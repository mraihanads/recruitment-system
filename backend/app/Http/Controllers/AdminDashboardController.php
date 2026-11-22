<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Company;
use App\Models\Interview;
use App\Models\JobVacancy;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    /**
     * Get real-time dashboard statistics and recent activities for admin.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $userCounts = User::select('role', DB::raw('COUNT(*) as total'))
            ->groupBy('role')
            ->pluck('total', 'role');
        $totalUsers = (int) $userCounts->sum();
        $totalCandidates = (int) ($userCounts['candidate'] ?? 0);
        $totalCompanies = (int) ($userCounts['company'] ?? 0);

        $companyCounts = Company::select('verification_status', DB::raw('COUNT(*) as total'))
            ->groupBy('verification_status')
            ->pluck('total', 'verification_status');
        $pendingCompanies = (int) ($companyCounts['pending'] ?? 0);
        $verifiedCompanies = (int) ($companyCounts['verified'] ?? 0);
        $rejectedCompanies = (int) ($companyCounts['rejected'] ?? 0);

        $jobCounts = JobVacancy::select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');
        $totalJobs = (int) $jobCounts->sum();
        $activeJobs = (int) ($jobCounts['active'] ?? 0);
        $closedJobs = (int) ($jobCounts['closed'] ?? 0);

        $appCounts = Application::select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');
        $totalApplications = (int) $appCounts->sum();
        $pendingApplications = (int) (($appCounts['submitted'] ?? 0) + ($appCounts['screening'] ?? 0));
        $interviewApplications = (int) ($appCounts['interview'] ?? 0);
        $acceptedApplications = (int) ($appCounts['accepted'] ?? 0);
        $rejectedApplications = (int) ($appCounts['rejected'] ?? 0);

        $totalInterviews = Interview::count();

        // Recent items for real-time monitoring
        $recentUsers = User::latest()
            ->take(5)
            ->get(['id', 'name', 'email', 'role', 'status', 'created_at']);

        $recentCompanies = Company::with(['user:id,name,email'])
            ->latest()
            ->take(5)
            ->get(['id', 'user_id', 'company_name', 'verification_status', 'phone', 'created_at']);

        $recentJobs = JobVacancy::with([
            'company:id,company_name,logo',
            'category:id,name',
        ])
            ->where(function ($q) {
                $q->where('is_removed_by_admin', false)->orWhereNull('is_removed_by_admin');
            })
            ->latest()
            ->take(5)
            ->get([
                'id', 'company_id', 'category_id', 'title', 'status', 'location',
                'education', 'deadline', 'interview_start_date', 'interview_end_date', 'announcement_date', 'created_at'
            ]);

        $recentApplications = Application::with([
            'candidateProfile:id,user_id,full_name',
            'candidateProfile.user:id,name,email',
            'jobVacancy:id,company_id,title',
            'jobVacancy.company:id,company_name',
        ])
            ->latest('applied_at')
            ->take(5)
            ->get(['id', 'candidate_id', 'job_id', 'status', 'match_percentage', 'applied_at']);

        return response()->json([
            'success' => true,
            'data' => [
                'total_users' => $totalUsers,
                'total_candidates' => $totalCandidates,
                'total_companies' => $totalCompanies,
                'pending_companies' => $pendingCompanies,
                'verified_companies' => $verifiedCompanies,
                'rejected_companies' => $rejectedCompanies,
                'total_jobs' => $totalJobs,
                'active_jobs' => $activeJobs,
                'closed_jobs' => $closedJobs,
                'total_applications' => $totalApplications,
                'pending_applications' => $pendingApplications,
                'interview_applications' => $interviewApplications,
                'accepted_applications' => $acceptedApplications,
                'rejected_applications' => $rejectedApplications,
                'total_interviews' => $totalInterviews,
                'recent_users' => $recentUsers,
                'recent_companies' => $recentCompanies,
                'recent_jobs' => $recentJobs,
                'recent_applications' => $recentApplications,
            ],
        ]);
    }
}
