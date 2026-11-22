<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Company;
use App\Models\Interview;
use App\Models\JobCategory;
use App\Models\JobVacancy;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminReportController extends Controller
{
    /**
     * Get system wide report and aggregated statistics.
     */
    public function reports(Request $request): JsonResponse
    {
        JobVacancy::autoCloseExpired();

        $userCounts = User::select('role', DB::raw('COUNT(*) as total'))
            ->groupBy('role')
            ->pluck('total', 'role');
        $totalUsers = (int) $userCounts->sum();
        $totalCandidates = (int) ($userCounts['candidate'] ?? 0);
        $totalCompanies = (int) ($userCounts['company'] ?? 0);
        $totalAdmins = (int) ($userCounts['admin'] ?? 0);

        $companyCounts = Company::select('verification_status', DB::raw('COUNT(*) as total'))
            ->groupBy('verification_status')
            ->pluck('total', 'verification_status');
        $verifiedCompanies = (int) ($companyCounts['verified'] ?? 0);
        $pendingCompanies = (int) ($companyCounts['pending'] ?? 0);
        $rejectedCompanies = (int) ($companyCounts['rejected'] ?? 0);

        $jobCounts = JobVacancy::select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');
        $totalJobs = (int) $jobCounts->sum();
        $activeJobs = (int) ($jobCounts['active'] ?? 0);
        $closedJobs = (int) ($jobCounts['closed'] ?? 0);
        $draftJobs = (int) ($jobCounts['draft'] ?? 0);

        $appCounts = Application::select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');
        $totalApplications = (int) $appCounts->sum();
        $submittedApplications = (int) ($appCounts['submitted'] ?? 0);
        $screeningApplications = (int) ($appCounts['screening'] ?? 0);
        $interviewApplications = (int) ($appCounts['interview'] ?? 0);
        $testApplications = (int) ($appCounts['test'] ?? 0);
        $acceptedApplications = (int) ($appCounts['accepted'] ?? 0);
        $rejectedApplications = (int) ($appCounts['rejected'] ?? 0);

        $interviewCounts = Interview::select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');
        $totalInterviews = (int) $interviewCounts->sum();
        $scheduledInterviews = (int) ($interviewCounts['scheduled'] ?? 0);
        $completedInterviews = (int) ($interviewCounts['completed'] ?? 0);
        $cancelledInterviews = (int) ($interviewCounts['cancelled'] ?? 0);

        // Top job categories by vacancies
        $topJobCategories = JobCategory::withCount('jobVacancies')
            ->orderByDesc('job_vacancies_count')
            ->limit(5)
            ->get()
            ->map(function ($cat) {
                return [
                    'category_id' => $cat->id,
                    'category_name' => $cat->name,
                    'job_count' => (int) $cat->job_vacancies_count,
                ];
            });

        // Top companies by job vacancies
        $topCompaniesByJobs = Company::withCount('jobVacancies')
            ->orderByDesc('job_vacancies_count')
            ->limit(5)
            ->get()
            ->map(function ($comp) {
                return [
                    'company_id' => $comp->id,
                    'company_name' => $comp->company_name,
                    'job_count' => (int) $comp->job_vacancies_count,
                ];
            });

        // Top companies by applications
        $topCompaniesByApplications = Company::leftJoin('job_vacancies', 'companies.id', '=', 'job_vacancies.company_id')
            ->leftJoin('applications', 'job_vacancies.id', '=', 'applications.job_id')
            ->select('companies.id as company_id', 'companies.company_name', DB::raw('COUNT(applications.id) as application_count'))
            ->groupBy('companies.id', 'companies.company_name')
            ->orderByDesc('application_count')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'company_id' => (int) $item->company_id,
                    'company_name' => $item->company_name,
                    'application_count' => (int) $item->application_count,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'total_users' => $totalUsers,
                'total_candidates' => $totalCandidates,
                'total_companies' => $totalCompanies,
                'total_admins' => $totalAdmins,
                'verified_companies' => $verifiedCompanies,
                'pending_companies' => $pendingCompanies,
                'rejected_companies' => $rejectedCompanies,
                'total_jobs' => $totalJobs,
                'active_jobs' => $activeJobs,
                'closed_jobs' => $closedJobs,
                'draft_jobs' => $draftJobs,
                'total_applications' => $totalApplications,
                'submitted_applications' => $submittedApplications,
                'screening_applications' => $screeningApplications,
                'interview_applications' => $interviewApplications,
                'test_applications' => $testApplications,
                'accepted_applications' => $acceptedApplications,
                'rejected_applications' => $rejectedApplications,
                'total_interviews' => $totalInterviews,
                'scheduled_interviews' => $scheduledInterviews,
                'completed_interviews' => $completedInterviews,
                'cancelled_interviews' => $cancelledInterviews,
                'top_job_categories' => $topJobCategories,
                'top_companies_by_jobs' => $topCompaniesByJobs,
                'top_companies_by_applications' => $topCompaniesByApplications,
            ],
        ]);
    }
}
