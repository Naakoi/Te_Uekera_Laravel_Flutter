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
            $globalActivated = \App\Models\RedeemCode::where('device_id', $deviceId)
                ->where('is_used', true)
                ->whereNull('document_id')
                ->exists();
        }

        $documents = $documents->map(function ($doc) use ($globalActivated) {
            $doc->has_access = $globalActivated || $this->hasAccess($doc);
            $doc->page_count = $doc->page_count ?? $this->countPdfPages(storage_path('app/' . $doc->file_path));
            return $doc;
        });

        return Inertia::render('Documents/Index', [
            'documents' => $documents,
            'isGlobalActivated' => $globalActivated,
        ]);
    }

    public function apiIndex()
    {
        $documents = Document::latest()->get();

        $documents = $documents->map(function ($doc) {
            $doc->has_access = $this->hasAccess($doc);
            $doc->page_count = $doc->page_count ?? $this->countPdfPages(storage_path('app/' . $doc->file_path));
            return $doc;
        });

        return response()->json([
            'success' => true,
            'data' => $documents
        ]);
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

        $pageCacheDir = "pages/{$document->id}";
        $pageCachePath = "{$pageCacheDir}/page-{$page}.png";

        if (!\Illuminate\Support\Facades\Storage::disk('local')->exists($pageCachePath)) {
            \Illuminate\Support\Facades\Storage::disk('local')->makeDirectory($pageCacheDir);
            $pdfPath = storage_path('app/' . $document->file_path);
            $outputPath = storage_path('app/' . $pageCachePath);

            Log::info("Generating page $page for doc {$document->id} using Ghostscript");

            // Using Ghostscript as pdftoppm may not be available. We use -dNOSAFER as it was required for countPdfPages.
            $command = sprintf(
                "/usr/bin/gs -q -dNOSAFER -dBATCH -dNOPAUSE -dNOPROMPT -sDEVICE=png16m -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -r150 -dFirstPage=%d -dLastPage=%d -sOutputFile=%s %s 2>&1",
                $page,
                $page,
                escapeshellarg($outputPath),
                escapeshellarg($pdfPath)
            );

            $output = [];
            $return_var = -1;
            \exec($command, $output, $return_var);

            if ($return_var !== 0) {
                Log::error("Ghostscript page generation failed: " . implode("\n", $output));
                abort(500, 'Page image generation failed.');
            }
        }

        return response()->file(storage_path('app/' . $pageCachePath));
    }

    public function hasAccess(Document $document)
    {
        // Try to get token from query param for Web compatibility
        $token = request()->query('token');
        if ($token) {
            $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
            if ($accessToken && $accessToken->tokenable) {
                auth('sanctum')->setUser($accessToken->tokenable);
            }
        }

        // Check for authenticated user (Sanctum)
        $user = auth('sanctum')->user() ?? auth()->user();

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

        // Check device-based activation
        $deviceId = request()->cookie('device_id') ?? request()->header('X-Device-Id') ?? request('device_id');
        if ($deviceId) {
            $isActivated = \App\Models\RedeemCode::where('device_id', $deviceId)
                ->where('is_used', true)
                ->where(function ($query) use ($document) {
                    $query->whereNull('document_id')
                        ->orWhere('document_id', $document->id);
                })
                ->where(function ($query) {
                    $query->whereNull('expires_at')
                        ->orWhere('expires_at', '>', now());
                })
                ->exists();

            if ($isActivated) {
                return true;
            }
        }

        return false;
    }

    public function library()
    {
        $user = auth()->user();
        $purchasedIds = $user ? $user->purchases()->pluck('document_id')->toArray() : [];

        $deviceId = request()->cookie('device_id') ?? request()->header('X-Device-Id');
        $activatedIds = [];
        $fullAccess = false;

        if ($deviceId) {
            $codes = \App\Models\RedeemCode::where('device_id', $deviceId)
                ->where('is_used', true)
                ->where(function ($query) {
                    $query->whereNull('expires_at')
                        ->orWhere('expires_at', '>', now());
                })
                ->get();

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
            $doc->page_count = $doc->page_count ?? $this->countPdfPages(storage_path('app/' . $doc->file_path));
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

    private function countPdfPages($path)
    {
        if (!file_exists($path))
            return 0;

        // Pure PHP implementation to avoid exec() restrictions
        $fp = @fopen($path, "rb");
        if (!$fp)
            return 1;

        $count = 0;
        while (!feof($fp)) {
            $line = fread($fp, 8192);
            if (preg_match_all("/\/Page\W/", $line, $matches)) {
                $count += count($matches[0]);
            }
        }
        fclose($fp);

        // This regex find all instances of /Page. This is often double the actual page count 
        // because of the way PDFs are structured. However, it's safer than crashing.
        return max(1, (int) ($count / 2));
    }
}
