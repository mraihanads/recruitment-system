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
      {/* Clean Editorial Welcome Card (Aligned with Homepage Style) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-blue-700 font-semibold block mb-1.5">
            Portal Pencari Kerja
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Halo, {user?.name || 'Kandidat'}!
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1.5 max-w-xl leading-relaxed">
            Pantau status tahapan lamaran kerja Anda dan temukan lowongan yang paling cocok dengan keahlian Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            to="/candidate/profile"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200/80 transition-colors"
          >
            Profil & CV Saya
          </Link>
          <Link
            to="/candidate/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors"
          >
            <span>Cari Lowongan Kerja</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </div>

      {/* Main StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Lamaran Dikirim"
          value={totalAppsCount}
          subtitle="Seluruh lowongan yang pernah Anda lamar"
          color="blue"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />

        <StatCard
          title="Lowongan Tersimpan"
          value={savedJobsCount}
          subtitle="Bookmark untuk dilamar nanti"
          color="emerald"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          }
        />
      </div>

      {/* Outcome Breakdown Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90">
          <span className="text-xs font-medium text-slate-500 block mb-1">Sedang Screening</span>
          <span className="text-xl font-bold text-amber-600">{pendingCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90">
          <span className="text-xs font-medium text-slate-500 block mb-1">Interview Berlangsung</span>
          <span className="text-xl font-bold text-blue-600">{interviewCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90">
          <span className="text-xs font-medium text-slate-500 block mb-1">Diterima (Hired)</span>
          <span className="text-xl font-bold text-emerald-600">{acceptedCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90">
          <span className="text-xs font-medium text-slate-500 block mb-1">Belum Berhasil</span>
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
            className="text-xs font-bold text-blue-700 hover:text-blue-800"
          >
            Lihat Semua Lamaran →
          </Link>
        }
      >
        {applications.length > 0 ? (
          <div className="divide-y divide-slate-200/80">
            {applications.slice(0, 5).map((app) => (
              <div key={app.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="min-w-0 pr-4">
                  <Link
                    to={`/candidate/applications/${app.id}`}
                    className="text-sm font-bold text-slate-950 hover:text-blue-700 transition-colors truncate block"
                  >
                    {app.job_vacancy?.title || 'Posisi Lowongan'}
                  </Link>
                  <p className="text-xs font-medium text-slate-700 mt-0.5">
                    {app.job_vacancy?.company?.company_name || 'Perusahaan'} • Kecocokan Skill:{' '}
                    <strong className="text-slate-900">
                      {app.match_percentage ? `${Math.round(app.match_percentage)}%` : '-'}
                    </strong>
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-md border uppercase ${
                      app.status === 'accepted'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : app.status === 'interview'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : app.status === 'rejected'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-slate-100 text-slate-800 border-slate-200'
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
            <p className="text-slate-700 font-medium text-sm mb-4">Anda belum mengirimkan lamaran pekerjaan.</p>
            <Link
              to="/candidate/jobs"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-semibold text-xs rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>Cari & Lamar Lowongan Pertama</span>
              <span>&rarr;</span>
            </Link>
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default CandidateDashboard;
