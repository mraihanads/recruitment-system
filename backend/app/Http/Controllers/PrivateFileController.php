<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\CandidateProfile;
use App\Models\CompanyDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PrivateFileController extends Controller
{
    /**
     * Resolve and stream a file safely from private storage, with read-only fallback
     * to legacy public storage so previously uploaded documents remain accessible.
     */
    protected function serveFile(?string $relativePath, ?string $downloadName = null): BinaryFileResponse|StreamedResponse|JsonResponse
    {
        if (!$relativePath) {
            return response()->json([
                'success' => false,
                'message' => 'Berkas tidak ditemukan.',
            ], 404);
        }

        // Prevent path traversal attacks
        $clean = ltrim(preg_replace('/^public\//', '', str_replace('\\', '/', $relativePath)), '/');
        if ($clean === '' || str_contains($clean, '..') || str_contains($clean, "\0")) {
            return response()->json([
                'success' => false,
                'message' => 'Path berkas tidak valid.',
            ], 400);
        }

        $disk = null;
        if (Storage::disk('private')->exists($clean)) {
            $disk = 'private';
        } elseif (Storage::disk('public')->exists($clean)) {
            // Safe backward compatibility for files uploaded before private storage migration
            $disk = 'public';
        }

        if (!$disk) {
            return response()->json([
                'success' => false,
                'message' => 'File tidak ditemukan di server penyimpanan.',
            ], 404);
        }

        $filename = $downloadName ?: basename($clean);
        $mime = Storage::disk($disk)->mimeType($clean) ?: 'application/octet-stream';

        return Storage::disk($disk)->response($clean, $filename, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="' . addslashes($filename) . '"',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store, max-age=0',
        ]);
    }

    /**
     * Authenticated download for company legal/verification document.
     * Allowed: Admin, or the owning Company only.
     */
    public function downloadCompanyDocument(Request $request, int $id): BinaryFileResponse|StreamedResponse|JsonResponse
    {
        $user = $request->user();
        if (!$user || $user->status === 'inactive') {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 401);
        }

        $document = CompanyDocument::find($id);
        if (!$document) {
            return response()->json(['success' => false, 'message' => 'Dokumen tidak ditemukan.'], 404);
        }

        $isAuthorized = false;
        if ($user->role === 'admin') {
            $isAuthorized = true;
        } elseif ($user->role === 'company') {
            $company = $user->company;
            $isAuthorized = $company && (int) $company->id === (int) $document->company_id;
        }

        if (!$isAuthorized) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki izin untuk mengakses dokumen ini.',
            ], 403);
        }

        return $this->serveFile($document->document_file);
    }

    /**
     * Signed temporary URL handler for company document (browser tab viewing).
     */
    public function signedCompanyDocument(int $id): BinaryFileResponse|StreamedResponse|JsonResponse
    {
        $document = CompanyDocument::find($id);
        if (!$document) {
            return response()->json(['success' => false, 'message' => 'Dokumen tidak ditemukan.'], 404);
        }

        return $this->serveFile($document->document_file);
    }

    /**
     * Authenticated download for candidate CV.
     * Allowed: Admin, the owning Candidate, or a Company that received an application from this candidate.
     */
    public function downloadCandidateCv(Request $request, int $profileId): BinaryFileResponse|StreamedResponse|JsonResponse
    {
        $user = $request->user();
        if (!$user || $user->status === 'inactive') {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 401);
        }

        $profile = CandidateProfile::find($profileId);
        if (!$profile) {
            return response()->json(['success' => false, 'message' => 'Profil kandidat tidak ditemukan.'], 404);
        }

        $isAuthorized = false;
        if ($user->role === 'admin') {
            $isAuthorized = true;
        } elseif ($user->role === 'candidate') {
            $isAuthorized = (int) $profile->user_id === (int) $user->id;
        } elseif ($user->role === 'company') {
            $company = $user->company;
            if ($company) {
                $isAuthorized = Application::where('candidate_id', $profile->id)
                    ->whereHas('jobVacancy', function ($q) use ($company) {
                        $q->where('company_id', $company->id);
                    })
                    ->exists();
            }
        }

        if (!$isAuthorized) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki izin untuk mengakses CV kandidat ini.',
            ], 403);
        }

        return $this->serveFile($profile->cv_file);
    }

    /**
     * Signed temporary URL handler for candidate CV (browser tab viewing).
     */
    public function signedCandidateCv(int $profileId): BinaryFileResponse|StreamedResponse|JsonResponse
    {
        $profile = CandidateProfile::find($profileId);
        if (!$profile) {
            return response()->json(['success' => false, 'message' => 'Profil kandidat tidak ditemukan.'], 404);
        }

        return $this->serveFile($profile->cv_file);
    }

    /**
     * Authenticated download for application CV snapshot.
     * Allowed: Admin, owning Candidate, or owning Company of the job vacancy.
     */
    public function downloadApplicationCv(Request $request, int $applicationId): BinaryFileResponse|StreamedResponse|JsonResponse
    {
        $application = Application::with(['jobVacancy:id,company_id', 'candidateProfile:id,user_id,cv_file'])->find($applicationId);
        $authError = $this->authorizeApplicationAccess($request, $application);
        if ($authError) {
            return $authError;
        }

        $cvPath = $application->cv_file ?: $application->candidateProfile?->cv_file;
        return $this->serveFile($cvPath);
    }

    /**
     * Signed temporary URL handler for application CV.
     */
    public function signedApplicationCv(int $applicationId): BinaryFileResponse|StreamedResponse|JsonResponse
    {
        $application = Application::with('candidateProfile:id,cv_file')->find($applicationId);
        if (!$application) {
            return response()->json(['success' => false, 'message' => 'Data lamaran tidak ditemukan.'], 404);
        }

        $cvPath = $application->cv_file ?: $application->candidateProfile?->cv_file;
        return $this->serveFile($cvPath);
    }

    /**
     * Authenticated download for application cover letter / attachment file by index.
     */
    public function downloadApplicationAttachment(Request $request, int $applicationId, int $index): BinaryFileResponse|StreamedResponse|JsonResponse
    {
        $application = Application::with(['jobVacancy:id,company_id', 'candidateProfile:id,user_id'])->find($applicationId);
        $authError = $this->authorizeApplicationAccess($request, $application);
        if ($authError) {
            return $authError;
        }

        $paths = $this->extractAttachmentPaths($application->cover_letter);
        if (!isset($paths[$index])) {
            return response()->json(['success' => false, 'message' => 'Berkas lampiran tidak ditemukan.'], 404);
        }

        return $this->serveFile($paths[$index]);
    }

    /**
     * Signed temporary URL handler for application attachment file by index.
     */
    public function signedApplicationAttachment(int $applicationId, int $index): BinaryFileResponse|StreamedResponse|JsonResponse
    {
        $application = Application::find($applicationId);
        if (!$application) {
            return response()->json(['success' => false, 'message' => 'Data lamaran tidak ditemukan.'], 404);
        }

        $paths = $this->extractAttachmentPaths($application->cover_letter);
        if (!isset($paths[$index])) {
            return response()->json(['success' => false, 'message' => 'Berkas lampiran tidak ditemukan.'], 404);
        }

        return $this->serveFile($paths[$index]);
    }

    /**
     * Shared ownership authorization check for application files.
     */
    protected function authorizeApplicationAccess(Request $request, ?Application $application): ?JsonResponse
    {
        $user = $request->user();
        if (!$user || $user->status === 'inactive') {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 401);
        }

        if (!$application) {
            return response()->json(['success' => false, 'message' => 'Data lamaran tidak ditemukan.'], 404);
        }

        if ($user->role === 'admin') {
            return null;
        }

        if ($user->role === 'candidate') {
            $candidate = $user->candidateProfile;
            if ($candidate && (int) $application->candidate_id === (int) $candidate->id) {
                return null;
            }
        }

        if ($user->role === 'company') {
            $company = $user->company;
            if ($company && $application->jobVacancy && (int) $application->jobVacancy->company_id === (int) $company->id) {
                return null;
            }
        }

        return response()->json([
            'success' => false,
            'message' => 'Anda tidak memiliki izin untuk mengakses berkas lamaran ini.',
        ], 403);
    }

    /**
     * Parse single-path or JSON-array cover_letter column into normalized path array.
     */
    protected function extractAttachmentPaths(?string $coverLetter): array
    {
        if (!$coverLetter) {
            return [];
        }

        $trimmed = trim($coverLetter);
        if (str_starts_with($trimmed, '[')) {
            $decoded = json_decode($trimmed, true);
            return is_array($decoded) ? array_values(array_filter($decoded, 'is_string')) : [];
        }

        if (str_starts_with($trimmed, 'candidate/') || str_starts_with($trimmed, 'http')) {
            return [$trimmed];
        }

        return [];
    }
}
