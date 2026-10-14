<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\ApplicationStatusHistory;
use App\Models\Interview;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CompanyInterviewController extends Controller
{
    protected function getCompany(Request $request)
    {
        return $request->user()->company;
    }

    /**
     * List all interviews across all jobs for the authenticated company.
     */
    public function index(Request $request): JsonResponse
    {
        $company = $this->getCompany($request);

        if (!$company) {
            return response()->json([
                'success' => true,
                'message' => 'Daftar wawancara berhasil diambil.',
                'data' => [],
            ]);
        }

        $companyJobIds = $company->jobVacancies()->pluck('id')->toArray();
        $applicationIds = Application::whereIn('job_id', $companyJobIds)->pluck('id')->toArray();

        $interviews = Interview::whereIn('application_id', $applicationIds)
            ->with([
                'application:id,job_id,candidate_id,status,applied_at,match_percentage,cv_file',
                'application.jobVacancy:id,title,location,employment_type',
                'application.candidateProfile:id,user_id,full_name,phone,photo',
                'application.candidateProfile.user:id,email',
            ])
            ->orderBy('interview_date', 'asc')
            ->orderBy('interview_time', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar jadwal wawancara berhasil diambil.',
            'data' => $interviews,
        ]);
    }

    /**
     * Get details of a specific interview.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $company = $this->getCompany($request);
        $interview = Interview::with([
            'application.jobVacancy.company',
            'application.candidateProfile.user:id,email',
            'application.candidateProfile.skills',
            'application.candidateProfile.educations',
            'application.candidateProfile.experiences',
            'application.candidateProfile.portfolios',
            'application.statusHistories.changer:id,name',
        ])->find($id);

        if (!$interview) {
            return response()->json([
                'success' => false,
                'message' => 'Data wawancara tidak ditemukan.',
            ], 404);
        }

        if (!$company || $interview->application->jobVacancy->company_id !== $company->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke data wawancara ini.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail jadwal wawancara berhasil diambil.',
            'data' => $interview,
        ]);
    }

    /**
     * Update an interview schedule and details.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $company = $this->getCompany($request);
        $interview = Interview::with(['application.jobVacancy', 'application.candidateProfile'])->find($id);

        if (!$interview) {
            return response()->json([
                'success' => false,
                'message' => 'Data wawancara tidak ditemukan.',
            ], 404);
        }

        if (!$company || $interview->application->jobVacancy->company_id !== $company->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke data wawancara ini.',
            ], 403);
        }

        $validated = $request->validate([
            'interview_date' => ['sometimes', 'required', 'date'],
            'interview_time' => ['sometimes', 'required'],
            'method' => ['sometimes', 'required', Rule::in(['online', 'offline'])],
            'location' => ['nullable', 'string', 'max:255'],
            'meeting_link' => ['nullable', 'url', 'max:255'],
            'notes' => ['nullable', 'string'],
            'status' => ['sometimes', 'required', Rule::in(['scheduled', 'completed', 'cancelled'])],
        ], [
            'interview_date.required' => 'Tanggal wawancara wajib diisi.',
            'interview_time.required' => 'Waktu wawancara wajib diisi.',
            'method.required' => 'Metode wawancara wajib dipilih.',
            'meeting_link.url' => 'Format tautan meeting tidak valid.',
            'status.in' => 'Status wawancara harus scheduled, completed, atau cancelled.',
        ]);

        $interview->update($validated);

        // Notify candidate
        $candProfile = $interview->application->candidateProfile ?? null;
        if ($candProfile && $candProfile->user_id) {
            $statusText = $interview->status === 'cancelled'
                ? 'dibatalkan'
                : ($interview->status === 'completed' ? 'telah selesai' : 'telah diperbarui');
            Notification::create([
                'user_id' => $candProfile->user_id,
                'title' => 'Jadwal Interview Diperbarui',
                'message' => "Jadwal wawancara posisi '{$interview->application->jobVacancy->title}' di {$company->company_name} {$statusText}.",
                'type' => 'interview_updated',
                'is_read' => false,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Jadwal wawancara berhasil diperbarui.',
            'data' => $interview,
        ]);
    }

    /**
     * List interviews for a specific application.
     */
    public function applicationInterviews(Request $request, $id): JsonResponse
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

        $interviews = $application->interviews()->orderBy('interview_date', 'desc')->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar jadwal wawancara lamaran berhasil diambil.',
            'data' => $interviews,
        ]);
    }

    /**
     * Schedule a new interview for an application.
     */
    public function store(Request $request, $id): JsonResponse
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
            'interview_date' => ['required', 'date'],
            'interview_time' => ['required'],
            'method' => ['required', Rule::in(['online', 'offline'])],
            'location' => ['required_if:method,offline', 'nullable', 'string', 'max:255'],
            'meeting_link' => ['required_if:method,online', 'nullable', 'url', 'max:255'],
            'notes' => ['nullable', 'string'],
        ], [
            'interview_date.required' => 'Tanggal wawancara wajib diisi.',
            'interview_time.required' => 'Waktu wawancara wajib diisi.',
            'method.required' => 'Metode wawancara (online/offline) wajib dipilih.',
            'location.required_if' => 'Lokasi wajib diisi jika metode wawancara offline.',
            'meeting_link.required_if' => 'Tautan meeting (URL) wajib diisi jika metode wawancara online.',
            'meeting_link.url' => 'Format tautan meeting tidak valid.',
        ]);

        return DB::transaction(function () use ($application, $validated, $company, $request) {
            $interview = $application->interviews()->create([
                'interview_date' => $validated['interview_date'],
                'interview_time' => $validated['interview_time'],
                'method' => $validated['method'],
                'location' => $validated['location'] ?? null,
                'meeting_link' => $validated['meeting_link'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'status' => 'scheduled',
            ]);

            // Update application status to interview if it is in an earlier stage
            if (in_array($application->status, ['submitted', 'screening'])) {
                $application->update(['status' => 'interview']);

                ApplicationStatusHistory::create([
                    'application_id' => $application->id,
                    'status' => 'interview',
                    'note' => 'Jadwal wawancara telah ditetapkan oleh perusahaan.',
                    'changed_by' => $request->user()->id,
                ]);
            }

            // Notify candidate
            if ($application->candidateProfile && $application->candidateProfile->user_id) {
                Notification::create([
                    'user_id' => $application->candidateProfile->user_id,
                    'title' => 'Jadwal Interview Telah Dibuat',
                    'message' => "Anda telah dijadwalkan untuk wawancara posisi '{$application->jobVacancy->title}' di {$company->company_name} pada tanggal {$validated['interview_date']} pukul {$validated['interview_time']} WIB.",
                    'type' => 'interview_scheduled',
                    'is_read' => false,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Jadwal wawancara berhasil dibuat.',
                'data' => $interview,
            ], 201);
        });
    }

    /**
     * Update status of an interview (scheduled, completed, cancelled).
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        $company = $this->getCompany($request);
        $interview = Interview::with(['application.jobVacancy', 'application.candidateProfile'])->find($id);

        if (!$interview) {
            return response()->json([
                'success' => false,
                'message' => 'Data wawancara tidak ditemukan.',
            ], 404);
        }

        if (!$company || $interview->application->jobVacancy->company_id !== $company->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke data wawancara ini.',
            ], 403);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['scheduled', 'completed', 'cancelled'])],
        ], [
            'status.required' => 'Status wawancara wajib dipilih.',
            'status.in' => 'Status wawancara harus scheduled, completed, atau cancelled.',
        ]);

        $interview->update(['status' => $validated['status']]);

        // Notify candidate
        $candProfile = $interview->application->candidateProfile ?? null;
        if ($candProfile && $candProfile->user_id) {
            $statusLabel = $validated['status'] === 'completed'
                ? 'telah selesai'
                : ($validated['status'] === 'cancelled' ? 'telah dibatalkan' : 'telah dijadwalkan');
            Notification::create([
                'user_id' => $candProfile->user_id,
                'title' => 'Status Interview Diperbarui',
                'message' => "Wawancara posisi '{$interview->application->jobVacancy->title}' di {$company->company_name} {$statusLabel}.",
                'type' => 'interview_status_changed',
                'is_read' => false,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Status wawancara berhasil diubah menjadi {$validated['status']}.",
            'data' => $interview,
        ]);
    }
}
