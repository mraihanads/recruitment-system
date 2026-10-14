import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import companyService from '../../services/companyService';
import LoadingScreen from '../../components/common/LoadingScreen';
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
    description: 'Lowongan ini sedang tayang aktif dan dapat dilihat serta dilamar oleh para kandidat.',
  },
  draft: {
    label: 'Draft',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    description: 'Lowongan ini masih berupa draf dan belum dipublikasikan ke publik.',
  },
  closed: {
    label: 'Ditutup (Closed)',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    description: 'Penerimaan lamaran untuk posisi ini telah resmi ditutup.',
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
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

const CompanyJobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [feedback, setFeedback] = useState({
    type: location.state?.successMessage ? 'success' : '',
    message: location.state?.successMessage || '',
  });

  const fetchJob = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await companyService.getJobDetail(id);
      if (res?.success && res.data) {
        setJob(res.data);
      } else {
        throw new Error(res?.message || 'Data lowongan tidak ditemukan.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat detail lowongan kerja.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleUpdateStatus = async (newStatus) => {
    const confirmMessage =
      newStatus === 'closed'
        ? `Tutup lowongan "${job.title}"? Kandidat tidak akan dapat mengirim lamaran baru.`
        : `Ubah status lowongan menjadi "${newStatus}"?`;

    if (!window.confirm(confirmMessage)) return;

    setUpdatingStatus(true);
    try {
      const res = await companyService.updateJobStatus(id, newStatus);
      setJob((prev) => ({ ...prev, status: newStatus }));
      setFeedback({
        type: 'success',
        message: res?.message || `Status lowongan berhasil diubah menjadi ${newStatus}.`,
      });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal mengubah status lowongan.',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (job.applications_count > 0) {
      alert(
        `Lowongan "${job.title}" sudah memiliki ${job.applications_count} pelamar. Lowongan tidak dapat dihapus, silakan tutup lowongan (Closed).`
      );
      return;
    }

    if (!window.confirm(`Hapus lowongan "${job.title}" secara permanen? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      await companyService.deleteJob(id);
      navigate('/company/jobs', {
        state: { successMessage: 'Lowongan kerja berhasil dihapus.' },
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal menghapus lowongan.',
      });
    }
  };

  if (loading) {
    return <LoadingScreen message="Memuat detail lowongan kerja..." />;
  }

  if (error || !job) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <ErrorState
          title="Lowongan Tidak Ditemukan"
          message={error || 'Lowongan pekerjaan tidak dapat diakses atau bukan milik akun Anda.'}
          onRetry={fetchJob}
        />
        <div className="mt-4 text-center">
          <Link to="/company/jobs" className="text-xs font-bold text-blue-600 hover:text-blue-700">
            &larr; Kembali ke Daftar Lowongan
          </Link>
        </div>
      </div>
    );
  }

  const currentStatus = (job.status || 'draft').toLowerCase();
  const statusBadge = statusConfig[currentStatus] || statusConfig.draft;
  const formattedSalary = (() => {
    if (job.salary_min && job.salary_max) {
      return `${formatCurrency(job.salary_min)} - ${formatCurrency(job.salary_max)}`;
    }
    if (job.salary_min) return `Mulai ${formatCurrency(job.salary_min)}`;
    if (job.salary_max) return `Hingga ${formatCurrency(job.salary_max)}`;
    return 'Gaji dirahasiakan / Negosiasi';
  })();

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation Breadcrumb & Back Link */}
      <div className="flex items-center justify-between">
        <Link
          to="/company/jobs"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Daftar Lowongan
        </Link>
      </div>

      {/* Global Feedback Banner */}
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

      {/* Top Banner Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="space-y-3 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-lg text-xs font-bold border ${statusBadge.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusBadge.dot}`} />
                {statusBadge.label}
              </span>
              {job.category?.name && (
                <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                  {job.category.name}
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                {employmentTypeLabels[job.employment_type] || job.employment_type}
              </span>
              <span className="text-slate-400 font-mono text-xs">
                ID: #{job.id}
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl font-black text-slate-900 leading-tight">
              {job.title}
            </h1>

            {/* Meta highlights */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {job.location}
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formattedSalary}
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Batas Lamaran: <strong>{formatDate(job.deadline)}</strong>
              </span>
            </div>
          </div>

          {/* Quick Actions Header */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
            <Link
              to={`/company/jobs/${job.id}/edit`}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs inline-flex items-center gap-2 transition-all"
              data-testid="edit-job-btn"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Lowongan
            </Link>

            {job.status === 'active' ? (
              <button
                type="button"
                onClick={() => handleUpdateStatus('closed')}
                disabled={updatingStatus}
                className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white font-bold text-xs border border-rose-200 transition-all inline-flex items-center gap-1.5"
                data-testid="close-job-btn"
              >
                Tutup Lowongan
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleUpdateStatus('active')}
                disabled={updatingStatus}
                className="px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white font-bold text-xs border border-emerald-200 transition-all inline-flex items-center gap-1.5"
                data-testid="activate-job-btn"
              >
                Aktifkan Lowongan
              </button>
            )}

            {job.applications_count === 0 && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 font-bold text-xs transition-colors"
                title="Hapus Lowongan"
              >
                Hapus
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid: 2 Kolom (Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Deskripsi, Persyaratan, Skill */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Deskripsi Pekerjaan */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2.5">
              <span className="w-2 h-5 rounded-full bg-blue-600" />
              Deskripsi Pekerjaan
            </h2>
            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {job.description || '-'}
            </div>
          </div>

          {/* Card: Persyaratan Kualifikasi */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2.5">
              <span className="w-2 h-5 rounded-full bg-indigo-600" />
              Persyaratan & Kualifikasi
            </h2>
            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {job.requirements || '-'}
            </div>
          </div>

          {/* Card: Kebutuhan Keahlian (Skills) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2.5">
              <span className="w-2 h-5 rounded-full bg-emerald-600" />
              Keahlian yang Disyaratkan (Skills)
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Kandidat yang melamar akan dicocokkan otomatis berdasarkan kepemilikan skill berikut:
            </p>

            {job.skills && job.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100"
                  >
                    ✓ {skill.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Tidak ada skill spesifik yang ditentukan.</p>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Status Pelamar & Rincian Administratif */}
        <div className="space-y-6">
          {/* Card: Jumlah Pelamar & Akses Review */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Ringkasan Pelamar
            </h3>

            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Total Pelamar Masuk:</span>
                <span className="text-2xl font-black text-blue-700">
                  {job.applications_count ?? 0}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Tinjau berkas CV, portofolio, dan nilai pencocokan keahlian kandidat yang telah melamar posisi ini.
              </p>

              <Link
                to={`/company/applicants?job_id=${job.id}`}
                className="w-full text-center block py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                data-testid="view-applicants-btn"
              >
                Lihat Daftar Pelamar &rarr;
              </Link>
            </div>
          </div>

          {/* Card: Status Tayang Info */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Status Publikasi
            </h3>

            <div className={`p-4 rounded-2xl border ${statusBadge.color} space-y-2`}>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${statusBadge.dot}`} />
                <span className="text-sm font-extrabold">{statusBadge.label}</span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">
                {statusBadge.description}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 text-xs space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Pendidikan Minimal:</span>
                <span className="font-semibold text-slate-800">{job.education || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dibuat Pada:</span>
                <span className="font-semibold text-slate-800">{formatDate(job.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyJobDetail;
