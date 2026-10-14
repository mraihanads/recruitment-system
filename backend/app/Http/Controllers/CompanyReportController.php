<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Company;
use App\Models\Interview;
use App\Models\JobVacancy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

class CompanyReportController extends Controller
{
    /**
     * Get the authenticated company instance.
     */
    protected function getCompany(Request $request): ?Company
    {
        return $request->user()->company;
    }

    /**
     * Get recruitment reports and statistics for the authenticated company.
     */
    public function index(Request $request): JsonResponse
    {
        $company = $this->getCompany($request);

        if (!$company) {
            return response()->json([
                'success' => true,
                'message' => 'Laporan perusahaan berhasil diambil.',
                'data' => [
                    'stats' => [
                        'total_jobs' => 0,
                        'active_jobs' => 0,
                        'closed_jobs' => 0,
                        'total_applications' => 0,
                        'total_interviews' => 0,
                        'accepted_applications' => 0,
                        'rejected_applications' => 0,
                    ],
                    'application_status' => [
                        'submitted' => 0,
                        'screening' => 0,
                        'interview' => 0,
                        'test' => 0,
                        'accepted' => 0,
                        'rejected' => 0,
                    ],
                    'interview_status' => [
                        'scheduled' => 0,
                        'completed' => 0,
                        'cancelled' => 0,
                        'total' => 0,
                    ],
                    'jobs' => [],
                    'top_candidates' => [],
                    'recent_applications' => [],
                    'period' => 'all',
                ],
            ]);
        }

        $period = $request->query('period', 'all');

        // 1. Jobs query for company
        $jobsQuery = $company->jobVacancies();
        $totalJobs = (clone $jobsQuery)->count();
        $activeJobs = (clone $jobsQuery)->where('status', 'active')->count();
        $closedJobs = (clone $jobsQuery)->where('status', 'closed')->count();
        $companyJobIds = (clone $jobsQuery)->pluck('id')->toArray();

        // 2. Base Applications Query for company's vacancies
        $appBaseQuery = Application::whereIn('job_id', $companyJobIds);

        // Apply period filter if specified
        if ($period === 'month') {
            $appBaseQuery->where('applied_at', '>=', Carbon::now()->startOfMonth());
        } elseif ($period === '3months') {
            $appBaseQuery->where('applied_at', '>=', Carbon::now()->subMonths(3));
        } elseif ($period === 'year') {
            $appBaseQuery->where('applied_at', '>=', Carbon::now()->startOfYear());
        }

        $totalApplications = (clone $appBaseQuery)->count();
        $acceptedApplications = (clone $appBaseQuery)->where('status', 'accepted')->count();
        $rejectedApplications = (clone $appBaseQuery)->where('status', 'rejected')->count();

        // Application status breakdown
        $applicationStatus = [
            'submitted' => (clone $appBaseQuery)->where('status', 'submitted')->count(),
            'screening' => (clone $appBaseQuery)->where('status', 'screening')->count(),
            'interview' => (clone $appBaseQuery)->where('status', 'interview')->count(),
            'test' => (clone $appBaseQuery)->where('status', 'test')->count(),
            'accepted' => $acceptedApplications,
            'rejected' => $rejectedApplications,
        ];

        // 3. Interview query
        $allAppIdsForCompany = Application::whereIn('job_id', $companyJobIds)->pluck('id')->toArray();
        $interviewBaseQuery = Interview::whereIn('application_id', $allAppIdsForCompany);

        if ($period === 'month') {
            $interviewBaseQuery->where('interview_date', '>=', Carbon::now()->startOfMonth());
        } elseif ($period === '3months') {
            $interviewBaseQuery->where('interview_date', '>=', Carbon::now()->subMonths(3));
        } elseif ($period === 'year') {
            $interviewBaseQuery->where('interview_date', '>=', Carbon::now()->startOfYear());
        }

        $totalInterviews = (clone $interviewBaseQuery)->count();
        $interviewScheduled = (clone $interviewBaseQuery)->where('status', 'scheduled')->count();
        $interviewCompleted = (clone $interviewBaseQuery)->where('status', 'completed')->count();
        $interviewCancelled = (clone $interviewBaseQuery)->where('status', 'cancelled')->count();

        $interviewStatus = [
            'scheduled' => $interviewScheduled,
            'completed' => $interviewCompleted,
            'cancelled' => $interviewCancelled,
            'total' => $totalInterviews,
        ];

        // 4. Job Statistics Breakdown (with applicants, interviews, accepted, rejected)
        $jobsList = $company->jobVacancies()
            ->withCount([
                'applications',
                'applications as accepted_count' => function ($q) {
                    $q->where('status', 'accepted');
                },
                'applications as rejected_count' => function ($q) {
                    $q->where('status', 'rejected');
                },
            ])
            ->get()
            ->map(function ($job) {
                $jobAppIds = $job->applications()->pluck('id')->toArray();
                $ivCount = Interview::whereIn('application_id', $jobAppIds)->count();

                return [
                    'id' => $job->id,
                    'title' => $job->title,
                    'status' => $job->status,
                    'employment_type' => $job->employment_type,
                    'location' => $job->location,
                    'applications_count' => (int) $job->applications_count,
                    'interviews_count' => $ivCount,
                    'accepted_count' => (int) $job->accepted_count,
                    'rejected_count' => (int) $job->rejected_count,
                    'created_at' => $job->created_at,
                ];
            });

        // 5. Top Candidates / Matches (top 5 by match_percentage)
        $topCandidates = (clone $appBaseQuery)
            ->with([
                'candidateProfile:id,user_id,full_name,photo,phone',
                'jobVacancy:id,title',
            ])
            ->whereNotNull('match_percentage')
            ->orderByDesc('match_percentage')
            ->limit(5)
            ->get()
            ->map(function ($app) {
                $cand = $app->candidateProfile;
                return [
                    'application_id' => $app->id,
                    'candidate_name' => $cand ? $cand->full_name : 'Kandidat',
                    'candidate_phone' => $cand ? $cand->phone : null,
                    'photo_url' => $cand && $cand->photo ? Storage::disk('public')->url($cand->photo) : null,
                    'job_title' => $app->jobVacancy ? $app->jobVacancy->title : '-',
                    'match_percentage' => (float) $app->match_percentage,
                    'status' => $app->status,
                    'applied_at' => $app->applied_at,
                ];
            });

        // 6. Recent Applications (latest 7)
        $recentApplications = (clone $appBaseQuery)
            ->with([
                'candidateProfile.user:id,email',
                'jobVacancy:id,title',
            ])
            ->orderByDesc('applied_at')
            ->limit(7)
            ->get()
            ->map(function ($app) {
                $cand = $app->candidateProfile;
                return [
                    'id' => $app->id,
                    'candidate_name' => $cand ? $cand->full_name : 'Kandidat',
                    'candidate_email' => $cand && $cand->user ? $cand->user->email : null,
                    'photo_url' => $cand && $cand->photo ? Storage::disk('public')->url($cand->photo) : null,
                    'job_title' => $app->jobVacancy ? $app->jobVacancy->title : '-',
                    'match_percentage' => (float) $app->match_percentage,
                    'status' => $app->status,
                    'applied_at' => $app->applied_at,
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Laporan dan statistik rekrutmen perusahaan berhasil diambil.',
            'data' => [
                'stats' => [
                    'total_jobs' => $totalJobs,
                    'active_jobs' => $activeJobs,
                    'closed_jobs' => $closedJobs,
                    'total_applications' => $totalApplications,
                    'total_interviews' => $totalInterviews,
                    'accepted_applications' => $acceptedApplications,
                    'rejected_applications' => $rejectedApplications,
                ],
                'application_status' => $applicationStatus,
                'interview_status' => $interviewStatus,
                'jobs' => $jobsList,
                'top_candidates' => $topCandidates,
                'recent_applications' => $recentApplications,
                'period' => $period,
            ],
        ]);
    }
}
