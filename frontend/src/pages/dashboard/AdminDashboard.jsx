import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/dashboard/StatCard';
import SectionCard from '../../components/dashboard/SectionCard';
import LoadingScreen from '../../components/common/LoadingScreen';
import ErrorState from '../../components/common/ErrorState';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, repRes] = await Promise.all([
        adminService.getDashboard(),
        adminService.getReports().catch(() => null),
      ]);

      if (dashRes?.success) {
        setStats(dashRes.data);
      }
      if (repRes?.success) {
        setReports(repRes.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Gagal mengambil data statistik administrator dari server.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <LoadingScreen message="Memuat statistik admin terkini..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Aktif</span>;
      case 'verified':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Terverifikasi</span>;
      case 'accepted':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Diterima</span>;
      case 'pending':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Menunggu</span>;
      case 'submitted':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Diajukan</span>;
      case 'screening':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Screening</span>;
      case 'interview':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Wawancara</span>;
      case 'closed':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">Ditutup</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Ditolak</span>;
      case 'inactive':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Nonaktif</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-xs text-white border border-white/25 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Administrator Control Center
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang, {user?.name || 'Administrator'}!
          </h2>
          <p className="text-blue-100 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
            Pantau dan kelola seluruh ekosistem rekrutmen: pengguna, perusahaan, dokumen verifikasi, lowongan, kategori, dan monitoring lamaran secara real-time.
          </p>
        </div>
        <div className="absolute -right-8 -bottom-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none"></div>
      </div>

      {/* 8 Primary Real-time Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Users"
          value={stats?.total_users || 0}
          subtitle="Semua akun pengguna terdaftar"
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />

        <StatCard
          title="Total Kandidat"
          value={stats?.total_candidates || 0}
          subtitle="Pencari kerja terdaftar"
          color="indigo"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />

        <StatCard
          title="Total Perusahaan"
          value={stats?.total_companies || 0}
          subtitle={`${stats?.verified_companies || 0} Terverifikasi`}
          color="emerald"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />

        <StatCard
          title="Menunggu Verifikasi"
          value={stats?.pending_companies || 0}
          subtitle="Perusahaan menunggu approval"
          color="amber"
          badge={stats?.pending_companies > 0 ? `${stats?.pending_companies} Menunggu` : 'Bersih'}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />

        <StatCard
          title="Total Lowongan"
          value={stats?.total_jobs || 0}
          subtitle="Seluruh lowongan terdata"
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />

        <StatCard
          title="Lowongan Aktif"
          value={stats?.active_jobs || 0}
          subtitle="Lowongan sedang tayang"
          color="emerald"
          badge={`${stats?.active_jobs || 0} Tayang`}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          title="Total Lamaran"
          value={stats?.total_applications || 0}
          subtitle={`${stats?.accepted_applications || 0} Diterima Kerja`}
          color="indigo"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />

        <StatCard
          title="Total Wawancara"
          value={stats?.total_interviews || 0}
          subtitle="Jadwal wawancara terjadwal"
          color="amber"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* Breakdown Status Application & Verification */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Pending / Screening</span>
          <span className="text-2xl font-bold text-amber-600">{stats?.pending_applications || 0}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Tahap Interview</span>
          <span className="text-2xl font-bold text-blue-600">{stats?.interview_applications || 0}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Diterima Kerja</span>
          <span className="text-2xl font-bold text-emerald-600">{stats?.accepted_applications || 0}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Ditolak</span>
          <span className="text-2xl font-bold text-rose-600">{stats?.rejected_applications || 0}</span>
        </div>
      </div>

      {/* RECENT SECTIONS GRID (Recent Users, Recent Companies, Recent Jobs, Recent Applications) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <SectionCard
          title="Pengguna Terbaru"
          subtitle="5 akun pengguna yang baru mendaftar"
          action={
            <Link to="/admin/users" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Lihat Semua →
            </Link>
          }
        >
          {stats?.recent_users && stats.recent_users.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {stats.recent_users.map((u) => (
                <div key={u.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {u.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{u.name}</p>
                      <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-medium text-slate-500 capitalize bg-slate-100 px-2 py-0.5 rounded">
                      {u.role}
                    </span>
                    {getStatusBadge(u.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-4 text-center">Belum ada pengguna terdaftar.</p>
          )}
        </SectionCard>

        {/* Recent Companies */}
        <SectionCard
          title="Perusahaan Terbaru"
          subtitle="5 perusahaan mitra yang baru mendaftar"
          action={
            <Link to="/admin/companies" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Lihat Semua →
            </Link>
          }
        >
          {stats?.recent_companies && stats.recent_companies.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {stats.recent_companies.map((c) => (
                <div key={c.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{c.company_name}</p>
                    <p className="text-xs text-slate-400 truncate">{c.user?.email || c.phone || 'Email belum diisi'}</p>
                  </div>
                  <div className="shrink-0">
                    {getStatusBadge(c.verification_status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-4 text-center">Belum ada perusahaan terdaftar.</p>
          )}
        </SectionCard>

        {/* Recent Jobs */}
        <SectionCard
          title="Lowongan Terbaru"
          subtitle="5 lowongan kerja yang baru ditambahkan"
          action={
            <Link to="/admin/jobs" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Lihat Semua →
            </Link>
          }
        >
          {stats?.recent_jobs && stats.recent_jobs.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {stats.recent_jobs.map((j) => (
                <div key={j.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{j.title}</p>
                    <p className="text-xs text-slate-400 truncate">{j.company?.company_name} • {j.category?.name || 'Kategori'}</p>
                  </div>
                  <div className="shrink-0">
                    {getStatusBadge(j.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-4 text-center">Belum ada lowongan terdaftar.</p>
          )}
        </SectionCard>

        {/* Recent Applications */}
        <SectionCard
          title="Lamaran Terbaru"
          subtitle="5 aktivitas pengajuan lamaran terakhir"
          action={
            <Link to="/admin/applications" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Lihat Semua →
            </Link>
          }
        >
          {stats?.recent_applications && stats.recent_applications.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {stats.recent_applications.map((a) => (
                <div key={a.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {a.candidate_profile?.full_name || a.candidate_profile?.user?.name || 'Kandidat'}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      Melamar: {a.job_vacancy?.title} ({a.job_vacancy?.company?.company_name})
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {a.match_percentage && (
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {Math.round(a.match_percentage)}% Match
                      </span>
                    )}
                    {getStatusBadge(a.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-4 text-center">Belum ada lamaran masuk.</p>
          )}
        </SectionCard>
      </div>

      {/* Top Categories & Companies Analytics Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard
          title="Kategori Pekerjaan Populer"
          subtitle="Kategori dengan lowongan terbanyak"
          action={
            <Link to="/admin/categories" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Kelola Kategori →
            </Link>
          }
        >
          {reports?.top_job_categories && reports.top_job_categories.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {reports.top_job_categories.map((cat, idx) => (
                <div key={cat.category_id || idx} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-800">
                      {cat.category_name}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                    {cat.job_count} Lowongan
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-4 text-center">Data kategori belum tersedia.</p>
          )}
        </SectionCard>

        <SectionCard
          title="Laporan & Ringkasan Sistem"
          subtitle="Statistik agregat keseluruhan platform"
          action={
            <Link to="/admin/reports" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Laporan Lengkap →
            </Link>
          }
        >
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 block">Total Pengguna</span>
              <span className="text-lg font-bold text-slate-800">{reports?.total_users || 0}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 block">Total Lowongan</span>
              <span className="text-lg font-bold text-blue-600">{reports?.total_jobs || 0}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 block">Total Lamaran</span>
              <span className="text-lg font-bold text-indigo-600">{reports?.total_applications || 0}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 block">Total Wawancara</span>
              <span className="text-lg font-bold text-amber-600">{reports?.total_interviews || 0}</span>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default AdminDashboard;
