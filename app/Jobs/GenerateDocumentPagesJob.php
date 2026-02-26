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

        // --- Try Ghostscript first (works when exec() is available, e.g. locally) ---
        $execDisabled = in_array('exec', array_map('trim', explode(',', ini_get('disable_functions'))));
        $gsAvailable = !$execDisabled && function_exists('exec');

        if ($gsAvailable) {
            $gsPath = file_exists('/usr/bin/gs') ? '/usr/bin/gs' : 'gs';
            $countCmd = $gsPath . ' -q -dNODISPLAY -dNOSAFER -c "(' . addslashes($pdfPath) . ') (r) file runpdfbegin pdfpagecount = quit" 2>&1';
            exec($countCmd, $countOut, $countRet);

            $pageCount = 0;
            if ($countRet === 0 && !empty($countOut) && is_numeric(trim(end($countOut)))) {
                $pageCount = (int) trim(end($countOut));
            }

            if ($pageCount > 0) {
                $doc->page_count = $pageCount;
                $doc->save();

                Log::info("GenerateDocumentPagesJob: Generating {$pageCount} pages for doc {$doc->id} via Ghostscript");

                $pageDir = storage_path("app/pages/{$doc->id}");
                Storage::disk('local')->makeDirectory("pages/{$doc->id}");
                chmod($pageDir, 0777);

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

                if ($return_var === 0) {
                    $generated = 0;
                    for ($p = 1; $p <= $pageCount; $p++) {
                        if (file_exists("{$pageDir}/page-{$p}.png")) {
                            $generated++;
                        }
                    }
                    Log::info("GenerateDocumentPagesJob: GS done — {$generated}/{$pageCount} pages for doc {$doc->id}");
                    return;
                }

                Log::warning("GenerateDocumentPagesJob: GS render failed for doc {$doc->id}: " . implode("\n", $output));
            }
        }

        // --- Fallback: Imagick (works on Cloudways where exec() is disabled) ---
        if (!extension_loaded('imagick')) {
            Log::error("GenerateDocumentPagesJob: Neither Ghostscript nor Imagick is available for doc {$doc->id}.");
            return;
        }

        Log::info("GenerateDocumentPagesJob: Using Imagick for doc {$doc->id}");

        try {
            // Count pages with Imagick
            $counter = new \Imagick();
            $counter->pingImage($pdfPath);
            $pageCount = $counter->getNumberImages();
            $counter->clear();
            $counter->destroy();

            if ($pageCount < 1) {
                Log::warning("GenerateDocumentPagesJob: Imagick returned 0 pages for doc {$doc->id}");
                return;
            }

            $doc->page_count = $pageCount;
            $doc->save();

            $pageDir = storage_path("app/pages/{$doc->id}");
            Storage::disk('local')->makeDirectory("pages/{$doc->id}");

            for ($page = 1; $page <= $pageCount; $page++) {
                $outputPath = "{$pageDir}/page-{$page}.png";
                if (file_exists($outputPath)) {
                    continue;
                }

                $imagick = new \Imagick();
                $imagick->setResolution(150, 150);
                // Force sRGB before reading — fixes green/tinted rendering of CMYK newspaper PDFs
                $imagick->setColorspace(\Imagick::COLORSPACE_SRGB);
                $imagick->readImage($pdfPath . '[' . ($page - 1) . ']');
                // Transform after reading to handle embedded CMYK profiles
                $imagick->transformImageColorspace(\Imagick::COLORSPACE_SRGB);
                $imagick->setImageFormat('png');
                $imagick->setImageCompressionQuality(90);
                $imagick->setImageBackgroundColor('white');
                $flat = $imagick->mergeImageLayers(\Imagick::LAYERMETHOD_FLATTEN);
                $flat->setImageFormat('png');
                $flat->writeImage($outputPath);
                $flat->clear();
                $flat->destroy();
                $imagick->clear();
                $imagick->destroy();
            }

            Log::info("GenerateDocumentPagesJob: Imagick done — {$pageCount} pages for doc {$doc->id}");
        } catch (\Throwable $e) {
            Log::error("GenerateDocumentPagesJob: Imagick failed for doc {$doc->id}: " . $e->getMessage());
        }
    }
}
