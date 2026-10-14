import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import companyService from '../../services/companyService';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';

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

const Interviews = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [interviews, setInterviews] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');

  // Modal State (Create / Edit)
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedInterview, setSelectedInterview] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    application_id: '',
    interview_date: '',
    interview_time: '10:00',
    method: 'online',
    meeting_link: '',
    location: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadData();
    // If URL has ?schedule_app_id=..., automatically open create modal for that application
    const targetAppId = searchParams.get('schedule_app_id');
    if (targetAppId) {
      setFormData((prev) => ({ ...prev, application_id: targetAppId }));
      setShowModal(true);
      setModalMode('create');
    }
  }, [searchParams]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ivRes, appRes] = await Promise.all([
        companyService.getInterviews(),
        companyService.getApplicants(),
      ]);
      setInterviews(ivRes.data || []);
      setApplicants(appRes.data || []);
    } catch (err) {
      console.error('Failed to load interviews:', err);
      setError(err?.response?.data?.message || 'Gagal memuat daftar wawancara.');
    } finally {
      setLoading(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = interviews.length;
    const scheduled = interviews.filter((i) => i.status === 'scheduled').length;
    const completed = interviews.filter((i) => i.status === 'completed').length;
    const cancelled = interviews.filter((i) => i.status === 'cancelled').length;
    return { total, scheduled, completed, cancelled };
  }, [interviews]);

  // Filtered Interviews
  const filteredInterviews = useMemo(() => {
    return interviews.filter((iv) => {
      const candName = iv.application?.candidate_profile?.full_name?.toLowerCase() || '';
      const candEmail = iv.application?.candidate_profile?.user?.email?.toLowerCase() || '';
      const jobTitle = iv.application?.job_vacancy?.title?.toLowerCase() || '';
      const q = searchQuery.toLowerCase().trim();

      const matchSearch = !q || candName.includes(q) || candEmail.includes(q) || jobTitle.includes(q);
      const matchStatus = statusFilter === 'all' || iv.status === statusFilter;
      const matchMethod = methodFilter === 'all' || iv.method === methodFilter;

      return matchSearch && matchStatus && matchMethod;
    });
  }, [interviews, searchQuery, statusFilter, methodFilter]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedInterview(null);
    setFormData({
      application_id: applicants.length > 0 ? String(applicants[0].id) : '',
      interview_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      interview_time: '10:00',
      method: 'online',
      meeting_link: '',
      location: '',
      notes: '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (iv) => {
    setModalMode('edit');
    setSelectedInterview(iv);
    // Parse date for input (YYYY-MM-DD)
    let dVal = '';
    if (iv.interview_date) {
      dVal = String(iv.interview_date).substring(0, 10);
    }
    setFormData({
      application_id: String(iv.application_id),
      interview_date: dVal,
      interview_time: iv.interview_time ? iv.interview_time.substring(0, 5) : '10:00',
      method: iv.method || 'online',
      meeting_link: iv.meeting_link || '',
      location: iv.location || '',
      notes: iv.notes || '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Validate Form
  const validateForm = () => {
    const errors = {};
    if (modalMode === 'create' && !formData.application_id) {
      errors.application_id = 'Pilih kandidat/lamaran yang akan diwawancarai.';
    }
    if (!formData.interview_date) {
      errors.interview_date = 'Tanggal wawancara wajib diisi.';
    }
    if (!formData.interview_time) {
      errors.interview_time = 'Waktu wawancara wajib diisi.';
    }
    if (!formData.method) {
      errors.method = 'Metode wawancara wajib dipilih.';
    }
    if (formData.method === 'online') {
      if (!formData.meeting_link) {
        errors.meeting_link = 'Tautan meeting online (URL) wajib diisi.';
      } else if (!/^https?:\/\/.+/i.test(formData.meeting_link)) {
        errors.meeting_link = 'Format tautan meeting harus diawali http:// atau https://';
      }
    }
    if (formData.method === 'offline') {
      if (!formData.location || !formData.location.trim()) {
        errors.location = 'Alamat/lokasi wawancara tatap muka wajib diisi.';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setActionLoading(true);
      if (modalMode === 'create') {
        const payload = {
          interview_date: formData.interview_date,
          interview_time: formData.interview_time,
          method: formData.method,
          notes: formData.notes || null,
          meeting_link: formData.method === 'online' ? formData.meeting_link : null,
          location: formData.method === 'offline' ? formData.location : null,
        };
        await companyService.createInterview(formData.application_id, payload);
        setFeedback({
          type: 'success',
          message: 'Jadwal wawancara baru berhasil dibuat dan notifikasi telah dikirimkan ke kandidat.',
        });
      } else {
        const payload = {
          interview_date: formData.interview_date,
          interview_time: formData.interview_time,
          method: formData.method,
          notes: formData.notes || null,
          meeting_link: formData.method === 'online' ? formData.meeting_link : null,
          location: formData.method === 'offline' ? formData.location : null,
        };
        await companyService.updateInterview(selectedInterview.id, payload);
        setFeedback({
          type: 'success',
          message: 'Jadwal wawancara berhasil diperbarui.',
        });
      }
      setShowModal(false);
      // Clean up search param if present
      if (searchParams.get('schedule_app_id')) {
        setSearchParams({});
      }
      await loadData();
    } catch (err) {
      console.error('Failed to save interview:', err);
      const msg = err?.response?.data?.message || 'Gagal menyimpan jadwal wawancara.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Quick Status Update
  const handleUpdateStatus = async (interviewId, newStatus) => {
    try {
      setActionLoading(true);
      await companyService.updateInterviewStatus(interviewId, newStatus);
      setFeedback({
        type: 'success',
        message: `Status wawancara berhasil diubah menjadi: ${STATUS_BADGES[newStatus]?.label || newStatus}.`,
      });
      await loadData();
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

  if (loading) {
    return <LoadingScreen message="Memuat jadwal wawancara perusahaan..." />;
  }

  return (
    <div className="space-y-6 pb-12">
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

      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-6 rounded-full bg-blue-600 inline-block" />
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Manajemen Jadwal Interview
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Atur, jadwalkan, dan kelola sesi wawancara langsung bersama kandidat pelamar yang lolos seleksi berkas.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all inline-flex items-center justify-center gap-2 self-start md:self-auto shrink-0"
            data-testid="schedule-interview-btn"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Jadwalkan Interview Baru
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50/70 p-3.5 sm:p-4 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Interview
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 block">
              {stats.total}
            </span>
          </div>
          <div className="bg-blue-50/50 p-3.5 sm:p-4 rounded-2xl border border-blue-100/60">
            <span className="text-[11px] font-semibold text-blue-500 uppercase tracking-wider block">
              Dijadwalkan
            </span>
            <span className="text-xl sm:text-2xl font-black text-blue-700 mt-0.5 block">
              {stats.scheduled}
            </span>
          </div>
          <div className="bg-emerald-50/50 p-3.5 sm:p-4 rounded-2xl border border-emerald-100/60">
            <span className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider block">
              Selesai
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5 block">
              {stats.completed}
            </span>
          </div>
          <div className="bg-rose-50/50 p-3.5 sm:p-4 rounded-2xl border border-rose-100/60">
            <span className="text-[11px] font-semibold text-rose-500 uppercase tracking-wider block">
              Dibatalkan
            </span>
            <span className="text-xl sm:text-2xl font-black text-rose-700 mt-0.5 block">
              {stats.cancelled}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kandidat, email, atau posisi lowongan..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              data-testid="interview-search-input"
            />
          </div>

          {/* Method Filter */}
          <div className="flex items-center gap-2">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="method-filter-select"
            >
              <option value="all">Semua Metode</option>
              <option value="online">Online (Meeting)</option>
              <option value="offline">Offline (Tatap Muka)</option>
            </select>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-slate-100 pt-3">
          {[
            { id: 'all', label: 'Semua Status', count: stats.total },
            { id: 'scheduled', label: 'Dijadwalkan', count: stats.scheduled },
            { id: 'completed', label: 'Selesai', count: stats.completed },
            { id: 'cancelled', label: 'Dibatalkan', count: stats.cancelled },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap inline-flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100/70 text-slate-600 hover:bg-slate-200/60'
                }`}
                data-testid={`status-tab-${tab.id}`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                    isActive ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List / Grid of Interviews */}
      {filteredInterviews.length === 0 ? (
        <EmptyState
          title="Tidak Ada Jadwal Interview"
          description={
            searchQuery || statusFilter !== 'all' || methodFilter !== 'all'
              ? 'Tidak ada jadwal interview yang sesuai dengan filter pencarian Anda.'
              : 'Belum ada sesi wawancara yang dijadwalkan. Klik tombol di atas untuk membuat jadwal baru.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5" data-testid="interview-list-grid">
          {filteredInterviews.map((iv) => {
            const candidate = iv.application?.candidate_profile;
            const job = iv.application?.job_vacancy;
            const badge = STATUS_BADGES[iv.status] || STATUS_BADGES.scheduled;

            return (
              <div
                key={iv.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:border-blue-200 hover:shadow-md transition-all flex flex-col justify-between"
                data-testid={`interview-card-${iv.id}`}
              >
                <div className="space-y-4">
                  {/* Top Bar: Badge & Method */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${badge.color}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dot}`} />
                      {badge.label}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold uppercase tracking-wider ${
                        iv.method === 'online'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                          : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                      }`}
                    >
                      {iv.method === 'online' ? '🌐 Online' : '🏢 Offline'}
                    </span>
                  </div>

                  {/* Candidate Info */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-xs shrink-0">
                      {candidate?.full_name ? candidate.full_name[0].toUpperCase() : 'K'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-bold text-slate-900 truncate">
                        {candidate?.full_name || 'Kandidat'}
                      </h2>
                      <p className="text-xs font-semibold text-blue-600 truncate mt-0.5">
                        {job?.title || 'Posisi Tidak Diketahui'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {candidate?.user?.email || candidate?.phone || 'Kontak kandidat'}
                      </p>
                    </div>
                  </div>

                  {/* Date & Time Highlight */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-700">
                      <span className="text-slate-400 font-medium flex items-center gap-1.5">
                        📅 Tanggal:
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatDateIndo(iv.interview_date)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-700">
                      <span className="text-slate-400 font-medium flex items-center gap-1.5">
                        ⏰ Waktu:
                      </span>
                      <span className="font-bold text-blue-700">
                        {formatTime(iv.interview_time)}
                      </span>
                    </div>

                    {/* Location or Meeting Link */}
                    {iv.method === 'online' ? (
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2 text-xs">
                        <span className="text-slate-400 font-medium shrink-0">Link Meeting:</span>
                        {iv.meeting_link ? (
                          <a
                            href={iv.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-bold truncate underline decoration-blue-300"
                            title={iv.meeting_link}
                          >
                            Buka Meeting Room ↗
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">Belum ada link</span>
                        )}
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-200/60 flex items-start justify-between gap-2 text-xs">
                        <span className="text-slate-400 font-medium shrink-0">Lokasi:</span>
                        <span className="font-semibold text-slate-800 text-right line-clamp-2">
                          {iv.location || '-'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Notes if available */}
                  {iv.notes && (
                    <div className="text-xs text-slate-600 bg-amber-50/40 border border-amber-100 rounded-xl p-2.5">
                      <span className="font-bold text-amber-900 block text-[11px] mb-0.5">Catatan:</span>
                      <p className="line-clamp-2 text-slate-700 italic">"{iv.notes}"</p>
                    </div>
                  )}
                </div>

                {/* Card Actions Bottom */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Quick status button */}
                    {iv.status === 'scheduled' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(iv.id, 'completed')}
                          disabled={actionLoading}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all"
                          title="Tandai wawancara selesai"
                          data-testid={`mark-completed-btn-${iv.id}`}
                        >
                          ✓ Selesaikan
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(iv.id, 'cancelled')}
                          disabled={actionLoading}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all"
                          title="Batalkan wawancara"
                          data-testid={`mark-cancelled-btn-${iv.id}`}
                        >
                          ✕ Batalkan
                        </button>
                      </>
                    )}
                    {iv.status === 'cancelled' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(iv.id, 'scheduled')}
                        disabled={actionLoading}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all"
                        title="Jadwalkan ulang wawancara"
                      >
                        ↺ Jadwalkan Ulang
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(iv)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
                      data-testid={`edit-interview-btn-${iv.id}`}
                    >
                      Edit
                    </button>
                    <Link
                      to={`/company/interviews/${iv.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all"
                      data-testid={`detail-interview-btn-${iv.id}`}
                    >
                      Detail
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          MODAL: SCHEDULE / EDIT INTERVIEW
          ======================================================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="text-lg font-black text-slate-900">
                  {modalMode === 'create' ? 'Jadwalkan Wawancara' : 'Edit Jadwal Wawancara'}
                </h3>
                <p className="text-xs text-slate-500">
                  {modalMode === 'create'
                    ? 'Tentukan waktu dan format wawancara dengan kandidat pelamar.'
                    : 'Ubah detail atau jadwal sesi wawancara ini.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-sm"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {/* Candidate / Application selection (Only in Create mode) */}
              {modalMode === 'create' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kandidat / Lamaran yang Diwawancarai <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.application_id}
                    onChange={(e) => setFormData({ ...formData, application_id: e.target.value })}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white ${
                      formErrors.application_id ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                    data-testid="interview-app-select"
                  >
                    <option value="">-- Pilih Lamaran Kandidat --</option>
                    {applicants.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.candidate?.full_name || 'Kandidat'} — {app.job?.title || 'Lowongan'} (Status: {app.status})
                      </option>
                    ))}
                  </select>
                  {formErrors.application_id && (
                    <span className="text-xs text-rose-500 mt-1 block">
                      {formErrors.application_id}
                    </span>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                  <span className="text-slate-400 font-medium block">Kandidat Terjadwal:</span>
                  <span className="font-bold text-slate-900 block mt-0.5">
                    {selectedInterview?.application?.candidate_profile?.full_name} —{' '}
                    {selectedInterview?.application?.job_vacancy?.title}
                  </span>
                </div>
              )}

              {/* Date & Time Row */}
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
                    data-testid="interview-date-input"
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
                    data-testid="interview-time-input"
                  />
                  {formErrors.interview_time && (
                    <span className="text-xs text-rose-500 mt-1 block">
                      {formErrors.interview_time}
                    </span>
                  )}
                </div>
              </div>

              {/* Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Metode Wawancara <span className="text-rose-500">*</span>
                </label>
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
                    🌐 Online (Google Meet/Zoom)
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

              {/* Conditional Location / Link */}
              {formData.method === 'online' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tautan Meeting Online <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.meeting_link}
                    onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                    placeholder="https://meet.google.com/xyz-abcd-efg"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white ${
                      formErrors.meeting_link ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                    data-testid="meeting-link-input"
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
                    Alamat / Ruang Pertemuan Offline <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Contoh: Gedung Kantor Lantai 3, Ruang Rapat Andromeda"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white ${
                      formErrors.location ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                    data-testid="location-input"
                  />
                  {formErrors.location && (
                    <span className="text-xs text-rose-500 mt-1 block">
                      {formErrors.location}
                    </span>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Catatan untuk Kandidat / Pewawancara (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informasi persiapan, dress code, atau agenda wawancara teknis..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  data-testid="interview-notes-input"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50"
                  data-testid="submit-interview-form-btn"
                >
                  {actionLoading
                    ? 'Menyimpan...'
                    : modalMode === 'create'
                    ? 'Simpan Jadwal'
                    : 'Perbarui Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Interviews;
