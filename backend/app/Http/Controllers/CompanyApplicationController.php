<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\ApplicationNote;
use App\Models\ApplicationStatusHistory;
use App\Models\Notification;
use App\Services\SkillMatchingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class CompanyApplicationController extends Controller
{
    protected SkillMatchingService $matchingService;

    public function __construct(SkillMatchingService $matchingService)
    {
        $this->matchingService = $matchingService;
    }

    protected function getCompany(Request $request)
    {
        return $request->user()->company;
    }

    /**
     * List all applications submitted to jobs owned by the company.
     */
    public function index(Request $request): JsonResponse
    {
        $company = $this->getCompany($request);

        if (!$company) {
            return response()->json([
                'success' => true,
                'message' => 'Daftar pelamar berhasil diambil.',
                'data' => [],
            ]);
        }

        $companyJobIds = $company->jobVacancies()->pluck('id')->toArray();

        $query = Application::with([
            'jobVacancy:id,title,location,employment_type',
            'candidateProfile:id,user_id,full_name,phone,photo,bio,cv_file',
        ])->whereIn('job_id', $companyJobIds);

        if ($request->filled('job_id')) {
            $query->where('job_id', $request->job_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $applications = $query->orderBy('applied_at', 'desc')->get()->map(function ($app) {
            $candidate = $app->candidateProfile;
            return [
                'id' => $app->id,
                'status' => $app->status,
                'match_percentage' => (float) $app->match_percentage,
                'applied_at' => $app->applied_at,
                'job' => $app->jobVacancy,
                'candidate' => $candidate ? [
                    'id' => $candidate->id,
                    'full_name' => $candidate->full_name,
                    'phone' => $candidate->phone,
                    'photo' => $candidate->photo,
                    'photo_url' => $candidate->photo ? Storage::disk('public')->url($candidate->photo) : null,
                    'bio' => $candidate->bio,
                    'cv_file' => $app->cv_file,
                    'cv_url' => $app->cv_file ? Storage::disk('public')->url($app->cv_file) : null,
                ] : null,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Daftar pelamar berhasil diambil.',
            'data' => $applications,
        ]);
    }

    /**
     * Show application details with candidate profile, educations, experiences, portfolios, and skills.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $company = $this->getCompany($request);
        $application = Application::with([
            'jobVacancy',
            'candidateProfile.educations',
            'candidateProfile.experiences',
            'candidateProfile.portfolios',
            'candidateProfile.skills',
            'statusHistories.changer:id,name',
            'interviews',
        ])->find($id);

        if (!$application) {
            return response()->json([
                'success' => false,
                'message' => 'Data lamaran tidak ditemukan.',
            ], 404);
        }

        if (!$company || $application->jobVacancy->company_id !== $company->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke data lamaran ini.',
            ], 403);
        }

        $cand = $application->candidateProfile;

        return response()->json([
            'success' => true,
            'message' => 'Detail lamaran berhasil diambil.',
            'data' => [
                'application' => [
                    'id' => $application->id,
                    'status' => $application->status,
                    'match_percentage' => (float) $application->match_percentage,
                    'cover_letter' => $application->cover_letter,
                    'cv_file' => $application->cv_file,
                    'cv_url' => $application->cv_file ? Storage::disk('public')->url($application->cv_file) : null,
                    'applied_at' => $application->applied_at,
                    'status_histories' => $application->statusHistories,
                    'interviews' => $application->interviews,
                ],
                'job' => [
                    'id' => $application->jobVacancy->id,
                    'title' => $application->jobVacancy->title,
                    'location' => $application->jobVacancy->location,
                    'employment_type' => $application->jobVacancy->employment_type,
                ],
                'candidate' => $cand ? [
                    'id' => $cand->id,
                    'full_name' => $cand->full_name,
                    'phone' => $cand->phone,
                    'gender' => $cand->gender,
                    'birth_date' => $cand->birth_date,
                    'address' => $cand->address,
                    'bio' => $cand->bio,
                    'photo_url' => $cand->photo ? Storage::disk('public')->url($cand->photo) : null,
                    'educations' => $cand->educations,
                    'experiences' => $cand->experiences,
                    'portfolios' => $cand->portfolios,
                    'skills' => $cand->skills,
                ] : null,
            ],
        ]);
    }

    /**
     * Preview candidate skill matching for this application.
     */
    public function match(Request $request, $id): JsonResponse
    {
        $company = $this->getCompany($request);
        $application = Application::with(['jobVacancy.skills', 'candidateProfile.skills'])->find($id);

        if (!$application) {
            return response()->json([
                'success' => false,
                'message' => 'Data lamaran tidak ditemukan.',
            ], 404);
        }

        if (!$company || $application->jobVacancy->company_id !== $company->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke data lamaran ini.',
            ], 403);
        }

        $candidate = $application->candidateProfile;
        $job = $application->jobVacancy;

        $candSkills = $candidate->skills()->pluck('name', 'skills.id')->toArray();
        $jobSkills = $job->skills()->pluck('name', 'skills.id')->toArray();

        $matchedSkillNames = [];
        $missingSkillNames = [];

        foreach ($jobSkills as $skillId => $skillName) {
            if (isset($candSkills[$skillId])) {
                $matchedSkillNames[] = $skillName;
            } else {
                $missingSkillNames[] = $skillName;
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Data matching berhasil diambil.',
            'data' => [
                'application_id' => $application->id,
                'candidate' => $candidate->full_name,
                'job' => $job->title,
                'match_percentage' => (float) $application->match_percentage,
                'required_skills' => array_values($jobSkills),
                'candidate_skills' => array_values($candSkills),
                'matched_skills' => $matchedSkillNames,
                'missing_skills' => $missingSkillNames,
            ],
        ]);
    }

    /**
     * Update application status and log history + notify candidate.
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        $company = $this->getCompany($request);
        $application = Application::with(['jobVacancy', 'candidateProfile'])->find($id);

        if (!$application) {
            return response()->json([
                'success' => false,
                'message' => 'Data lamaran tidak ditemukan.',
            ], 404);
        }

        if (!$company || $application->jobVacancy->company_id !== $company->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke data lamaran ini.',
            ], 403);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['submitted', 'screening', 'interview', 'test', 'accepted', 'rejected'])],
            'note' => ['nullable', 'string'],
        ], [
            'status.required' => 'Status lamaran wajib diisi.',
            'status.in' => 'Status lamaran tidak valid.',
        ]);

        return DB::transaction(function () use ($application, $validated, $company, $request) {
            $application->update(['status' => $validated['status']]);

            $historyNote = $validated['note'] ?? "Status lamaran diperbarui menjadi {$validated['status']}.";

            ApplicationStatusHistory::create([
                'application_id' => $application->id,
                'status' => $validated['status'],
                'note' => $historyNote,
                'changed_by' => $request->user()->id,
            ]);

            // Notify candidate
            if ($application->candidateProfile && $application->candidateProfile->user_id) {
                Notification::create([
                    'user_id' => $application->candidateProfile->user_id,
                    'title' => 'Status Lamaran Diperbarui',
                    'message' => "Lamaran Anda untuk posisi '{$application->jobVacancy->title}' di {$company->company_name} telah diperbarui menjadi " . strtoupper($validated['status']) . ".",
                    'type' => 'application_status',
                    'is_read' => false,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => "Status lamaran berhasil diperbarui menjadi {$validated['status']}.",
                'data' => [
                    'id' => $application->id,
                    'status' => $application->status,
                    'note' => $historyNote,
                ],
            ]);
        });
    }

    /**
     * List internal notes for an application.
     */
    public function notes(Request $request, $id): JsonResponse
    {
        $company = $this->getCompany($request);
        $application = Application::with('jobVacancy')->find($id);

        if (!$application) {
            return response()->json([
                'success' => false,
                'message' => 'Data lamaran tidak ditemukan.',
            ], 404);
        }

        if (!$company || $application->jobVacancy->company_id !== $company->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke data lamaran ini.',
            ], 403);
        }

        $notes = $application->notes()->with('user:id,name')->latest()->get();

        return response()->json([
            'success' => true,
            'message' => 'Catatan internal berhasil diambil.',
            'data' => $notes,
        ]);
    }

    /**
     * Add an internal note to an application.
     */
    public function addNote(Request $request, $id): JsonResponse
    {
        $company = $this->getCompany($request);
        $application = Application::with('jobVacancy')->find($id);

        if (!$application) {
            return response()->json([
                'success' => false,
                'message' => 'Data lamaran tidak ditemukan.',
            ], 404);
        }

        if (!$company || $application->jobVacancy->company_id !== $company->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke data lamaran ini.',
            ], 403);
        }

        $validated = $request->validate([
            'note' => ['required', 'string'],
        ], [
            'note.required' => 'Catatan wajib diisi.',
        ]);

        $note = ApplicationNote::create([
            'application_id' => $application->id,
            'user_id' => $request->user()->id,
            'note' => $validated['note'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Catatan internal berhasil ditambahkan.',
            'data' => $note->load('user:id,name'),
        ], 201);
    }
}
