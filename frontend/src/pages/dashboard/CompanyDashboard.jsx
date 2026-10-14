import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/dashboard/StatCard';
import SectionCard from '../../components/dashboard/SectionCard';
import LoadingScreen from '../../components/common/LoadingScreen';
import ErrorState from '../../components/common/ErrorState';

const CompanyDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentApps, setRecentApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, jobsRes, appsRes] = await Promise.all([
        api.get('/company/dashboard'),
        api.get('/company/jobs?per_page=4').catch(() => null),
        api.get('/company/applications?per_page=4').catch(() => null),
      ]);

      if (dashRes?.data?.success) {
        setStats(dashRes.data.data);
      }
      if (jobsRes?.data?.success) {
        setRecentJobs(jobsRes.data.data?.data || []);
      }
      if (appsRes?.data?.success) {
        setRecentApps(appsRes.data.data?.data || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Gagal mengambil data statistik perusahaan dari server.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <LoadingScreen message="Memuat dashboard perusahaan..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-xs text-white border border-white/25 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
              Company Recruiter Portal
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Selamat Datang, {user?.name || 'Recruiter'}!
            </h2>
            <p className="text-emerald-100 text-sm sm:text-base mt-2 max-w-xl leading-relaxed">
              Kelola pembukaan lowongan kerja, review kandidat yang melamar, dan atur jadwal wawancara secara terintegrasi.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center shrink-0">
            <Link
              to="/company/reports"
              className="px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white border border-white/30 font-bold text-sm rounded-xl transition-all inline-flex items-center gap-1.5"
              data-testid="view-reports-dashboard-btn"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Lihat Laporan
            </Link>
            <Link
              to="/company/jobs"
              className="px-5 py-2.5 bg-white text-emerald-800 font-bold text-sm rounded-xl hover:bg-emerald-50 shadow-md transition-all shrink-0"
            >
              + Buat Lowongan
            </Link>
          </div>
        </div>
        <div className="absolute -right-8 -bottom-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none"></div>
      </div>

      {/* Main StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Lowongan"
          value={stats?.total_jobs || 0}
          subtitle={`${stats?.active_jobs || 0} Tayang • ${stats?.closed_jobs || 0} Selesai`}
          color="emerald"
          badge={`${stats?.active_jobs || 0} Aktif`}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />

        <StatCard
          title="Total Pelamar Masuk"
          value={stats?.total_applications || 0}
          subtitle={`${stats?.pending_applications || 0} Menunggu Tindakan`}
          color="blue"
          badge={stats?.pending_applications > 0 ? `${stats?.pending_applications} Perlu Review` : 'Up-to-date'}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />

        <StatCard
          title="Jadwal Interview"
          value={stats?.interview_count || 0}
          subtitle="Kandidat pada tahap wawancara"
          color="purple"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />

        <StatCard
          title="Kandidat Diterima"
          value={stats?.accepted_count || 0}
          subtitle={`${stats?.rejected_count || 0} Lamaran Ditolak`}
          color="amber"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Application Status Funnel Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Menunggu Review</span>
          <span className="text-xl font-bold text-amber-600">{stats?.pending_applications || 0}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Tahap Wawancara</span>
          <span className="text-xl font-bold text-purple-600">{stats?.interview_count || 0}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Resmi Diterima</span>
          <span className="text-xl font-bold text-emerald-600">{stats?.accepted_count || 0}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Tidak Lolos</span>
          <span className="text-xl font-bold text-rose-600">{stats?.rejected_count || 0}</span>
        </div>
      </div>

      {/* Summary Lists: Active Jobs & Recent Applicants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lowongan Aktif */}
        <SectionCard
          title="Daftar Lowongan Kerja"
          subtitle="Lowongan yang sedang aktif dibuka"
          action={
            <Link to="/company/jobs" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              Lihat Semua →
            </Link>
          }
        >
          {recentJobs.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentJobs.map((job) => (
                <div key={job.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-bold text-slate-800 truncate">{job.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {job.category?.name || 'Umum'} • {job.employment_type || 'Full Time'}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${
                      job.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {job.status === 'active' ? 'Aktif' : job.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-sm">
              Belum ada lowongan dibuat. Silakan tambahkan lowongan baru.
            </div>
          )}
        </SectionCard>

        {/* Lamaran Terbaru */}
        <SectionCard
          title="Lamaran Masuk Terbaru"
          subtitle="Kandidat yang baru melamar ke perusahaan Anda"
          action={
            <Link to="/company/applications" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              Lihat Semua →
            </Link>
          }
        >
          {recentApps.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentApps.map((app) => (
                <div key={app.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {app.candidate_profile?.full_name || 'Pelamar'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      Lowongan: {app.job_vacancy?.title || 'Posisi'}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full uppercase">
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-sm">
              Belum ada lamaran kandidat masuk saat ini.
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

export default CompanyDashboard;
