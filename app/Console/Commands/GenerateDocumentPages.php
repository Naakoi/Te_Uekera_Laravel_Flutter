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
            $this->info("Dispatching page generation job for [{$doc->id}] {$doc->title}...");
            \App\Jobs\GenerateDocumentPagesJob::dispatch($doc);
        }

        $this->info('All document jobs have been dispatched to the queue.');
        $this->info('You can process them by running: php artisan queue:work');
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
