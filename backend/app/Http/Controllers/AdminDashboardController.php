<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Company;
use App\Models\Interview;
use App\Models\JobVacancy;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    /**
     * Get real-time dashboard statistics and recent activities for admin.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $totalUsers = User::count();
        $totalCandidates = User::where('role', 'candidate')->count();
        $totalCompanies = User::where('role', 'company')->count();

        $pendingCompanies = Company::where('verification_status', 'pending')->count();
        $verifiedCompanies = Company::where('verification_status', 'verified')->count();
        $rejectedCompanies = Company::where('verification_status', 'rejected')->count();

        $totalJobs = JobVacancy::count();
        $activeJobs = JobVacancy::where('status', 'active')->count();
        $closedJobs = JobVacancy::where('status', 'closed')->count();

        $totalApplications = Application::count();
        $pendingApplications = Application::whereIn('status', ['submitted', 'screening'])->count();
        $interviewApplications = Application::where('status', 'interview')->count();
        $acceptedApplications = Application::where('status', 'accepted')->count();
        $rejectedApplications = Application::where('status', 'rejected')->count();

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
            ->latest()
            ->take(5)
            ->get(['id', 'company_id', 'category_id', 'title', 'status', 'location', 'created_at']);

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
