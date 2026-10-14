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
        $totalUsers = User::count();
        $totalCandidates = User::where('role', 'candidate')->count();
        $totalCompanies = User::where('role', 'company')->count();
        $totalAdmins = User::where('role', 'admin')->count();

        $verifiedCompanies = Company::where('verification_status', 'verified')->count();
        $pendingCompanies = Company::where('verification_status', 'pending')->count();
        $rejectedCompanies = Company::where('verification_status', 'rejected')->count();

        $totalJobs = JobVacancy::count();
        $activeJobs = JobVacancy::where('status', 'active')->count();
        $closedJobs = JobVacancy::where('status', 'closed')->count();
        $draftJobs = JobVacancy::where('status', 'draft')->count();

        $totalApplications = Application::count();
        $submittedApplications = Application::where('status', 'submitted')->count();
        $screeningApplications = Application::where('status', 'screening')->count();
        $interviewApplications = Application::where('status', 'interview')->count();
        $testApplications = Application::where('status', 'test')->count();
        $acceptedApplications = Application::where('status', 'accepted')->count();
        $rejectedApplications = Application::where('status', 'rejected')->count();

        $totalInterviews = Interview::count();
        $scheduledInterviews = Interview::where('status', 'scheduled')->count();
        $completedInterviews = Interview::where('status', 'completed')->count();
        $cancelledInterviews = Interview::where('status', 'cancelled')->count();

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
