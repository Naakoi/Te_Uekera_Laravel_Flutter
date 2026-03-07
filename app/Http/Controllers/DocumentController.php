<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Document;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DocumentController extends Controller
{
    public function index()
    {
        $documents = Document::latest()->get();
        $deviceId = request()->cookie('device_id');

        $globalActivated = false;
        $currentUser = auth()->user();

        if ($currentUser || $deviceId) {
            $globalQuery = \App\Models\RedeemCode::where('is_used', true)
                ->whereNull('document_id')
                ->where(function ($q) {
                    $q->whereNull('expires_at')
                        ->orWhere('expires_at', '>', now());
                });

            if ($currentUser) {
                // If logged in, access is tied to the account (every device)
                $globalQuery->where('user_id', $currentUser->id);
            } else {
                // If guest, only check device and ensure it wasn't a user-based activation
                $globalQuery->where('device_id', $deviceId)->whereNull('user_id');
            }

            $globalActivated = $globalQuery->exists();
        }

        $documents = $documents->map(function ($doc) use ($globalActivated) {
            $doc->has_access = $globalActivated || $this->hasAccess($doc);
            if (!$doc->page_count) {
                $pdfPath = $this->getAbsolutePdfPath($doc->file_path);
                $doc->page_count = $pdfPath ? $this->countPdfPages($pdfPath) : 0;
                try {
                    $doc->save();
                } catch (\Exception $e) {
                    Log::warning("Could not persist page_count for doc {$doc->id}: " . $e->getMessage());
                }
            }
            return $doc;
        });

        return Inertia::render('Documents/Index', [
            'documents' => $documents,
            'isGlobalActivated' => $globalActivated,
        ]);
    }

    public function apiIndex()
    {
        try {
            $platform = request()->header('X-App-Platform', 'web/unknown');
            \Illuminate\Support\Facades\Log::info("API Access: Editions list requested. Platform: $platform, IP: " . request()->ip(), [
                'headers' => collect(request()->header())->map(fn($h) => $h[0])->toArray()
            ]);
            $documents = Document::latest()->get();
            $deviceId = request('device_id') ?? request()->cookie('device_id') ?? request()->header('X-Device-Id');

            // Fetch user once for the whole request to optimize N+1 issues in loops
            $user = auth('sanctum')->user() ?? auth()->user();
            if (!$user) {
                $token = request('token') ?? request()->bearerToken();
                if ($token) {
                    $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
                    if ($accessToken && $accessToken->tokenable) {
                        $user = $accessToken->tokenable;
                        auth('sanctum')->setUser($user);
                    } else {
                        // SECURITY: If a token was provided but is invalid (e.g., remotely logged out),
                        // return 401 to force the client to clear its local session storage.
                        return response()->json([
                            'success' => false,
                            'message' => 'Your session has expired or been terminated from another device.',
                            'requires_reauth' => true
                        ], 401);
                    }
                }
            }

            $globalActivated = false;
            if ($user || $deviceId) {
                $globalQuery = \App\Models\RedeemCode::where('is_used', true)
                    ->whereNull('document_id')
                    ->where(function ($q) {
                        $q->whereNull('expires_at')
                            ->orWhere('expires_at', '>', now());
                    });

                if ($user) {
                    $globalQuery->where('user_id', $user->id);
                } else {
                    $globalQuery->where('device_id', $deviceId)->whereNull('user_id');
                }

                $globalActivated = $globalQuery->exists();
            }

            $data = $documents->map(function ($doc) use ($globalActivated, $user) {
                // Ensure page_count is populated
                if (!$doc->page_count) {
                    $pdfPath = $this->getAbsolutePdfPath($doc->file_path);
                    $doc->page_count = $pdfPath ? $this->countPdfPages($pdfPath) : 0;
                    try {
                        $doc->save();
                    } catch (\Exception $e) {
                        \Illuminate\Support\Facades\Log::warning("Could not persist page_count for doc {$doc->id}: " . $e->getMessage());
                    }
                }

                // Use the pre-fetched user
                $doc->has_access = $globalActivated || $this->hasAccess($doc, $user);

                $arr = $doc->toArray();
                $arr['has_access'] = $doc->has_access;
                $arr['page_count'] = $doc->page_count;
                return $arr;
            });

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Throwable $e) {
            Log::error("apiIndex fatal error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    public function show(Document $document)
    {
        return Inertia::render('Documents/Show', [
            'document' => $document,
            'isPurchased' => $this->hasAccess($document),
        ]);
    }

    public function reader(Document $document)
    {
        if (!$this->hasAccess($document)) {
            abort(403, 'You must purchase or activate this document first.');
        }

        $pageCount = $this->countPdfPages(storage_path('app/' . $document->file_path));

        return Inertia::render('Documents/Viewer', [
            'document' => $document,
            'pageCount' => $pageCount,
        ]);
    }

    public function stream(Document $document)
    {
        if (!$this->hasAccess($document)) {
            abort(403, 'You must purchase or activate this document first.');
        }

        // Restrict raw PDF streaming to Staff and Admin to prevent easy extraction
        /** @var \App\Models\User $currentUser */
        $currentUser = auth()->user();
        if (!$currentUser || (!$currentUser->isStaff() && !$currentUser->isAdmin())) {
            abort(403, 'Direct file access is restricted. Please use the reader.');
        }

        if (!\Illuminate\Support\Facades\Storage::disk('local')->exists($document->file_path)) {
            abort(404, 'File not found.');
        }

        return response()->file(storage_path('app/' . $document->file_path), [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $document->title . '.pdf"',
        ]);
    }

    public function pageImage(Document $document, int $page)
    {
        // Version 1.1.5 - Max Reliability Mode
        @ini_set('memory_limit', '2048M');
        @set_time_limit(90);

        $platform = request()->header('X-App-Platform') ?? 'Unknown';
        $deviceId = request('device_id') ?? request()->header('X-Device-Id') ?? 'None';

        // Check for token in all possible locations
        $token = request('token') ?? request()->bearerToken() ?? request()->header('X-Authorization');
        if ($token)
            $token = str_replace('Bearer ', '', $token);

        // Debug: Log ALL headers to see what is actually arriving
        $allHeaders = collect(request()->header())->map(function ($item) {
            return is_array($item) ? implode(', ', $item) : $item;
        })->toArray();
        Log::info("PAGE_REQ: Doc {$document->id}, Page $page. Dev: $deviceId, Plat: $platform, Token: " . ($token ? "Present" : "Missing"), [
            'raw_token' => $token ? substr($token, 0, 10) . '...' : 'NONE',
            'headers' => $allHeaders
        ]);

        if ($page !== 1 && !$this->hasAccess($document)) {
            Log::warning("PAGE_DENIED: Doc {$document->id}, Page $page. Dev: $deviceId");
            return $this->placeholderPngResponse("Access Denied (403)");
        }

        $pageCachePath = "pages/{$document->id}/page-{$page}.png";
        $fullPath = storage_path('app/' . $pageCachePath);

        if (!file_exists($fullPath)) {
            $pdfPath = $this->getAbsolutePdfPath($document->file_path);
            if (!$pdfPath) {
                Log::error("PAGE_ERR: PDF missing for doc {$document->id}");
                return $this->placeholderPngResponse("PDF source missing");
            }

            try {
                if (!file_exists(dirname($fullPath))) {
                    mkdir(dirname($fullPath), 0755, true);
                }

                $success = false;
                $renderErrors = [];

                // --- 1. PREFERRED: Imagick (usually more reliable for CMYK on this server) ---
                if (extension_loaded('imagick')) {
                    try {
                        Log::info("PAGE_GEN: Starting Imagick for doc {$document->id} p$page");
                        $imagick = new \Imagick();

                        if (method_exists($imagick, 'setResourceLimit')) {
                            $imagick->setResourceLimit(\Imagick::RESOURCETYPE_MEMORY, 1024 * 1024 * 1024); // 1GB
                        }

                        $imagick->setResolution(150, 150);
                        $imagick->readImage($pdfPath . '[' . ($page - 1) . ']');
                        $imagick->transformImageColorspace(\Imagick::COLORSPACE_SRGB);
                        $imagick->setImageFormat('png');
                        $imagick->setImageBackgroundColor('white');

                        $flat = $imagick->mergeImageLayers(13); // 13 is FLATTEN constant
                        $flat->setImageFormat('png');
                        $flat->writeImage($fullPath);

                        $flat->clear();
                        $flat->destroy();
                        $imagick->clear();
                        $imagick->destroy();

                        if (file_exists($fullPath)) {
                            $success = true;
                            Log::info("PAGE_OK: Imagick doc {$document->id} p$page");
                        }
                    } catch (\Throwable $imE) {
                        $renderErrors[] = "IM: " . substr($imE->getMessage(), 0, 100);
                        Log::error("Imagick page generation error: " . $imE->getMessage());
                    }
                }

                // --- 2. FALLBACK: Ghostscript via exec ---
                if (!$success && !in_array('exec', array_map('trim', explode(',', ini_get('disable_functions')))) && function_exists('exec')) {
                    try {
                        $gsPath = file_exists('/usr/bin/gs') ? '/usr/bin/gs' : 'gs';
                        $command = sprintf(
                            "%s -sDEVICE=png16m -o %s -dFirstPage=%d -dLastPage=%d -r150 %s 2>&1",
                            $gsPath,
                            escapeshellarg($fullPath),
                            $page,
                            $page,
                            escapeshellarg($pdfPath)
                        );
                        $output = [];
                        $return_var = -1;
                        exec($command, $output, $return_var);
                        if ($return_var === 0 && file_exists($fullPath)) {
                            $success = true;
                            Log::info("PAGE_OK: GS doc {$document->id} p$page");
                        } else {
                            $renderErrors[] = "GS: " . implode(" ", array_slice($output, -1));
                        }
                    } catch (\Throwable $gsE) {
                        $renderErrors[] = "GS Exception: " . $gsE->getMessage();
                    }
                }

                if (!$success) {
                    throw new \Exception("All paths failed: " . implode(" | ", $renderErrors));
                }

            } catch (\Throwable $e) {
                Log::error("PAGE_FATAL: Doc {$document->id} p$page: " . $e->getMessage());
                return $this->placeholderPngResponse($e->getMessage());
            }
        }

        return response()->file($fullPath, [
            'Content-Type' => 'image/png',
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }

    /**
     * Staff-only diagnostic endpoint: checks Imagick & file availability.
     * Access: /api/documents/{document}/diag
     */
    public function imagickDiag(Document $document)
    {
        // Version 1.1.5 - Max Diag
        @ini_set('memory_limit', '2048M');
        $pdfPath = $this->getAbsolutePdfPath($document->file_path);

        $tokenRaw = request('token') ?? request()->bearerToken() ?? request()->header('X-Authorization');
        $user = null;
        if ($tokenRaw) {
            $tokenRaw = str_replace('Bearer ', '', $tokenRaw);
            $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($tokenRaw);
            if ($accessToken)
                $user = $accessToken->tokenable;
        }
        if (!$user)
            $user = auth('sanctum')->user() ?? auth()->user();

        $info = [
            'diag_version' => '1.1.6',
            'time' => now()->toDateTimeString(),
            'imagick_loaded' => extension_loaded('imagick'),
            'pdf_file_exists' => $pdfPath ? file_exists($pdfPath) : false,
            'pdf_size' => $pdfPath ? filesize($pdfPath) : 0,
            'identified_user' => $user ? $user->id . " (" . $user->email . ")" : 'Guest',
            'token_received' => $tokenRaw ? "YES (" . substr($tokenRaw, 0, 5) . "...)" : "NO",
            'has_full_access' => $this->hasAccess($document, $user),
            'memory_limit' => ini_get('memory_limit'),
            'disable_functions' => ini_get('disable_functions'),
            'headers_captured' => [
                'Authorization' => request()->hasHeader('Authorization') ? 'PRESENT' : 'MISSING',
                'X-Authorization' => request()->hasHeader('X-Authorization') ? 'PRESENT' : 'MISSING',
                'X-App-Platform' => request()->header('X-App-Platform', 'NONE'),
            ],
        ];

        return response()->json($info);
    }

    private function getColorspaceName($const)
    {
        $constants = (new \ReflectionClass('\Imagick'))->getConstants();
        foreach ($constants as $name => $value) {
            if (strpos($name, 'COLORSPACE_') === 0 && $value === $const) {
                return $name;
            }
        }
        return 'UNKNOWN (' . $const . ')';
    }

    /**
     * Returns a minimal 1x1 transparent PNG as a placeholder so the viewer
     * doesn't hard-crash with a 500 — the error is logged server-side.
     */
    private function placeholderPngResponse(string $reason = ''): \Illuminate\Http\Response
    {
        // A 1x1 transparent PNG in binary
        $png = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        );
        return response($png, 200, [
            'Content-Type' => 'image/png',
            'Cache-Control' => 'no-store',
            'X-Page-Error' => substr($reason, 0, 200),
        ]);
    }

    public function hasAccess(Document $document, $user = null)
    {
        // Unify user identification with X-Authorization support
        if (!$user) {
            $user = auth('sanctum')->user() ?? auth()->user();
            if (!$user) {
                $token = request('token') ?? request()->bearerToken() ?? request()->header('X-Authorization');

                // Detailed debug logging
                Log::info("hasAccess Entry: Token=" . ($token ? 'YES' : 'NO') . " AuthHeader=" . (request()->hasHeader('Authorization') ? 'YES' : 'NO') . " XAuthHeader=" . (request()->hasHeader('X-Authorization') ? 'YES' : 'NO'));

                if ($token) {
                    $token = str_replace('Bearer ', '', $token);
                    $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
                    if ($accessToken && $accessToken->tokenable) {
                        $user = $accessToken->tokenable;
                        auth('sanctum')->setUser($user);
                        Log::info("hasAccess: Identified user from token: {$user->id}");
                    }
                }
            }
        }

        /** @var \App\Models\User $user */
        if ($user) {
            if ($user->isAdmin() || $user->isStaff())
                return true;
            if ($user->purchases()->where('document_id', $document->id)->exists())
                return true;
            if ($user->hasActiveSubscription())
                return true;
        }

        // Check for active activations (Full Access or Document Specific)
        $deviceId = request('device_id') ?? request()->header('X-Device-Id');

        if ($user || $deviceId) {
            $activationQuery = \App\Models\RedeemCode::where('is_used', true)
                ->where(function ($query) use ($document) {
                    $query->whereNull('document_id')->orWhere('document_id', $document->id);
                })
                ->where(function ($query) {
                    $query->whereNull('expires_at')->orWhere('expires_at', '>', now());
                });

            if ($user)
                $activationQuery->where('user_id', $user->id);
            else
                $activationQuery->where('device_id', $deviceId)->whereNull('user_id');

            if ($activationQuery->exists())
                return true;
        }

        return false;
    }

    public function library()
    {
        // Re-authenticate if possible
        $token = request()->query('token') ?? request()->bearerToken();
        if ($token) {
            $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
            if ($accessToken && $accessToken->tokenable) {
                auth('sanctum')->setUser($accessToken->tokenable);
            }
        }

        $user = auth('sanctum')->user() ?? auth()->user();
        $purchasedIds = $user ? $user->purchases()->pluck('document_id')->toArray() : [];

        $deviceId = request()->cookie('device_id') ?? request()->header('X-Device-Id') ?? request('device_id');
        $activatedIds = [];
        $fullAccess = false;

        if ($deviceId) {
            $codesQuery = \App\Models\RedeemCode::where('device_id', $deviceId)
                ->where('is_used', true)
                ->where(function ($query) {
                    $query->whereNull('expires_at')
                        ->orWhere('expires_at', '>', now());
                });

            // SECURITY: Only count device-based redemptions belonging to the
            // current authentication state (the user's identity or guest null).
            // This prevents guests or secondary users from inheriting redemptions
            // left behind by a previous user on the same device.
            $codesQuery->where('user_id', $user ? $user->id : null);

            $codes = $codesQuery->get();

            foreach ($codes as $code) {
                if ($code->document_id) {
                    $activatedIds[] = $code->document_id;
                } else {
                    $fullAccess = true;
                }
            }
        }

        if ($fullAccess || ($user && $user->hasActiveSubscription())) {
            $documents = Document::latest()->get();
        } else {
            $allIds = array_unique(array_merge($purchasedIds, $activatedIds));
            $documents = Document::whereIn('id', $allIds)->latest()->get();
        }

        $documents = $documents->map(function ($doc) {
            if (!$doc->page_count) {
                $doc->page_count = $this->countPdfPages(storage_path('app/' . $doc->file_path));
                try {
                    $doc->save();
                } catch (\Exception $e) {
                    Log::warning("Could not persist page_count for doc {$doc->id}: " . $e->getMessage());
                }
            }
            return $doc;
        });

        return Inertia::render('Library/Index', [
            'documents' => $documents,
        ]);
    }

    public function download(Document $document)
    {
        abort(403, 'Downloading is disabled. Documents can only be viewed within the library.');
    }

    /**
     * Tries to find the absolute path of a PDF on available disks.
     */
    private function getAbsolutePdfPath($filePath)
    {
        $diskPaths = [
            storage_path('app/' . $filePath),
            storage_path('app/public/' . $filePath),
        ];

        foreach ($diskPaths as $path) {
            if (file_exists($path))
                return $path;
        }

        return null;
    }

    private function countPdfPages($path)
    {
        try {
            if (!file_exists($path)) {
                return 0;
            }

            // 1. Use Imagick if available
            if (extension_loaded('imagick')) {
                try {
                    $imagick = new \Imagick();
                    $imagick->pingImage($path);
                    $count = $imagick->getNumberImages();
                    $imagick->clear();
                    $imagick->destroy();
                    if ($count > 0)
                        return $count;
                } catch (\Throwable $e) {
                }
            }

            // 2. Try Ghostscript via exec
            if (!in_array('exec', array_map('trim', explode(',', ini_get('disable_functions')))) && function_exists('exec')) {
                try {
                    $gsPath = file_exists('/usr/bin/gs') ? '/usr/bin/gs' : 'gs';
                    $output = [];
                    $return_var = -1;
                    exec($gsPath . ' -q -dNODISPLAY -dNOSAFER -c "(' . addslashes($path) . ') (r) file runpdfbegin pdfpagecount = quit" 2>&1', $output, $return_var);
                    if ($return_var === 0 && !empty($output)) {
                        $lastLine = trim(end($output));
                        if (is_numeric($lastLine) && (int) $lastLine > 0)
                            return (int) $lastLine;
                    }
                } catch (\Throwable $e) {
                }
            }

            // 3. pure PHP fallback
            $content = @file_get_contents($path);
            if ($content !== false) {
                if (preg_match_all('/\/Count\s+(\d+)/', $content, $matches)) {
                    $pageCount = max(array_map('intval', $matches[1]));
                    if ($pageCount > 0)
                        return $pageCount;
                }
                $pageEntries = preg_match_all('/\/Type\s*\/Page[^s]/', $content, $m);
                return $pageEntries > 0 ? $pageEntries : 1;
            }

            return 1; // Default fallback if found but unreadable
        } catch (\Throwable $e) {
            return 1;
        }
    }
}
