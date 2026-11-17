<?php

namespace App\Http\Controllers;

use App\Models\JobVacancy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CompanyJobController extends Controller
{
    protected function getCompany(Request $request)
    {
        return $request->user()->company;
    }

    /**
     * List all job vacancies created by the authenticated company.
     */
    public function index(Request $request): JsonResponse
    {
        $company = $this->getCompany($request);

        if (!$company) {
            return response()->json([
                'success' => true,
                'message' => 'Daftar lowongan kerja berhasil diambil.',
                'data' => [],
            ]);
        }

        $query = $company->jobVacancies()->with([
            'category:id,name',
            'skills:id,name',
        ])->withCount('applications');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $jobs = $query->latest()->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar lowongan kerja perusahaan berhasil diambil.',
            'data' => $jobs,
        ]);
    }

    /**
     * Create a new job vacancy with required skills.
     */
    public function store(Request $request): JsonResponse
    {
        $company = $this->getCompany($request);

        if (!$company || $company->verification_status !== 'verified') {
            return response()->json([
                'success' => false,
                'message' => 'Perusahaan Anda belum terverifikasi oleh admin. Upload dokumen legalitas dan tunggu persetujuan admin sebelum dapat membuat lowongan.',
            ], 403);
        }

        // Ensure schedule columns exist on job_vacancies table dynamically
        if (!\Illuminate\Support\Facades\Schema::hasColumn('job_vacancies', 'interview_start_date')) {
            \Illuminate\Support\Facades\Schema::table('job_vacancies', function (\Illuminate\Database\Schema\Blueprint $table) {
                $table->date('interview_start_date')->nullable()->after('deadline');
                $table->date('interview_end_date')->nullable()->after('interview_start_date');
                $table->date('announcement_date')->nullable()->after('interview_end_date');
            });
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'category_id' => ['required', 'integer', 'exists:job_categories,id'],
            'description' => ['required', 'string'],
            'requirements' => ['required', 'string'],
            'location' => ['required', 'string', 'max:150'],
            'employment_type' => ['required', Rule::in(['full_time', 'part_time', 'internship', 'freelance'])],
            'salary_min' => ['nullable', 'numeric', 'min:0'],
            'salary_max' => ['nullable', 'numeric', 'gte:salary_min'],
            'education' => ['nullable', 'string', 'max:100'],
            'deadline' => ['required', 'date'],
            'interview_start_date' => ['nullable', 'date'],
            'interview_end_date' => ['nullable', 'date', 'after_or_equal:interview_start_date'],
            'announcement_date' => ['nullable', 'date'],
            'status' => ['nullable', Rule::in(['draft', 'active', 'closed'])],
            'skills' => ['nullable', 'array'],
            'skills.*' => ['integer', 'exists:skills,id'],
        ], [
            'title.required' => 'Judul lowongan wajib diisi.',
            'category_id.required' => 'Kategori lowongan wajib dipilih.',
            'category_id.exists' => 'Kategori tidak valid.',
            'description.required' => 'Deskripsi pekerjaan wajib diisi.',
            'requirements.required' => 'Persyaratan pekerjaan wajib diisi.',
            'location.required' => 'Lokasi penempatan kerja wajib diisi.',
            'employment_type.required' => 'Tipe pekerjaan wajib dipilih.',
            'salary_max.gte' => 'Gaji maksimal tidak boleh lebih kecil dari gaji minimal.',
            'deadline.required' => 'Batas waktu lamaran (deadline) wajib diisi.',
            'interview_end_date.after_or_equal' => 'Tanggal selesai wawancara tidak boleh sebelum tanggal mulai wawancara.',
        ]);

        return DB::transaction(function () use ($company, $validated) {
            $job = $company->jobVacancies()->create([
                'category_id' => $validated['category_id'],
                'title' => $validated['title'],
                'description' => $validated['description'],
                'requirements' => $validated['requirements'],
                'location' => $validated['location'],
                'employment_type' => $validated['employment_type'],
                'salary_min' => $validated['salary_min'] ?? null,
                'salary_max' => $validated['salary_max'] ?? null,
                'education' => $validated['education'] ?? null,
                'deadline' => $validated['deadline'],
                'interview_start_date' => $validated['interview_start_date'] ?? null,
                'interview_end_date' => $validated['interview_end_date'] ?? null,
                'announcement_date' => $validated['announcement_date'] ?? null,
                'status' => $validated['status'] ?? 'draft',
            ]);

            if (!empty($validated['skills'])) {
                $job->skills()->sync($validated['skills']);
            }

            return response()->json([
                'success' => true,
                'message' => 'Lowongan kerja berhasil dibuat.',
                'data' => $job->fresh()->load(['category:id,name', 'skills:id,name']),
            ], 201);
        });
    }

    /**
     * Show job vacancy details with ownership guard.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $company = $this->getCompany($request);
        $job = JobVacancy::with([
            'category:id,name,description',
            'skills:id,name',
        ])->withCount('applications')->find($id);

        if (!$job) {
            return response()->json([
                'success' => false,
                'message' => 'Lowongan kerja tidak ditemukan.',
            ], 404);
        }

        if (!$company || $job->company_id !== $company->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke lowongan kerja ini.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail lowongan kerja berhasil diambil.',
            'data' => $job,
        ]);
    }

    /**
     * Update an existing job vacancy with ownership guard.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $company = $this->getCompany($request);
        $job = JobVacancy::find($id);

        if (!$job) {
            return response()->json([
                'success' => false,
                'message' => 'Lowongan kerja tidak ditemukan.',
            ], 404);
        }

        if (!$company || $job->company_id !== $company->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke lowongan kerja ini.',
            ], 403);
        }

        if (!\Illuminate\Support\Facades\Schema::hasColumn('job_vacancies', 'interview_start_date')) {
            \Illuminate\Support\Facades\Schema::table('job_vacancies', function (\Illuminate\Database\Schema\Blueprint $table) {
                $table->date('interview_start_date')->nullable()->after('deadline');
                $table->date('interview_end_date')->nullable()->after('interview_start_date');
                $table->date('announcement_date')->nullable()->after('interview_end_date');
            });
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'category_id' => ['required', 'integer', 'exists:job_categories,id'],
            'description' => ['required', 'string'],
            'requirements' => ['required', 'string'],
            'location' => ['required', 'string', 'max:150'],
            'employment_type' => ['required', Rule::in(['full_time', 'part_time', 'internship', 'freelance'])],
            'salary_min' => ['nullable', 'numeric', 'min:0'],
            'salary_max' => ['nullable', 'numeric', 'gte:salary_min'],
            'education' => ['nullable', 'string', 'max:100'],
            'deadline' => ['required', 'date'],
            'interview_start_date' => ['nullable', 'date'],
            'interview_end_date' => ['nullable', 'date', 'after_or_equal:interview_start_date'],
            'announcement_date' => ['nullable', 'date'],
            'status' => ['nullable', Rule::in(['draft', 'active', 'closed'])],
            'skills' => ['nullable', 'array'],
            'skills.*' => ['integer', 'exists:skills,id'],
        ], [
            'salary_max.gte' => 'Gaji maksimal tidak boleh lebih kecil dari gaji minimal.',
            'interview_end_date.after_or_equal' => 'Tanggal selesai wawancara tidak boleh sebelum tanggal mulai wawancara.',
        ]);

        return DB::transaction(function () use ($job, $validated) {
            $job->update([
                'category_id' => $validated['category_id'],
                'title' => $validated['title'],
                'description' => $validated['description'],
                'requirements' => $validated['requirements'],
                'location' => $validated['location'],
                'employment_type' => $validated['employment_type'],
                'salary_min' => $validated['salary_min'] ?? null,
                'salary_max' => $validated['salary_max'] ?? null,
                'education' => $validated['education'] ?? null,
                'deadline' => $validated['deadline'],
                'interview_start_date' => $validated['interview_start_date'] ?? null,
                'interview_end_date' => $validated['interview_end_date'] ?? null,
                'announcement_date' => $validated['announcement_date'] ?? null,
                'status' => $validated['status'] ?? $job->status,
            ]);

            if (isset($validated['skills'])) {
                $job->skills()->sync($validated['skills']);
            }

            return response()->json([
                'success' => true,
                'message' => 'Lowongan kerja berhasil diperbarui.',
                'data' => $job->fresh()->load(['category:id,name', 'skills:id,name']),
            ]);
        });
    }

    /**
     * Delete a job vacancy with ownership guard.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $company = $this->getCompany($request);
        $job = JobVacancy::find($id);

        if (!$job) {
            return response()->json([
                'success' => false,
                'message' => 'Lowongan kerja tidak ditemukan.',
            ], 404);
        }

        if (!$company || $job->company_id !== $company->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke lowongan kerja ini.',
            ], 403);
        }

        // Business rule: Do not delete if applications already exist
        if ($job->applications()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Lowongan ini sudah memiliki lamaran dan tidak dapat dihapus. Silakan ubah status lowongan menjadi closed.',
            ], 422);
        }

        $job->delete();

        return response()->json([
            'success' => true,
            'message' => 'Lowongan kerja berhasil dihapus.',
        ]);
    }

    /**
     * Change status of a job vacancy (draft, active, closed).
     */
    public function changeStatus(Request $request, $id): JsonResponse
    {
        $company = $this->getCompany($request);
        $job = JobVacancy::find($id);

        if (!$job) {
            return response()->json([
                'success' => false,
                'message' => 'Lowongan kerja tidak ditemukan.',
            ], 404);
        }

        if (!$company || $job->company_id !== $company->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke lowongan kerja ini.',
            ], 403);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['draft', 'active', 'closed'])],
        ], [
            'status.required' => 'Status wajib dipilih.',
            'status.in' => 'Status hanya boleh draft, active, atau closed.',
        ]);

        if ($validated['status'] === 'active' && $company->verification_status !== 'verified') {
            return response()->json([
                'success' => false,
                'message' => 'Perusahaan belum terverifikasi. Lowongan tidak dapat diaktifkan sebelum admin menyetujui perusahaan Anda.',
            ], 403);
        }

        $job->update(['status' => $validated['status']]);

        return response()->json([
            'success' => true,
            'message' => "Status lowongan berhasil diubah menjadi {$validated['status']}.",
            'data' => $job,
        ]);
    }
}
