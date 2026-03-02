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
        if ($deviceId) {
            $globalQuery = \App\Models\RedeemCode::where('device_id', $deviceId)
                ->where('is_used', true)
                ->whereNull('document_id');

            // SECURITY: Ensure global activation belongs to the current identity
            // (user ID or null for guest). This prevents cross-user leakage.
            $globalQuery->where('user_id', auth()->id());

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
            \Illuminate\Support\Facades\Log::info("API Access: Editions list requested from origin: " . request()->header('Origin') . " IP: " . request()->ip());
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
                    }
                }
            }

            $globalActivated = false;
            if ($deviceId) {
                $globalActivated = \App\Models\RedeemCode::where('device_id', $deviceId)
                    ->where('is_used', true)
                    ->whereNull('document_id')
                    ->where('user_id', $user ? $user->id : null)
                    ->exists();
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
        Log::info("pageImage request for doc {$document->id}, page $page");
        if (!$this->hasAccess($document)) {
            Log::warning("Access denied for doc {$document->id}, page $page");
            abort(403);
        }

        $pageCachePath = "pages/{$document->id}/page-{$page}.png";
        $fullPath = storage_path('app/' . $pageCachePath);

        if (!file_exists($fullPath)) {
            // Pre-generated file doesn't exist — generate on-the-fly via Imagick.
            $pdfPath = $this->getAbsolutePdfPath($document->file_path);

            if (!$pdfPath) {
                Log::error("PDF source file missing for doc {$document->id}: looking in app/ and app/public/");
                return $this->placeholderPngResponse("PDF not found");
            }

            if (!extension_loaded('imagick')) {
                Log::error("Imagick not available and page not pre-generated for doc {$document->id} page $page.");
                return $this->placeholderPngResponse("Imagick not available");
            }

            Log::info("Generating page $page on-the-fly for doc {$document->id} via Imagick");

            try {
                // Ensure the cache directory exists
                \Illuminate\Support\Facades\Storage::disk('local')->makeDirectory("pages/{$document->id}");

                // --- 1. Use Imagick if available ---
                if (extension_loaded('imagick')) {
                    $imagick = new \Imagick();
                    try {
                        $imagick->setResolution(150, 150);
                        $imagick->readImage($pdfPath . '[' . ($page - 1) . ']');
                    } catch (\Throwable $e) {
                        $imagick->clear();
                        $imagick->readImage($pdfPath . '[' . ($page - 1) . ']');
                    }

                    $colorspace = $imagick->getImageColorspace();
                    if ($colorspace === \Imagick::COLORSPACE_CMYK) {
                        $imagick->setImageColorspace(\Imagick::COLORSPACE_CMYK);
                        $imagick->transformImageColorspace(\Imagick::COLORSPACE_SRGB);
                    } else {
                        $imagick->transformImageColorspace(\Imagick::COLORSPACE_SRGB);
                    }

                    $imagick->setImageFormat('png');
                    $imagick->setImageCompressionQuality(90);
                    $imagick->setImageBackgroundColor('white');

                    $flat = $imagick->mergeImageLayers(\Imagick::LAYERMETHOD_FLATTEN);
                    $flat->setImageFormat('png');
                    $flat->writeImage($fullPath);
                    $flat->clear();
                    $flat->destroy();
                    $imagick->clear();
                    $imagick->destroy();
                } 
                // --- 2. Use Ghostscript if available ---
                else if (!in_array('exec', array_map('trim', explode(',', ini_get('disable_functions')))) && function_exists('exec')) {
                    $gsPath = file_exists('/usr/bin/gs') ? '/usr/bin/gs' : 'gs';
                    // Render specific page to PNG
                    $command = sprintf(
                        "%s -sDEVICE=png16m -o %s -dFirstPage=%d -dLastPage=%d -r150 -dGraphicsAlphaBits=4 -dTextAlphaBits=4 %s 2>&1",
                        $gsPath,
                        escapeshellarg($fullPath),
                        $page,
                        $page,
                        escapeshellarg($pdfPath)
                    );
                    
                    $output = [];
                    $return_var = -1;
                    exec($command, $output, $return_var);
                    
                    if ($return_var !== 0 || !file_exists($fullPath)) {
                        throw new \Exception("Ghostscript failed to generate page: " . implode(" ", $output));
                    }
                } else {
                    throw new \Exception("No rendering engine available (Imagick or Ghostscript)");
                }

                Log::info("Page $page generated and cached for doc {$document->id}");
            } catch (\Throwable $e) {
                Log::error("Page generation failed for doc {$document->id} page $page: " . $e->getMessage());
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
        // Version 1.0.6 - Use this to confirm deployment
        $pdfPath = storage_path('app/' . $document->file_path);
        $info = [
            'diag_version' => '1.0.6',
            'imagick_loaded' => extension_loaded('imagick'),
            'pdf_file_exists' => file_exists($pdfPath),
            'pdf_path' => $pdfPath,
            'exec_disabled' => in_array('exec', array_map('trim', explode(',', ini_get('disable_functions')))),
            'disable_functions' => ini_get('disable_functions'),
            'page_count_db' => $document->page_count,
            'pages_dir_exists' => is_dir(storage_path("app/pages/{$document->id}")),
        ];

        if (extension_loaded('imagick')) {
            try {
                $im = new \Imagick();
                $im->pingImage($pdfPath);
                $info['imagick_page_count'] = $im->getNumberImages();
                $im->clear();
                $im->destroy();
            } catch (\Throwable $e) {
                $info['imagick_ping_error'] = $e->getMessage();
            }

            try {
                $im2 = new \Imagick();
                try {
                    $im2->readImage($pdfPath . '[0]');
                } catch (\Throwable $e2) {
                    if (str_contains($e2->getMessage(), 'security policy')) {
                         $im2->clear();
                         $im2->setColorspace(\Imagick::COLORSPACE_SRGB);
                         $im2->readImage($pdfPath . '[0]');
                    } else {
                        throw $e2;
                    }
                }
                
                $info['imagick_read_page1'] = 'OK';
                $info['colorspace'] = $im2->getImageColorspace();
                $info['colorspace_name'] = $this->getColorspaceName($im2->getImageColorspace());
                $info['image_type'] = $im2->getImageType();
                $im2->clear();
                $im2->destroy();
            } catch (\Throwable $e) {
                $info['imagick_read_error'] = $e->getMessage();
            }
        }

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
        // If already authenticated (via middleware or pre-fetched), use that
        $user = $user ?? auth('sanctum')->user() ?? auth()->user();

        // If not authenticated, try to manually identify from token (any parameter)
        if (!$user) {
            $token = request('token') ?? request()->bearerToken();
            if ($token) {
                $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
                if ($accessToken && $accessToken->tokenable) {
                    $user = $accessToken->tokenable;
                    auth('sanctum')->setUser($user);
                }
            }
        }

        if ($user) {
            if ($user->isAdmin() || $user->isStaff()) {
                return true;
            }

            // Check for account-based purchase
            if ($user->purchases()->where('document_id', $document->id)->exists()) {
                return true;
            }

            // Check for active subscription
            if ($user->hasActiveSubscription()) {
                return true;
            }
        }

        // Check device-based activation (any parameter)
        $deviceId = request('device_id') ?? request()->cookie('device_id') ?? request()->header('X-Device-Id');
        if ($deviceId) {
            $deviceQuery = \App\Models\RedeemCode::where('device_id', $deviceId)
                ->where('is_used', true)
                ->where(function ($query) use ($document) {
                    $query->whereNull('document_id')
                        ->orWhere('document_id', $document->id);
                })
                ->where(function ($query) {
                    $query->whereNull('expires_at')
                        ->orWhere('expires_at', '>', now());
                });

            // SECURITY: Device activation MUST belong to the current authentication state.
            // (The logged-in user's ID, or null for guests).
            // This prevents guests or a different user from inheriting redemptions
            // left behind on a shared device.
            $deviceQuery->where('user_id', $user ? $user->id : null);

            if ($deviceQuery->exists()) {
                return true;
            }
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
            if (file_exists($path)) return $path;
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
                    if ($count > 0) return $count;
                } catch (\Throwable $e) {}
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
                        if (is_numeric($lastLine) && (int) $lastLine > 0) return (int) $lastLine;
                    }
                } catch (\Throwable $e) {}
            }

            // 3. pure PHP fallback
            $content = @file_get_contents($path);
            if ($content !== false) {
                if (preg_match_all('/\/Count\s+(\d+)/', $content, $matches)) {
                    $pageCount = max(array_map('intval', $matches[1]));
                    if ($pageCount > 0) return $pageCount;
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
