<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ChatController extends Controller
{
    private const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'zip'];
    private const BLOCKED_MIMES = [
        'text/html', 'text/x-php', 'application/x-httpd-php',
        'application/javascript', 'text/javascript', 'image/svg+xml',
    ];

    /**
     * Determine which side of the conversation the user is on ('candidate' | 'company' | null).
     */
    protected function sideOf(Request $request, Conversation $conversation): ?string
    {
        $user = $request->user();

        if ($user->role === 'candidate') {
            $profile = $user->candidateProfile;
            return $profile && (int) $profile->id === (int) $conversation->candidate_id ? 'candidate' : null;
        }

        if ($user->role === 'company') {
            $company = $user->company;
            return $company && (int) $company->id === (int) $conversation->company_id ? 'company' : null;
        }

        return null;
    }

    protected function forbidden(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Anda tidak memiliki akses ke percakapan ini.',
        ], 403);
    }

    protected function formatMessage(Message $message, int $viewerId): array
    {
        $attachment = null;
        if ($message->attachment_path) {
            $mime = (string) $message->attachment_mime;
            $attachment = [
                'name' => $message->attachment_name,
                'mime' => $mime,
                'is_image' => str_starts_with($mime, 'image/'),
                'url' => $message->attachment_url,
            ];
        }

        return [
            'id' => $message->id,
            'conversation_id' => $message->conversation_id,
            'sender_id' => $message->sender_id,
            'is_mine' => (int) $message->sender_id === $viewerId,
            'body' => $message->body,
            'attachment' => $attachment,
            'read_at' => $message->read_at,
            'created_at' => $message->created_at,
        ];
    }

    /**
     * List conversations of the authenticated candidate/company with unread counts.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Conversation::query();

        if ($user->role === 'candidate') {
            $profile = $user->candidateProfile;
            $query->where('candidate_id', $profile?->id ?? 0)
                ->with(['company:id,company_name,logo', 'application.jobVacancy:id,title']);
        } else {
            $company = $user->company;
            $query->where('company_id', $company?->id ?? 0)
                ->with(['candidate:id,user_id,full_name,photo', 'application.jobVacancy:id,title']);
        }

        $conversations = $query
            ->with('latestMessage')
            ->withCount(['messages as unread_count' => function ($q) use ($user) {
                $q->where('sender_id', '!=', $user->id)->whereNull('read_at');
            }])
            ->orderByDesc('last_message_at')
            ->orderByDesc('id')
            ->get();

        $data = $conversations->map(function (Conversation $c) use ($user) {
            $last = $c->latestMessage;
            $lastText = null;
            if ($last) {
                $lastText = $last->body ?: ($last->attachment_name ? 'Lampiran: ' . $last->attachment_name : null);
            }

            if ($user->role === 'candidate') {
                $name = $c->company?->company_name ?? 'Perusahaan';
                $avatar = $c->company?->logo_url;
            } else {
                $name = $c->candidate?->full_name ?? 'Kandidat';
                $avatar = $c->candidate?->photo_url;
            }

            return [
                'id' => $c->id,
                'application_id' => $c->application_id,
                'job_title' => $c->application?->jobVacancy?->title,
                'counterpart_name' => $name,
                'counterpart_avatar' => $avatar,
                'last_message' => $lastText,
                'last_message_at' => $c->last_message_at,
                'unread_count' => (int) $c->unread_count,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'message' => 'Daftar percakapan berhasil diambil.',
            'data' => $data,
        ]);
    }

    /**
     * Start (or reuse) the conversation attached to an application. Either party may start it.
     */
    public function start(Request $request, $applicationId): JsonResponse
    {
        $user = $request->user();
        $application = Application::with('jobVacancy:id,company_id')->find($applicationId);

        if (!$application || !$application->jobVacancy) {
            return response()->json([
                'success' => false,
                'message' => 'Data lamaran tidak ditemukan.',
            ], 404);
        }

        $isCandidateOwner = $user->role === 'candidate'
            && $user->candidateProfile
            && (int) $user->candidateProfile->id === (int) $application->candidate_id;
        $isCompanyOwner = $user->role === 'company'
            && $user->company
            && (int) $user->company->id === (int) $application->jobVacancy->company_id;

        if (!$isCandidateOwner && !$isCompanyOwner) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke lamaran ini.',
            ], 403);
        }

        $conversation = Conversation::firstOrCreate(
            ['application_id' => $application->id],
            [
                'candidate_id' => $application->candidate_id,
                'company_id' => $application->jobVacancy->company_id,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Percakapan siap digunakan.',
            'data' => ['id' => $conversation->id],
        ]);
    }

    /**
     * Fetch messages. With ?after_id= returns only newer messages (used by polling).
     * Incoming messages from the other party are marked as read.
     */
    public function messages(Request $request, $id): JsonResponse
    {
        $conversation = Conversation::find($id);
        if (!$conversation) {
            return response()->json(['success' => false, 'message' => 'Percakapan tidak ditemukan.'], 404);
        }
        if (!$this->sideOf($request, $conversation)) {
            return $this->forbidden();
        }

        $user = $request->user();
        $afterId = (int) $request->query('after_id', 0);

        if ($afterId > 0) {
            $messages = $conversation->messages()
                ->where('id', '>', $afterId)
                ->orderBy('id')
                ->limit(200)
                ->get();
        } else {
            $messages = $conversation->messages()
                ->orderByDesc('id')
                ->limit(100)
                ->get()
                ->reverse()
                ->values();
        }

        $conversation->messages()
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $otherReadUpTo = (int) $conversation->messages()
            ->where('sender_id', $user->id)
            ->whereNotNull('read_at')
            ->max('id');

        return response()->json([
            'success' => true,
            'message' => 'Pesan berhasil diambil.',
            'data' => [
                'messages' => $messages->map(fn (Message $m) => $this->formatMessage($m, $user->id))->values(),
                'other_read_up_to_id' => $otherReadUpTo,
            ],
        ]);
    }

    /**
     * Send a text and/or file message.
     */
    public function send(Request $request, $id): JsonResponse
    {
        $conversation = Conversation::with(['candidate:id,user_id,full_name', 'company:id,user_id,company_name'])->find($id);
        if (!$conversation) {
            return response()->json(['success' => false, 'message' => 'Percakapan tidak ditemukan.'], 404);
        }

        $side = $this->sideOf($request, $conversation);
        if (!$side) {
            return $this->forbidden();
        }

        $request->validate([
            'body' => ['nullable', 'string', 'max:2000'],
            'attachment' => ['nullable', 'file', 'max:10240'],
        ], [
            'body.max' => 'Pesan maksimal 2000 karakter.',
            'attachment.max' => 'Ukuran lampiran maksimal 10MB.',
        ]);

        $body = trim((string) $request->input('body', ''));
        $file = $request->file('attachment');

        if ($body === '' && !$file) {
            return response()->json([
                'success' => false,
                'message' => 'Tulis pesan atau pilih lampiran terlebih dahulu.',
            ], 422);
        }

        $attrs = [
            'conversation_id' => $conversation->id,
            'sender_id' => $request->user()->id,
            'body' => $body !== '' ? $body : null,
        ];

        if ($file) {
            $extension = strtolower($file->getClientOriginalExtension());
            $mime = strtolower((string) $file->getMimeType());

            if (!in_array($extension, self::ALLOWED_EXTENSIONS, true) || in_array($mime, self::BLOCKED_MIMES, true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Format lampiran harus PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, atau ZIP.',
                ], 422);
            }

            $safeName = preg_replace('/[^A-Za-z0-9._\- ()]/', '_', basename($file->getClientOriginalName()));
            if ($safeName === '' || $safeName === null) {
                $safeName = 'lampiran.' . $extension;
            }

            $attrs['attachment_path'] = $file->store("chat/{$conversation->id}", 'private');
            $attrs['attachment_name'] = mb_substr($safeName, 0, 200);
            $attrs['attachment_mime'] = mb_substr($mime ?: 'application/octet-stream', 0, 100);
        }

        $message = Message::create($attrs);
        $conversation->update(['last_message_at' => $message->created_at]);

        // Notify the other party once per unread burst to avoid notification spam.
        $senderId = $request->user()->id;
        $recipientUserId = $side === 'candidate' ? $conversation->company?->user_id : $conversation->candidate?->user_id;
        $senderName = $side === 'candidate' ? ($conversation->candidate?->full_name ?? 'Kandidat') : ($conversation->company?->company_name ?? 'Perusahaan');

        $unreadFromSender = $conversation->messages()
            ->where('sender_id', $senderId)
            ->whereNull('read_at')
            ->count();

        if ($recipientUserId && $unreadFromSender === 1) {
            Notification::create([
                'user_id' => $recipientUserId,
                'title' => 'Pesan Baru',
                'message' => "{$senderName} mengirim pesan baru pada percakapan lamaran Anda.",
                'type' => 'chat_message',
                'is_read' => false,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Pesan terkirim.',
            'data' => $this->formatMessage($message, $senderId),
        ], 201);
    }

    /**
     * Stream a chat attachment through a signed URL. The URL is only issued inside
     * responses that already passed participant authorization.
     */
    public function attachment($id): StreamedResponse|JsonResponse
    {
        $message = Message::find($id);
        if (!$message || !$message->attachment_path) {
            return response()->json(['success' => false, 'message' => 'Lampiran tidak ditemukan.'], 404);
        }

        $path = $message->attachment_path;
        if (str_contains($path, '..') || !Storage::disk('private')->exists($path)) {
            return response()->json(['success' => false, 'message' => 'File tidak ditemukan di server penyimpanan.'], 404);
        }

        $name = $message->attachment_name ?: basename($path);

        return Storage::disk('private')->response($path, $name, [
            'Content-Type' => $message->attachment_mime ?: 'application/octet-stream',
            'Content-Disposition' => 'inline; filename="' . addslashes($name) . '"',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store, max-age=0',
        ]);
    }
}
