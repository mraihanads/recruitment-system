<?php

namespace App\Http\Controllers;

use App\Models\CandidateExperience;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CandidateExperienceController extends Controller
{
    protected function getCandidate(Request $request)
    {
        return $request->user()->candidateProfile;
    }

    /**
     * List all experiences for the authenticated candidate.
     */
    public function index(Request $request): JsonResponse
    {
        $candidate = $this->getCandidate($request);
        $experiences = $candidate ? $candidate->experiences()->orderBy('start_date', 'desc')->get() : [];

        return response()->json([
            'success' => true,
            'message' => 'Daftar pengalaman kerja berhasil diambil.',
            'data' => $experiences,
        ]);
    }

    /**
     * Add a new experience record.
     */
    public function store(Request $request): JsonResponse
    {
        $candidate = $this->getCandidate($request);

        $validated = $request->validate([
            'company_name' => ['required', 'string', 'max:150'],
            'position' => ['required', 'string', 'max:100'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'description' => ['nullable', 'string'],
        ], [
            'company_name.required' => 'Nama perusahaan wajib diisi.',
            'position.required' => 'Posisi / jabatan wajib diisi.',
            'start_date.required' => 'Tanggal mulai kerja wajib diisi.',
            'end_date.after_or_equal' => 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.',
        ]);

        $experience = $candidate->experiences()->create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Pengalaman kerja berhasil ditambahkan.',
            'data' => $experience,
        ], 201);
    }

    /**
     * Show a specific experience record.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $candidate = $this->getCandidate($request);
        $experience = CandidateExperience::find($id);

        if (!$experience) {
            return response()->json([
                'success' => false,
                'message' => 'Data pengalaman kerja tidak ditemukan.',
            ], 404);
        }

        if ($experience->candidate_id !== $candidate->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke data ini.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail pengalaman kerja berhasil diambil.',
            'data' => $experience,
        ]);
    }

    /**
     * Update an experience record.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $candidate = $this->getCandidate($request);
        $experience = CandidateExperience::find($id);

        if (!$experience) {
            return response()->json([
                'success' => false,
                'message' => 'Data pengalaman kerja tidak ditemukan.',
            ], 404);
        }

        if ($experience->candidate_id !== $candidate->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke data ini.',
            ], 403);
        }

        $validated = $request->validate([
            'company_name' => ['required', 'string', 'max:150'],
            'position' => ['required', 'string', 'max:100'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'description' => ['nullable', 'string'],
        ], [
            'company_name.required' => 'Nama perusahaan wajib diisi.',
            'position.required' => 'Posisi / jabatan wajib diisi.',
            'start_date.required' => 'Tanggal mulai wajib diisi.',
            'end_date.after_or_equal' => 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.',
        ]);

        $experience->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Pengalaman kerja berhasil diperbarui.',
            'data' => $experience,
        ]);
    }

    /**
     * Delete an experience record.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $candidate = $this->getCandidate($request);
        $experience = CandidateExperience::find($id);

        if (!$experience) {
            return response()->json([
                'success' => false,
                'message' => 'Data pengalaman kerja tidak ditemukan.',
            ], 404);
        }

        if ($experience->candidate_id !== $candidate->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke data ini.',
            ], 403);
        }

        $experience->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pengalaman kerja berhasil dihapus.',
        ]);
    }
}
