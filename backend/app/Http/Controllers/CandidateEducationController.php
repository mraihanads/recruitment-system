<?php

namespace App\Http\Controllers;

use App\Models\CandidateEducation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CandidateEducationController extends Controller
{
    /**
     * Get candidate profile from authenticated user.
     */
    protected function getCandidate(Request $request)
    {
        return $request->user()->candidateProfile;
    }

    /**
     * List all educations for the authenticated candidate.
     */
    public function index(Request $request): JsonResponse
    {
        $candidate = $this->getCandidate($request);
        $educations = $candidate ? $candidate->educations()->orderBy('start_year', 'desc')->get() : [];

        return response()->json([
            'success' => true,
            'message' => 'Daftar riwayat pendidikan berhasil diambil.',
            'data' => $educations,
        ]);
    }

    /**
     * Add a new education entry.
     */
    public function store(Request $request): JsonResponse
    {
        $candidate = $this->getCandidate($request);

        $validated = $request->validate([
            'institution' => ['required', 'string', 'max:150'],
            'degree' => ['required', 'string', 'max:100'],
            'major' => ['required', 'string', 'max:100'],
            'start_year' => ['required', 'integer', 'digits:4', 'min:1950', 'max:' . (date('Y') + 10)],
            'end_year' => ['nullable', 'integer', 'digits:4', 'gte:start_year'],
            'description' => ['nullable', 'string'],
        ], [
            'institution.required' => 'Nama institusi/kampus/sekolah wajib diisi.',
            'degree.required' => 'Jenjang pendidikan (misal: S1, D4) wajib diisi.',
            'major.required' => 'Jurusan/program studi wajib diisi.',
            'start_year.required' => 'Tahun mulai wajib diisi.',
            'end_year.gte' => 'Tahun selesai tidak boleh lebih kecil dari tahun mulai.',
        ]);

        $education = $candidate->educations()->create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Riwayat pendidikan berhasil ditambahkan.',
            'data' => $education,
        ], 201);
    }

    /**
     * Show a specific education record.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $candidate = $this->getCandidate($request);
        $education = CandidateEducation::find($id);

        if (!$education) {
            return response()->json([
                'success' => false,
                'message' => 'Data pendidikan tidak ditemukan.',
            ], 404);
        }

        if ($education->candidate_id !== $candidate->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke data ini.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail pendidikan berhasil diambil.',
            'data' => $education,
        ]);
    }

    /**
     * Update an education record.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $candidate = $this->getCandidate($request);
        $education = CandidateEducation::find($id);

        if (!$education) {
            return response()->json([
                'success' => false,
                'message' => 'Data pendidikan tidak ditemukan.',
            ], 404);
        }

        if ($education->candidate_id !== $candidate->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke data ini.',
            ], 403);
        }

        $validated = $request->validate([
            'institution' => ['required', 'string', 'max:150'],
            'degree' => ['required', 'string', 'max:100'],
            'major' => ['required', 'string', 'max:100'],
            'start_year' => ['required', 'integer', 'digits:4', 'min:1950', 'max:' . (date('Y') + 10)],
            'end_year' => ['nullable', 'integer', 'digits:4', 'gte:start_year'],
            'description' => ['nullable', 'string'],
        ], [
            'institution.required' => 'Nama institusi wajib diisi.',
            'degree.required' => 'Jenjang pendidikan wajib diisi.',
            'major.required' => 'Jurusan wajib diisi.',
            'start_year.required' => 'Tahun mulai wajib diisi.',
            'end_year.gte' => 'Tahun selesai tidak boleh lebih kecil dari tahun mulai.',
        ]);

        $education->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Riwayat pendidikan berhasil diperbarui.',
            'data' => $education,
        ]);
    }

    /**
     * Delete an education record.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $candidate = $this->getCandidate($request);
        $education = CandidateEducation::find($id);

        if (!$education) {
            return response()->json([
                'success' => false,
                'message' => 'Data pendidikan tidak ditemukan.',
            ], 404);
        }

        if ($education->candidate_id !== $candidate->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke data ini.',
            ], 403);
        }

        $education->delete();

        return response()->json([
            'success' => true,
            'message' => 'Riwayat pendidikan berhasil dihapus.',
        ]);
    }
}
