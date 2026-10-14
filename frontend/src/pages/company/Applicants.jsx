import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import companyService from '../../services/companyService';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

const statusConfig = {
  submitted: {
    label: 'Submitted',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  screening: {
    label: 'Screening',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  interview: {
    label: 'Interview',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
  },
  test: {
    label: 'Test',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
  },
  accepted: {
    label: 'Accepted',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

const resolvePhotoUrl = (photoPath, photoUrl) => {
  if (photoUrl) return photoUrl;
  if (!photoPath) return null;
  if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) return photoPath;
  const clean = photoPath.replace(/^public\//, '');
  return `http://127.0.0.1:8000/storage/${clean}`;
};

const Applicants = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialJobId = searchParams.get('job_id') || '';

  const [applicants, setApplicants] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState(initialJobId);
  const [selectedStatus, setSelectedStatus] = useState('');

  const fetchApplicants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (selectedJob) params.job_id = selectedJob;
      if (selectedStatus) params.status = selectedStatus;

      const [appsRes, jobsRes] = await Promise.all([
        companyService.getApplicants(params),
        jobs.length === 0 ? companyService.getJobs().catch(() => ({ data: [] })) : Promise.resolve({ data: jobs }),
      ]);

      if (appsRes?.success) {
        setApplicants(appsRes.data || []);
      }
      if (jobsRes?.data && jobs.length === 0) {
        setJobs(jobsRes.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat daftar pelamar kerja.');
    } finally {
      setLoading(false);
    }
  }, [selectedJob, selectedStatus, jobs.length]);

  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  // Synchronize URL search params with job filter
  const handleJobFilterChange = (jobId) => {
    setSelectedJob(jobId);
    if (jobId) {
      setSearchParams({ job_id: jobId });
    } else {
      setSearchParams({});
    }
  };

  // Client-side search filtering (by candidate name, bio, job title)
  const filteredApplicants = useMemo(() => {
    if (!search.trim()) return applicants;
    const q = search.toLowerCase().trim();
    return applicants.filter((item) => {
      const cand = item.candidate || {};
      const job = item.job || {};
      const nameMatch = (cand.full_name || '').toLowerCase().includes(q);
      const bioMatch = (cand.bio || '').toLowerCase().includes(q);
      const jobMatch = (job.title || '').toLowerCase().includes(q);
      const phoneMatch = (cand.phone || '').toLowerCase().includes(q);
      return nameMatch || bioMatch || jobMatch || phoneMatch;
    });
  }, [applicants, search]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-md shadow-blue-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black mb-1.5">Daftar Pelamar Kerja</h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl leading-relaxed">
            Tinjau kualifikasi berkas, persentase kecocokan skill kandidat, dan kelola proses tahapan seleksi rekrutmen.
          </p>
        </div>

        <Link
          to="/company/jobs"
          className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all inline-flex items-center gap-2 shrink-0"
        >
          Kelola Lowongan
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama pelamar atau posisi lowongan..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400"
              data-testid="search-applicant-input"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-base"
              >
                &times;
              </button>
            )}
          </div>

          {/* Job Filter Dropdown */}
          <div>
            <select
              value={selectedJob}
              onChange={(e) => handleJobFilterChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
              data-testid="job-filter-select"
            >
              <option value="">Semua Lowongan</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
              data-testid="status-filter-select"
            >
              <option value="">Semua Status</option>
              <option value="submitted">Submitted</option>
              <option value="screening">Screening</option>
              <option value="interview">Interview</option>
              <option value="test">Test</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingScreen message="Memuat daftar pelamar kerja..." />
      ) : error ? (
        <ErrorState
          title="Gagal Memuat Pelamar"
          message={error}
          onRetry={fetchApplicants}
        />
      ) : filteredApplicants.length === 0 ? (
        <EmptyState
          title="Belum ada pelamar ditemukan."
          description={
            search || selectedJob || selectedStatus
              ? 'Tidak ada pelamar yang sesuai dengan kata kunci atau filter yang Anda pilih.'
              : 'Belum ada kandidat yang melamar ke lowongan perusahaan Anda saat ini.'
          }
          actionLabel="Tinjau Lowongan Kerja"
          onAction={() => navigate('/company/jobs')}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Menampilkan {filteredApplicants.length} pelamar
              {selectedStatus && ` dengan status "${selectedStatus}"`}
              {selectedJob && ` untuk lowongan terpilih`}
              {search && ` untuk pencarian "${search}"`}
            </span>
          </div>

          {/* Applicant Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredApplicants.map((app) => {
              const cand = app.candidate || {};
              const job = app.job || {};
              const currentStatus = (app.status || 'submitted').toLowerCase();
              const badge = statusConfig[currentStatus] || statusConfig.submitted;
              const matchPercentage = Math.round(app.match_percentage ?? 0);
              const photoSrc = resolvePhotoUrl(cand.photo, cand.photo_url);

              return (
                <div
                  key={app.id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between group"
                  data-testid={`applicant-card-${app.id}`}
                >
                  <div className="space-y-4">
                    {/* Top: Candidate info & Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {photoSrc ? (
                          <img
                            src={photoSrc}
                            alt={cand.full_name}
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-100 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center shrink-0 border border-blue-100 text-sm">
                            {cand.full_name ? cand.full_name[0].toUpperCase() : 'K'}
                          </div>
                        )}

                        <div className="min-w-0">
                          <Link
                            to={`/company/applicants/${app.id}`}
                            className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors truncate block group-hover:text-blue-600"
                          >
                            {cand.full_name || 'Kandidat Pelamar'}
                          </Link>
                          <p className="text-xs text-slate-400 truncate">
                            {cand.phone ? `Tel: ${cand.phone}` : 'Kontak belum diisi'}
                          </p>
                        </div>
                      </div>

                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shrink-0 ${badge.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </div>

                    {/* Applied Position */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100/80 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                        Posisi yang Dilamar
                      </span>
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {job.title || 'Lowongan Kerja'}
                      </p>
                      {job.location && (
                        <p className="text-[11px] text-slate-500">
                          Lokasi: {job.location}
                        </p>
                      )}
                    </div>

                    {/* Skill Match Indicator */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">Kecocokan Kualifikasi:</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded-md ${
                            matchPercentage >= 75
                              ? 'bg-emerald-100 text-emerald-700'
                              : matchPercentage >= 50
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {matchPercentage}% Match
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            matchPercentage >= 75
                              ? 'bg-emerald-500'
                              : matchPercentage >= 50
                              ? 'bg-amber-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(matchPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer Info & Action */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                    <span className="text-slate-400">
                      Melamar: <strong className="text-slate-600">{formatDate(app.applied_at)}</strong>
                    </span>

                    <Link
                      to={`/company/applicants/${app.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-2xs"
                      data-testid={`applicant-detail-btn-${app.id}`}
                    >
                      Tinjau Lamaran &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Applicants;
