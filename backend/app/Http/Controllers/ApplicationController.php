<?php

namespace App\Http\Controllers;

use App\Models\Application;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    protected function getCandidate(Request $request)
    {
        return $request->user()->candidateProfile;
    }

    /**
     * List all applications submitted by the authenticated candidate.
     */
    public function index(Request $request): JsonResponse
    {
        $candidate = $this->getCandidate($request);

        if (!$candidate) {
            return response()->json([
                'success' => true,
                'message' => 'Daftar lamaran berhasil diambil.',
                'data' => [],
            ]);
        }

        $query = $candidate->applications()
            ->with([
                'jobVacancy:id,company_id,category_id,title,location,employment_type,salary_min,salary_max,deadline',
                'jobVacancy.company:id,company_name,logo,address',
                'jobVacancy.category:id,name',
            ]);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $applications = $query->orderBy('applied_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar lamaran berhasil diambil.',
            'data' => $applications,
        ]);
    }

    /**
     * Show detailed application information with status histories and interview details.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $candidate = $this->getCandidate($request);
        $application = Application::with([
            'jobVacancy:id,company_id,category_id,title,description,requirements,location,employment_type,salary_min,salary_max,education,deadline,status',
            'jobVacancy.company:id,company_name,description,logo,address,phone,website,verification_status',
            'jobVacancy.category:id,name',
            'jobVacancy.skills:id,name',
            'statusHistories' => function ($q) {
                $q->orderBy('created_at', 'asc');
            },
            'interviews',
        ])->find($id);

        if (!$application) {
            return response()->json([
                'success' => false,
                'message' => 'Data lamaran tidak ditemukan.',
            ], 404);
        }

        if (!$candidate || $application->candidate_id !== $candidate->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke data lamaran ini.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail lamaran berhasil diambil.',
            'data' => $application,
        ]);
    }
}
