import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import candidateService from '../../services/candidateService';
import ApplyJobModal from '../../components/candidate/ApplyJobModal';
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

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [jobData, setJobData] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [candidateProfile, setCandidateProfile] = useState(null);

  const [isSaved, setIsSaved] = useState(false);
  const [savingAction, setSavingAction] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationInfo, setApplicationInfo] = useState(null);

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [detailRes, matchRes, profileRes] = await Promise.allSettled([
        candidateService.getJobDetail(id),
        candidateService.getJobMatch(id),
        candidateService.getProfile(),
      ]);

      if (detailRes.status === 'fulfilled' && detailRes.value?.success) {
        const data = detailRes.value.data;
        setJobData(data.job);
        setIsSaved(Boolean(data.is_saved));
        setHasApplied(Boolean(data.has_applied));
        setApplicationInfo(data.application || null);
      } else {
        throw new Error(detailRes.reason?.response?.data?.message || 'Gagal memuat lowongan.');
      }

      if (matchRes.status === 'fulfilled' && matchRes.value?.success) {
        setMatchData(matchRes.value.data);
      }

      if (profileRes.status === 'fulfilled' && profileRes.value?.success) {
        setCandidateProfile(profileRes.value.data);
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat detail lowongan kerja.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleToggleSave = async () => {
    if (savingAction) return;
    setSavingAction(true);
    const prevState = isSaved;
    setIsSaved(!prevState);

    try {
      if (prevState) {
        await candidateService.unsaveJob(id);
        setFeedbackMessage({
          type: 'info',
          text: 'Lowongan dihapus dari daftar tersimpan.',
        });
      } else {
        await candidateService.saveJob(id);
        setFeedbackMessage({
          type: 'success',
          text: 'Lowongan berhasil disimpan!',
        });
      }
    } catch (err) {
      setIsSaved(prevState);
      const msg = err.response?.data?.message || 'Gagal mengubah status simpan lowongan.';
      setFeedbackMessage({ type: 'error', text: msg });
    } finally {
      setSavingAction(false);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  const handleApplySuccess = (newApp) => {
    setIsApplyModalOpen(false);
    setHasApplied(true);
    setApplicationInfo(newApp);
    setFeedbackMessage({
      type: 'success',
      text: 'Lamaran Anda berhasil dikirimkan!',
    });
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  if (loading) {
    return <LoadingScreen message="Memuat detail lowongan kerja..." />;
  }

  if (error || !jobData) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <ErrorState
          title="Gagal Memuat Lowongan"
          message={error || 'Lowongan tidak ditemukan atau sudah tidak tersedia.'}
          onRetry={fetchData}
        />
        <div className="mt-4 text-center">
          <Link
            to="/candidate/jobs"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            &larr; Kembali ke Pencarian Lowongan
          </Link>
        </div>
      </div>
    );
  }

  const formattedSalary = (() => {
    if (jobData.salary_min && jobData.salary_max) {
      return `${formatCurrency(jobData.salary_min)} - ${formatCurrency(jobData.salary_max)}`;
    }
    if (jobData.salary_min) return `Mulai ${formatCurrency(jobData.salary_min)}`;
    if (jobData.salary_max) return `Hingga ${formatCurrency(jobData.salary_max)}`;
    return 'Gaji dirahasiakan / Kompetitif';
  })();

  const empType = employmentTypeLabels[jobData.employment_type] || jobData.employment_type || 'Full Time';
  const isDeadlinePassed = jobData.deadline ? new Date(jobData.deadline) < new Date(new Date().setHours(0, 0, 0, 0)) : false;
  const isClosed = jobData.status !== 'active' || isDeadlinePassed;

  const matchPercentage = matchData?.match_percentage ?? 0;
  const requiredSkills = matchData?.required_skills || (jobData.skills || []).map(s => ({ ...s, matched: false }));
  const matchedSkills = requiredSkills.filter(s => s.matched);
  const missingSkills = requiredSkills.filter(s => !s.matched);

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/candidate/jobs"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Daftar Lowongan
        </Link>
      </div>

      {/* Floating Notification */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border shadow-xs animate-in fade-in duration-200 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : feedbackMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-600 ml-3"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5 min-w-0">
            {jobData.company?.logo ? (
              <img
                src={jobData.company.logo}
                alt={jobData.company.company_name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-100 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center text-2xl shrink-0 border border-blue-100">
                {jobData.company?.company_name ? jobData.company.company_name[0].toUpperCase() : 'C'}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold text-slate-500">
                  {jobData.company?.company_name || 'Perusahaan'}
                </span>
                {jobData.category?.name && (
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                    {jobData.category.name}
                  </span>
                )}
                {isClosed && (
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-700">
                    Lowongan Ditutup
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                {jobData.title}
              </h1>

              {/* Key Highlights */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{jobData.location || 'Indonesia'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{empType}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{formattedSalary}</span>
                </div>
                {jobData.education && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                    <span>Min. {jobData.education}</span>
                  </div>
                )}
                {jobData.deadline && (
                  <div className="flex items-center gap-1.5 text-rose-600 font-medium">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Batas: {formatDate(jobData.deadline)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Button Strip */}
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            {/* Save / Unsave Button */}
            <button
              type="button"
              onClick={handleToggleSave}
              disabled={savingAction}
              className={`p-3 rounded-2xl border transition-all flex items-center justify-center shrink-0 ${
                isSaved
                  ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'
              }`}
              title={isSaved ? 'Hapus Simpanan' : 'Simpan Lowongan'}
              data-testid="jobdetail-save-btn"
            >
              <svg
                className={`w-5 h-5 ${isSaved ? 'fill-current' : 'none'}`}
                fill={isSaved ? 'currentColor' : 'none'}
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>

            {/* Apply Button */}
            {hasApplied ? (
              <button
                type="button"
                disabled
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-2 cursor-default"
                data-testid="jobdetail-applied-badge"
              >
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Sudah Melamar
              </button>
            ) : isClosed ? (
              <button
                type="button"
                disabled
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-100 text-slate-400 font-bold text-xs cursor-not-allowed"
              >
                Lowongan Ditutup
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                data-testid="jobdetail-apply-btn"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Lamar Sekarang (Apply Now)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid: 2 Kolom (Desktop) / 1 Kolom (Mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri / Utama: Deskripsi & Persyaratan */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deskripsi Pekerjaan */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2.5">
              <span className="w-2 h-5 rounded-full bg-blue-600"></span>
              Deskripsi Pekerjaan
            </h2>
            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {jobData.description || 'Tidak ada deskripsi rinci untuk posisi ini.'}
            </div>
          </div>

          {/* Persyaratan & Kualifikasi */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2.5">
              <span className="w-2 h-5 rounded-full bg-blue-600"></span>
              Kualifikasi & Persyaratan
            </h2>
            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {jobData.requirements || 'Tidak ada persyaratan khusus.'}
            </div>
          </div>

          {/* Profil Perusahaan */}
          {jobData.company && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2.5">
                <span className="w-2 h-5 rounded-full bg-slate-400"></span>
                Tentang {jobData.company.company_name}
              </h2>
              {jobData.company.description && (
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  {jobData.company.description}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                {jobData.company.address && (
                  <div>
                    <span className="font-bold text-slate-700 block">Alamat Perusahaan:</span>
                    <span>{jobData.company.address}</span>
                  </div>
                )}
                {jobData.company.website && (
                  <div>
                    <span className="font-bold text-slate-700 block">Website:</span>
                    <a
                      href={jobData.company.website.startsWith('http') ? jobData.company.website : `https://${jobData.company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {jobData.company.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Kolom Kanan: Skill Matching & Status Lamaran */}
        <div className="space-y-6">
          {/* Card: Skill Matching Breakdown (Requirement 9) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs" data-testid="skill-matching-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Skill Matching
              </h3>
              <span
                className={`text-sm font-extrabold ${
                  matchPercentage >= 75
                    ? 'text-emerald-600'
                    : matchPercentage >= 50
                    ? 'text-amber-600'
                    : 'text-slate-600'
                }`}
                data-testid="skill-match-percentage"
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

            <p className="text-[11px] text-slate-500 mb-5 leading-relaxed">
              Persentase kecocokan dihitung secara otomatis berdasarkan keahlian di profil Anda dengan keahlian yang dicari pada lowongan ini.
            </p>

            {/* Matched Skills */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Matched Skills ({matchedSkills.length})
                  </span>
                </div>
                {matchedSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {matchedSkills.map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                      >
                        <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {s.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Belum ada keahlian yang cocok.</p>
                )}
              </div>

              {/* Missing Skills */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                    Missing Skills ({missingSkills.length})
                  </span>
                </div>
                {missingSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {missingSkills.map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200"
                      >
                        <svg className="w-3.5 h-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {s.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-emerald-600 font-medium">
                    Semua keahlian yang dibutuhkan terpenuhi!
                  </p>
                )}
              </div>
            </div>

            {/* Profile Skill Upgrade prompt */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <Link
                to="/candidate/profile/skills"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                Kelola Keterampilan Profil Saya &rarr;
              </Link>
            </div>
          </div>

          {/* Card: Status Lamaran jika sudah melamar */}
          {hasApplied && applicationInfo && (
            <div className="bg-emerald-50/60 rounded-3xl border border-emerald-200 p-6 shadow-xs">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">Lamaran Terkirim</h4>
                  <p className="text-[11px] text-emerald-700">
                    Status: <span className="font-bold uppercase">{applicationInfo.status}</span>
                  </p>
                </div>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed mb-4">
                Anda sudah mengajukan lamaran untuk posisi ini. Perusahaan akan mereview resume dan kecocokan profil Anda.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {applicationInfo.id && (
                  <Link
                    to={`/candidate/applications/${applicationInfo.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    Buka Detail Lamaran &rarr;
                  </Link>
                )}
                <Link
                  to="/candidate/applications"
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-900 underline"
                >
                  Riwayat Lamaran Saya
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      <ApplyJobModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        job={jobData}
        matchData={matchData}
        candidateProfile={candidateProfile}
        onApplySuccess={handleApplySuccess}
      />
    </div>
  );
};

export default JobDetail;
