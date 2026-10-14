import React, { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

const CompanyVerification = () => {
  const [companies, setCompanies] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [targetAction, setTargetAction] = useState('verified'); // 'verified' or 'rejected'
  const [actionLoading, setActionLoading] = useState(false);
  const [alertFeedback, setAlertFeedback] = useState(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        per_page: 10,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.verification_status = statusFilter;

      const res = await adminService.getCompanies(params);
      if (res?.success) {
        setCompanies(res.data.data || []);
        setPagination({
          current_page: res.data.current_page,
          last_page: res.data.last_page,
          total: res.data.total,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data perusahaan.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleOpenActionModal = (company, action) => {
    setSelectedCompany(company);
    setTargetAction(action);
    setConfirmModalOpen(true);
  };

  const handleConfirmVerification = async () => {
    if (!selectedCompany) return;
    setActionLoading(true);
    try {
      await adminService.verifyCompany(selectedCompany.id, targetAction);
      setAlertFeedback({
        type: 'success',
        message: `Status verifikasi perusahaan ${selectedCompany.company_name} berhasil diubah menjadi ${
          targetAction === 'verified' ? 'Terverifikasi' : 'Ditolak'
        }.`,
      });
      setConfirmModalOpen(false);
      setSelectedCompany(null);
      fetchCompanies();
    } catch (err) {
      setAlertFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal memperbarui status verifikasi.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDetail = async (company) => {
    try {
      const res = await adminService.getCompany(company.id);
      if (res?.success) {
        setSelectedCompany(res.data);
      } else {
        setSelectedCompany(company);
      }
    } catch {
      setSelectedCompany(company);
    }
    setDetailModalOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Terverifikasi
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Ditolak
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Verifikasi Perusahaan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tinjau legalitas dan verifikasi profil perusahaan mitra yang mendaftar di sistem.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200 self-start sm:self-auto">
          Total: {pagination.total} Perusahaan
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

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80 relative">
          <input
            type="text"
            placeholder="Cari nama perusahaan..."
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
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
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

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12">
            <LoadingScreen message="Memuat daftar perusahaan..." />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState message={error} onRetry={fetchCompanies} />
          </div>
        ) : companies.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Perusahaan Tidak Ditemukan"
              message="Belum ada data perusahaan yang cocok dengan kriteria filter."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Perusahaan</th>
                  <th className="py-3.5 px-4">Kontak</th>
                  <th className="py-3.5 px-4">Alamat & Website</th>
                  <th className="py-3.5 px-4">Status Verifikasi</th>
                  <th className="py-3.5 px-4">Terdaftar</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {companies.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-blue-600 text-sm shrink-0 overflow-hidden">
                          {c.logo ? (
                            <img src={c.logo} alt={c.company_name} className="w-full h-full object-cover" />
                          ) : (
                            c.company_name?.charAt(0)?.toUpperCase() || 'C'
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{c.company_name}</p>
                          <p className="text-xs text-slate-400">
                            {c.job_vacancies_count || 0} Lowongan • {c.company_documents_count || 0} Dokumen
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-600">
                      <div className="font-medium text-slate-800">{c.user?.email || '-'}</div>
                      <div className="text-slate-400">{c.phone || '-'}</div>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-600 max-w-xs">
                      <p className="truncate text-slate-800">{c.address || '-'}</p>
                      {c.website ? (
                        <a
                          href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline truncate block"
                        >
                          {c.website}
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(c.verification_status)}</td>
                    <td className="py-4 px-4 text-xs text-slate-500">
                      {new Date(c.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenDetail(c)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 transition"
                        >
                          Detail
                        </button>
                        {c.verification_status !== 'verified' && (
                          <button
                            onClick={() => handleOpenActionModal(c, 'verified')}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition"
                          >
                            Verifikasi
                          </button>
                        )}
                        {c.verification_status !== 'rejected' && (
                          <button
                            onClick={() => handleOpenActionModal(c, 'rejected')}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
                          >
                            Tolak
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

      {/* Confirmation Modal */}
      {confirmModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  targetAction === 'verified' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {targetAction === 'verified' ? 'Verifikasi Perusahaan' : 'Tolak Verifikasi'}
                </h3>
                <p className="text-xs text-slate-500">Konfirmasi tindakan verifikasi</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Apakah Anda yakin ingin {targetAction === 'verified' ? 'menyetujui dan memverifikasi' : 'menolak verifikasi'}{' '}
              perusahaan <strong className="text-slate-900">{selectedCompany.company_name}</strong>?
              {targetAction === 'verified'
                ? ' Dokumen pending milik perusahaan ini juga akan otomatis disetujui dan statusnya menjadi Verified.'
                : ' Notifikasi penolakan akan dikirimkan ke akun perusahaan tersebut.'}
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  setConfirmModalOpen(false);
                  setSelectedCompany(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmVerification}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition ${
                  targetAction === 'verified'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                } disabled:opacity-50`}
              >
                {actionLoading ? 'Menyimpan...' : targetAction === 'verified' ? 'Ya, Verifikasi' : 'Ya, Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company Detail Modal */}
      {detailModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-blue-600 text-lg overflow-hidden shrink-0">
                  {selectedCompany.logo ? (
                    <img src={selectedCompany.logo} alt={selectedCompany.company_name} className="w-full h-full object-cover" />
                  ) : (
                    selectedCompany.company_name?.charAt(0)?.toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedCompany.company_name}</h3>
                  <div className="mt-1">{getStatusBadge(selectedCompany.verification_status)}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  setSelectedCompany(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-slate-400 block">Email Akun</span>
                  <span className="font-semibold text-slate-800">{selectedCompany.user?.email || '-'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Telepon</span>
                  <span className="font-semibold text-slate-800">{selectedCompany.phone || '-'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Website</span>
                  <span className="font-semibold text-slate-800">{selectedCompany.website || '-'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Tanggal Registrasi</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(selectedCompany.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-slate-400 block">Alamat Perusahaan</span>
                  <span className="font-semibold text-slate-800">{selectedCompany.address || '-'}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Deskripsi Perusahaan</h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedCompany.description || 'Belum ada deskripsi profil.'}
                </p>
              </div>

              {selectedCompany.company_documents && selectedCompany.company_documents.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dokumen Terkait</h4>
                  <div className="space-y-2">
                    {selectedCompany.company_documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-800 capitalize">{doc.document_type}</span>
                          <span className="block text-slate-400">Status: {doc.verification_status}</span>
                        </div>
                        {doc.document_file && (
                          <a
                            href={doc.document_file}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100"
                          >
                            Buka File ↗
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  setSelectedCompany(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Tutup
              </button>
              {selectedCompany.verification_status !== 'verified' && (
                <button
                  onClick={() => {
                    setDetailModalOpen(false);
                    handleOpenActionModal(selectedCompany, 'verified');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition"
                >
                  Verifikasi Sekarang
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyVerification;
