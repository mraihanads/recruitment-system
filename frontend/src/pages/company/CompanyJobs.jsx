import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import companyService from '../../services/companyService';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

const employmentTypeLabels = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  internship: 'Internship',
  freelance: 'Freelance',
};

const statusConfig = {
  active: {
    label: 'Aktif',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  draft: {
    label: 'Draft',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  closed: {
    label: 'Ditutup',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
};

const formatCurrency = (val) => {
  if (!val) return null;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);
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

const CompanyJobs = () => {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Status Action State
  const [updatingId, setUpdatingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category_id = categoryFilter;

      const [jobsRes, catsRes] = await Promise.all([
        companyService.getJobs(params),
        categories.length === 0 ? companyService.getJobCategories().catch(() => ({ data: [] })) : Promise.resolve({ data: categories }),
      ]);

      if (jobsRes?.success) {
        setJobs(jobsRes.data || []);
      }
      if (catsRes?.data && categories.length === 0) {
        setCategories(catsRes.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat daftar lowongan pekerjaan.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter, categories.length]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleToggleStatus = async (job) => {
    const nextStatus = job.status === 'active' ? 'closed' : 'active';
    const confirmMsg =
      job.status === 'active'
        ? `Apakah Anda yakin ingin MENUTUP lowongan "${job.title}"? Pelamar tidak akan dapat melamar lowongan ini lagi.`
        : `Apakah Anda yakin ingin MENGAKTIFKAN kembali lowongan "${job.title}"?`;

    if (!window.confirm(confirmMsg)) return;

    setUpdatingId(job.id);
    try {
      const res = await companyService.updateJobStatus(job.id, nextStatus);
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: nextStatus } : j))
      );
      setFeedback({
        type: 'success',
        message: res?.message || `Status lowongan berhasil diubah menjadi ${nextStatus}.`,
      });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal mengubah status lowongan.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteJob = async (job) => {
    if (job.applications_count > 0) {
      alert(
        `Lowongan "${job.title}" sudah memiliki ${job.applications_count} pelamar. Lowongan tidak dapat dihapus, silakan ubah status menjadi Closed.`
      );
      return;
    }

    if (!window.confirm(`Hapus lowongan "${job.title}" secara permanen? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    setUpdatingId(job.id);
    try {
      const res = await companyService.deleteJob(job.id);
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
      setFeedback({ type: 'success', message: res?.message || 'Lowongan berhasil dihapus.' });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal menghapus lowongan.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-md shadow-blue-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black mb-1.5">Manajemen Lowongan Pekerjaan</h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl leading-relaxed">
            Kelola lowongan aktif, buat posisi baru, dan tinjau status publikasi rekrutmen perusahaan Anda.
          </p>
        </div>

        <Link
          to="/company/jobs/create"
          className="px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs sm:text-sm shadow-sm transition-all inline-flex items-center gap-2 shrink-0"
          data-testid="create-job-button"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Lowongan Baru
        </Link>
      </div>

      {/* Global Feedback Alert */}
      {feedback.message && (
        <div
          className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback({ type: '', message: '' })}
            className="text-slate-400 hover:text-slate-600 text-base leading-none"
          >
            &times;
          </button>
        </div>
      )}

      {/* Search & Filter Controls */}
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
              placeholder="Cari posisi atau kata kunci lowongan..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400"
              data-testid="search-job-input"
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

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
              data-testid="status-filter-select"
            >
              <option value="">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="draft">Draft</option>
              <option value="closed">Ditutup (Closed)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
              data-testid="category-filter-select"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingScreen message="Memuat daftar lowongan pekerjaan..." />
      ) : error ? (
        <ErrorState
          title="Gagal Memuat Lowongan"
          message={error}
          onRetry={fetchJobs}
        />
      ) : jobs.length === 0 ? (
        <EmptyState
          title="Belum ada lowongan ditemukan."
          description={
            search || statusFilter || categoryFilter
              ? 'Tidak ada lowongan yang sesuai dengan kriteria filter atau pencarian Anda.'
              : 'Perusahaan Anda belum menerbitkan lowongan pekerjaan. Mulai buat lowongan pertama Anda sekarang!'
          }
          actionLabel="Buat Lowongan Sekarang"
          onAction={() => navigate('/company/jobs/create')}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Menampilkan {jobs.length} lowongan pekerjaan
              {statusFilter && ` dengan status "${statusFilter}"`}
              {search && ` untuk pencarian "${search}"`}
            </span>
          </div>

          {/* Job Cards Grid */}
          <div className="grid grid-cols-1 gap-4">
            {jobs.map((job) => {
              const currentStatus = (job.status || 'draft').toLowerCase();
              const badge = statusConfig[currentStatus] || statusConfig.draft;
              const formattedSalary = (() => {
                if (job.salary_min && job.salary_max) {
                  return `${formatCurrency(job.salary_min)} - ${formatCurrency(job.salary_max)}`;
                }
                if (job.salary_min) return `Mulai ${formatCurrency(job.salary_min)}`;
                if (job.salary_max) return `Hingga ${formatCurrency(job.salary_max)}`;
                return 'Gaji dirahasiakan / Kompetitif';
              })();

              return (
                <div
                  key={job.id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:border-blue-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5 group"
                  data-testid={`company-job-card-${job.id}`}
                >
                  <div className="space-y-2.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${badge.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dot}`} />
                        {badge.label}
                      </span>
                      {job.category?.name && (
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                          {job.category.name}
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {employmentTypeLabels[job.employment_type] || job.employment_type}
                      </span>
                      <span className="text-slate-400 text-xs">
                        ID: #{job.id}
                      </span>
                    </div>

                    <Link
                      to={`/company/jobs/${job.id}`}
                      className="text-base sm:text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors block line-clamp-1"
                    >
                      {job.title}
                    </Link>

                    {/* Metadata chips */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formattedSalary}
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Deadline: {formatDate(job.deadline)}
                      </span>
                      <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50/70 px-2.5 py-0.5 rounded-md font-bold">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {job.applications_count ?? 0} Pelamar
                      </span>
                    </div>

                    {/* Required Skills tags */}
                    {job.skills && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {job.skills.map((skill) => (
                          <span
                            key={skill.id}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700"
                          >
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-wrap md:flex-col items-center md:items-end gap-2 shrink-0 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <Link
                        to={`/company/jobs/${job.id}`}
                        className="flex-1 md:flex-none text-center px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                      >
                        Detail
                      </Link>

                      <Link
                        to={`/company/jobs/${job.id}/edit`}
                        className="flex-1 md:flex-none text-center px-3.5 py-2 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        Edit
                      </Link>

                      {/* Toggle status button */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(job)}
                        disabled={updatingId === job.id}
                        className={`flex-1 md:flex-none text-center px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                          job.status === 'active'
                            ? 'text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white'
                            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white'
                        }`}
                      >
                        {updatingId === job.id
                          ? 'Memproses...'
                          : job.status === 'active'
                          ? 'Tutup'
                          : 'Aktifkan'}
                      </button>
                    </div>

                    {/* Delete button (only if no applicants) */}
                    {job.applications_count === 0 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteJob(job)}
                        disabled={updatingId === job.id}
                        className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors font-medium self-end"
                      >
                        Hapus Lowongan
                      </button>
                    )}
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

export default CompanyJobs;
