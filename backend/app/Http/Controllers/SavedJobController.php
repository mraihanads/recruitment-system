<?php

namespace App\Http\Controllers;

use App\Models\JobVacancy;
use App\Models\SavedJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavedJobController extends Controller
{
    protected function getCandidate(Request $request)
    {
        return $request->user()->candidateProfile;
    }

    /**
     * List all saved job vacancies for the authenticated candidate.
     */
    public function index(Request $request): JsonResponse
    {
        $candidate = $this->getCandidate($request);

        if (!$candidate) {
            return response()->json([
                'success' => true,
                'message' => 'Daftar lowongan tersimpan berhasil diambil.',
                'data' => [],
            ]);
        }

        $savedJobs = $candidate->savedJobs()
            ->with([
                'jobVacancy:id,company_id,category_id,title,location,employment_type,salary_min,salary_max,deadline,status',
                'jobVacancy.company:id,company_name,logo,address',
                'jobVacancy.category:id,name',
                'jobVacancy.skills:id,name',
            ])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar lowongan tersimpan berhasil diambil.',
            'data' => $savedJobs,
        ]);
    }

    /**
     * Save a job vacancy.
     */
    public function store(Request $request, $id): JsonResponse
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
            ], 422);
        }

        if ($candidate->savedJobs()->where('job_id', $job->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Lowongan ini sudah disimpan sebelumnya.',
            ], 422);
        }

        $savedJob = $candidate->savedJobs()->create([
            'job_id' => $job->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Lowongan berhasil disimpan ke daftar tersimpan.',
            'data' => $savedJob,
        ], 201);
    }

    /**
     * Remove a job from saved jobs.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $candidate = $this->getCandidate($request);

        if (!$candidate) {
            return response()->json([
                'success' => false,
                'message' => 'Profil kandidat tidak ditemukan.',
            ], 404);
        }

        $savedJob = $candidate->savedJobs()->where('job_id', $id)->first();

        if (!$savedJob) {
            return response()->json([
                'success' => false,
                'message' => 'Lowongan belum disimpan atau tidak ditemukan.',
            ], 404);
        }

        $savedJob->delete();

        return response()->json([
            'success' => true,
            'message' => 'Lowongan berhasil dihapus dari daftar tersimpan.',
        ]);
    }
}
