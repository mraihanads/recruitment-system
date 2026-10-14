<?php

namespace App\Http\Controllers;

use App\Models\CandidatePortfolio;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CandidatePortfolioController extends Controller
{
    protected function getCandidate(Request $request)
    {
        return $request->user()->candidateProfile;
    }

    /**
     * List all portfolios for the authenticated candidate.
     */
    public function index(Request $request): JsonResponse
    {
        $candidate = $this->getCandidate($request);
        $portfolios = $candidate ? $candidate->portfolios()->orderBy('created_at', 'desc')->get() : [];

        return response()->json([
            'success' => true,
            'message' => 'Daftar portofolio berhasil diambil.',
            'data' => $portfolios,
        ]);
    }

    /**
     * Add a new portfolio record.
     */
    public function store(Request $request): JsonResponse
    {
        $candidate = $this->getCandidate($request);

        $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'project_url' => ['nullable', 'url', 'max:255'],
            'image' => ['nullable'],
        ], [
            'title.required' => 'Judul proyek/portofolio wajib diisi.',
            'project_url.url' => 'Format URL proyek tidak valid.',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $request->validate([
                'image' => ['image', 'mimes:jpg,jpeg,png', 'max:2048'],
            ], [
                'image.mimes' => 'Format gambar harus berupa JPG, JPEG, atau PNG.',
                'image.max' => 'Ukuran gambar maksimal 2MB.',
            ]);
            $imagePath = $request->file('image')->store('candidate/portfolios', 'public');
        } elseif (is_string($request->image)) {
            $imagePath = $request->image;
        }

        $portfolio = $candidate->portfolios()->create([
            'title' => $request->title,
            'description' => $request->description,
            'project_url' => $request->project_url,
            'image' => $imagePath,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Portofolio berhasil ditambahkan.',
            'data' => $portfolio,
        ], 201);
    }

    /**
     * Show a specific portfolio record.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $candidate = $this->getCandidate($request);
        $portfolio = CandidatePortfolio::find($id);

        if (!$portfolio) {
            return response()->json([
                'success' => false,
                'message' => 'Data portofolio tidak ditemukan.',
            ], 404);
        }

        if ($portfolio->candidate_id !== $candidate->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke data ini.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail portofolio berhasil diambil.',
            'data' => $portfolio,
        ]);
    }

    /**
     * Update a portfolio record.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $candidate = $this->getCandidate($request);
        $portfolio = CandidatePortfolio::find($id);

        if (!$portfolio) {
            return response()->json([
                'success' => false,
                'message' => 'Data portofolio tidak ditemukan.',
            ], 404);
        }

        if ($portfolio->candidate_id !== $candidate->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke data ini.',
            ], 403);
        }

        $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'project_url' => ['nullable', 'url', 'max:255'],
        ], [
            'title.required' => 'Judul proyek/portofolio wajib diisi.',
            'project_url.url' => 'Format URL proyek tidak valid.',
        ]);

        $imagePath = $portfolio->image;
        if ($request->hasFile('image')) {
            $request->validate([
                'image' => ['image', 'mimes:jpg,jpeg,png', 'max:2048'],
            ], [
                'image.mimes' => 'Format gambar harus berupa JPG, JPEG, atau PNG.',
                'image.max' => 'Ukuran gambar maksimal 2MB.',
            ]);

            if ($portfolio->image && Storage::disk('public')->exists($portfolio->image)) {
                Storage::disk('public')->delete($portfolio->image);
            }
            $imagePath = $request->file('image')->store('candidate/portfolios', 'public');
        } elseif ($request->has('image') && is_string($request->image)) {
            $imagePath = $request->image;
        }

        $portfolio->update([
            'title' => $request->title,
            'description' => $request->description,
            'project_url' => $request->project_url,
            'image' => $imagePath,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Portofolio berhasil diperbarui.',
            'data' => $portfolio,
        ]);
    }

    /**
     * Delete a portfolio record.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $candidate = $this->getCandidate($request);
        $portfolio = CandidatePortfolio::find($id);

        if (!$portfolio) {
            return response()->json([
                'success' => false,
                'message' => 'Data portofolio tidak ditemukan.',
            ], 404);
        }

        if ($portfolio->candidate_id !== $candidate->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke data ini.',
            ], 403);
        }

        if ($portfolio->image && Storage::disk('public')->exists($portfolio->image)) {
            Storage::disk('public')->delete($portfolio->image);
        }

        $portfolio->delete();

        return response()->json([
            'success' => true,
            'message' => 'Portofolio berhasil dihapus.',
        ]);
    }
}
