<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'company_name',
        'description',
        'logo',
        'address',
        'phone',
        'website',
        'verification_status',
    ];

    protected $appends = ['logo_url'];

    public function getLogoAttribute($value): ?string
    {
        if (!$value) return null;
        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            return $value;
        }
        $clean = ltrim(preg_replace('/^public\//', '', $value), '/');
        return url("storage/{$clean}");
    }

    public function getLogoUrlAttribute(): ?string
    {
        return $this->logo;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function jobVacancies(): HasMany
    {
        return $this->hasMany(JobVacancy::class, 'company_id');
    }

    public function companyDocuments(): HasMany
    {
        return $this->hasMany(CompanyDocument::class, 'company_id');
    }
}
