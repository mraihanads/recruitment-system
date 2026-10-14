<?php

namespace App\Http\Controllers;

use App\Models\CompanyDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CompanyDocumentController extends Controller
{
    protected function getCompany(Request $request)
    {
        return $request->user()->company;
    }

    /**
     * List all documents uploaded by the authenticated company.
     */
    public function index(Request $request): JsonResponse
    {
        $company = $this->getCompany($request);
        $documents = $company ? $company->companyDocuments()->latest()->get() : [];

        return response()->json([
            'success' => true,
            'message' => 'Daftar dokumen perusahaan berhasil diambil.',
            'data' => $documents,
        ]);
    }

    /**
     * Upload a new company verification document.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'document_type' => ['required', 'string', 'max:100'],
            'document_file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ], [
            'document_type.required' => 'Jenis dokumen wajib diisi.',
            'document_file.required' => 'Berkas dokumen wajib diunggah.',
            'document_file.mimes' => 'Format dokumen harus berupa PDF, JPG, JPEG, atau PNG.',
            'document_file.max' => 'Ukuran berkas dokumen maksimal 5MB.',
        ]);

        $company = $this->getCompany($request);

        $path = $request->file('document_file')->store('company/documents', 'public');

        $doc = $company->companyDocuments()->create([
            'document_type' => $request->document_type,
            'document_file' => $path,
            'verification_status' => 'pending',
            'verified_by' => null,
            'verified_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Dokumen perusahaan berhasil diunggah dan sedang menunggu verifikasi.',
            'data' => [
                'id' => $doc->id,
                'document_type' => $doc->document_type,
                'document_file' => $doc->document_file,
                'document_url' => Storage::disk('public')->url($doc->document_file),
                'verification_status' => $doc->verification_status,
                'created_at' => $doc->created_at,
            ],
        ], 201);
    }

    /**
     * Show a specific document with ownership guard.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $company = $this->getCompany($request);
        $document = CompanyDocument::find($id);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Dokumen tidak ditemukan.',
            ], 404);
        }

        if (!$company || $document->company_id !== $company->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke dokumen ini.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail dokumen berhasil diambil.',
            'data' => [
                'id' => $document->id,
                'document_type' => $document->document_type,
                'document_file' => $document->document_file,
                'document_url' => Storage::disk('public')->url($document->document_file),
                'verification_status' => $document->verification_status,
                'created_at' => $document->created_at,
            ],
        ]);
    }

    /**
     * Delete a document with ownership guard.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $company = $this->getCompany($request);
        $document = CompanyDocument::find($id);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Dokumen tidak ditemukan.',
            ], 404);
        }

        if (!$company || $document->company_id !== $company->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke dokumen ini.',
            ], 403);
        }

        if ($document->document_file && Storage::disk('public')->exists($document->document_file)) {
            Storage::disk('public')->delete($document->document_file);
        }

        $document->delete();

        return response()->json([
            'success' => true,
            'message' => 'Dokumen berhasil dihapus.',
        ]);
    }
}
