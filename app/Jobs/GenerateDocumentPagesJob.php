<?php

namespace App\Jobs;

use App\Models\Document;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class GenerateDocumentPagesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 600; // 10 minutes max
    public int $tries = 2;

    public function __construct(public Document $document)
    {
    }

    public function handle(): void
    {
        $doc = $this->document;
        $pdfPath = storage_path('app/' . $doc->file_path);

        if (!file_exists($pdfPath)) {
            Log::error("GenerateDocumentPagesJob: PDF not found for doc {$doc->id}: {$pdfPath}");
            return;
        }

        // Count pages using Ghostscript (exec() available in queue worker / PHP CLI)
        $gsPath = file_exists('/usr/bin/gs') ? '/usr/bin/gs' : 'gs';
        $countCmd = $gsPath . ' -q -dNODISPLAY -dNOSAFER -c "(' . addslashes($pdfPath) . ') (r) file runpdfbegin pdfpagecount = quit" 2>&1';
        exec($countCmd, $countOut, $countRet);

        $pageCount = 0;
        if ($countRet === 0 && !empty($countOut) && is_numeric(trim(end($countOut)))) {
            $pageCount = (int) trim(end($countOut));
        }

        if ($pageCount < 1) {
            Log::warning("GenerateDocumentPagesJob: Could not count pages for doc {$doc->id}");
            return;
        }

        // Update page count in database
        $doc->page_count = $pageCount;
        $doc->save();

        Log::info("GenerateDocumentPagesJob: Generating {$pageCount} pages for doc {$doc->id}");

        // Ensure output directory exists and is writable
        $pageDir = storage_path("app/pages/{$doc->id}");
        Storage::disk('local')->makeDirectory("pages/{$doc->id}");
        chmod($pageDir, 0777);

        // Generate all pages using Ghostscript
        $outputPattern = $pageDir . '/page-%d.png';
        $command = sprintf(
            '%s -q -dNOSAFER -dBATCH -dNOPAUSE -dNOPROMPT -sDEVICE=png16m -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -r300 -sOutputFile=%s %s 2>&1',
            $gsPath,
            escapeshellarg($outputPattern),
            escapeshellarg($pdfPath)
        );

        $output = [];
        $return_var = -1;
        exec($command, $output, $return_var);

        if ($return_var !== 0) {
            Log::error("GenerateDocumentPagesJob: GS failed for doc {$doc->id}: " . implode("\n", $output));
            return;
        }

        // Rename page-1.png, page-2.png → page-1.png (GS generates page-1.png style already)
        // Verify files were created
        $generated = 0;
        for ($p = 1; $p <= $pageCount; $p++) {
            if (file_exists("{$pageDir}/page-{$p}.png")) {
                $generated++;
            }
        }

        Log::info("GenerateDocumentPagesJob: Done — {$generated}/{$pageCount} pages generated for doc {$doc->id}");
    }
}
