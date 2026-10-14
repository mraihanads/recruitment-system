<?php

namespace App\Http\Controllers;

use App\Models\Skill;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CandidateSkillController extends Controller
{
    protected function getCandidate(Request $request)
    {
        return $request->user()->candidateProfile;
    }

    /**
     * Get all master skills (for selection).
     */
    public function allSkills(): JsonResponse
    {
        $skills = Skill::orderBy('name')->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar semua keahlian berhasil diambil.',
            'data' => $skills,
        ]);
    }

    /**
     * List skills owned by the authenticated candidate.
     */
    public function index(Request $request): JsonResponse
    {
        $candidate = $this->getCandidate($request);
        $skills = $candidate ? $candidate->skills()->orderBy('name')->get() : [];

        return response()->json([
            'success' => true,
            'message' => 'Daftar skill kandidat berhasil diambil.',
            'data' => $skills,
        ]);
    }

    /**
     * Attach a skill to the candidate's profile.
     */
    public function store(Request $request): JsonResponse
    {
        $candidate = $this->getCandidate($request);

        $request->validate([
            'skill_id' => ['required', 'integer', 'exists:skills,id'],
        ], [
            'skill_id.required' => 'Skill wajib dipilih.',
            'skill_id.exists' => 'Skill yang dipilih tidak terdaftar di sistem.',
        ]);

        if ($candidate->skills()->where('skills.id', $request->skill_id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Skill ini sudah ditambahkan sebelumnya.',
            ], 422);
        }

        $candidate->skills()->attach($request->skill_id);

        $skill = Skill::find($request->skill_id);

        return response()->json([
            'success' => true,
            'message' => 'Skill berhasil ditambahkan.',
            'data' => $skill,
        ], 201);
    }

    /**
     * Detach a skill from the candidate's profile.
     */
    public function destroy(Request $request, $skill_id): JsonResponse
    {
        $candidate = $this->getCandidate($request);

        if (!$candidate->skills()->where('skills.id', $skill_id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Skill tidak ditemukan pada profil Anda.',
            ], 404);
        }

        $candidate->skills()->detach($skill_id);

        return response()->json([
            'success' => true,
            'message' => 'Skill berhasil dihapus dari profil.',
        ]);
    }
}
