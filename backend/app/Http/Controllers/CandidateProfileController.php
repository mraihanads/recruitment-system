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
            'cv_file' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
        ], [
            'cv_file.required' => 'File CV wajib diunggah.',
            'cv_file.mimes' => 'Format file CV harus berupa PDF, DOC, atau DOCX.',
            'cv_file.max' => 'Ukuran file CV maksimal 5MB.',
        ]);

        $user = $request->user();
        $profile = $user->candidateProfile ?? CandidateProfile::create([
            'user_id' => $user->id,
            'full_name' => $user->name,
        ]);

        if ($profile->cv_file && Storage::disk('public')->exists($profile->cv_file)) {
            Storage::disk('public')->delete($profile->cv_file);
        }

        $path = $request->file('cv_file')->store('candidate/cvs', 'public');
        $profile->update(['cv_file' => $path]);

        return response()->json([
            'success' => true,
            'message' => 'CV berhasil diunggah.',
            'data' => [
                'cv_file' => $path,
                'cv_url' => Storage::disk('public')->url($path),
            ],
        ]);
    }

    /**
     * Upload candidate profile photo.
     */
    public function uploadPhoto(Request $request): JsonResponse
    {
        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
        ], [
            'photo.required' => 'Foto profil wajib diunggah.',
            'photo.image' => 'File harus berupa gambar.',
            'photo.mimes' => 'Format foto harus berupa JPG, JPEG, atau PNG.',
            'photo.max' => 'Ukuran foto maksimal 2MB.',
        ]);

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

        return response()->json([
            'success' => true,
            'message' => 'Foto profil berhasil diunggah.',
            'data' => [
                'photo' => $path,
                'photo_url' => Storage::disk('public')->url($path),
            ],
        ]);
    }
}
