<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CandidateNotificationController extends Controller
{
    /**
     * List all notifications for the authenticated candidate user.
     */
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()->notifications()->latest()->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar notifikasi kandidat berhasil diambil.',
            'data' => $notifications,
        ]);
    }

    /**
     * Mark a notification as read with ownership guard.
     */
    public function markRead(Request $request, $id): JsonResponse
    {
        $notification = Notification::find($id);

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notifikasi tidak ditemukan.',
            ], 404);
        }

        if ((int) $notification->user_id !== (int) $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke notifikasi ini.',
            ], 403);
        }

        $notification->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi ditandai sebagai sudah dibaca.',
            'data' => $notification,
        ]);
    }

    /**
     * Mark all notifications as read for the authenticated candidate user.
     */
    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->notifications()->where('is_read', false)->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Semua notifikasi berhasil ditandai sebagai sudah dibaca.',
        ]);
    }
}
