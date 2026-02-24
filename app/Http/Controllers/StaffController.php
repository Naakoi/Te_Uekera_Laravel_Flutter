<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Document;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Str;
use Inertia\Inertia;

class StaffController extends Controller
{
    public function dashboard()
    {
        return Inertia::render('Staff/Dashboard', [
            'documents' => Document::latest()->paginate(10),
        ]);
    }

    public function store(Request $request)
    {
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            \Illuminate\Support\Facades\Log::info('File Upload Debug:', [
                'name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'error' => $file->getError(),
                'mime' => $file->getMimeType(),
                'ini_upload_max' => ini_get('upload_max_filesize'),
                'ini_post_max' => ini_get('post_max_size'),
            ]);
        } else {
            \Illuminate\Support\Facades\Log::warning('No file found in request. Raw data size: ' . strlen($request->getContent()));
        }

        if (auth()->user()->role !== 'admin' && !auth()->user()->can_upload_documents) {
            abort(403, 'Unauthorized. You do not have permission to upload documents.');
        }

        try {
            $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'file' => 'required|file|mimes:pdf|max:1048576', // 1GB (1024 * 1024 KB)
                'thumbnail' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048', // 2MB
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Illuminate\Support\Facades\Log::error('Validation failed: ' . json_encode($e->errors()));
            throw $e;
        }

        $filePath = $request->file('file')->store('newspapers', 'local');
        $thumbnailPath = null;

        if ($request->hasFile('thumbnail')) {
            $thumbnailPath = $request->file('thumbnail')->store('thumbnails', 'public');
        } else {
            // Generate thumbnail from PDF
            $pdfPath = storage_path('app/' . $filePath);
            $thumbnailDir = storage_path('app/public/thumbnails');

            if (!file_exists($thumbnailDir)) {
                mkdir($thumbnailDir, 0755, true);
            }

            $thumbnailFilename = Str::random(40) . '.png';
            $thumbnailFullPath = $thumbnailDir . '/' . $thumbnailFilename;
            $thumbnailPrefix = $thumbnailDir . '/' . pathinfo($thumbnailFilename, PATHINFO_FILENAME);

            // pdftoppm -f 1 -l 1 -png -singlefile input_pdf output_prefix
            $command = sprintf("pdftoppm -f 1 -l 1 -png -singlefile %s %s 2>&1", escapeshellarg($pdfPath), escapeshellarg($thumbnailPrefix));
            $output = [];
            $return_var = -1;
            exec($command, $output, $return_var);

            if ($return_var === 0) {
                $thumbnailPath = 'thumbnails/' . $thumbnailFilename;
            } else {
                \Illuminate\Support\Facades\Log::error("pdftoppm failed on upload: " . implode("\n", $output));
            }
        }

        Document::create([
            'title' => $request->title,
            'description' => $request->description,
            'file_path' => $filePath,
            'thumbnail_path' => $thumbnailPath,
            'price' => 1.00,
            'published_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Document uploaded successfully.');
    }

    public function destroy(Document $document)
    {
        if (auth()->user()->role !== 'admin' && !auth()->user()->can_upload_documents) {
            abort(403, 'Unauthorized. You do not have permission to delete documents.');
        }

        Storage::disk('local')->delete($document->file_path);

        if ($document->thumbnail_path) {
            Storage::disk('public')->delete($document->thumbnail_path);
        }

        $document->delete();

        return redirect()->back()->with('success', 'Document deleted successfully.');
    }
}
