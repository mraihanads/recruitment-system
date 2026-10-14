import React, { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

const InterviewMonitoring = () => {
  const [interviews, setInterviews] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [page, setPage] = useState(1);

  // Detail Modal
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        per_page: 10,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (methodFilter) params.method = methodFilter;

      const res = await adminService.getInterviews(params);
      if (res?.success) {
        setInterviews(res.data.data || []);
        setPagination({
          current_page: res.data.current_page,
          last_page: res.data.last_page,
          total: res.data.total,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat jadwal wawancara.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, methodFilter]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  const handleOpenDetail = (item) => {
    setSelectedInterview(item);
    setDetailModalOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Selesai
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Dibatalkan
          </span>
        );
      case 'scheduled':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            Terjadwal
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Monitoring Wawancara</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau seluruh sesi wawancara yang dijadwalkan oleh perusahaan dengan kandidat.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200 self-start sm:self-auto">
          Total: {pagination.total} Sesi Wawancara
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80 relative">
          <input
            type="text"
            placeholder="Cari kandidat, posisi, perusahaan..."
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
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-blue-500"
          >
            <option value="">Semua Metode</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>

          {(search || statusFilter || methodFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setMethodFilter('');
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
            <LoadingScreen message="Memuat seluruh jadwal interview..." />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState message={error} onRetry={fetchInterviews} />
          </div>
        ) : interviews.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Tidak Ada Jadwal Wawancara"
              message="Belum ada jadwal wawancara yang sesuai dengan kriteria."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Kandidat</th>
                  <th className="py-3.5 px-4">Posisi & Perusahaan</th>
                  <th className="py-3.5 px-4">Tanggal & Jam</th>
                  <th className="py-3.5 px-4">Metode</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {interviews.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="font-semibold text-slate-900">
                        {item.application?.candidate_profile?.full_name ||
                          item.application?.candidate_profile?.user?.name ||
                          'Kandidat'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {item.application?.candidate_profile?.user?.email || item.application?.candidate_profile?.phone || '-'}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-900">{item.application?.job_vacancy?.title}</div>
                      <div className="text-xs text-slate-500">
                        {item.application?.job_vacancy?.company?.company_name}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs">
                      <div className="font-semibold text-slate-800">
                        {new Date(item.interview_date).toLocaleDateString('id-ID', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-slate-400">Pukul {item.interview_time || '-'} WIB</div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          item.method === 'online'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {item.method}
                      </span>
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(item.status)}</td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(item)}
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
      {detailModalOpen && selectedInterview && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Detail Sesi Wawancara</h3>
                <p className="text-xs text-slate-500">Informasi lengkap jadwal interview kandidat</p>
              </div>
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  setSelectedInterview(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 block">Kandidat</span>
                  <span className="font-semibold text-slate-800">
                    {selectedInterview.application?.candidate_profile?.full_name ||
                      selectedInterview.application?.candidate_profile?.user?.name}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Perusahaan</span>
                  <span className="font-semibold text-slate-800">
                    {selectedInterview.application?.job_vacancy?.company?.company_name}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Posisi Lowongan</span>
                  <span className="font-semibold text-slate-800">
                    {selectedInterview.application?.job_vacancy?.title}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Status Wawancara</span>
                  <div>{getStatusBadge(selectedInterview.status)}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Tanggal Wawancara</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(selectedInterview.interview_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Jam & Metode</span>
                  <span className="font-semibold text-slate-800">
                    Pukul {selectedInterview.interview_time || '-'} •{' '}
                    <span className="capitalize">{selectedInterview.method}</span>
                  </span>
                </div>
              </div>

              {selectedInterview.method === 'online' && selectedInterview.meeting_link && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <span className="text-xs font-bold text-blue-900 block mb-1">Tautan Rapat Online:</span>
                  <a
                    href={selectedInterview.meeting_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-700 underline font-medium break-all hover:text-blue-900"
                  >
                    {selectedInterview.meeting_link}
                  </a>
                </div>
              )}

              {selectedInterview.method === 'offline' && selectedInterview.location && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 block mb-1">Lokasi Interview Fisik:</span>
                  <p className="text-xs text-slate-800 font-medium">{selectedInterview.location}</p>
                </div>
              )}

              {selectedInterview.notes && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Catatan Tambahan</h4>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-line">
                    {selectedInterview.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  setSelectedInterview(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewMonitoring;
