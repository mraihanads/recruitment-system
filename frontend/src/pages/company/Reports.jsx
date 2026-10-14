import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import companyService from '../../services/companyService';
import StatCard from '../../components/dashboard/StatCard';
import SectionCard from '../../components/dashboard/SectionCard';
import LoadingScreen from '../../components/common/LoadingScreen';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';

const APP_STATUS_CONFIG = {
  submitted: { label: 'Submitted', color: 'bg-slate-500', barBg: 'bg-slate-100', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  screening: { label: 'Screening', color: 'bg-amber-500', barBg: 'bg-amber-100', text: 'text-amber-700', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  interview: { label: 'Interview', color: 'bg-purple-500', barBg: 'bg-purple-100', text: 'text-purple-700', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  test: { label: 'Skill Test', color: 'bg-indigo-500', barBg: 'bg-indigo-100', text: 'text-indigo-700', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  accepted: { label: 'Accepted', color: 'bg-emerald-500', barBg: 'bg-emerald-100', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', color: 'bg-rose-500', barBg: 'bg-rose-100', text: 'text-rose-700', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
};

const Reports = () => {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async (selectedPeriod) => {
    setLoading(true);
    setError(null);
    try {
      const res = await companyService.getReports({ period: selectedPeriod });
      if (res?.success && res.data) {
        setData(res.data);
      } else {
        throw new Error(res?.message || 'Gagal memuat laporan perusahaan.');
      }
    } catch (err) {
      console.error('Failed to load company reports:', err);
      setError(
        err.response?.data?.message ||
        'Gagal mengambil data statistik dan laporan rekrutmen dari server.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports(period);
  }, [fetchReports, period]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  if (loading && !data) {
    return <LoadingScreen message="Memuat laporan dan analisis rekrutmen perusahaan..." />;
  }

  if (error && !data) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <ErrorState message={error} onRetry={() => fetchReports(period)} />
      </div>
    );
  }

  const stats = data?.stats || {};
  const appStatus = data?.application_status || {};
  const ivStatus = data?.interview_status || {};
  const jobs = data?.jobs || [];
  const topCandidates = data?.top_candidates || [];
  const recentApps = data?.recent_applications || [];

  // Calculations for Application Funnel percentages
  const totalAppsForCalc = stats.total_applications || 1;
  const appStatusItems = [
    { key: 'submitted', count: appStatus.submitted || 0 },
    { key: 'screening', count: appStatus.screening || 0 },
    { key: 'interview', count: appStatus.interview || 0 },
    { key: 'test', count: appStatus.test || 0 },
    { key: 'accepted', count: appStatus.accepted || 0 },
    { key: 'rejected', count: appStatus.rejected || 0 },
  ];

  // Calculations for Interview Status
  const totalIvForCalc = ivStatus.total || 1;
  const ivScheduledPct = Math.round(((ivStatus.scheduled || 0) / totalIvForCalc) * 100);
  const ivCompletedPct = Math.round(((ivStatus.completed || 0) / totalIvForCalc) * 100);
  const ivCancelledPct = Math.round(((ivStatus.cancelled || 0) / totalIvForCalc) * 100);

  const hasData = stats.total_jobs > 0 || stats.total_applications > 0;

  return (
    <div className="space-y-8 pb-16">
      {/* ========================================================
          1. HEADER & PERIOD FILTER
          ======================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-6 rounded-full bg-blue-600 inline-block" />
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Laporan & Statistik Rekrutmen
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Ringkasan performa lowongan kerja, konversi tahapan pelamar, dan efektivitas wawancara perusahaan Anda.
            </p>
          </div>

          {/* Period Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl self-start md:self-auto shrink-0" data-testid="report-period-filter">
            {[
              { id: 'all', label: 'Semua Waktu' },
              { id: 'month', label: 'Bulan Ini' },
              { id: '3months', label: '3 Bulan' },
              { id: 'year', label: 'Tahun Ini' },
            ].map((p) => {
              const active = period === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePeriodChange(p.id)}
                  disabled={loading}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  data-testid={`period-filter-${p.id}`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {!hasData ? (
        <EmptyState
          title="Belum Ada Data Rekrutmen"
          description="Perusahaan Anda belum memiliki lowongan atau pelamar aktif. Buat lowongan baru untuk mulai mengumpulkan statistik rekrutmen."
        />
      ) : (
        <>
          {/* ========================================================
              2. SUMMARY CARDS GRID (Section 3)
              ======================================================== */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4" data-testid="summary-cards-grid">
            <StatCard
              title="Total Lowongan"
              value={stats.total_jobs || 0}
              subtitle="Semua lowongan"
              color="blue"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />

            <StatCard
              title="Lowongan Aktif"
              value={stats.active_jobs || 0}
              subtitle={`${stats.closed_jobs || 0} ditutup`}
              color="emerald"
              badge="Tayang"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />

            <StatCard
              title="Total Pelamar"
              value={stats.total_applications || 0}
              subtitle="Berkas masuk"
              color="indigo"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />

            <StatCard
              title="Total Interview"
              value={stats.total_interviews || 0}
              subtitle="Sesi terjadwal"
              color="purple"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />

            <StatCard
              title="Diterima"
              value={stats.accepted_applications || 0}
              subtitle="Kandidat lolos"
              color="emerald"
              badge="Accepted"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              }
            />

            <StatCard
              title="Ditolak"
              value={stats.rejected_applications || 0}
              subtitle="Tidak sesuai"
              color="rose"
              badge="Rejected"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              }
            />
          </div>

          {/* ========================================================
              3. APPLICATION & INTERVIEW STATUS (Sections 4 & 5)
              ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Application Status Funnel Breakdown (2 Cols) */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-6" data-testid="application-status-section">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-5 rounded-full bg-blue-600" />
                    Distribusi Status Lamaran
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Komposisi berkas kandidat di setiap tahapan rekrutmen
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
                  Total: {stats.total_applications || 0} Pelamar
                </span>
              </div>

              {/* Stacked Progress Bar Visual */}
              <div className="space-y-1.5">
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  {appStatusItems.map((item) => {
                    if (item.count === 0) return null;
                    const pct = Math.round((item.count / totalAppsForCalc) * 100);
                    const cfg = APP_STATUS_CONFIG[item.key] || APP_STATUS_CONFIG.submitted;
                    return (
                      <div
                        key={item.key}
                        className={`${cfg.color} h-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                        title={`${cfg.label}: ${item.count} (${pct}%)`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Status Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {appStatusItems.map((item) => {
                  const cfg = APP_STATUS_CONFIG[item.key] || APP_STATUS_CONFIG.submitted;
                  const pct = Math.round((item.count / totalAppsForCalc) * 100);
                  return (
                    <div
                      key={item.key}
                      className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-3 h-3 rounded-full ${cfg.color} shrink-0`} />
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">
                            {cfg.label}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {pct}% dari total
                          </span>
                        </div>
                      </div>
                      <span className="text-base sm:text-lg font-black text-slate-900">
                        {item.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Interview Status Breakdown (1 Col) */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-6" data-testid="interview-status-section">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-5 rounded-full bg-purple-600" />
                    Statistik Wawancara
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Aktivitas & realisasi jadwal interview
                  </p>
                </div>
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl">
                  {ivStatus.total || 0} Sesi
                </span>
              </div>

              {/* Status items */}
              <div className="space-y-4">
                {/* Scheduled */}
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Dijadwalkan (Scheduled)
                    </span>
                    <span className="text-base font-black text-blue-800">
                      {ivStatus.scheduled || 0}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-blue-200/50 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${ivScheduledPct}%` }} />
                  </div>
                  <span className="text-[11px] text-blue-600 font-semibold block text-right">
                    {ivScheduledPct}% dari total
                  </span>
                </div>

                {/* Completed */}
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Selesai (Completed)
                    </span>
                    <span className="text-base font-black text-emerald-800">
                      {ivStatus.completed || 0}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-emerald-200/50 overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${ivCompletedPct}%` }} />
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold block text-right">
                    {ivCompletedPct}% dari total
                  </span>
                </div>

                {/* Cancelled */}
                <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Dibatalkan (Cancelled)
                    </span>
                    <span className="text-base font-black text-rose-800">
                      {ivStatus.cancelled || 0}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-rose-200/50 overflow-hidden">
                    <div className="h-full bg-rose-600 rounded-full" style={{ width: `${ivCancelledPct}%` }} />
                  </div>
                  <span className="text-[11px] text-rose-600 font-semibold block text-right">
                    {ivCancelledPct}% dari total
                  </span>
                </div>
              </div>

              <div className="pt-2 text-center">
                <Link
                  to="/company/interviews"
                  className="text-xs font-bold text-purple-600 hover:text-purple-800 hover:underline"
                >
                  Buka Manajemen Interview →
                </Link>
              </div>
            </div>
          </div>

          {/* ========================================================
              4. JOB STATISTICS TABLE (Section 6)
              ======================================================== */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4" data-testid="job-statistics-section">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-5 rounded-full bg-emerald-600" />
                  Statistik Berdasarkan Lowongan Kerja
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rincian pelamar, wawancara, dan keputusan akhir per lowongan
                </p>
              </div>
              <Link
                to="/company/jobs"
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Kelola Lowongan →
              </Link>
            </div>

            {jobs.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">Belum ada data lowongan.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-3">Judul Lowongan</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-center">Pelamar</th>
                      <th className="py-3 px-3 text-center">Interview</th>
                      <th className="py-3 px-3 text-center">Diterima</th>
                      <th className="py-3 px-3 text-center">Ditolak</th>
                      <th className="py-3 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-slate-900 block truncate max-w-xs">
                            {job.title}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {job.employment_type || 'Full Time'} • {job.location || 'Banda Aceh'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-xs font-bold capitalize ${
                              job.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {job.status === 'active' ? 'Aktif' : 'Ditutup'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                            {job.applications_count}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                            {job.interviews_count}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {job.accepted_count}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                            {job.rejected_count}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <Link
                            to={`/company/applicants?job_id=${job.id}`}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            Lihat Pelamar →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ========================================================
              5. TOP CANDIDATE MATCHES & RECENT APPLICATIONS (Sections 7 & 8)
              ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Candidate Matches */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4" data-testid="top-candidates-section">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-5 rounded-full bg-amber-500" />
                    Top Candidate Matches
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Kandidat dengan persentase kecocokan kualifikasi tertinggi
                  </p>
                </div>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl">
                  Top 5
                </span>
              </div>

              {topCandidates.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4">Belum ada skor kecocokan kandidat.</p>
              ) : (
                <div className="space-y-3">
                  {topCandidates.map((cand, idx) => {
                    const matchPct = Math.round(cand.match_percentage || 0);
                    const cfg = APP_STATUS_CONFIG[cand.status] || APP_STATUS_CONFIG.submitted;
                    return (
                      <div
                        key={cand.application_id}
                        className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-3 hover:border-blue-200 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-black text-sm flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {cand.candidate_name}
                            </h3>
                            <p className="text-[11px] text-slate-500 truncate">
                              {cand.job_title}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-xs font-black text-emerald-600 block">
                              {matchPct}% Match
                            </span>
                            <span className={`inline-block px-2 py-0.2 rounded-md text-[10px] font-bold border ${cfg.badge}`}>
                              {cfg.label}
                            </span>
                          </div>

                          <Link
                            to={`/company/applicants/${cand.application_id}`}
                            className="p-2 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-slate-600 hover:text-blue-600 transition-colors"
                            title="Buka Berkas Pelamar"
                          >
                            →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Applications */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4" data-testid="recent-applications-section">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-5 rounded-full bg-blue-600" />
                    Lamaran Terbaru (Recent)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Berkas pelamar yang baru saja masuk
                  </p>
                </div>
                <Link
                  to="/company/applicants"
                  className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                  data-testid="view-all-applicants-btn"
                >
                  Lihat Semua →
                </Link>
              </div>

              {recentApps.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4">Belum ada lamaran masuk pada periode ini.</p>
              ) : (
                <div className="space-y-3">
                  {recentApps.map((app) => {
                    const cfg = APP_STATUS_CONFIG[app.status] || APP_STATUS_CONFIG.submitted;
                    return (
                      <div
                        key={app.id}
                        className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-3 hover:border-blue-200 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                            {app.candidate_name ? app.candidate_name[0].toUpperCase() : 'K'}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {app.candidate_name}
                            </h3>
                            <p className="text-[11px] text-slate-500 truncate">
                              {app.job_title} • {formatDate(app.applied_at)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${cfg.badge}`}>
                            {cfg.label}
                          </span>
                          <Link
                            to={`/company/applicants/${app.id}`}
                            className="p-2 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-slate-600 hover:text-blue-600 transition-colors"
                            title="Buka Berkas Pelamar"
                          >
                            →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
