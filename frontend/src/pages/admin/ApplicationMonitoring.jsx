import React, { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

const ApplicationMonitoring = () => {
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Detail Modal
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        per_page: 10,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const res = await adminService.getApplications(params);
      if (res?.success) {
        setApplications(res.data.data || []);
        setPagination({
          current_page: res.data.current_page,
          last_page: res.data.last_page,
          total: res.data.total,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data lamaran.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleOpenDetail = async (app) => {
    setDetailLoading(true);
    setDetailModalOpen(true);
    try {
      const res = await adminService.getApplication(app.id);
      if (res?.success) {
        setSelectedApp(res.data);
      } else {
        setSelectedApp(app);
      }
    } catch {
      setSelectedApp(app);
    } finally {
      setDetailLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Accepted
          </span>
        );
      case 'interview':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Interview
          </span>
        );
      case 'test':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            Test
          </span>
        );
      case 'screening':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
            Screening
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Rejected
          </span>
        );
      case 'submitted':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Submitted
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Monitoring Lamaran Kerja</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau seluruh berkas dan alur seleksi lamaran kerja dari kandidat ke perusahaan mitra.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200 self-start sm:self-auto">
          Total: {pagination.total} Lamaran
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80 relative">
          <input
            type="text"
            placeholder="Cari kandidat atau judul lowongan..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-blue-500"
          >
            <option value="">Semua Status</option>
            <option value="submitted">Submitted</option>
            <option value="screening">Screening</option>
            <option value="interview">Interview</option>
            <option value="test">Test</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>

          {(search || statusFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12">
            <LoadingScreen message="Memuat data seluruh lamaran..." />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState message={error} onRetry={fetchApplications} />
          </div>
        ) : applications.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Lamaran Tidak Ditemukan"
              message="Belum ada data lamaran yang cocok dengan kriteria filter."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Kandidat</th>
                  <th className="py-3.5 px-4">Lowongan & Perusahaan</th>
                  <th className="py-3.5 px-4">Match %</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Tanggal Melamar</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="font-semibold text-slate-900">
                        {app.candidate_profile?.full_name || app.candidate_profile?.user?.name || 'Kandidat'}
                      </div>
                      <div className="text-xs text-slate-400">{app.candidate_profile?.user?.email || '-'}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-900">{app.job_vacancy?.title}</div>
                      <div className="text-xs text-slate-500">{app.job_vacancy?.company?.company_name}</div>
                    </td>
                    <td className="py-4 px-4">
                      {app.match_percentage ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {Math.round(app.match_percentage)}% Match
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(app.status)}</td>
                    <td className="py-4 px-4 text-xs text-slate-500">
                      {new Date(app.applied_at || app.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(app)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 transition"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Halaman {pagination.current_page} dari {pagination.last_page}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <button
                disabled={page >= pagination.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {detailLoading || !selectedApp ? (
              <div className="py-8">
                <LoadingScreen message="Memuat detail lamaran..." />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Lamaran: {selectedApp.candidate_profile?.full_name || selectedApp.candidate_profile?.user?.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Untuk posisi {selectedApp.job_vacancy?.title} di {selectedApp.job_vacancy?.company?.company_name}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setDetailModalOpen(false);
                      setSelectedApp(null);
                    }}
                    className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-xs text-slate-400 block">Status Saat Ini</span>
                      <div className="mt-0.5">{getStatusBadge(selectedApp.status)}</div>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Pencocokan AI</span>
                      <span className="font-bold text-blue-600">
                        {selectedApp.match_percentage ? `${Math.round(selectedApp.match_percentage)}% Match` : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Tanggal Melamar</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(selectedApp.applied_at || selectedApp.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {selectedApp.cv_file && (
                    <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-xs font-semibold text-blue-900">Berkas Curriculum Vitae (CV)</span>
                      </div>
                      <a
                        href={selectedApp.cv_file}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
                      >
                        Buka CV ↗
                      </a>
                    </div>
                  )}

                  {selectedApp.cover_letter && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Surat Lamaran / Cover Letter</h4>
                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-line">
                        {selectedApp.cover_letter}
                      </p>
                    </div>
                  )}

                  {/* Status History Timeline */}
                  {selectedApp.status_histories && selectedApp.status_histories.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Riwayat Perubahan Status</h4>
                      <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                        {selectedApp.status_histories.map((h) => (
                          <div key={h.id} className="p-3 text-xs flex items-center justify-between bg-white">
                            <div>
                              <span className="font-bold text-slate-800 capitalize">{h.status}</span>
                              {h.note && <span className="text-slate-500 block mt-0.5">{h.note}</span>}
                              <span className="text-[11px] text-slate-400 block">
                                Oleh: {h.changer?.name || 'Sistem'} ({h.changer?.role || '-'})
                              </span>
                            </div>
                            <span className="text-slate-400 text-[11px]">
                              {new Date(h.created_at).toLocaleString('id-ID')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
                  <button
                    onClick={() => {
                      setDetailModalOpen(false);
                      setSelectedApp(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                  >
                    Tutup
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationMonitoring;
