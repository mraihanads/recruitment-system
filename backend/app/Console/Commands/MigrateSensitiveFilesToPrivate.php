<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class MigrateSensitiveFilesToPrivate extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'storage:migrate-private {--dry-run : Preview files to migrate without modifying disk}';

    /**
     * The console command description.
     */
    protected $description = 'Safely migrate legacy sensitive files (CVs, company legal documents, application attachments) from public disk to private disk with SHA-256 verification.';

    /**
     * Sensitive directories to migrate. Non-sensitive assets (company/logos, candidate/photos) are never touched.
     */
    protected array $sensitiveDirectories = [
        'candidate/cvs',
        'candidate/cover_letters',
        'company/documents',
    ];

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $publicDisk = Storage::disk('public');
        $privateDisk = Storage::disk('private');

        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        foreach ($this->sensitiveDirectories as $dir) {
            if (!$publicDisk->exists($dir)) {
                continue;
            }

            $files = $publicDisk->allFiles($dir);
            foreach ($files as $relativePath) {
                if (!$publicDisk->exists($relativePath)) {
                    $this->error("Source file missing, skipped: {$relativePath}");
                    $failed++;
                    continue;
                }

                if ($dryRun) {
                    $this->line("[DRY-RUN] Would migrate: {$relativePath}");
                    $migrated++;
                    continue;
                }

                // 1. Read source content via Flysystem and compute SHA-256
                $contents = $publicDisk->get($relativePath);
                if ($contents === null) {
                    $this->error("Failed to read source file: {$relativePath}");
                    $failed++;
                    continue;
                }
                $srcHash = hash('sha256', $contents);

                // 2. Write to private disk preserving exact relative path (keeps DB paths 100% consistent)
                $written = $privateDisk->put($relativePath, $contents);
                if (!$written || !$privateDisk->exists($relativePath)) {
                    $this->error("Failed to write private copy for: {$relativePath}");
                    $failed++;
                    continue;
                }

                // 3. Verify SHA-256 byte-for-byte integrity before removing public copy
                $writtenContents = $privateDisk->get($relativePath);
                $dstHash = $writtenContents !== null ? hash('sha256', $writtenContents) : false;

                if ($dstHash === false || !hash_equals($srcHash, $dstHash)) {
                    $this->error("SHA-256 mismatch for {$relativePath}; keeping public file intact.");
                    $failed++;
                    continue;
                }

                // 4. Remove public exposure only after verified integrity match
                $publicDisk->delete($relativePath);
                $this->info("Migrated & verified (SHA-256): {$relativePath}");
                $migrated++;
            }

            // Clean up empty sensitive directories on public disk (non-destructive)
            if (!$dryRun && $publicDisk->exists($dir) && count($publicDisk->allFiles($dir)) === 0) {
                $publicDisk->deleteDirectory($dir);
            }
        }

        $this->newLine();
        $this->info("Summary: migrated={$migrated}, skipped={$skipped}, failed={$failed}" . ($dryRun ? ' (DRY-RUN)' : ''));

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
