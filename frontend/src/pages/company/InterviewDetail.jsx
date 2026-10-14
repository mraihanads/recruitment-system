import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import companyService from '../../services/companyService';
import LoadingScreen from '../../components/common/LoadingScreen';
import ErrorState from '../../components/common/ErrorState';

const STATUS_BADGES = {
  scheduled: {
    label: 'Dijadwalkan',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  completed: {
    label: 'Selesai',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    label: 'Dibatalkan',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
};

const APP_STATUS_BADGES = {
  submitted: { label: 'Submitted', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  screening: { label: 'Screening', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  interview: { label: 'Interview', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  test: { label: 'Skill Test', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  accepted: { label: 'Accepted', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const formatDateIndo = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  return timeStr.substring(0, 5) + ' WIB';
};

const InterviewDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    interview_date: '',
    interview_time: '',
    method: 'online',
    meeting_link: '',
    location: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadInterview();
  }, [id]);

  const loadInterview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await companyService.getInterviewDetail(id);
      setInterview(res.data);
      if (res.data) {
        let dVal = '';
        if (res.data.interview_date) {
          dVal = String(res.data.interview_date).substring(0, 10);
        }
        setFormData({
          interview_date: dVal,
          interview_time: res.data.interview_time ? res.data.interview_time.substring(0, 5) : '10:00',
          method: res.data.method || 'online',
          meeting_link: res.data.meeting_link || '',
          location: res.data.location || '',
          notes: res.data.notes || '',
        });
      }
    } catch (err) {
      console.error('Failed to load interview detail:', err);
      setError(err?.response?.data?.message || 'Gagal memuat detail wawancara.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Status Change
  const handleUpdateStatus = async (newStatus) => {
    try {
      setActionLoading(true);
      await companyService.updateInterviewStatus(id, newStatus);
      setFeedback({
        type: 'success',
        message: `Status wawancara berhasil diubah menjadi: ${STATUS_BADGES[newStatus]?.label || newStatus}.`,
      });
      await loadInterview();
    } catch (err) {
      console.error('Failed to update status:', err);
      setFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Gagal mengubah status wawancara.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.interview_date) errors.interview_date = 'Tanggal wawancara wajib diisi.';
    if (!formData.interview_time) errors.interview_time = 'Waktu wawancara wajib diisi.';
    if (formData.method === 'online' && !formData.meeting_link) {
      errors.meeting_link = 'Tautan meeting (URL) wajib diisi jika online.';
    }
    if (formData.method === 'offline' && !formData.location) {
      errors.location = 'Alamat/lokasi wajib diisi jika offline.';
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        interview_date: formData.interview_date,
        interview_time: formData.interview_time,
        method: formData.method,
        notes: formData.notes || null,
        meeting_link: formData.method === 'online' ? formData.meeting_link : null,
        location: formData.method === 'offline' ? formData.location : null,
      };
      await companyService.updateInterview(id, payload);
      setFeedback({
        type: 'success',
        message: 'Jadwal wawancara berhasil diperbarui.',
      });
      setShowEditModal(false);
      await loadInterview();
    } catch (err) {
      console.error('Failed to update interview:', err);
      setFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Gagal memperbarui wawancara.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Memuat detail sesi wawancara..." />;
  }

  if (error || !interview) {
    return (
      <ErrorState
        title="Gagal Memuat Detail Wawancara"
        description={error || 'Data wawancara tidak ditemukan.'}
        onRetry={loadInterview}
      />
    );
  }

  const application = interview.application || {};
  const candidate = application.candidate_profile || {};
  const job = application.job_vacancy || {};
  const statusBadge = STATUS_BADGES[interview.status] || STATUS_BADGES.scheduled;
  const appStatusBadge = APP_STATUS_BADGES[application.status] || APP_STATUS_BADGES.submitted;
  const matchPct = Math.round(Number(application.match_percentage || 0));

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Back */}
      <div className="flex items-center justify-between">
        <Link
          to="/company/interviews"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Daftar Interview
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to={`/company/applicants/${application.id}`}
            className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            Lihat Berkas Pelamar #{application.id} ↗
          </Link>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedback.message && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-medium border transition-all ${
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

      {/* Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5 min-w-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-xs shrink-0">
              {candidate?.full_name ? candidate.full_name[0].toUpperCase() : 'K'}
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-lg text-xs font-bold border ${statusBadge.color}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusBadge.dot}`} />
                  {statusBadge.label}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  ID Interview: #{interview.id}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                Wawancara: {candidate?.full_name || 'Kandidat'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Untuk Posisi: <span className="text-blue-600 font-bold">{job?.title || '-'}</span>
              </p>
            </div>
          </div>

          {/* Action buttons top right */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs shadow-xs transition-all inline-flex items-center gap-1.5"
              data-testid="edit-interview-header-btn"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit Jadwal
            </button>

            {interview.status === 'scheduled' && (
              <>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('completed')}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all inline-flex items-center gap-1.5"
                  data-testid="complete-interview-btn"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Tandai Selesai
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('cancelled')}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs shadow-xs transition-all inline-flex items-center gap-1.5"
                  data-testid="cancel-interview-btn"
                >
                  ✕ Batalkan
                </button>
              </>
            )}

            {interview.status === 'cancelled' && (
              <button
                type="button"
                onClick={() => handleUpdateStatus('scheduled')}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all"
              >
                ↺ Aktifkan & Jadwalkan Ulang
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: 2 Kolom */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Detail Interview & Catatan */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Informasi Sesi Interview */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <span className="w-2.5 h-5 rounded-full bg-blue-600" />
              Detail Sesi Wawancara (Interview)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                <span className="text-slate-400 font-medium block text-xs mb-1">
                  📅 Tanggal Pelaksanaan
                </span>
                <span className="font-bold text-slate-900 text-sm sm:text-base">
                  {formatDateIndo(interview.interview_date)}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                <span className="text-slate-400 font-medium block text-xs mb-1">
                  ⏰ Waktu Pelaksanaan
                </span>
                <span className="font-bold text-blue-700 text-sm sm:text-base">
                  {formatTime(interview.interview_time)}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                <span className="text-slate-400 font-medium block text-xs mb-1">
                  ⚙️ Metode Wawancara
                </span>
                <span className="font-bold text-slate-800 capitalize">
                  {interview.method === 'online' ? 'Online (Virtual Meeting)' : 'Offline (Tatap Muka)'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                <span className="text-slate-400 font-medium block text-xs mb-1">
                  📌 Status Sesi
                </span>
                <span className="font-bold text-slate-800 capitalize">
                  {statusBadge.label}
                </span>
              </div>
            </div>

            {/* Lokasi / Meeting Link Highlight */}
            <div className="p-5 rounded-2xl bg-blue-50/40 border border-blue-100 space-y-2">
              <span className="text-xs font-bold text-blue-900 block">
                {interview.method === 'online' ? '🌐 Tautan Google Meet / Zoom' : '🏢 Alamat / Lokasi Kantor'}
              </span>

              {interview.method === 'online' ? (
                interview.meeting_link ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <span className="text-xs font-mono text-slate-700 break-all select-all">
                      {interview.meeting_link}
                    </span>
                    <a
                      href={interview.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all inline-flex items-center justify-center gap-1.5 shrink-0"
                    >
                      Buka Ruang Meeting ↗
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Belum ada tautan meeting yang dimasukkan.</p>
                )
              ) : (
                <p className="text-xs sm:text-sm font-semibold text-slate-800">
                  {interview.location || 'Lokasi belum ditentukan secara rinci.'}
                </p>
              )}
            </div>

            {/* Notes Section */}
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-2">
                Catatan & Petunjuk untuk Kandidat / Pewawancara:
              </span>
              <div className="p-4 rounded-2xl bg-amber-50/30 border border-amber-100/80 text-xs sm:text-sm text-slate-700 leading-relaxed">
                {interview.notes ? (
                  <p className="whitespace-pre-line">{interview.notes}</p>
                ) : (
                  <p className="text-slate-400 italic">Tidak ada catatan tambahan untuk wawancara ini.</p>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Candidate Skills & Summary */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <span className="w-2.5 h-5 rounded-full bg-indigo-600" />
              Keahlian Kandidat (Skills)
            </h2>

            <div className="flex flex-wrap gap-2">
              {candidate?.skills && candidate.skills.length > 0 ? (
                candidate.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                  >
                    {skill.name}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">Belum ada data skill terdaftar.</span>
              )}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Candidate Info & Application Info */}
        <div className="space-y-6">
          {/* Candidate Profile Widget */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Profil Kandidat</span>
              <span className="text-[11px] text-blue-600 font-bold">Pelamar</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Nama Lengkap</span>
                <span className="font-bold text-slate-900 text-sm">{candidate?.full_name || '-'}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Email</span>
                <span className="font-semibold text-slate-800">{candidate?.user?.email || '-'}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Nomor Telepon</span>
                <span className="font-semibold text-slate-800">{candidate?.phone || '-'}</span>
              </div>

              {application.cv_file && (
                <div className="pt-3 border-t border-slate-100">
                  <a
                    href={`http://127.0.0.1:8000/storage/${application.cv_file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2"
                  >
                    📄 Lihat / Download CV Asli
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Application & Job Widget */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
              Informasi Lamaran Terkait
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Lowongan Kerja</span>
                <span className="font-bold text-slate-900 text-sm">{job?.title || '-'}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Status Lamaran</span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold border mt-1 ${appStatusBadge.color}`}
                >
                  {appStatusBadge.label}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-slate-500">Skor Kesesuaian (Match)</span>
                  <span className="text-blue-600 font-black">{matchPct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      matchPct >= 75 ? 'bg-emerald-500' : matchPct >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${matchPct}%` }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <Link
                  to={`/company/applicants/${application.id}`}
                  className="w-full px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  Buka Halaman Pelamar Lengkap →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          EDIT INTERVIEW MODAL
          ======================================================== */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="text-lg font-black text-slate-900">Ubah Jadwal Wawancara</h3>
                <p className="text-xs text-slate-500">Perbarui tanggal, waktu, atau tautan meeting interview.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-sm"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tanggal Wawancara <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.interview_date}
                    onChange={(e) => setFormData({ ...formData, interview_date: e.target.value })}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white ${
                      formErrors.interview_date ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  />
                  {formErrors.interview_date && (
                    <span className="text-xs text-rose-500 mt-1 block">
                      {formErrors.interview_date}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Waktu / Jam (WIB) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.interview_time}
                    onChange={(e) => setFormData({ ...formData, interview_time: e.target.value })}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white ${
                      formErrors.interview_time ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  />
                  {formErrors.interview_time && (
                    <span className="text-xs text-rose-500 mt-1 block">
                      {formErrors.interview_time}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Metode Wawancara</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, method: 'online' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      formData.method === 'online'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    🌐 Online (Meeting)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, method: 'offline' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      formData.method === 'offline'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    🏢 Offline (Tatap Muka)
                  </button>
                </div>
              </div>

              {formData.method === 'online' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tautan Meeting Online (URL) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.meeting_link}
                    onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                    placeholder="https://meet.google.com/xyz-abcd-efg"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white ${
                      formErrors.meeting_link ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  />
                  {formErrors.meeting_link && (
                    <span className="text-xs text-rose-500 mt-1 block">
                      {formErrors.meeting_link}
                    </span>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Lokasi / Ruang Pertemuan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white ${
                      formErrors.location ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  />
                  {formErrors.location && (
                    <span className="text-xs text-rose-500 mt-1 block">
                      {formErrors.location}
                    </span>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Catatan</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Menyimpan...' : 'Perbarui Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewDetail;
