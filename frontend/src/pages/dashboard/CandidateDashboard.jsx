import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/dashboard/StatCard';
import SectionCard from '../../components/dashboard/SectionCard';
import LoadingScreen from '../../components/common/LoadingScreen';
import ErrorState from '../../components/common/ErrorState';

const CandidateDashboard = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [totalAppsCount, setTotalAppsCount] = useState(0);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [appsRes, savedRes] = await Promise.all([
        api.get('/candidate/applications'),
        api.get('/candidate/saved-jobs').catch(() => null),
      ]);

      if (appsRes?.data?.success) {
        const appsData = appsRes.data.data?.data || appsRes.data.data || [];
        setApplications(appsData);
        setTotalAppsCount(appsRes.data.data?.total !== undefined ? appsRes.data.data.total : appsData.length);
      }

      if (savedRes?.data?.success) {
        const savedData = savedRes.data.data?.data || savedRes.data.data || [];
        setSavedJobsCount(savedRes.data.data?.total !== undefined ? savedRes.data.data.total : savedData.length);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Gagal mengambil data ringkasan lamaran kandidat dari server.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <LoadingScreen message="Memuat profil dan ringkasan lamaran Anda..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  // Aggregate stats from applications list
  const pendingCount = applications.filter((a) => ['submitted', 'screening'].includes(a.status)).length;
  const interviewCount = applications.filter((a) => a.status === 'interview').length;
  const acceptedCount = applications.filter((a) => a.status === 'accepted').length;
  const rejectedCount = applications.filter((a) => a.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-xs text-white border border-white/25 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Portal Pencari Kerja
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Halo, {user?.name || 'Kandidat'}!
            </h2>
            <p className="text-blue-100 text-sm sm:text-base mt-2 max-w-xl leading-relaxed">
              Pantau status tahapan lamaran kerja Anda dan temukan lowongan yang paling cocok dengan keahlian Anda.
            </p>
          </div>
          <Link
            to="/candidate/jobs"
            className="self-start sm:self-center px-5 py-2.5 bg-white text-blue-700 font-bold text-sm rounded-xl hover:bg-blue-50 shadow-md transition-all shrink-0"
          >
            🔍 Cari Lowongan Kerja
          </Link>
        </div>
        <div className="absolute -right-8 -bottom-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none"></div>
      </div>

      {/* Main StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Lamaran Dikirim"
          value={totalAppsCount}
          subtitle="Seluruh lowongan yang pernah Anda lamar"
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />

        <StatCard
          title="Dalam Proses Review"
          value={pendingCount}
          subtitle="Tahap screening awal oleh recruiter"
          color="amber"
          badge={pendingCount > 0 ? 'Menunggu' : 'Selesai'}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          title="Tahap Wawancara"
          value={interviewCount}
          subtitle="Undangan interview aktif"
          color="purple"
          badge={interviewCount > 0 ? 'Penting' : undefined}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />

        <StatCard
          title="Lowongan Tersimpan"
          value={savedJobsCount}
          subtitle="Bookmark untuk dilamar nanti"
          color="emerald"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          }
        />
      </div>

      {/* Outcome Breakdown Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Sedang Screening</span>
          <span className="text-xl font-bold text-amber-600">{pendingCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Interview Berlangsung</span>
          <span className="text-xl font-bold text-purple-600">{interviewCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Diterima (Hired)</span>
          <span className="text-xl font-bold text-emerald-600">{acceptedCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Belum Berhasil</span>
          <span className="text-xl font-bold text-rose-600">{rejectedCount}</span>
        </div>
      </div>

      {/* Recent Applications List */}
      <SectionCard
        title="Riwayat Lamaran Terbaru"
        subtitle="Daftar lowongan yang sedang Anda ikuti proses seleksinya"
        action={
          <Link
            to="/candidate/applications"
            className="text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            Lihat Semua Lamaran →
          </Link>
        }
      >
        {applications.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {applications.slice(0, 5).map((app) => (
              <div key={app.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="min-w-0 pr-4">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {app.job_vacancy?.title || 'Posisi Lowongan'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {app.job_vacancy?.company?.company_name || 'Perusahaan'} • Dicocokkan: {app.match_percentage ? `${Math.round(app.match_percentage)}%` : '-'}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border uppercase ${
                      app.status === 'accepted'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : app.status === 'interview'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : app.status === 'rejected'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm mb-4">Anda belum mengirimkan lamaran pekerjaan.</p>
            <Link
              to="/candidate/jobs"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700 shadow-xs"
            >
              Cari & Lamar Lowongan Pertama
            </Link>
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default CandidateDashboard;
