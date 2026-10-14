<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdminCompanyController extends Controller
{
    /**
     * Display a listing of companies with search and verification filter.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Company::with(['user:id,name,email,status'])
            ->withCount(['jobVacancies', 'companyDocuments']);

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where('company_name', 'like', "%{$search}%");
        }

        if ($request->filled('verification_status')) {
            $query->where('verification_status', $request->query('verification_status'));
        }

        $perPage = (int) $request->query('per_page', 10);
        $companies = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $companies,
        ]);
    }

    /**
     * Display the specified company details.
     */
    public function show(int $id): JsonResponse
    {
        $company = Company::with([
            'user:id,name,email,status',
            'companyDocuments',
            'jobVacancies' => function ($q) {
                $q->withCount('applications')->latest();
            },
        ])->find($id);

        if (!$company) {
            return response()->json([
                'success' => false,
                'message' => 'Perusahaan tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $company,
        ]);
    }

    /**
     * Update verification status of a company.
     */
    public function updateVerification(Request $request, int $id): JsonResponse
    {
        $company = Company::find($id);

        if (!$company) {
            return response()->json([
                'success' => false,
                'message' => 'Perusahaan tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'verification_status' => 'required|in:verified,rejected',
        ], [
            'verification_status.required' => 'Status verifikasi wajib diisi.',
            'verification_status.in' => 'Status verifikasi harus verified atau rejected.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $newStatus = $request->input('verification_status');
        $company->verification_status = $newStatus;
        $company->save();

        // If verified, approve any pending documents
        if ($newStatus === 'verified') {
            $company->companyDocuments()
                ->where('verification_status', 'pending')
                ->update([
                    'verification_status' => 'approved',
                    'verified_by' => $request->user()->id,
                    'verified_at' => now(),
                ]);
        }

        // Create notification for the company user
        $message = $newStatus === 'verified'
            ? 'Perusahaan Anda telah diverifikasi oleh administrator.'
            : 'Verifikasi perusahaan Anda ditolak oleh administrator.';

        Notification::create([
            'user_id' => $company->user_id,
            'title' => 'Status Verifikasi Perusahaan',
            'message' => $message,
            'type' => 'company_verification',
            'is_read' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status verifikasi perusahaan berhasil diperbarui.',
            'data' => $company->fresh(['user', 'companyDocuments']),
        ]);
    }
}
