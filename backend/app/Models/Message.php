<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\URL;

class Message extends Model
{
    protected $fillable = [
        'conversation_id',
        'sender_id',
        'body',
        'attachment_path',
        'attachment_name',
        'attachment_mime',
        'read_at',
    ];

    protected $hidden = ['attachment_path'];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * Temporary signed URL for the private chat attachment.
     */
    public function getAttachmentUrlAttribute(): ?string
    {
        if (!$this->attachment_path || !$this->id) {
            return null;
        }

        return URL::temporarySignedRoute(
            'chat.attachment',
            now()->addHours(2),
            ['id' => $this->id]
        );
    }
}
