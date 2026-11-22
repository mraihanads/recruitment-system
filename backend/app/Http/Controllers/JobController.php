<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\ApplicationStatusHistory;
use App\Models\JobCategory;
use App\Models\JobVacancy;
use App\Services\SkillMatchingService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JobController extends Controller
{
    protected SkillMatchingService $matchingService;

    public function __construct(SkillMatchingService $matchingService)
    {
        $this->matchingService = $matchingService;
    }

    protected function getCandidate(Request $request)
    {
        return $request->user()?->candidateProfile;
    }

    /**
     * List active and non-expired job vacancies with optional filters.
     */
    public function index(Request $request): JsonResponse
    {
        JobVacancy::autoCloseExpired();

        $query = JobVacancy::with([
            'company:id,user_id,company_name,logo,address,verification_status',
            'category:id,name',
            'skills:id,name',
        ])
        ->where('status', 'active')
        ->where(function ($q) {
            $q->where('is_removed_by_admin', false)->orWhereNull('is_removed_by_admin');
        })
        ->whereDate('deadline', '>=', Carbon::today());

        // Filter: search keyword (title, description, or requirements)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('requirements', 'like', "%{$search}%")
                  ->orWhereHas('company', function ($cq) use ($search) {
                      $cq->where('company_name', 'like', "%{$search}%");
                  });
            });
        }

        // Filter: location
        if ($request->filled('location')) {
            $query->where('location', 'like', "%{$request->location}%");
        }

        // Filter: employment_type
        if ($request->filled('employment_type')) {
            $query->where('employment_type', $request->employment_type);
        }

        // Filter: category_id
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $perPage = max(1, min((int) $request->get('per_page', 10), 100));
        $jobs = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Daftar lowongan kerja berhasil diambil.',
            'data' => $jobs,
        ]);
    }

    /**
     * Show job vacancy details with application & save status for candidate.
     */
    public function show(Request $request, $id): JsonResponse
    {
        JobVacancy::autoCloseExpired();

        $job = JobVacancy::with([
            'company:id,user_id,company_name,description,logo,address,phone,website,verification_status',
            'category:id,name,description',
            'skills:id,name',
        ])->find($id);

        if (!$job || $job->is_removed_by_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Lowongan kerja tidak ditemukan.',
            ], 404);
        }

        $candidate = $this->getCandidate($request);
        $isClosed = ($job->status !== 'active' || Carbon::parse($job->deadline)->isPast());

        $application = null;
        $isSaved = false;

        if ($candidate) {
            $application = Application::where('job_id', $job->id)
                ->where('candidate_id', $candidate->id)
                ->first();

            $isSaved = $candidate->savedJobs()->where('job_id', $job->id)->exists();
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail lowongan kerja berhasil diambil.',
            'data' => [
                'job' => $job,
                'is_active' => !$isClosed,
                'has_applied' => !is_null($application),
                'application' => $application ? [
                    'id' => $application->id,
                    'status' => $application->status,
                    'match_percentage' => $application->match_percentage,
                    'applied_at' => $application->applied_at,
                ] : null,
                'is_saved' => $isSaved,
            ],
        ]);
    }

    /**
     * Preview candidate skill matching for a job vacancy.
     */
    public function match(Request $request, $id): JsonResponse
    {
        $job = JobVacancy::find($id);
        if (!$job || $job->is_removed_by_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Lowongan kerja tidak ditemukan.',
            ], 404);
        }

        $candidate = $this->getCandidate($request);
        if (!$candidate) {
            return response()->json([
                'success' => false,
                'message' => 'Profil kandidat tidak ditemukan.',
            ], 404);
        }

        $matchResult = $this->matchingService->calculate($candidate, $job);

        return response()->json([
            'success' => true,
            'message' => 'Matching berhasil dihitung.',
            'data' => $matchResult,
        ]);
    }

    /**
     * Apply for a job vacancy.
     */
    public function apply(Request $request, $id): JsonResponse
    {
        $job = JobVacancy::find($id);
        if (!$job || $job->is_removed_by_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Lowongan kerja tidak ditemukan.',
            ], 404);
        }

        if ($job->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Lowongan ini sudah tidak aktif atau ditutup.',
            ], 422);
        }

        if (Carbon::parse($job->deadline)->endOfDay()->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'Batas waktu (deadline) lamaran untuk lowongan ini telah berakhir.',
            ], 422);
        }

        $candidate = $this->getCandidate($request);
        if (!$candidate) {
            return response()->json([
                'success' => false,
                'message' => 'Profil kandidat tidak ditemukan.',
            ], 422);
        }

        $missingFields = [];
        if (empty(trim((string) $candidate->full_name))) $missingFields[] = 'Nama Lengkap';
        if (empty(trim((string) $candidate->phone))) $missingFields[] = 'Nomor Telepon';
        if (empty(trim((string) $candidate->gender))) $missingFields[] = 'Jenis Kelamin';
        if (empty($candidate->birth_date)) $missingFields[] = 'Tanggal Lahir';
        if (empty(trim((string) $candidate->address))) $missingFields[] = 'Alamat Domisili';
        if (empty(trim((string) $candidate->bio))) $missingFields[] = 'Ringkasan Profil (Bio)';

        if (!empty($missingFields)) {
            return response()->json([
                'success' => false,
                'message' => 'Biodata Anda belum lengkap (' . implode(', ', $missingFields) . '). Silakan lengkapi biodata terlebih dahulu di menu Profil sebelum melamar.',
            ], 422);
        }

        if (empty($candidate->cv_file)) {
            return response()->json([
                'success' => false,
                'message' => 'Anda belum mengunggah CV. Silakan unggah CV terlebih dahulu di menu Profil sebelum melamar pekerjaan.',
            ], 422);
        }

        // Check if candidate already applied for this job
        $existing = Application::where('job_id', $job->id)
            ->where('candidate_id', $candidate->id)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Anda sudah pernah melamar lowongan ini.',
            ], 422);
        }

        $uploadedFiles = [];
        if ($request->hasFile('cover_letter_files')) {
            $rawFiles = $request->file('cover_letter_files');
            $uploadedFiles = is_array($rawFiles) ? $rawFiles : [$rawFiles];
        } elseif ($request->hasFile('cover_letter_file')) {
            $uploadedFiles = [$request->file('cover_letter_file')];
        }

        $allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'zip'];
        $storedPaths = [];

        foreach ($uploadedFiles as $idx => $uploadedFile) {
            if (!$uploadedFile || !$uploadedFile->isValid()) {
                continue;
            }

            if ($uploadedFile->getSize() > 10 * 1024 * 1024) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ukuran setiap berkas maksimal 10MB.',
                ], 422);
            }

            $extension = strtolower($uploadedFile->getClientOriginalExtension());
            if (!in_array($extension, $allowedExtensions)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Format berkas harus berupa PDF, DOC, DOCX, JPG, PNG, atau ZIP.',
                ], 422);
            }

            $originalName = $uploadedFile->getClientOriginalName();
            $safeOriginalName = preg_replace('/[^A-Za-z0-9._\- ()]/', '_', basename($originalName));
            if (empty($safeOriginalName)) {
                $safeOriginalName = 'Berkas_Lamaran_' . ($idx + 1) . '.' . $extension;
            }

            $storedPaths[] = $uploadedFile->storeAs(
                "candidate/cover_letters/{$candidate->id}/{$job->id}",
                $safeOriginalName,
                'public'
            );
        }

        $coverLetterValue = empty($storedPaths)
            ? ($request->input('cover_letter') ?: null)
            : (count($storedPaths) === 1 ? $storedPaths[0] : json_encode($storedPaths));

        $matchResult = $this->matchingService->calculate($candidate, $job);

        return DB::transaction(function () use ($job, $candidate, $request, $matchResult, $coverLetterValue) {
            $application = Application::create([
                'job_id' => $job->id,
                'candidate_id' => $candidate->id,
                'cv_file' => $candidate->cv_file,
                'cover_letter' => $coverLetterValue,
                'status' => 'submitted',
                'match_percentage' => $matchResult['match_percentage'],
                'applied_at' => Carbon::now(),
            ]);

            ApplicationStatusHistory::create([
                'application_id' => $application->id,
                'status' => 'submitted',
                'note' => 'Lamaran berhasil dikirimkan oleh kandidat.',
                'changed_by' => $request->user()->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Lamaran berhasil dikirim.',
                'data' => [
                    'id' => $application->id,
                    'job_id' => $application->job_id,
                    'status' => $application->status,
                    'match_percentage' => $application->match_percentage,
                    'applied_at' => $application->applied_at,
                ],
            ], 201);
        });
    }

    /**
     * Get list of all job categories.
     */
    public function categories(): JsonResponse
    {
        if (JobCategory::count() === 0) {
            $defaultCategories = [
                ['name' => 'Teknologi Informasi & Software', 'description' => 'Pengembangan aplikasi, jaringan, data, dan infrastruktur IT.'],
                ['name' => 'Keuangan, Akuntansi & Perbankan', 'description' => 'Manajemen keuangan, pajak, audit, dan layanan perbankan.'],
                ['name' => 'Pemasaran, Digital Marketing & Sales', 'description' => 'Strategi pemasaran, penjualan, media sosial, dan periklanan.'],
                ['name' => 'Desain Kreatif & Multimedia', 'description' => 'UI/UX design, desain grafis, video editing, dan animasi.'],
                ['name' => 'Sumber Daya Manusia (HR) & Umum', 'description' => 'Rekrutmen, pelatihan, pengembangan organisasi, dan general affair.'],
                ['name' => 'Administrasi & Operasional', 'description' => 'Administrasi perkantoran, sekretaris, dan manajemen operasional.'],
                ['name' => 'Teknik, Konstruksi & Manufaktur', 'description' => 'Teknik sipil, mesin, elektro, arsitektur, dan pabrikasi.'],
                ['name' => 'Logistik, Gudang & Rantai Pasok', 'description' => 'Manajemen pergudangan, pengiriman, pengadaan, dan distribusi.'],
                ['name' => 'Layanan Pelanggan (Customer Service)', 'description' => 'Dukungan pelanggan, call center, dan hubungan klien.'],
                ['name' => 'Pendidikan, Riset & Pelatihan', 'description' => 'Pengajar, instruktur, peneliti, dan staf akademik.'],
            ];

            foreach ($defaultCategories as $cat) {
                JobCategory::firstOrCreate(['name' => $cat['name']], $cat);
            }
        }

        $categories = JobCategory::orderBy('name')->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar kategori pekerjaan berhasil diambil.',
            'data' => $categories,
        ]);
    }

    /**
     * Get real-time public platform statistics from the database.
     */
    public function publicStats(): JsonResponse
    {
        JobVacancy::autoCloseExpired();

        if (JobCategory::count() === 0) {
            $this->categories();
        }

        $activeJobsCount = JobVacancy::where('status', 'active')
            ->where(function ($q) {
                $q->where('is_removed_by_admin', false)->orWhereNull('is_removed_by_admin');
            })
            ->whereDate('deadline', '>=', Carbon::today())
            ->count();

        $verifiedCompaniesCount = \App\Models\Company::where('verification_status', 'verified')->count();
        $totalCandidatesCount = \App\Models\User::where('role', 'candidate')->where('status', 'active')->count();
        $categoriesCount = JobCategory::count();
        $skillsCount = \App\Models\Skill::count();

        return response()->json([
            'success' => true,
            'data' => [
                'active_jobs' => $activeJobsCount,
                'verified_companies' => $verifiedCompaniesCount,
                'total_candidates' => $totalCandidatesCount,
                'total_categories' => $categoriesCount,
                'total_skills' => $skillsCount,
            ],
        ]);
    }
}
