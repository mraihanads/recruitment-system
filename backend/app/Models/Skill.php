<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Skill extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
    ];

    public function candidateProfiles(): BelongsToMany
    {
        return $this->belongsToMany(CandidateProfile::class, 'candidate_skills', 'skill_id', 'candidate_id')
            ->withTimestamps();
    }

    public function jobVacancies(): BelongsToMany
    {
        return $this->belongsToMany(JobVacancy::class, 'job_skills', 'skill_id', 'job_id')
            ->withTimestamps();
    }
}
