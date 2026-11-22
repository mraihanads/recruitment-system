<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'document_type',
        'document_file',
        'verification_status',
        'verified_by',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'verified_at' => 'datetime',
        ];
    }

    protected $appends = ['document_url'];

    public function getDocumentUrlAttribute(): ?string
    {
        if (!$this->document_file) return null;
        if (str_starts_with($this->document_file, 'http://') || str_starts_with($this->document_file, 'https://')) {
            return $this->document_file;
        }
        $clean = ltrim(preg_replace('/^public\//', '', $this->document_file), '/');
        return url("storage/{$clean}");
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
