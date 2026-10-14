<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\ApplicationStatusHistory;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdminApplicationController extends Controller
{
    /**
     * Display a listing of all applications.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Application::with([
            'jobVacancy.company:id,company_name,logo',
            'jobVacancy.category:id,name',
            'candidateProfile:id,user_id,full_name,phone',
            'candidateProfile.user:id,name,email',
        ]);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('job_id')) {
            $query->where('job_id', $request->query('job_id'));
        }

        if ($request->filled('company_id')) {
            $companyId = $request->query('company_id');
            $query->whereHas('jobVacancy', function ($q) use ($companyId) {
                $q->where('company_id', $companyId);
            });
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->whereHas('candidateProfile', function ($sub) use ($search) {
                    $sub->where('full_name', 'like', "%{$search}%");
                })->orWhereHas('jobVacancy', function ($sub) use ($search) {
                    $sub->where('title', 'like', "%{$search}%");
                });
            });
        }

        $perPage = (int) $request->query('per_page', 10);
        $applications = $query->latest('applied_at')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $applications,
        ]);
    }

    /**
     * Display detailed application information.
     */
    public function show(int $id): JsonResponse
    {
        $application = Application::with([
            'jobVacancy.company',
            'jobVacancy.skills',
            'candidateProfile.user:id,name,email',
            'candidateProfile.educations',
            'candidateProfile.experiences',
            'candidateProfile.portfolios',
            'candidateProfile.skills',
            'statusHistories.changer:id,name,role',
            'notes.user:id,name,role',
            'interviews',
        ])->find($id);

        if (!$application) {
            return response()->json([
                'success' => false,
                'message' => 'Lamaran tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $application,
        ]);
    }

    /**
     * Update application status, record history, and notify candidate.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $application = Application::with(['jobVacancy', 'candidateProfile'])->find($id);

        if (!$application) {
            return response()->json([
                'success' => false,
                'message' => 'Lamaran tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:submitted,screening,interview,test,accepted,rejected',
            'note' => 'nullable|string',
        ], [
            'status.required' => 'Status lamaran wajib diisi.',
            'status.in' => 'Status lamaran tidak valid.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $newStatus = $request->input('status');
        $note = $request->input('note');

        $application->status = $newStatus;
        $application->save();

        // Record history with changed_by admin
        ApplicationStatusHistory::create([
            'application_id' => $application->id,
            'status' => $newStatus,
            'note' => $note,
            'changed_by' => $request->user()->id,
        ]);

        // Send notification to candidate
        $candidateUserId = $application->candidateProfile?->user_id;
        if ($candidateUserId) {
            Notification::create([
                'user_id' => $candidateUserId,
                'title' => 'Status Lamaran Diperbarui',
                'message' => "Status lamaran Anda untuk lowongan {$application->jobVacancy?->title} telah diubah menjadi {$newStatus}.",
                'type' => 'application_status',
                'is_read' => false,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Status lamaran berhasil diperbarui.',
            'data' => $application->fresh([
                'statusHistories.changer:id,name,role',
            ]),
        ]);
    }
}
