<?php

namespace App\Http\Controllers;

use App\Models\Interview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminInterviewController extends Controller
{
    /**
     * Display a listing of all interviews for monitoring.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Interview::with([
            'application.candidateProfile:id,user_id,full_name,phone',
            'application.candidateProfile.user:id,name,email',
            'application.jobVacancy:id,company_id,title,category_id',
            'application.jobVacancy.company:id,company_name,logo',
        ]);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('method')) {
            $query->where('method', $request->query('method'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->whereHas('application.candidateProfile', function ($sub) use ($search) {
                    $sub->where('full_name', 'like', "%{$search}%");
                })->orWhereHas('application.jobVacancy', function ($sub) use ($search) {
                    $sub->where('title', 'like', "%{$search}%");
                })->orWhereHas('application.jobVacancy.company', function ($sub) use ($search) {
                    $sub->where('company_name', 'like', "%{$search}%");
                });
            });
        }

        $perPage = (int) $request->query('per_page', 10);
        $interviews = $query->latest('interview_date')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $interviews,
        ]);
    }

    /**
     * Display detailed interview information.
     */
    public function show(int $id): JsonResponse
    {
        $interview = Interview::with([
            'application.candidateProfile.user:id,name,email',
            'application.jobVacancy.company',
            'application.jobVacancy.category:id,name',
        ])->find($id);

        if (!$interview) {
            return response()->json([
                'success' => false,
                'message' => 'Jadwal interview tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $interview,
        ]);
    }
}
