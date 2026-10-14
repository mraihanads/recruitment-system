import React, { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';
import StatCard from '../../components/dashboard/StatCard';
import SectionCard from '../../components/dashboard/SectionCard';
import LoadingScreen from '../../components/common/LoadingScreen';
import ErrorState from '../../components/common/ErrorState';

const AdminReports = () => {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getReports();
      if (res?.success) {
        setReports(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat laporan analitik sistem.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  if (loading) {
    return <LoadingScreen message="Memuat ringkasan laporan dan statistik sistem..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchReports} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Laporan & Statistik Sistem</h1>
          <p className="text-sm text-slate-500 mt-1">
            Data analitik komprehensif pertumbuhan pengguna, lowongan, lamaran, dan proses rekrutmen.
          </p>
        </div>
        <button
          onClick={fetchReports}
          className="px-3.5 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition self-start sm:self-auto flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Segarkan Data
        </button>
      </div>

      {/* 6 Top Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Total Users</span>
          <span className="text-2xl font-extrabold text-slate-900">{reports?.total_users || 0}</span>
          <span className="text-[11px] text-slate-400 block mt-1">Seluruh Akun</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Candidates</span>
          <span className="text-2xl font-extrabold text-blue-600">{reports?.total_candidates || 0}</span>
          <span className="text-[11px] text-slate-400 block mt-1">Pencari Kerja</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Companies</span>
          <span className="text-2xl font-extrabold text-emerald-600">{reports?.total_companies || 0}</span>
          <span className="text-[11px] text-slate-400 block mt-1">Mitra Bisnis</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Jobs</span>
          <span className="text-2xl font-extrabold text-indigo-600">{reports?.total_jobs || 0}</span>
          <span className="text-[11px] text-slate-400 block mt-1">Lowongan Dibuka</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Applications</span>
          <span className="text-2xl font-extrabold text-amber-600">{reports?.total_applications || 0}</span>
          <span className="text-[11px] text-slate-400 block mt-1">Berkas Terkirim</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Interviews</span>
          <span className="text-2xl font-extrabold text-purple-600">{reports?.total_interviews || 0}</span>
          <span className="text-[11px] text-slate-400 block mt-1">Sesi Wawancara</span>
        </div>
      </div>

      {/* Distribution Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* User Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Distribusi Pengguna</h3>
          <p className="text-xs text-slate-400 mb-4">Proporsi akun berdasarkan peran</p>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Kandidat</span>
                <span className="text-blue-600">{reports?.total_candidates || 0}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${
                      reports?.total_users
                        ? Math.round(((reports?.total_candidates || 0) / reports.total_users) * 100)
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Perusahaan</span>
                <span className="text-emerald-600">{reports?.total_companies || 0}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{
                    width: `${
                      reports?.total_users
                        ? Math.round(((reports?.total_companies || 0) / reports.total_users) * 100)
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Administrator</span>
                <span className="text-purple-600">{reports?.total_admins || 1}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{
                    width: `${
                      reports?.total_users
                        ? Math.round(((reports?.total_admins || 1) / reports.total_users) * 100)
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Company Verification Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Status Verifikasi Mitra</h3>
          <p className="text-xs text-slate-400 mb-4">Kelayakan perusahaan terdaftar</p>
          <div className="space-y-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800">Verified</span>
              <span className="text-base font-bold text-emerald-700">{reports?.verified_companies || 0}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-800">Pending Review</span>
              <span className="text-base font-bold text-amber-700">{reports?.pending_companies || 0}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-800">Rejected</span>
              <span className="text-base font-bold text-rose-700">{reports?.rejected_companies || 0}</span>
            </div>
          </div>
        </div>

        {/* Job Vacancy Statistics */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Status Lowongan Kerja</h3>
          <p className="text-xs text-slate-400 mb-4">Kondisi tayang lowongan sistem</p>
          <div className="space-y-3">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-800">Active (Tayang)</span>
              <span className="text-base font-bold text-blue-700">{reports?.active_jobs || 0}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Closed (Ditutup)</span>
              <span className="text-base font-bold text-slate-700">{reports?.closed_jobs || 0}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Draft</span>
              <span className="text-base font-bold text-slate-600">{reports?.draft_jobs || 0}</span>
            </div>
          </div>
        </div>

        {/* Interview Statistics */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Status Wawancara</h3>
          <p className="text-xs text-slate-400 mb-4">Sesi interview kandidat</p>
          <div className="space-y-3">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-800">Scheduled</span>
              <span className="text-base font-bold text-blue-700">{reports?.scheduled_interviews || 0}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800">Completed</span>
              <span className="text-base font-bold text-emerald-700">{reports?.completed_interviews || 0}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-800">Cancelled</span>
              <span className="text-base font-bold text-rose-700">{reports?.cancelled_interviews || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Application Stage Funnel / Distribution */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1">Distribusi Status Lamaran Kerja</h3>
        <p className="text-xs text-slate-500 mb-6">Tahapan seleksi pelamar di platform</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
            <span className="text-xs font-bold text-amber-700 block">Submitted</span>
            <span className="text-2xl font-extrabold text-amber-900 mt-1 block">
              {reports?.submitted_applications || 0}
            </span>
          </div>
          <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-100 text-center">
            <span className="text-xs font-bold text-cyan-700 block">Screening</span>
            <span className="text-2xl font-extrabold text-cyan-900 mt-1 block">
              {reports?.screening_applications || 0}
            </span>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
            <span className="text-xs font-bold text-blue-700 block">Interview</span>
            <span className="text-2xl font-extrabold text-blue-900 mt-1 block">
              {reports?.interview_applications || 0}
            </span>
          </div>
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-center">
            <span className="text-xs font-bold text-purple-700 block">Test</span>
            <span className="text-2xl font-extrabold text-purple-900 mt-1 block">
              {reports?.test_applications || 0}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
            <span className="text-xs font-bold text-emerald-700 block">Accepted</span>
            <span className="text-2xl font-extrabold text-emerald-900 mt-1 block">
              {reports?.accepted_applications || 0}
            </span>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-center">
            <span className="text-xs font-bold text-rose-700 block">Rejected</span>
            <span className="text-2xl font-extrabold text-rose-900 mt-1 block">
              {reports?.rejected_applications || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Top Categories & Top Companies Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Job Categories */}
        <SectionCard
          title="Top 5 Kategori Lowongan"
          subtitle="Kategori dengan jumlah lowongan terbanyak"
        >
          {reports?.top_job_categories && reports.top_job_categories.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {reports.top_job_categories.map((c, idx) => (
                <div key={c.category_id || idx} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-800">{c.category_name}</span>
                  </div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {c.job_count} Jobs
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">Belum ada data kategori.</p>
          )}
        </SectionCard>

        {/* Top Companies by Jobs */}
        <SectionCard
          title="Top 5 Perusahaan Teraktif"
          subtitle="Berdasarkan jumlah lowongan kerja"
        >
          {reports?.top_companies_by_jobs && reports.top_companies_by_jobs.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {reports.top_companies_by_jobs.map((c, idx) => (
                <div key={c.company_id || idx} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 truncate max-w-[140px]">{c.company_name}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    {c.job_count} Jobs
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">Belum ada data perusahaan.</p>
          )}
        </SectionCard>

        {/* Top Companies by Applications */}
        <SectionCard
          title="Top 5 Minat Pelamar"
          subtitle="Berdasarkan jumlah lamaran diterima"
        >
          {reports?.top_companies_by_applications && reports.top_companies_by_applications.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {reports.top_companies_by_applications.map((c, idx) => (
                <div key={c.company_id || idx} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 truncate max-w-[140px]">{c.company_name}</span>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {c.application_count} Pelamar
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">Belum ada data lamaran.</p>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

export default AdminReports;
