<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\CandidateEducationController;
use App\Http\Controllers\CandidateExperienceController;
use App\Http\Controllers\CandidateInterviewController;
use App\Http\Controllers\CandidateNotificationController;
use App\Http\Controllers\CandidatePortfolioController;
use App\Http\Controllers\CandidateProfileController;
use App\Http\Controllers\CandidateSkillController;
use App\Http\Controllers\CompanyApplicationController;
use App\Http\Controllers\CompanyDocumentController;
use App\Http\Controllers\CompanyInterviewController;
use App\Http\Controllers\CompanyJobController;
use App\Http\Controllers\CompanyNotificationController;
use App\Http\Controllers\CompanyProfileController;
use App\Http\Controllers\CompanyReportController;
use App\Http\Controllers\AdminApplicationController;
use App\Http\Controllers\AdminCategoryController;
use App\Http\Controllers\AdminCompanyController;
use App\Http\Controllers\AdminCompanyDocumentController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminInterviewController;
use App\Http\Controllers\AdminJobController;
use App\Http\Controllers\AdminNotificationController;
use App\Http\Controllers\AdminReportController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\JobController;
use App\Http\Controllers\SavedJobController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Authentication
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->name('login');

// Authenticated Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Master Categories & Skills (Shared for candidate, company & admin)
    Route::get('/job-categories', [JobController::class, 'categories']);
    Route::get('/skills', [CandidateSkillController::class, 'allSkills']);

    // ==========================================
    // CANDIDATE ONLY ROUTES (STEP 10A & 10B)
    // ==========================================
    Route::middleware('role:candidate')->group(function () {
        // Job Vacancies, Matching & Applications (Candidate perspective)
        Route::get('/jobs', [JobController::class, 'index']);
        Route::get('/jobs/{id}', [JobController::class, 'show']);
        Route::get('/jobs/{id}/match', [JobController::class, 'match']);
        Route::post('/jobs/{id}/apply', [JobController::class, 'apply']);
        Route::post('/jobs/{id}/save', [SavedJobController::class, 'store']);
        Route::delete('/jobs/{id}/save', [SavedJobController::class, 'destroy']);

        // Candidate Profile, Experience, Education, Portfolio, Skills, Applications & Saved Jobs
        Route::prefix('candidate')->group(function () {
            // Profile & Files (STEP 10A)
            Route::get('/profile', [CandidateProfileController::class, 'show']);
            Route::put('/profile', [CandidateProfileController::class, 'update']);
            Route::post('/profile/cv', [CandidateProfileController::class, 'uploadCv']);
            Route::post('/profile/photo', [CandidateProfileController::class, 'uploadPhoto']);

            // Educations (STEP 10A)
            Route::get('/educations', [CandidateEducationController::class, 'index']);
            Route::post('/educations', [CandidateEducationController::class, 'store']);
            Route::get('/educations/{id}', [CandidateEducationController::class, 'show']);
            Route::put('/educations/{id}', [CandidateEducationController::class, 'update']);
            Route::delete('/educations/{id}', [CandidateEducationController::class, 'destroy']);

            // Experiences (STEP 10A)
            Route::get('/experiences', [CandidateExperienceController::class, 'index']);
            Route::post('/experiences', [CandidateExperienceController::class, 'store']);
            Route::get('/experiences/{id}', [CandidateExperienceController::class, 'show']);
            Route::put('/experiences/{id}', [CandidateExperienceController::class, 'update']);
            Route::delete('/experiences/{id}', [CandidateExperienceController::class, 'destroy']);

            // Portfolios (STEP 10A)
            Route::get('/portfolios', [CandidatePortfolioController::class, 'index']);
            Route::post('/portfolios', [CandidatePortfolioController::class, 'store']);
            Route::get('/portfolios/{id}', [CandidatePortfolioController::class, 'show']);
            Route::put('/portfolios/{id}', [CandidatePortfolioController::class, 'update']);
            Route::delete('/portfolios/{id}', [CandidatePortfolioController::class, 'destroy']);

            // Skills (STEP 10A)
            Route::get('/skills', [CandidateSkillController::class, 'index']);
            Route::post('/skills', [CandidateSkillController::class, 'store']);
            Route::delete('/skills/{skill_id}', [CandidateSkillController::class, 'destroy']);

            // Applications (STEP 10B)
            Route::get('/applications', [ApplicationController::class, 'index']);
            Route::get('/applications/{id}', [ApplicationController::class, 'show']);

            // Saved Jobs (STEP 10B)
            Route::get('/saved-jobs', [SavedJobController::class, 'index']);

            // Interviews Monitoring for Candidate
            Route::get('/interviews', [CandidateInterviewController::class, 'index']);
            Route::get('/interviews/{id}', [CandidateInterviewController::class, 'show']);

            // Notifications for Candidate
            Route::get('/notifications', [CandidateNotificationController::class, 'index']);
            Route::patch('/notifications/{id}/read', [CandidateNotificationController::class, 'markRead']);
            Route::patch('/notifications/read-all', [CandidateNotificationController::class, 'markAllRead']);
        });
    });

    // ==========================================
    // COMPANY ONLY ROUTES (STEP 11)
    // ==========================================
    Route::middleware('role:company')->prefix('company')->group(function () {
        // Dashboard Summary
        Route::get('/dashboard', [CompanyProfileController::class, 'dashboard']);

        // Profile & Logo
        Route::get('/profile', [CompanyProfileController::class, 'show']);
        Route::put('/profile', [CompanyProfileController::class, 'update']);
        Route::post('/profile/logo', [CompanyProfileController::class, 'uploadLogo']);

        // Verification Documents
        Route::get('/documents', [CompanyDocumentController::class, 'index']);
        Route::post('/documents', [CompanyDocumentController::class, 'store']);
        Route::get('/documents/{id}', [CompanyDocumentController::class, 'show']);
        Route::delete('/documents/{id}', [CompanyDocumentController::class, 'destroy']);

        // Job Vacancies Management
        Route::get('/jobs', [CompanyJobController::class, 'index']);
        Route::post('/jobs', [CompanyJobController::class, 'store']);
        Route::get('/jobs/{id}', [CompanyJobController::class, 'show']);
        Route::put('/jobs/{id}', [CompanyJobController::class, 'update']);
        Route::delete('/jobs/{id}', [CompanyJobController::class, 'destroy']);
        Route::patch('/jobs/{id}/status', [CompanyJobController::class, 'changeStatus']);

        // Applications & Applicants
        Route::get('/applications', [CompanyApplicationController::class, 'index']);
        Route::get('/applications/{id}', [CompanyApplicationController::class, 'show']);
        Route::get('/applications/{id}/match', [CompanyApplicationController::class, 'match']);
        Route::patch('/applications/{id}/status', [CompanyApplicationController::class, 'updateStatus']);
        Route::get('/applications/{id}/notes', [CompanyApplicationController::class, 'notes']);
        Route::post('/applications/{id}/notes', [CompanyApplicationController::class, 'addNote']);

        // Interviews
        Route::get('/interviews', [CompanyInterviewController::class, 'index']);
        Route::get('/interviews/{id}', [CompanyInterviewController::class, 'show']);
        Route::put('/interviews/{id}', [CompanyInterviewController::class, 'update']);
        Route::get('/applications/{id}/interviews', [CompanyInterviewController::class, 'applicationInterviews']);
        Route::post('/applications/{id}/interviews', [CompanyInterviewController::class, 'store']);
        Route::patch('/interviews/{id}/status', [CompanyInterviewController::class, 'updateStatus']);

        // Notifications
        Route::get('/notifications', [CompanyNotificationController::class, 'index']);
        Route::patch('/notifications/{id}/read', [CompanyNotificationController::class, 'markRead']);
        Route::patch('/notifications/read-all', [CompanyNotificationController::class, 'markAllRead']);

        // Reports & Statistics (STEP 15E)
        Route::get('/reports', [CompanyReportController::class, 'index']);
    });

    // ==========================================
    // ADMIN ONLY ROUTES (STEP 16)
    // ==========================================
    Route::prefix('admin')->middleware('role:admin')->group(function () {
        // Dashboard
        Route::get('/dashboard', [AdminDashboardController::class, 'dashboard']);

        // Users Management
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::get('/users/{id}', [AdminUserController::class, 'show']);
        Route::patch('/users/{id}/status', [AdminUserController::class, 'updateStatus']);
        Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);

        // Companies Management & Verification
        Route::get('/companies', [AdminCompanyController::class, 'index']);
        Route::get('/companies/{id}', [AdminCompanyController::class, 'show']);
        Route::patch('/companies/{id}/verify', [AdminCompanyController::class, 'updateVerification']);

        // Company Documents
        Route::get('/documents', [AdminCompanyDocumentController::class, 'index']);
        Route::get('/documents/{id}', [AdminCompanyDocumentController::class, 'show']);
        Route::patch('/documents/{id}/verify', [AdminCompanyDocumentController::class, 'updateVerification']);

        // Job Vacancies Moderation
        Route::get('/jobs', [AdminJobController::class, 'index']);
        Route::get('/jobs/{id}', [AdminJobController::class, 'show']);
        Route::patch('/jobs/{id}/status', [AdminJobController::class, 'changeStatus']);
        Route::delete('/jobs/{id}', [AdminJobController::class, 'destroy']);

        // Job Categories
        Route::get('/categories', [AdminCategoryController::class, 'index']);
        Route::post('/categories', [AdminCategoryController::class, 'store']);
        Route::get('/categories/{id}', [AdminCategoryController::class, 'show']);
        Route::put('/categories/{id}', [AdminCategoryController::class, 'update']);
        Route::delete('/categories/{id}', [AdminCategoryController::class, 'destroy']);

        // Applications Monitoring
        Route::get('/applications', [AdminApplicationController::class, 'index']);
        Route::get('/applications/{id}', [AdminApplicationController::class, 'show']);
        Route::patch('/applications/{id}/status', [AdminApplicationController::class, 'updateStatus']);

        // Interviews Monitoring
        Route::get('/interviews', [AdminInterviewController::class, 'index']);
        Route::get('/interviews/{id}', [AdminInterviewController::class, 'show']);

        // Reports & Statistics
        Route::get('/reports', [AdminReportController::class, 'reports']);

        // Notifications
        Route::get('/notifications', [AdminNotificationController::class, 'index']);
        Route::patch('/notifications/{id}/read', [AdminNotificationController::class, 'markRead']);
        Route::patch('/notifications/read-all', [AdminNotificationController::class, 'markAllRead']);
    });
});

