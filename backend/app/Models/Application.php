<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Application extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_id',
        'candidate_id',
        'cv_file',
        'cover_letter',
        'status',
        'match_percentage',
        'applied_at',
    ];

    protected function casts(): array
    {
        return [
            'match_percentage' => 'decimal:2',
            'applied_at' => 'datetime',
        ];
    }

    protected $appends = ['cv_url', 'cover_letter_url', 'cover_letter_files'];

    public function getCvUrlAttribute(): ?string
    {
        if (!$this->cv_file) return null;
        if (str_starts_with($this->cv_file, 'http://') || str_starts_with($this->cv_file, 'https://')) {
            return $this->cv_file;
        }
        $clean = ltrim(preg_replace('/^public\//', '', $this->cv_file), '/');
        return "http://127.0.0.1:8000/storage/{$clean}";
    }

    public function getCoverLetterFilesAttribute(): array
    {
        if (!$this->cover_letter) return [];

        $paths = [];
        $trimmed = trim($this->cover_letter);

        if (str_starts_with($trimmed, '[')) {
            $decoded = json_decode($trimmed, true);
            if (is_array($decoded)) {
                $paths = $decoded;
            }
        } elseif (str_starts_with($trimmed, 'candidate/') || str_starts_with($trimmed, 'http')) {
            $paths = [$trimmed];
        }

        $result = [];
        foreach ($paths as $p) {
            if (!is_string($p) || empty($p)) continue;
            $url = (str_starts_with($p, 'http://') || str_starts_with($p, 'https://'))
                ? $p
                : "http://127.0.0.1:8000/storage/" . ltrim(preg_replace('/^public\//', '', $p), '/');
            $result[] = [
                'path' => $p,
                'name' => basename($p),
                'url' => $url,
            ];
        }

        return $result;
    }

    public function getCoverLetterUrlAttribute(): ?string
    {
        $files = $this->cover_letter_files;
        return count($files) > 0 ? $files[0]['url'] : null;
    }

    public function jobVacancy(): BelongsTo
    {
        return $this->belongsTo(JobVacancy::class, 'job_id');
    }

    public function candidateProfile(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class, 'candidate_id');
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(ApplicationStatusHistory::class, 'application_id');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(ApplicationNote::class, 'application_id');
    }

    public function interviews(): HasMany
    {
        return $this->hasMany(Interview::class, 'application_id');
    }
}
