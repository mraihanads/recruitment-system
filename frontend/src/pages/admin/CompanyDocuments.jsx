import React, { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

const CompanyDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modals & Action
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('approved'); // 'approved' or 'rejected'
  const [actionLoading, setActionLoading] = useState(false);
  const [alertFeedback, setAlertFeedback] = useState(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        per_page: 10,
      };
      if (statusFilter) params.verification_status = statusFilter;

      const res = await adminService.getDocuments(params);
      if (res?.success) {
        setDocuments(res.data.data || []);
        setPagination({
          current_page: res.data.current_page,
          last_page: res.data.last_page,
          total: res.data.total,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat dokumen perusahaan.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleOpenActionModal = (doc, status) => {
    setSelectedDoc(doc);
    setTargetStatus(status);
    setConfirmModalOpen(true);
  };

  const handleConfirmVerification = async () => {
    if (!selectedDoc) return;
    setActionLoading(true);
    try {
      await adminService.verifyDocument(selectedDoc.id, targetStatus);
      setAlertFeedback({
        type: 'success',
        message: `Status dokumen ${selectedDoc.document_type} milik ${
          selectedDoc.company?.company_name || 'perusahaan'
        } berhasil diubah menjadi ${targetStatus === 'approved' ? 'Disetujui' : 'Ditolak'}.`,
      });
      setConfirmModalOpen(false);
      setSelectedDoc(null);
      fetchDocuments();
    } catch (err) {
      setAlertFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal mengubah status dokumen.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Disetujui
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Verifikasi Dokumen Perusahaan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Validasi dokumen legalitas seperti NIB, SIUP, NPWP yang diunggah oleh perusahaan.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200 self-start sm:self-auto">
          Total: {pagination.total} Dokumen
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

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-500">Filter Status Dokumen:</label>
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
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          {statusFilter && (
            <button
              onClick={() => {
                setStatusFilter('');
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12">
            <LoadingScreen message="Memuat dokumen perusahaan..." />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState message={error} onRetry={fetchDocuments} />
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Tidak Ada Dokumen"
              message="Belum ada dokumen perusahaan yang sesuai dengan filter ini."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Perusahaan</th>
                  <th className="py-3.5 px-4">Tipe Dokumen</th>
                  <th className="py-3.5 px-4">File Dokumen</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Diverifikasi Oleh</th>
                  <th className="py-3.5 px-4">Tanggal Upload</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="font-semibold text-slate-900">{doc.company?.company_name || 'N/A'}</div>
                      <div className="text-xs text-slate-400">Status Perusahaan: {doc.company?.verification_status}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-700">
                        {doc.document_type}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs">
                      {doc.document_file ? (
                        <a
                          href={doc.document_file}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Lihat File
                        </a>
                      ) : (
                        <span className="text-slate-400">Tidak ada file</span>
                      )}
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(doc.verification_status)}</td>
                    <td className="py-4 px-4 text-xs text-slate-600">
                      {doc.verifier ? (
                        <div>
                          <span className="font-medium text-slate-800">{doc.verifier.name}</span>
                          <span className="block text-slate-400">
                            {doc.verified_at ? new Date(doc.verified_at).toLocaleDateString('id-ID') : '-'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Belum diverifikasi</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-500">
                      {new Date(doc.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {doc.verification_status !== 'approved' && (
                          <button
                            onClick={() => handleOpenActionModal(doc, 'approved')}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition"
                          >
                            Setujui
                          </button>
                        )}
                        {doc.verification_status !== 'rejected' && (
                          <button
                            onClick={() => handleOpenActionModal(doc, 'rejected')}
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
      {confirmModalOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  targetStatus === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {targetStatus === 'approved' ? 'Setujui Dokumen' : 'Tolak Dokumen'}
                </h3>
                <p className="text-xs text-slate-500">Konfirmasi status validasi dokumen</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Apakah Anda yakin ingin {targetStatus === 'approved' ? 'menyetujui' : 'menolak'} dokumen{' '}
              <strong className="text-slate-900 capitalize">{selectedDoc.document_type}</strong> milik{' '}
              <strong className="text-slate-900">{selectedDoc.company?.company_name || 'perusahaan'}</strong>?
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  setConfirmModalOpen(false);
                  setSelectedDoc(null);
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
                  targetStatus === 'approved'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                } disabled:opacity-50`}
              >
                {actionLoading ? 'Menyimpan...' : targetStatus === 'approved' ? 'Ya, Setujui' : 'Ya, Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDocuments;
