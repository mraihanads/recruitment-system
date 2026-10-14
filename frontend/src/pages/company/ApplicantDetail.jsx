import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import companyService from '../../services/companyService';
import LoadingScreen from '../../components/common/LoadingScreen';
import ErrorState from '../../components/common/ErrorState';

const statusConfig = {
  submitted: {
    label: 'Submitted',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    description: 'Lamaran baru saja dikirim oleh kandidat.',
  },
  screening: {
    label: 'Screening',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    description: 'Berkas dan kualifikasi kandidat sedang dalam tahap peninjauan awal.',
  },
  interview: {
    label: 'Interview',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
    description: 'Kandidat masuk ke tahapan wawancara.',
  },
  test: {
    label: 'Test',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
    description: 'Kandidat sedang menjalani tes teknis atau psikotes.',
  },
  accepted: {
    label: 'Accepted',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    description: 'Kandidat resmi diterima untuk posisi ini.',
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    description: 'Lamaran kandidat belum memenuhi kualifikasi untuk posisi ini.',
  },
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

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return d.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

const resolveMediaUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const clean = path.replace(/^public\//, '');
  return `http://127.0.0.1:8000/storage/${clean}`;
};

const ApplicantDetail = () => {
  const { id } = useParams();

  const [detailData, setDetailData] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status Update Modal State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('screening');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Schedule Interview Modal State (STEP 15D)
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    interview_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    interview_time: '10:00',
    method: 'online',
    meeting_link: '',
    location: '',
    notes: '',
  });
  const [scheduleErrors, setScheduleErrors] = useState({});

  // Recruiter Note Input State
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [appRes, matchRes, notesRes] = await Promise.all([
        companyService.getApplicantDetail(id),
        companyService.getApplicantMatch(id).catch(() => ({ data: null })),
        companyService.getApplicationNotes(id).catch(() => ({ data: [] })),
      ]);

      if (appRes?.success && appRes.data) {
        setDetailData(appRes.data);
        setNewStatus(appRes.data.application.status || 'screening');
      } else {
        throw new Error(appRes?.message || 'Data pelamar tidak ditemukan.');
      }

      if (matchRes?.data) setMatchData(matchRes.data);
      if (notesRes?.data) setNotes(notesRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat rincian pelamar kerja.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setUpdatingStatus(true);
    try {
      const res = await companyService.updateApplicationStatus(
        id,
        newStatus,
        statusNote.trim() || null
      );
      setFeedback({
        type: 'success',
        message: res?.message || `Status berhasil diubah menjadi ${newStatus}.`,
      });
      setShowStatusModal(false);
      setStatusNote('');
      fetchAllData();
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal mengubah status pelamar.',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setAddingNote(true);
    try {
      const res = await companyService.addApplicationNote(id, newNote.trim());
      if (res?.data) {
        setNotes((prev) => [res.data, ...prev]);
        setNewNote('');
        setFeedback({ type: 'success', message: 'Catatan internal berhasil ditambahkan.' });
        setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal menambahkan catatan.',
      });
    } finally {
      setAddingNote(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!scheduleForm.interview_date) errs.interview_date = 'Tanggal wawancara wajib diisi.';
    if (!scheduleForm.interview_time) errs.interview_time = 'Waktu wawancara wajib diisi.';
    if (scheduleForm.method === 'online') {
      if (!scheduleForm.meeting_link) errs.meeting_link = 'Tautan meeting online (URL) wajib diisi.';
      else if (!/^https?:\/\/.+/i.test(scheduleForm.meeting_link)) {
        errs.meeting_link = 'Format tautan meeting harus diawali http:// atau https://';
      }
    }
    if (scheduleForm.method === 'offline' && !scheduleForm.location?.trim()) {
      errs.location = 'Alamat/lokasi wawancara tatap muka wajib diisi.';
    }
    if (Object.keys(errs).length > 0) {
      setScheduleErrors(errs);
      return;
    }

    setScheduling(true);
    try {
      const payload = {
        interview_date: scheduleForm.interview_date,
        interview_time: scheduleForm.interview_time,
        method: scheduleForm.method,
        notes: scheduleForm.notes || null,
        meeting_link: scheduleForm.method === 'online' ? scheduleForm.meeting_link : null,
        location: scheduleForm.method === 'offline' ? scheduleForm.location : null,
      };
      await companyService.createInterview(id, payload);
      setFeedback({
        type: 'success',
        message: 'Jadwal wawancara berhasil dibuat dan notifikasi telah dikirimkan ke kandidat.',
      });
      setShowScheduleModal(false);
      fetchAllData();
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal menjadwalkan wawancara.',
      });
    } finally {
      setScheduling(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Memuat profil dan berkas pelamar..." />;
  }

  if (error || !detailData) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <ErrorState
          title="Gagal Memuat Pelamar"
          message={error || 'Data pelamar tidak dapat diakses atau bukan milik lowongan perusahaan Anda.'}
          onRetry={fetchAllData}
        />
        <div className="mt-4 text-center">
          <Link to="/company/applicants" className="text-xs font-bold text-blue-600 hover:text-blue-700">
            &larr; Kembali ke Daftar Pelamar
          </Link>
        </div>
      </div>
    );
  }

  const { application, job, candidate } = detailData;
  const currentStatus = (application.status || 'submitted').toLowerCase();
  const statusBadge = statusConfig[currentStatus] || statusConfig.submitted;
  const matchPercentage = Math.round(application.match_percentage ?? matchData?.match_percentage ?? 0);
  const cvUrl = application.cv_url || resolveMediaUrl(application.cv_file);
  const photoUrl = candidate?.photo_url || resolveMediaUrl(candidate?.photo);

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/company/applicants"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Daftar Pelamar
        </Link>

        {job.id && (
          <Link
            to={`/company/jobs/${job.id}`}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            Lihat Lowongan: {job.title} &rarr;
          </Link>
        )}
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

      {/* Main Header Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5 min-w-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={candidate?.full_name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-slate-100 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-xs shrink-0">
                {candidate?.full_name ? candidate.full_name[0].toUpperCase() : 'K'}
              </div>
            )}

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-lg text-xs font-bold border ${statusBadge.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusBadge.dot}`} />
                  {statusBadge.label}
                </span>
                <span className="text-slate-400 text-xs font-mono">
                  ID Lamaran: #{application.id}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {candidate?.full_name || 'Kandidat Pelamar'}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                {candidate?.phone && (
                  <span className="flex items-center gap-1">
                    📞 {candidate.phone}
                  </span>
                )}
                {candidate?.gender && (
                  <span className="capitalize">
                    Gender: {candidate.gender === 'male' ? 'Laki-laki' : candidate.gender === 'female' ? 'Perempuan' : candidate.gender}
                  </span>
                )}
                <span>Melamar: {formatDate(application.applied_at)}</span>
              </div>
            </div>
          </div>

          {/* Actions: Schedule Interview & Ubah Status Buttons */}
          <div className="shrink-0 w-full md:w-auto flex flex-wrap md:flex-nowrap items-center gap-2.5">
            {['submitted', 'screening', 'interview'].includes(application.status) && (
              <button
                type="button"
                onClick={() => setShowScheduleModal(true)}
                className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-all inline-flex items-center justify-center gap-2"
                data-testid="schedule-interview-applicant-btn"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Schedule Interview
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowStatusModal(true)}
              className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all inline-flex items-center justify-center gap-2"
              data-testid="update-status-modal-btn"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Ubah Status Lamaran
            </button>
          </div>
        </div>
      </div>

      {/* Grid: 2 Kolom (Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Profile, Skills, Education, Experience, Portfolio */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Biodata & Profil Singkat */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2.5">
              <span className="w-2 h-5 rounded-full bg-blue-600" />
              Biodata & Alamat Kandidat
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-700 pb-4 border-b border-slate-100">
              <div>
                <span className="text-slate-400 block text-xs font-medium mb-0.5">Nama Lengkap</span>
                <span className="font-bold text-slate-900">{candidate?.full_name || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs font-medium mb-0.5">Nomor Telepon</span>
                <span className="font-semibold text-slate-800">{candidate?.phone || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs font-medium mb-0.5">Jenis Kelamin</span>
                <span className="capitalize font-semibold text-slate-800">
                  {candidate?.gender === 'male' ? 'Laki-laki' : candidate?.gender === 'female' ? 'Perempuan' : candidate?.gender || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs font-medium mb-0.5">Tanggal Lahir</span>
                <span className="font-semibold text-slate-800">{formatDate(candidate?.birth_date)}</span>
              </div>
            </div>

            <div className="pt-4 space-y-3 text-xs sm:text-sm">
              <div>
                <span className="text-slate-400 block text-xs font-medium mb-1">Alamat Tinggal</span>
                <p className="text-slate-700 leading-relaxed">
                  {candidate?.address || <span className="text-slate-400 italic">Alamat belum diisi.</span>}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block text-xs font-medium mb-1">Tentang Kandidat (Bio)</span>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {candidate?.bio || <span className="text-slate-400 italic">Bio kandidat belum diisi.</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Skill Matching Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2.5">
              <span className="w-2 h-5 rounded-full bg-emerald-600" />
              Pencocokan Keahlian (Skill Matching)
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Komparasi keahlian yang dimiliki kandidat terhadap persyaratan posisi <strong>{job.title}</strong>.
            </p>

            {/* Match percentage display */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Tingkat Kecocokan:</span>
                <span
                  className={`text-sm font-extrabold px-2.5 py-0.5 rounded-lg ${
                    matchPercentage >= 75
                      ? 'bg-emerald-100 text-emerald-700'
                      : matchPercentage >= 50
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {matchPercentage}% Match Kandidat
                </span>
              </div>

              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
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
            </div>

            {/* Matched Skills vs Missing Skills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                <span className="text-xs font-bold text-emerald-800 block">
                  ✓ Matched Skills ({matchData?.matched_skills?.length || 0})
                </span>
                {matchData?.matched_skills && matchData.matched_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {matchData.matched_skills.map((name, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Tidak ada keahlian cocok.</p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/40 border border-rose-100 space-y-2">
                <span className="text-xs font-bold text-rose-800 block">
                  ✕ Missing Skills ({matchData?.missing_skills?.length || 0})
                </span>
                {matchData?.missing_skills && matchData.missing_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {matchData.missing_skills.map((name, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-100/70 text-rose-800"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Seluruh kebutuhan skill terpenuhi.</p>
                )}
              </div>
            </div>

            {/* All candidate skills */}
            <div className="pt-4 mt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-600 block mb-2">
                Seluruh Skill Kandidat:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {candidate?.skills && candidate.skills.length > 0 ? (
                  candidate.skills.map((s) => (
                    <span
                      key={s.id}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700"
                    >
                      {s.name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">Kandidat belum menambahkan skill.</span>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Riwayat Pendidikan (Education) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2.5">
              <span className="w-2 h-5 rounded-full bg-indigo-600" />
              Riwayat Pendidikan (Education)
            </h2>

            {candidate?.educations && candidate.educations.length > 0 ? (
              <div className="space-y-4">
                {candidate.educations.map((edu) => (
                  <div key={edu.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 text-sm">{edu.institution}</span>
                      <span className="text-slate-500 font-semibold">
                        {edu.start_year} - {edu.end_year || 'Sekarang'}
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 font-semibold">
                      {edu.degree} • {edu.field_of_study}
                    </p>
                    {edu.description && (
                      <p className="text-xs text-slate-600 pt-1 leading-relaxed">{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Belum ada riwayat pendidikan yang dicantumkan.</p>
            )}
          </div>

          {/* Card 4: Pengalaman Kerja (Experience) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2.5">
              <span className="w-2 h-5 rounded-full bg-amber-600" />
              Pengalaman Kerja (Experience)
            </h2>

            {candidate?.experiences && candidate.experiences.length > 0 ? (
              <div className="space-y-4">
                {candidate.experiences.map((exp) => (
                  <div key={exp.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 text-sm">{exp.position}</span>
                      <span className="text-slate-500 font-semibold">
                        {formatDate(exp.start_date)} - {exp.end_date ? formatDate(exp.end_date) : 'Sekarang'}
                      </span>
                    </div>
                    <p className="text-xs text-amber-700 font-semibold">{exp.company_name}</p>
                    {exp.description && (
                      <p className="text-xs text-slate-600 pt-1 leading-relaxed whitespace-pre-line">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Belum ada pengalaman kerja yang dicantumkan.</p>
            )}
          </div>

          {/* Card 5: Portofolio Proyek */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2.5">
              <span className="w-2 h-5 rounded-full bg-purple-600" />
              Portofolio Proyek
            </h2>

            {candidate?.portfolios && candidate.portfolios.length > 0 ? (
              <div className="space-y-4">
                {candidate.portfolios.map((port) => {
                  const portImg = port.image_url || resolveMediaUrl(port.image);
                  return (
                    <div key={port.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h3 className="font-bold text-slate-900 text-sm">{port.title}</h3>
                          {port.project_url && (
                            <a
                              href={port.project_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline font-semibold block break-all"
                            >
                              🔗 {port.project_url}
                            </a>
                          )}
                        </div>
                        {portImg && (
                          <img
                            src={portImg}
                            alt={port.title}
                            className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        )}
                      </div>
                      {port.description && (
                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                          {port.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Belum ada portofolio proyek yang dicantumkan.</p>
            )}
          </div>
        </div>

        {/* Kolom Kanan / Sidebar: Sesi Interview, Berkas CV, Cover Letter, Status History & Notes */}
        <div className="space-y-6">
          {/* Card: Sesi Wawancara (Interviews) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4" data-testid="applicant-interviews-card">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Jadwal Wawancara ({application.interviews?.length || 0})
              </h3>
              <button
                type="button"
                onClick={() => setShowScheduleModal(true)}
                className="text-xs font-bold text-purple-600 hover:text-purple-800 inline-flex items-center gap-1"
                data-testid="add-interview-link-btn"
              >
                + Jadwalkan
              </button>
            </div>

            {application.interviews && application.interviews.length > 0 ? (
              <div className="space-y-3">
                {application.interviews.map((iv) => (
                  <div
                    key={iv.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs"
                    data-testid={`applicant-interview-item-${iv.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {formatDate(iv.interview_date)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          iv.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : iv.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {iv.status}
                      </span>
                    </div>

                    <div className="text-slate-600 flex items-center justify-between">
                      <span>⏰ {iv.interview_time ? iv.interview_time.substring(0, 5) + ' WIB' : '-'}</span>
                      <span className="font-semibold">{iv.method === 'online' ? '🌐 Online' : '🏢 Offline'}</span>
                    </div>

                    {iv.meeting_link && (
                      <div className="truncate text-blue-600 font-semibold pt-1 border-t border-slate-200/60">
                        <a href={iv.meeting_link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          🔗 Link Meeting Room ↗
                        </a>
                      </div>
                    )}
                    {iv.location && (
                      <p className="text-slate-500 pt-1 border-t border-slate-200/60 truncate">
                        📍 {iv.location}
                      </p>
                    )}

                    <div className="pt-1.5 flex justify-end">
                      <Link
                        to={`/company/interviews/${iv.id}`}
                        className="text-[11px] font-bold text-blue-600 hover:underline"
                      >
                        Detail & Kelola Wawancara →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-slate-400 italic">Belum ada sesi wawancara yang dijadwalkan.</p>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(true)}
                  className="mt-2 text-xs font-bold text-purple-600 hover:underline inline-block"
                >
                  Jadwalkan Wawancara Sekarang
                </button>
              </div>
            )}
          </div>

          {/* Berkas CV & Cover Letter */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Dokumen Lamaran
            </h3>

            {/* CV Button */}
            {cvUrl ? (
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    CV
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {application.cv_file ? application.cv_file.split('/').pop() : 'Resume Kandidat'}
                    </p>
                    <p className="text-[11px] text-blue-700">Berkas Curriculum Vitae</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a
                    href={cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-2 px-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                  >
                    Lihat CV
                  </a>
                  <a
                    href={cvUrl}
                    download
                    className="flex-1 text-center py-2 px-3 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-blue-700 border border-blue-200 transition-colors"
                  >
                    Download CV
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Berkas CV tidak disertakan.</p>
            )}

            {/* Cover Letter */}
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-700 block mb-1.5">
                Surat Lamaran (Cover Letter):
              </span>
              {application.cover_letter ? (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {application.cover_letter}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Kandidat tidak menyertakan cover letter.</p>
              )}
            </div>
          </div>

          {/* Timeline Status History */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Riwayat Perubahan Status (Timeline)
            </h3>

            {application.status_histories && application.status_histories.length > 0 ? (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {application.status_histories.map((hist, index) => {
                  const badge = statusConfig[hist.status] || statusConfig.submitted;
                  return (
                    <div key={hist.id || index} className="relative">
                      {/* Dot */}
                      <span className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 border-white ${badge.dot}`} />
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {formatDateTime(hist.created_at)}
                          </span>
                        </div>
                        {hist.note && (
                          <p className="text-xs text-slate-600 leading-relaxed pt-1">
                            {hist.note}
                          </p>
                        )}
                        {hist.changer?.name && (
                          <p className="text-[10px] text-slate-400">
                            Oleh: {hist.changer.name}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Belum ada catatan riwayat status.</p>
            )}
          </div>

          {/* Internal Recruiter Notes */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Catatan Internal Recruiter
            </h3>

            {/* Add note form */}
            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Tambahkan catatan evaluasi interview atau review berkas..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                required
              />
              <button
                type="submit"
                disabled={addingNote || !newNote.trim()}
                className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
              >
                {addingNote ? 'Menyimpan Catatan...' : '+ Tambah Catatan'}
              </button>
            </form>

            {/* Notes list */}
            {notes.length > 0 ? (
              <div className="space-y-3 pt-2">
                {notes.map((n) => (
                  <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <p className="text-slate-800 leading-relaxed">{n.note}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                      <span>{n.user?.name || 'Recruiter'}</span>
                      <span>{formatDateTime(n.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Belum ada catatan internal untuk kandidat ini.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Update Status Lamaran */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Ubah Status Lamaran Kandidat
              </h3>
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4" data-testid="update-status-form">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Tahapan Status Baru <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                  data-testid="status-select-input"
                >
                  <option value="submitted">Submitted</option>
                  <option value="screening">Screening</option>
                  <option value="interview">Interview</option>
                  <option value="test">Test</option>
                  <option value="accepted">Accepted (Diterima)</option>
                  <option value="rejected">Rejected (Ditolak)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Progres (Opsional)
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Contoh: Berkas memenuhi syarat, dijadwalkan wawancara..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  data-testid="status-note-input"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Catatan ini akan tersimpan dalam riwayat linimasa (timeline) status pelamar.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  disabled={updatingStatus}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                  data-testid="save-status-btn"
                >
                  {updatingStatus ? 'Menyimpan...' : 'Perbarui Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: SCHEDULE INTERVIEW (STEP 15D)
          ======================================================== */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="text-lg font-black text-slate-900">Jadwalkan Interview</h3>
                <p className="text-xs text-slate-500">
                  Untuk kandidat: <strong className="text-slate-800">{candidate?.full_name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-sm"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tanggal Wawancara <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={scheduleForm.interview_date}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, interview_date: e.target.value })}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white ${
                      scheduleErrors.interview_date ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                    data-testid="applicant-interview-date"
                  />
                  {scheduleErrors.interview_date && (
                    <span className="text-xs text-rose-500 mt-1 block">
                      {scheduleErrors.interview_date}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Waktu / Jam (WIB) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.interview_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, interview_time: e.target.value })}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white ${
                      scheduleErrors.interview_time ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                    data-testid="applicant-interview-time"
                  />
                  {scheduleErrors.interview_time && (
                    <span className="text-xs text-rose-500 mt-1 block">
                      {scheduleErrors.interview_time}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Metode Wawancara</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setScheduleForm({ ...scheduleForm, method: 'online' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      scheduleForm.method === 'online'
                        ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    🌐 Online (Meeting)
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleForm({ ...scheduleForm, method: 'offline' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      scheduleForm.method === 'offline'
                        ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    🏢 Offline (Tatap Muka)
                  </button>
                </div>
              </div>

              {scheduleForm.method === 'online' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tautan Meeting Online <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={scheduleForm.meeting_link}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, meeting_link: e.target.value })}
                    placeholder="https://meet.google.com/xyz-abcd-efg"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white ${
                      scheduleErrors.meeting_link ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                    data-testid="applicant-meeting-link"
                  />
                  {scheduleErrors.meeting_link && (
                    <span className="text-xs text-rose-500 mt-1 block">
                      {scheduleErrors.meeting_link}
                    </span>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Alamat / Ruang Pertemuan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={scheduleForm.location}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })}
                    placeholder="Contoh: Gedung A Lantai 2, Ruang Meeting"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white ${
                      scheduleErrors.location ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                    data-testid="applicant-location-input"
                  />
                  {scheduleErrors.location && (
                    <span className="text-xs text-rose-500 mt-1 block">
                      {scheduleErrors.location}
                    </span>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Catatan untuk Kandidat (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  placeholder="Informasi dress code, persiapan teknis, atau dokumen yang perlu dibawa..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                  data-testid="applicant-interview-notes"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  disabled={scheduling}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50"
                  data-testid="submit-schedule-applicant-btn"
                >
                  {scheduling ? 'Menyimpan...' : 'Jadwalkan Wawancara'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantDetail;
