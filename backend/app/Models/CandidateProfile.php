<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CandidateProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'full_name',
        'phone',
        'gender',
        'birth_date',
        'address',
        'photo',
        'bio',
        'cv_file',
    ];

    protected $appends = ['photo_url', 'cv_url'];

    public function getPhotoUrlAttribute(): ?string
    {
        if (!$this->photo) return null;
        if (str_starts_with($this->photo, 'http://') || str_starts_with($this->photo, 'https://')) {
            return $this->photo;
        }
        $clean = ltrim(preg_replace('/^public\//', '', $this->photo), '/');
        return url("storage/{$clean}");
    }

    public function getCvUrlAttribute(): ?string
    {
        if (!$this->cv_file) return null;
        if (str_starts_with($this->cv_file, 'http://') || str_starts_with($this->cv_file, 'https://')) {
            return $this->cv_file;
        }
        if ($this->id) {
            return \Illuminate\Support\Facades\URL::temporarySignedRoute(
                'private.files.candidate-cv',
                now()->addMinutes(30),
                ['profileId' => $this->id]
            );
        }
        return null;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function educations(): HasMany
    {
        return $this->hasMany(CandidateEducation::class, 'candidate_id');
    }

    public function experiences(): HasMany
    {
        return $this->hasMany(CandidateExperience::class, 'candidate_id');
    }

    public function portfolios(): HasMany
    {
        return $this->hasMany(CandidatePortfolio::class, 'candidate_id');
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'candidate_skills', 'candidate_id', 'skill_id')
            ->withTimestamps();
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class, 'candidate_id');
    }

    public function savedJobs(): HasMany
    {
        return $this->hasMany(SavedJob::class, 'candidate_id');
    }
}
