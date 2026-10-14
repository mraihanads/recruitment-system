<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdminUserController extends Controller
{
    /**
     * Display a listing of users with search and filter.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with([
            'candidateProfile:id,user_id,full_name,phone,gender',
            'company:id,user_id,company_name,verification_status,phone',
        ]);

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->query('role'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $perPage = (int) $request->query('per_page', 10);
        $users = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    /**
     * Display detailed user information.
     */
    public function show(int $id): JsonResponse
    {
        $user = User::with([
            'candidateProfile:id,user_id,full_name,phone,gender,birth_date,address',
            'company:id,user_id,company_name,description,address,phone,website,verification_status',
        ])->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    /**
     * Update user active/inactive status.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:active,inactive',
        ], [
            'status.required' => 'Status user wajib diisi.',
            'status.in' => 'Status user harus active atau inactive.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        if ((int) $request->user()->id === (int) $id && $request->input('status') === 'inactive') {
            return response()->json([
                'success' => false,
                'message' => 'Admin tidak dapat menonaktifkan akunnya sendiri.',
            ], 422);
        }

        $user->status = $request->input('status');
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Status user berhasil diperbarui.',
            'data' => $user,
        ]);
    }

    /**
     * Delete a user account.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        if ((int) $request->user()->id === (int) $id) {
            return response()->json([
                'success' => false,
                'message' => 'Admin tidak dapat menghapus akunnya sendiri.',
            ], 422);
        }

        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User berhasil dihapus.',
        ]);
    }
}
