<?php

namespace App\Services;

use App\Models\CandidateProfile;
use App\Models\JobVacancy;

class SkillMatchingService
{
    /**
     * Calculate matching details between a candidate profile and a job vacancy.
     *
     * @param CandidateProfile $candidate
     * @param JobVacancy $job
     * @return array
     */
    public function calculate(CandidateProfile $candidate, JobVacancy $job): array
    {
        $candidateSkillIds = $candidate->skills()->pluck('skills.id')->toArray();
        $requiredSkills = $job->skills()->select('skills.id', 'skills.name')->get();

        $totalRequired = $requiredSkills->count();
        if ($totalRequired === 0) {
            return [
                'job_id' => $job->id,
                'job_title' => $job->title,
                'required_skills' => [],
                'matched_count' => 0,
                'required_count' => 0,
                'match_percentage' => 0.00,
            ];
        }

        $matchedCount = 0;
        $skillsBreakdown = [];

        foreach ($requiredSkills as $skill) {
            $isMatched = in_array($skill->id, $candidateSkillIds, true);
            if ($isMatched) {
                $matchedCount++;
            }
            $skillsBreakdown[] = [
                'id' => $skill->id,
                'name' => $skill->name,
                'matched' => $isMatched,
            ];
        }

        $percentage = round(($matchedCount / $totalRequired) * 100, 2);

        return [
            'job_id' => $job->id,
            'job_title' => $job->title,
            'required_skills' => $skillsBreakdown,
            'matched_count' => $matchedCount,
            'required_count' => $totalRequired,
            'match_percentage' => $percentage,
        ];
    }
}
