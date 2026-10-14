<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CompanyProfileController extends Controller
{
    protected function getCompany(Request $request): ?Company
    {
        return $request->user()->company;
    }

    /**
     * Get company profile.
     */
    public function show(Request $request): JsonResponse
    {
        $company = $this->getCompany($request);

        if (!$company) {
            $company = Company::create([
                'user_id' => $request->user()->id,
                'company_name' => $request->user()->name,
                'verification_status' => 'pending',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Profil perusahaan berhasil diambil.',
            'data' => [
                'id' => $company->id,
                'company_name' => $company->company_name,
                'description' => $company->description,
                'logo' => $company->logo,
                'logo_url' => $company->logo ? Storage::disk('public')->url($company->logo) : null,
                'address' => $company->address,
                'phone' => $company->phone,
                'website' => $company->website,
                'verification_status' => $company->verification_status,
                'created_at' => $company->created_at,
                'user' => [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'role' => $request->user()->role,
                ],
            ],
        ]);
    }

    /**
     * Update company profile details.
     */
    public function update(Request $request): JsonResponse
    {
        $company = $this->getCompany($request);

        if (!$company) {
            $company = Company::create([
                'user_id' => $request->user()->id,
                'company_name' => $request->user()->name,
                'verification_status' => 'pending',
            ]);
        }

        $validated = $request->validate([
            'company_name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:20'],
            'website' => ['nullable', 'url', 'max:255'],
        ], [
            'company_name.required' => 'Nama perusahaan wajib diisi.',
            'website.url' => 'Format URL website perusahaan tidak valid.',
        ]);

        $company->update([
            'company_name' => $validated['company_name'],
            'description' => $validated['description'] ?? null,
            'address' => $validated['address'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'website' => $validated['website'] ?? null,
        ]);

        if ($request->user()->name !== $validated['company_name']) {
            $request->user()->update(['name' => $validated['company_name']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Profil perusahaan berhasil diperbarui.',
            'data' => $company->fresh(),
        ]);
    }

    /**
     * Upload company logo.
     */
    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate([
            'logo' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
        ], [
            'logo.required' => 'File logo perusahaan wajib diunggah.',
            'logo.image' => 'File harus berupa gambar.',
            'logo.mimes' => 'Format gambar harus berupa JPG, JPEG, atau PNG.',
            'logo.max' => 'Ukuran file gambar maksimal 2MB.',
        ]);

        $company = $this->getCompany($request);

        if ($company->logo && Storage::disk('public')->exists($company->logo)) {
            Storage::disk('public')->delete($company->logo);
        }

        $path = $request->file('logo')->store('company/logos', 'public');
        $company->update(['logo' => $path]);

        return response()->json([
            'success' => true,
            'message' => 'Logo perusahaan berhasil diunggah.',
            'data' => [
                'logo' => $path,
                'logo_url' => Storage::disk('public')->url($path),
            ],
        ]);
    }

    /**
     * Get company dashboard summary statistics.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $company = $this->getCompany($request);

        if (!$company) {
            return response()->json([
                'success' => true,
                'message' => 'Dashboard berhasil diambil.',
                'data' => [
                    'total_jobs' => 0,
                    'active_jobs' => 0,
                    'closed_jobs' => 0,
                    'total_applications' => 0,
                    'pending_applications' => 0,
                    'interview_count' => 0,
                    'accepted_count' => 0,
                    'rejected_count' => 0,
                ],
            ]);
        }

        $jobsQuery = $company->jobVacancies();
        $totalJobs = (clone $jobsQuery)->count();
        $activeJobs = (clone $jobsQuery)->where('status', 'active')->count();
        $closedJobs = (clone $jobsQuery)->where('status', 'closed')->count();

        $jobIds = (clone $jobsQuery)->pluck('id')->toArray();

        $appQuery = \App\Models\Application::whereIn('job_id', $jobIds);
        $totalApplications = (clone $appQuery)->count();
        $pendingApplications = (clone $appQuery)->whereIn('status', ['submitted', 'screening'])->count();
        $interviewCount = (clone $appQuery)->where('status', 'interview')->count();
        $acceptedCount = (clone $appQuery)->where('status', 'accepted')->count();
        $rejectedCount = (clone $appQuery)->where('status', 'rejected')->count();

        return response()->json([
            'success' => true,
            'message' => 'Dashboard berhasil diambil.',
            'data' => [
                'total_jobs' => $totalJobs,
                'active_jobs' => $activeJobs,
                'closed_jobs' => $closedJobs,
                'total_applications' => $totalApplications,
                'pending_applications' => $pendingApplications,
                'interview_count' => $interviewCount,
                'accepted_count' => $acceptedCount,
                'rejected_count' => $rejectedCount,
            ],
        ]);
    }
}
