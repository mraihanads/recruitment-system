import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import candidateService from '../../services/candidateService';
import ApplicationStatusBadge, { statusConfig } from '../../components/candidate/ApplicationStatusBadge';
import ApplicationTimeline from '../../components/candidate/ApplicationTimeline';
import LoadingScreen from '../../components/common/LoadingScreen';
import ErrorState from '../../components/common/ErrorState';

const employmentTypeLabels = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  internship: 'Internship',
  freelance: 'Freelance',
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

const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchDetail = async () => {
    setLoading(true);
    setErrorStatus(null);
    setErrorMessage('');
    try {
      const res = await candidateService.getApplicationDetail(id);
      if (res?.success && res.data) {
        setApplication(res.data);

        // Fetch skill matching breakdown for this job
        if (res.data.job_id) {
          try {
            const matchRes = await candidateService.getJobMatch(res.data.job_id);
            if (matchRes?.success) {
              setMatchData(matchRes.data);
            }
          } catch (e) {
            // Non-blocking match breakdown
          }
        }
      } else {
        throw new Error(res?.message || 'Gagal memuat detail lamaran.');
      }
    } catch (err) {
      const status = err.response?.status;
      setErrorStatus(status);
      if (status === 403) {
        setErrorMessage('Akses ke lamaran ini tidak diizinkan.');
      } else if (status === 404) {
        setErrorMessage('Lamaran tidak ditemukan.');
      } else if (status === 401) {
        setErrorMessage('Sesi Anda telah berakhir. Silakan login kembali.');
      } else {
        setErrorMessage('Gagal memuat data lamaran.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (loading) {
    return <LoadingScreen message="Memuat detail lamaran kerja..." />;
  }

  if (errorStatus || !application) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <ErrorState
          title={
            errorStatus === 403
              ? 'Akses Ditolak'
              : errorStatus === 404
              ? 'Lamaran Tidak Ditemukan'
              : 'Gagal Memuat Lamaran'
          }
          message={errorMessage}
          onRetry={errorStatus === 403 || errorStatus === 404 ? undefined : fetchDetail}
        />
        <div className="mt-4 text-center">
          <Link
            to="/candidate/applications"
            className="text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            &larr; Kembali ke Riwayat Lamaran
          </Link>
        </div>
      </div>
    );
  }

  const job = application.job_vacancy || application.jobVacancy || {};
  const company = job.company || {};
  const currentStatus = (application.status || 'submitted').toLowerCase();
  const statusInfo = statusConfig[currentStatus] || {
    label: application.status,
    message: 'Status dalam proses.',
  };

  const matchPercentage = Math.round(application.match_percentage ?? matchData?.match_percentage ?? 0);
  const requiredSkills = matchData?.required_skills || (job.skills || []).map((s) => ({ ...s, matched: false }));
  const matchedSkills = requiredSkills.filter((s) => s.matched);
  const missingSkills = requiredSkills.filter((s) => !s.matched);

  const formattedSalary = (() => {
    if (job.salary_min && job.salary_max) {
      return `${formatCurrency(job.salary_min)} - ${formatCurrency(job.salary_max)}`;
    }
    if (job.salary_min) return `Mulai ${formatCurrency(job.salary_min)}`;
    if (job.salary_max) return `Hingga ${formatCurrency(job.salary_max)}`;
    return null;
  })();

  const empType = employmentTypeLabels[job.employment_type] || job.employment_type || 'Full Time';

  // Resolve CV file URL
  const cvUrl = (() => {
    if (!application.cv_file) return null;
    if (application.cv_file.startsWith('http://') || application.cv_file.startsWith('https://')) {
      return application.cv_file;
    }
    const cleanPath = application.cv_file.replace(/^public\//, '');
    return `http://127.0.0.1:8000/storage/${cleanPath}`;
  })();

  const interviews = application.interviews || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/candidate/applications"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Riwayat Lamaran
        </Link>

        {job.id && (
          <Link
            to={`/candidate/jobs/${job.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white transition-all shadow-2xs"
          >
            Lihat Lowongan Pekerjaan &rarr;
          </Link>
        )}
      </div>

      {/* Main Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5 min-w-0">
            {company.logo ? (
              <img
                src={company.logo}
                alt={company.company_name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-100 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center text-2xl shrink-0 border border-blue-100">
                {company.company_name ? company.company_name[0].toUpperCase() : 'C'}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold text-slate-500">
                  {company.company_name || 'Perusahaan'}
                </span>
                {job.category?.name && (
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                    {job.category.name}
                  </span>
                )}
                <span className="text-[11px] font-mono text-slate-400">
                  ID: #{application.id}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                {job.title || 'Detail Lamaran'}
              </h1>

              {/* Highlights */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{job.location || 'Indonesia'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{empType}</span>
                </div>
                {formattedSalary && (
                  <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{formattedSalary}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Melamar: {formatDate(application.applied_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Current Status Badge in Header */}
          <div className="shrink-0">
            <ApplicationStatusBadge status={application.status} size="lg" />
          </div>
        </div>
      </div>

      {/* Grid: 2 Kolom (Desktop) / 1 Kolom (Mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri / Utama: Detail Info, Cover Letter, Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Job Details Overview */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2.5">
              <span className="w-2 h-5 rounded-full bg-blue-600"></span>
              Informasi Lowongan Pekerjaan
            </h2>

            <div className="space-y-4 text-xs sm:text-sm text-slate-600">
              {job.description && (
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">Deskripsi Posisi</h3>
                  <p className="whitespace-pre-line leading-relaxed text-slate-600">
                    {job.description}
                  </p>
                </div>
              )}

              {job.requirements && (
                <div className="pt-3 border-t border-slate-100">
                  <h3 className="font-bold text-slate-800 mb-1">Persyaratan Kualifikasi</h3>
                  <p className="whitespace-pre-line leading-relaxed text-slate-600">
                    {job.requirements}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Pendidikan Minimal</span>
                  <span className="font-semibold text-slate-700">{job.education || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Batas Akhir Lamaran</span>
                  <span className="font-semibold text-slate-700">{formatDate(job.deadline)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Status Lowongan</span>
                  <span className="font-semibold capitalize text-slate-700">{job.status || 'Active'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Cover Letter (Requirement 11) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2.5">
              <span className="w-2 h-5 rounded-full bg-indigo-600"></span>
              Surat Lamaran (Cover Letter)
            </h2>
            {application.cover_letter ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {application.cover_letter}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Cover letter tidak disertakan saat pengiriman lamaran.
              </p>
            )}
          </div>

          {/* Card 3: Status Timeline (Requirement 8) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
                <span className="w-2 h-5 rounded-full bg-emerald-600"></span>
                Riwayat & Timeline Status Lamaran
              </h2>
              <span className="text-xs text-slate-400">
                {application.status_histories?.length || application.statusHistories?.length || 0} tahapan
              </span>
            </div>

            <ApplicationTimeline
              histories={application.status_histories || application.statusHistories || []}
              currentStatus={application.status}
            />
          </div>
        </div>

        {/* Kolom Kanan / Sidebar: Status Card, Skill Match, Interview Info, CV */}
        <div className="space-y-6">
          {/* 1. Status Card (Requirement 12) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs" data-testid="status-summary-card">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Status Lamaran Saat Ini
            </h3>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-full ${statusInfo.dot || 'bg-blue-500'}`}></span>
                <span className="text-base font-extrabold capitalize text-slate-900">
                  {statusInfo.label}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-600 leading-relaxed">
                {statusInfo.message}
              </p>
            </div>
          </div>

          {/* 2. Skill Match Card (Requirement 7) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs" data-testid="application-skill-match">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Skill Match
              </h3>
              <span
                className={`text-sm font-extrabold ${
                  matchPercentage >= 75
                    ? 'text-emerald-600'
                    : matchPercentage >= 50
                    ? 'text-amber-600'
                    : 'text-slate-600'
                }`}
              >
                {matchPercentage}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden p-0.5 border border-slate-200/60">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  matchPercentage >= 75
                    ? 'bg-emerald-500'
                    : matchPercentage >= 50
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(matchPercentage, 100)}%` }}
              />
            </div>

            {/* Matched Skills */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <span className="text-xs font-bold text-emerald-700 block mb-1.5">
                  Matched Skills ({matchedSkills.length})
                </span>
                {matchedSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {matchedSkills.map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                      >
                        ✓ {s.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Tidak ada keahlian cocok.</p>
                )}
              </div>

              {/* Missing Skills */}
              {missingSkills.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-slate-600 block mb-1.5">
                    Missing Skills ({missingSkills.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {missingSkills.map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200"
                      >
                        ✕ {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Interview Information Card (Requirement 9) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs" data-testid="interview-card">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Jadwal Wawancara (Interview)
            </h3>

            {interviews && interviews.length > 0 ? (
              <div className="space-y-4">
                {interviews.map((iv) => (
                  <div key={iv.id} className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-900 capitalize">
                        Metode: {iv.method || 'Online'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-white text-purple-700 border border-purple-200 uppercase">
                        {iv.status || 'scheduled'}
                      </span>
                    </div>

                    <div className="text-slate-600 space-y-1 pt-1">
                      <div>
                        <span className="font-medium text-slate-500">Tanggal:</span>{' '}
                        <span className="font-bold text-slate-800">{formatDate(iv.interview_date)}</span>
                      </div>
                      {iv.interview_time && (
                        <div>
                          <span className="font-medium text-slate-500">Waktu:</span>{' '}
                          <span className="font-bold text-slate-800">{iv.interview_time} WIB</span>
                        </div>
                      )}
                      {iv.location && (
                        <div>
                          <span className="font-medium text-slate-500">Lokasi:</span>{' '}
                          <span className="text-slate-800">{iv.location}</span>
                        </div>
                      )}
                      {iv.meeting_link && (
                        <div className="pt-1">
                          <a
                            href={iv.meeting_link.startsWith('http') ? iv.meeting_link : `https://${iv.meeting_link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-purple-700 hover:text-purple-800 underline"
                          >
                            🔗 Buka Link Pertemuan
                          </a>
                        </div>
                      )}
                      {iv.notes && (
                        <p className="mt-2 pt-2 border-t border-purple-200/60 text-slate-600 italic">
                          Catatan: {iv.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Belum ada jadwal interview yang dijadwalkan oleh perusahaan.
              </p>
            )}
          </div>

          {/* 4. CV Document Card (Requirement 10) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs" data-testid="cv-document-card">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CV yang Digunakan Saat Melamar
            </h3>

            {cvUrl ? (
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {application.cv_file.split('/').pop()}
                    </p>
                    <p className="text-[11px] text-emerald-700">Resume Pelamar</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-2 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                  >
                    Lihat CV
                  </a>
                  <a
                    href={cvUrl}
                    download
                    className="flex-1 text-center py-2 px-3 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-emerald-700 border border-emerald-300 transition-colors"
                  >
                    Download CV
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                CV tidak tersedia untuk lamaran ini.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetail;
