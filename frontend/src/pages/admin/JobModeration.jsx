import React, { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

const JobModeration = () => {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modals & Action
  const [selectedJob, setSelectedJob] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(''); // 'active', 'closed', 'delete'
  const [actionLoading, setActionLoading] = useState(false);
  const [alertFeedback, setAlertFeedback] = useState(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        per_page: 10,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const res = await adminService.getJobs(params);
      if (res?.success) {
        setJobs(res.data.data || []);
        setPagination({
          current_page: res.data.current_page,
          last_page: res.data.last_page,
          total: res.data.total,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat daftar lowongan pekerjaan.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleOpenActionModal = (job, type) => {
    setSelectedJob(job);
    setActionType(type);
    setActionModalOpen(true);
  };

  const handleExecuteAction = async () => {
    if (!selectedJob) return;
    setActionLoading(true);
    try {
      if (actionType === 'delete') {
        await adminService.deleteJob(selectedJob.id);
        setAlertFeedback({
          type: 'success',
          message: `Lowongan "${selectedJob.title}" berhasil dihapus.`,
        });
      } else {
        await adminService.updateJobStatus(selectedJob.id, actionType);
        setAlertFeedback({
          type: 'success',
          message: `Status lowongan "${selectedJob.title}" berhasil diubah menjadi ${
            actionType === 'active' ? 'Aktif' : 'Ditutup'
          }.`,
        });
      }
      setActionModalOpen(false);
      setSelectedJob(null);
      fetchJobs();
    } catch (err) {
      setAlertFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal melakukan aksi pada lowongan.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDetail = async (job) => {
    try {
      const res = await adminService.getJob(job.id);
      if (res?.success) {
        setSelectedJob(res.data);
      } else {
        setSelectedJob(job);
      }
    } catch {
      setSelectedJob(job);
    }
    setDetailModalOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Aktif
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Ditutup
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Moderasi Lowongan Kerja</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau dan kelola seluruh lowongan kerja yang diunggah oleh perusahaan di platform.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200 self-start sm:self-auto">
          Total: {pagination.total} Lowongan
        </div>
      </div>

      {/* Alert Notification */}
      {alertFeedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            alertFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span className="font-semibold text-sm">{alertFeedback.message}</span>
          <button
            onClick={() => setAlertFeedback(null)}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80 relative">
          <input
            type="text"
            placeholder="Cari judul lowongan..."
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
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="draft">Draft</option>
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
            <LoadingScreen message="Memuat daftar lowongan pekerjaan..." />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState message={error} onRetry={fetchJobs} />
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Lowongan Tidak Ditemukan"
              message="Belum ada lowongan pekerjaan yang cocok dengan kriteria filter."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Lowongan & Perusahaan</th>
                  <th className="py-3.5 px-4">Kategori & Lokasi</th>
                  <th className="py-3.5 px-4">Tipe & Deadline</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Pelamar</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="font-semibold text-slate-900">{j.title}</div>
                      <div className="text-xs text-slate-500">{j.company?.company_name || 'Perusahaan'}</div>
                    </td>
                    <td className="py-4 px-4 text-xs">
                      <span className="font-medium text-slate-800">{j.category?.name || '-'}</span>
                      <span className="block text-slate-400">{j.location || '-'}</span>
                    </td>
                    <td className="py-4 px-4 text-xs">
                      <span className="font-medium capitalize text-slate-800">{j.job_type || j.employment_type || '-'}</span>
                      <span className="block text-slate-400">
                        Batas: {j.deadline ? new Date(j.deadline).toLocaleDateString('id-ID') : '-'}
                      </span>
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(j.status)}</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {j.applications_count || 0} Pelamar
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenDetail(j)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 transition"
                        >
                          Detail
                        </button>
                        {j.status === 'active' ? (
                          <button
                            onClick={() => handleOpenActionModal(j, 'closed')}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-600 hover:bg-amber-50 border border-amber-200 transition"
                          >
                            Tutup
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenActionModal(j, 'active')}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition"
                          >
                            Aktifkan
                          </button>
                        )}
                        {Number(j.applications_count) === 0 && (
                          <button
                            onClick={() => handleOpenActionModal(j, 'delete')}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
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

      {/* Action Confirmation Modal */}
      {actionModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  actionType === 'delete'
                    ? 'bg-rose-100 text-rose-600'
                    : actionType === 'active'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-amber-100 text-amber-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Konfirmasi {actionType === 'delete' ? 'Hapus' : actionType === 'active' ? 'Aktivasi' : 'Penutupan'}{' '}
                  Lowongan
                </h3>
                <p className="text-xs text-slate-500">Tinjau tindakan Anda</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Apakah Anda yakin ingin {actionType === 'delete' ? 'menghapus' : actionType === 'active' ? 'mengaktifkan kembali' : 'menutup'}{' '}
              lowongan <strong className="text-slate-900">{selectedJob.title}</strong> dari{' '}
              <strong className="text-slate-900">{selectedJob.company?.company_name}</strong>?
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  setActionModalOpen(false);
                  setSelectedJob(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleExecuteAction}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition ${
                  actionType === 'delete'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : actionType === 'active'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                } disabled:opacity-50`}
              >
                {actionLoading ? 'Menyimpan...' : 'Ya, Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedJob.title}</h3>
                <p className="text-xs text-slate-500">{selectedJob.company?.company_name}</p>
              </div>
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  setSelectedJob(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 block">Kategori</span>
                  <span className="font-semibold text-slate-800">{selectedJob.category?.name || '-'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Status</span>
                  <div>{getStatusBadge(selectedJob.status)}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Lokasi & Tipe</span>
                  <span className="font-semibold text-slate-800">
                    {selectedJob.location || '-'} • {selectedJob.job_type || selectedJob.employment_type || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Total Pelamar</span>
                  <span className="font-semibold text-blue-600">{selectedJob.applications_count || 0} Pelamar</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Deskripsi Pekerjaan</h4>
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-line">
                  {selectedJob.description || 'Tidak ada deskripsi.'}
                </div>
              </div>

              {selectedJob.requirements && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Kualifikasi & Persyaratan</h4>
                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-line">
                    {selectedJob.requirements}
                  </div>
                </div>
              )}

              {selectedJob.skills && selectedJob.skills.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Skill Dibutuhkan</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.skills.map((s) => (
                      <span key={s.id} className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  setSelectedJob(null);
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

export default JobModeration;
