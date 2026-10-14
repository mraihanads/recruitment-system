<?php

namespace App\Http\Controllers;

use App\Models\JobVacancy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdminJobController extends Controller
{
    /**
     * Display a listing of all job vacancies.
     */
    public function index(Request $request): JsonResponse
    {
        $query = JobVacancy::with([
            'company:id,user_id,company_name,logo',
            'category:id,name',
            'skills:id,name',
        ])->withCount('applications');

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where('title', 'like', "%{$search}%");
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->query('category_id'));
        }

        if ($request->filled('company_id')) {
            $query->where('company_id', $request->query('company_id'));
        }

        $perPage = (int) $request->query('per_page', 10);
        $jobs = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $jobs,
        ]);
    }

    /**
     * Display the specified job vacancy.
     */
    public function show(int $id): JsonResponse
    {
        $job = JobVacancy::with([
            'company',
            'category:id,name',
            'skills:id,name',
        ])->withCount('applications')->find($id);

        if (!$job) {
            return response()->json([
                'success' => false,
                'message' => 'Lowongan tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $job,
        ]);
    }

    /**
     * Update the status of a job vacancy.
     */
    public function changeStatus(Request $request, int $id): JsonResponse
    {
        $job = JobVacancy::find($id);

        if (!$job) {
            return response()->json([
                'success' => false,
                'message' => 'Lowongan tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:draft,active,closed',
        ], [
            'status.required' => 'Status lowongan wajib diisi.',
            'status.in' => 'Status lowongan harus draft, active, atau closed.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $job->status = $request->input('status');
        $job->save();

        return response()->json([
            'success' => true,
            'message' => 'Status lowongan berhasil diperbarui.',
            'data' => $job->load(['company:id,company_name', 'category:id,name']),
        ]);
    }

    /**
     * Remove the specified job vacancy.
     */
    public function destroy(int $id): JsonResponse
    {
        $job = JobVacancy::find($id);

        if (!$job) {
            return response()->json([
                'success' => false,
                'message' => 'Lowongan tidak ditemukan.',
            ], 404);
        }

        if ($job->applications()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Lowongan memiliki pelamar dan tidak dapat dihapus.',
            ], 422);
        }

        $job->skills()->detach();
        $job->delete();

        return response()->json([
            'success' => true,
            'message' => 'Lowongan berhasil dihapus.',
        ]);
    }
}
