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
        if (Skill::count() === 0) {
            $defaultSkills = [
                'JavaScript', 'React.js', 'PHP', 'Laravel', 'MySQL', 'Node.js', 'Python',
                'UI/UX Design', 'Figma', 'Graphic Design', 'Digital Marketing', 'SEO',
                'Copywriting', 'Microsoft Excel', 'Accounting', 'Financial Analysis',
                'Project Management', 'Public Speaking', 'Customer Service', 'Data Analysis',
                'HTML/CSS', 'Tailwind CSS', 'Git', 'Human Resources', 'Administration',
            ];

            foreach ($defaultSkills as $skillName) {
                Skill::firstOrCreate(['name' => $skillName]);
            }
        }

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
     * Attach one or more skills to the candidate's profile.
     */
    public function store(Request $request): JsonResponse
    {
        $candidate = $this->getCandidate($request);

        // Support both batch `skill_ids` (array) and single `skill_id` (int)
        if ($request->has('skill_ids')) {
            $validated = $request->validate([
                'skill_ids' => ['required', 'array', 'min:1'],
                'skill_ids.*' => ['integer', 'exists:skills,id'],
            ], [
                'skill_ids.required' => 'Pilih minimal satu keahlian.',
                'skill_ids.min' => 'Pilih minimal satu keahlian.',
                'skill_ids.*.exists' => 'Salah satu keahlian yang dipilih tidak terdaftar di sistem.',
            ]);

            $candidate->skills()->syncWithoutDetaching($validated['skill_ids']);
            $updatedSkills = $candidate->skills()->orderBy('name')->get();

            return response()->json([
                'success' => true,
                'message' => count($validated['skill_ids']) . ' keahlian berhasil ditambahkan ke profil Anda.',
                'data' => $updatedSkills,
            ], 201);
        }

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
