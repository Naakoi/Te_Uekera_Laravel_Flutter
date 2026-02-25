<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Document;
use Illuminate\Support\Facades\Storage;

class GenerateDocumentPages extends Command
{
    protected $signature = 'documents:generate-pages
                            {--document= : Only regenerate pages for a specific document ID}
                            {--force : Overwrite already-generated images}
                            {--dpi=300 : Resolution in DPI (default 300)}';

    protected $description = 'Pre-generate all PNG page images for documents using Ghostscript';

    public function handle(): int
    {
        $dpi = (int) $this->option('dpi');
        $force = (bool) $this->option('force');
        $docId = $this->option('document');

        $query = Document::query();
        if ($docId) {
            $query->where('id', $docId);
        }

        $documents = $query->get();

        if ($documents->isEmpty()) {
            $this->error('No documents found.');
            return self::FAILURE;
        }

        foreach ($documents as $doc) {
            $pdfPath = storage_path('app/' . $doc->file_path);

            if (!file_exists($pdfPath)) {
                $this->warn("PDF not found for document [{$doc->id}] {$doc->title}, skipping.");
                continue;
            }

            // Count pages with Ghostscript
            $pageCount = $this->countPages($pdfPath);
            if ($pageCount === 0) {
                $this->warn("Could not determine page count for [{$doc->id}] {$doc->title}, skipping.");
                continue;
            }

            $this->info("Generating {$pageCount} pages for [{$doc->id}] {$doc->title} at {$dpi} DPI...");
            $cacheDir = "pages/{$doc->id}";
            Storage::disk('local')->makeDirectory($cacheDir);

            $bar = $this->output->createProgressBar($pageCount);
            $bar->start();

            for ($page = 1; $page <= $pageCount; $page++) {
                $cachePath = "{$cacheDir}/page-{$page}.png";
                $outputPath = storage_path('app/' . $cachePath);

                if (!$force && file_exists($outputPath)) {
                    $bar->advance();
                    continue;
                }

                $command = sprintf(
                    '/usr/bin/gs -q -dNOSAFER -dBATCH -dNOPAUSE -dNOPROMPT -sDEVICE=png16m -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -r%d -dFirstPage=%d -dLastPage=%d -sOutputFile=%s %s 2>&1',
                    $dpi,
                    $page,
                    $page,
                    escapeshellarg($outputPath),
                    escapeshellarg($pdfPath)
                );

                $output = [];
                $returnVar = -1;
                exec($command, $output, $returnVar);

                if ($returnVar !== 0) {
                    $this->newLine();
                    $this->error("  Ghostscript failed for page {$page}: " . implode(' ', $output));
                }

                $bar->advance();
            }

            $bar->finish();
            $this->newLine();
            $this->info("Done: [{$doc->id}] {$doc->title}");
        }

        // Update page_count on the document records
        foreach ($documents as $doc) {
            $pdfPath = storage_path('app/' . $doc->file_path);
            if (file_exists($pdfPath)) {
                $count = $this->countPages($pdfPath);
                if ($count > 0) {
                    $doc->update(['page_count' => $count]);
                }
            }
        }

        $this->info('All documents processed.');
        return self::SUCCESS;
    }

    private function countPages(string $pdfPath): int
    {
        $command = sprintf(
            '/usr/bin/gs -q -dNODISPLAY -dNOSAFER -c "(%s) (r) file runpdfbegin pdfpagecount = quit" 2>&1',
            str_replace(['(', ')'], ['\(', '\)'], $pdfPath)
        );
        $output = [];
        $returnVar = -1;
        exec($command, $output, $returnVar);

        if ($returnVar === 0 && !empty($output)) {
            $last = trim(end($output));
            if (is_numeric($last)) {
                return (int) $last;
            }
        }

        // Fallback: count /Page entries
        $fp = @fopen($pdfPath, 'rb');
        if (!$fp)
            return 0;
        $count = 0;
        while (!feof($fp)) {
            $chunk = fread($fp, 8192);
            if (preg_match_all('/\/Page\W/', $chunk, $m)) {
                $count += count($m[0]);
            }
        }
        fclose($fp);
        return max(1, (int) ($count / 2));
    }
}
