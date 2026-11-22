<?php

namespace App\Http\Controllers;

use App\Models\CandidateProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class CandidateProfileController extends Controller
{
    /**
     * Get candidate profile.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = $user->candidateProfile()->with('user:id,name,email,role,status')->first();

        if (!$profile) {
            $profile = CandidateProfile::create([
                'user_id' => $user->id,
                'full_name' => $user->name,
            ]);
            $profile->load('user:id,name,email,role,status');
        }

        return response()->json([
            'success' => true,
            'message' => 'Profil kandidat berhasil diambil.',
            'data' => $profile,
        ]);
    }

    /**
     * Update candidate profile details.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = $user->candidateProfile;

        if (!$profile) {
            $profile = CandidateProfile::create([
                'user_id' => $user->id,
                'full_name' => $user->name,
            ]);
        }

        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:150'],
            'phone' => ['nullable', 'string', 'max:20'],
            'gender' => ['nullable', Rule::in(['male', 'female'])],
            'birth_date' => ['nullable', 'date'],
            'address' => ['nullable', 'string'],
            'bio' => ['nullable', 'string'],
        ], [
            'full_name.required' => 'Nama lengkap wajib diisi.',
            'gender.in' => 'Pilihan gender hanya male atau female.',
            'birth_date.date' => 'Format tanggal lahir tidak valid.',
        ]);

        $profile->update($validated);

        if ($user->name !== $validated['full_name']) {
            $user->update(['name' => $validated['full_name']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Profil kandidat berhasil diperbarui.',
            'data' => $profile->fresh()->load('user:id,name,email,role,status'),
        ]);
    }

    /**
     * Upload candidate CV.
     */
    public function uploadCv(Request $request): JsonResponse
    {
        $request->validate([
            'cv_file' => ['required', 'file', 'max:10240'],
        ], [
            'cv_file.required' => 'File CV wajib diunggah.',
            'cv_file.max' => 'Ukuran file CV maksimal 10MB.',
        ]);

        $allowedExtensions = ['pdf', 'doc', 'docx'];
        $extension = strtolower($request->file('cv_file')->getClientOriginalExtension());
        if (!in_array($extension, $allowedExtensions)) {
            return response()->json([
                'success' => false,
                'message' => 'Format file CV harus berupa PDF, DOC, atau DOCX.',
            ], 422);
        }

        $user = $request->user();
        $profile = $user->candidateProfile ?? CandidateProfile::create([
            'user_id' => $user->id,
            'full_name' => $user->name,
        ]);

        if ($profile->cv_file) {
            if (Storage::disk('private')->exists($profile->cv_file)) {
                Storage::disk('private')->delete($profile->cv_file);
            } elseif (Storage::disk('public')->exists($profile->cv_file)) {
                Storage::disk('public')->delete($profile->cv_file);
            }
        }

        $uploadedFile = $request->file('cv_file');
        $originalName = $uploadedFile->getClientOriginalName();
        // Clean dangerous path characters while preserving readable original filename
        $safeOriginalName = preg_replace('/[^A-Za-z0-9._\- ()]/', '_', basename($originalName));
        if (empty($safeOriginalName)) {
            $safeOriginalName = 'CV_' . $profile->id . '.' . $extension;
        }

        $path = $uploadedFile->storeAs("candidate/cvs/{$profile->id}", $safeOriginalName, 'private');
        $profile->update(['cv_file' => $path]);
        $freshProfile = $profile->fresh();

        return response()->json([
            'success' => true,
            'message' => 'CV berhasil diunggah.',
            'data' => [
                'cv_file' => $freshProfile->cv_file,
                'cv_url' => $freshProfile->cv_url,
            ],
        ]);
    }

    /**
     * Upload candidate profile photo.
     */
    public function uploadPhoto(Request $request): JsonResponse
    {
        $request->validate([
            'photo' => ['required', 'file', 'max:5120'],
        ], [
            'photo.required' => 'Foto profil wajib diunggah.',
            'photo.max' => 'Ukuran foto maksimal 5MB.',
        ]);

        $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
        $extension = strtolower($request->file('photo')->getClientOriginalExtension());
        if (!in_array($extension, $allowedExtensions)) {
            return response()->json([
                'success' => false,
                'message' => 'Format foto harus berupa JPG, JPEG, PNG, atau WEBP.',
            ], 422);
        }

        $user = $request->user();
        $profile = $user->candidateProfile ?? CandidateProfile::create([
            'user_id' => $user->id,
            'full_name' => $user->name,
        ]);

        if ($profile->photo && Storage::disk('public')->exists($profile->photo)) {
            Storage::disk('public')->delete($profile->photo);
        }

        $path = $request->file('photo')->store('candidate/photos', 'public');
        $profile->update(['photo' => $path]);
        $freshProfile = $profile->fresh();

        return response()->json([
            'success' => true,
            'message' => 'Foto profil berhasil diunggah.',
            'data' => [
                'photo' => $freshProfile->photo,
                'photo_url' => $freshProfile->photo_url,
            ],
        ]);
    }
}
