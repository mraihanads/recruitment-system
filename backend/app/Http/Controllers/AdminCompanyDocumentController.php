<?php

namespace App\Http\Controllers;

use App\Models\CompanyDocument;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdminCompanyDocumentController extends Controller
{
    /**
     * Display a listing of company documents.
     */
    public function index(Request $request): JsonResponse
    {
        $query = CompanyDocument::with([
            'company:id,user_id,company_name,verification_status',
            'verifier:id,name,role',
        ]);

        if ($request->filled('company_id')) {
            $query->where('company_id', $request->query('company_id'));
        }

        if ($request->filled('verification_status')) {
            $query->where('verification_status', $request->query('verification_status'));
        }

        if ($request->filled('document_type')) {
            $query->where('document_type', $request->query('document_type'));
        }

        $perPage = (int) $request->query('per_page', 10);
        $documents = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $documents,
        ]);
    }

    /**
     * Display the specified company document.
     */
    public function show(int $id): JsonResponse
    {
        $document = CompanyDocument::with([
            'company',
            'verifier:id,name,role',
        ])->find($id);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Dokumen tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $document,
        ]);
    }

    /**
     * Update verification status of a company document.
     */
    public function updateVerification(Request $request, int $id): JsonResponse
    {
        $document = CompanyDocument::with('company')->find($id);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Dokumen tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'verification_status' => 'required|in:pending,approved,rejected',
        ], [
            'verification_status.required' => 'Status verifikasi dokumen wajib diisi.',
            'verification_status.in' => 'Status verifikasi harus pending, approved, atau rejected.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $newStatus = $request->input('verification_status');

        $document->verification_status = $newStatus;
        $document->verified_by = $request->user()->id;
        $document->verified_at = now();
        $document->save();

        // Send notification to company
        if ($document->company && $document->company->user_id) {
            Notification::create([
                'user_id' => $document->company->user_id,
                'title' => 'Status Verifikasi Dokumen Perusahaan',
                'message' => "Dokumen {$document->document_type} Anda telah diubah statusnya menjadi {$newStatus} oleh administrator.",
                'type' => 'company_document_verification',
                'is_read' => false,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Status dokumen berhasil diperbarui.',
            'data' => $document->fresh(['verifier:id,name,role']),
        ]);
    }
}
