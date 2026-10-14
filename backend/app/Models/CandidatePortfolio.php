<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CandidatePortfolio extends Model
{
    use HasFactory;

    protected $table = 'candidate_portfolios';

    protected $fillable = [
        'candidate_id',
        'title',
        'description',
        'project_url',
        'image',
    ];

    public function candidateProfile(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class, 'candidate_id');
    }
}
