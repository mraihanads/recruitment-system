<?php

namespace App\Http\Controllers;

use App\Models\Interview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CandidateInterviewController extends Controller
{
    /**
     * List all interviews for the authenticated candidate.
     */
    public function index(Request $request): JsonResponse
    {
        $candidate = $request->user()->candidateProfile;

        if (!$candidate) {
            return response()->json([
                'success' => true,
                'message' => 'Daftar wawancara berhasil diambil.',
                'data' => [],
            ]);
        }

        $interviews = Interview::whereHas('application', function ($q) use ($candidate) {
            $q->where('candidate_id', $candidate->id);
        })->with([
            'application.jobVacancy:id,company_id,category_id,title,location,employment_type',
            'application.jobVacancy.company:id,company_name,logo,address,phone',
        ])->latest('interview_date')->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar jadwal wawancara berhasil diambil.',
            'data' => $interviews,
        ]);
    }

    /**
     * Show a specific interview with candidate ownership check.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $candidate = $request->user()->candidateProfile;

        $interview = Interview::with([
            'application.jobVacancy.company',
            'application.jobVacancy.category',
            'application.statusHistories.changer:id,name',
        ])->find($id);

        if (!$interview) {
            return response()->json([
                'success' => false,
                'message' => 'Jadwal wawancara tidak ditemukan.',
            ], 404);
        }

        if (!$candidate || $interview->application->candidate_id !== $candidate->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke jadwal wawancara ini.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail jadwal wawancara berhasil diambil.',
            'data' => $interview,
        ]);
    }
}
