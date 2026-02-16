<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Document;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
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

            // Add page count for PWA caching
            $pdfPath = storage_path('app/' . $doc->file_path);
            $result = \Illuminate\Support\Facades\Process::run(['pdfinfo', $pdfPath]);
            $doc->page_count = 0;
            if ($result->successful()) {
                preg_match('/Pages:\s+(\d+)/', $result->output(), $matches);
                $doc->page_count = isset($matches[1]) ? (int) $matches[1] : 0;
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
        $documents = Document::latest()->get();

        // Add access status for the authenticated user or device
        $documents = $documents->map(function ($doc) {
            $doc->has_access = $this->hasAccess($doc);

            // Add page count for mobile viewer
            $pdfPath = storage_path('app/' . $doc->file_path);
            $result = \Illuminate\Support\Facades\Process::run(['pdfinfo', $pdfPath]);
            $doc->page_count = 0;
            if ($result->successful()) {
                preg_match('/Pages:\s+(\d+)/', $result->output(), $matches);
                $doc->page_count = isset($matches[1]) ? (int) $matches[1] : 0;
                Log::info("Document {$doc->id} page count: {$doc->page_count}");
            } else {
                Log::error("pdfinfo failed for doc {$doc->id}: " . $result->errorOutput());
                // Fallback attempt with specific path if needed, or check if file exists
                if (!file_exists($pdfPath)) {
                    Log::error("File not found at $pdfPath");
                }
            }

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

        // Get page count using pdfinfo
        $pdfPath = storage_path('app/' . $document->file_path);
        $result = \Illuminate\Support\Facades\Process::run(['pdfinfo', $pdfPath]);
        $pageCount = 0;
        if ($result->successful()) {
            preg_match('/Pages:\s+(\d+)/', $result->output(), $matches);
            $pageCount = isset($matches[1]) ? (int) $matches[1] : 0;
        }

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
        if (!auth()->user()->isStaff() && !auth()->user()->isAdmin()) {
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
            $outputPrefix = str_replace('.png', '', $outputPath);

            // Using high resolution for better reading experience
            Log::info("Generating page $page for doc {$document->id}");
            $processResult = \Illuminate\Support\Facades\Process::run([
                'pdftoppm',
                '-f',
                (string) $page,
                '-l',
                (string) $page,
                '-png',
                '-singlefile',
                '-r',
                '200',
                $pdfPath,
                $outputPrefix
            ]);

            if (!$processResult->successful()) {
                Log::error("pdftoppm failed: " . $processResult->errorOutput());
            }
        }

        if (!\Illuminate\Support\Facades\Storage::disk('local')->exists($pageCachePath)) {
            abort(404);
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
        $purchasedIds = $user->purchases()->pluck('document_id')->toArray();

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

        if ($fullAccess || $user->hasActiveSubscription()) {
            $documents = Document::latest()->get();
        } else {
            $allIds = array_unique(array_merge($purchasedIds, $activatedIds));
            $documents = Document::whereIn('id', $allIds)->latest()->get();
        }

        $documents = $documents->map(function ($doc) {
            $pdfPath = storage_path('app/' . $doc->file_path);
            $result = \Illuminate\Support\Facades\Process::run(['pdfinfo', $pdfPath]);
            $doc->page_count = 0;
            if ($result->successful()) {
                preg_match('/Pages:\s+(\d+)/', $result->output(), $matches);
                $doc->page_count = isset($matches[1]) ? (int) $matches[1] : 0;
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
}
