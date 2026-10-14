<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\ApplicationStatusHistory;
use App\Models\JobCategory;
use App\Models\JobVacancy;
use App\Services\SkillMatchingService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JobController extends Controller
{
    protected SkillMatchingService $matchingService;

    public function __construct(SkillMatchingService $matchingService)
    {
        $this->matchingService = $matchingService;
    }

    protected function getCandidate(Request $request)
    {
        return $request->user()->candidateProfile;
    }

    /**
     * List active and non-expired job vacancies with optional filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = JobVacancy::with([
            'company:id,user_id,company_name,logo,address,verification_status',
            'category:id,name',
            'skills:id,name',
        ])
        ->where('status', 'active')
        ->whereDate('deadline', '>=', Carbon::today());

        // Filter: search keyword (title, description, or requirements)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('requirements', 'like', "%{$search}%")
                  ->orWhereHas('company', function ($cq) use ($search) {
                      $cq->where('company_name', 'like', "%{$search}%");
                  });
            });
        }

        // Filter: location
        if ($request->filled('location')) {
            $query->where('location', 'like', "%{$request->location}%");
        }

        // Filter: employment_type
        if ($request->filled('employment_type')) {
            $query->where('employment_type', $request->employment_type);
        }

        // Filter: category_id
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $perPage = (int) $request->get('per_page', 10);
        $jobs = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Daftar lowongan kerja berhasil diambil.',
            'data' => $jobs,
        ]);
    }

    /**
     * Show job vacancy details with application & save status for candidate.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $job = JobVacancy::with([
            'company:id,user_id,company_name,description,logo,address,phone,website,verification_status',
            'category:id,name,description',
            'skills:id,name',
        ])->find($id);

        if (!$job) {
            return response()->json([
                'success' => false,
                'message' => 'Lowongan kerja tidak ditemukan.',
            ], 404);
        }

        $candidate = $this->getCandidate($request);
        $isClosed = ($job->status !== 'active' || Carbon::parse($job->deadline)->isPast());

        $application = null;
        $isSaved = false;

        if ($candidate) {
            $application = Application::where('job_id', $job->id)
                ->where('candidate_id', $candidate->id)
                ->first();

            $isSaved = $candidate->savedJobs()->where('job_id', $job->id)->exists();
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail lowongan kerja berhasil diambil.',
            'data' => [
                'job' => $job,
                'is_active' => !$isClosed,
                'has_applied' => !is_null($application),
                'application' => $application ? [
                    'id' => $application->id,
                    'status' => $application->status,
                    'match_percentage' => $application->match_percentage,
                    'applied_at' => $application->applied_at,
                ] : null,
                'is_saved' => $isSaved,
            ],
        ]);
    }

    /**
     * Preview candidate skill matching for a job vacancy.
     */
    public function match(Request $request, $id): JsonResponse
    {
        $job = JobVacancy::find($id);
        if (!$job) {
            return response()->json([
                'success' => false,
                'message' => 'Lowongan kerja tidak ditemukan.',
            ], 404);
        }

        $candidate = $this->getCandidate($request);
        if (!$candidate) {
            return response()->json([
                'success' => false,
                'message' => 'Profil kandidat tidak ditemukan.',
            ], 404);
        }

        $matchResult = $this->matchingService->calculate($candidate, $job);

        return response()->json([
            'success' => true,
            'message' => 'Matching berhasil dihitung.',
            'data' => $matchResult,
        ]);
    }

    /**
     * Apply for a job vacancy.
     */
    public function apply(Request $request, $id): JsonResponse
    {
        $job = JobVacancy::find($id);
        if (!$job) {
            return response()->json([
                'success' => false,
                'message' => 'Lowongan kerja tidak ditemukan.',
            ], 404);
        }

        if ($job->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Lowongan ini sudah tidak aktif atau ditutup.',
            ], 422);
        }

        if (Carbon::parse($job->deadline)->endOfDay()->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'Batas waktu (deadline) lamaran untuk lowongan ini telah berakhir.',
            ], 422);
        }

        $candidate = $this->getCandidate($request);
        if (!$candidate) {
            return response()->json([
                'success' => false,
                'message' => 'Profil kandidat tidak ditemukan.',
            ], 422);
        }

        if (empty($candidate->cv_file)) {
            return response()->json([
                'success' => false,
                'message' => 'Anda belum mengunggah CV. Silakan unggah CV terlebih dahulu di menu Profil sebelum melamar pekerjaan.',
            ], 422);
        }

        // Check if candidate already applied for this job
        $existing = Application::where('job_id', $job->id)
            ->where('candidate_id', $candidate->id)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Anda sudah pernah melamar lowongan ini.',
            ], 422);
        }

        $request->validate([
            'cover_letter' => ['nullable', 'string'],
        ]);

        $matchResult = $this->matchingService->calculate($candidate, $job);

        return DB::transaction(function () use ($job, $candidate, $request, $matchResult) {
            $application = Application::create([
                'job_id' => $job->id,
                'candidate_id' => $candidate->id,
                'cv_file' => $candidate->cv_file,
                'cover_letter' => $request->cover_letter,
                'status' => 'submitted',
                'match_percentage' => $matchResult['match_percentage'],
                'applied_at' => Carbon::now(),
            ]);

            ApplicationStatusHistory::create([
                'application_id' => $application->id,
                'status' => 'submitted',
                'note' => 'Lamaran berhasil dikirimkan oleh kandidat.',
                'changed_by' => $request->user()->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Lamaran berhasil dikirim.',
                'data' => [
                    'id' => $application->id,
                    'job_id' => $application->job_id,
                    'status' => $application->status,
                    'match_percentage' => $application->match_percentage,
                    'applied_at' => $application->applied_at,
                ],
            ], 201);
        });
    }

    /**
     * Get list of all job categories.
     */
    public function categories(): JsonResponse
    {
        $categories = JobCategory::orderBy('name')->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar kategori pekerjaan berhasil diambil.',
            'data' => $categories,
        ]);
    }
}
