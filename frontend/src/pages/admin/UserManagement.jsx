import React, { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

const UserManagement = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modals & Action States
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [alertFeedback, setAlertFeedback] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        per_page: 10,
      };
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await adminService.getUsers(params);
      if (res?.success) {
        setUsers(res.data.data || []);
        setPagination({
          current_page: res.data.current_page,
          last_page: res.data.last_page,
          total: res.data.total,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengambil data pengguna.');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenStatusModal = (u, newStatus) => {
    if (u.id === currentAdmin?.id && newStatus === 'inactive') {
      setAlertFeedback({
        type: 'error',
        message: 'Anda tidak dapat menonaktifkan akun administrator Anda sendiri.',
      });
      return;
    }
    setSelectedUser(u);
    setTargetStatus(newStatus);
    setStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await adminService.updateUserStatus(selectedUser.id, targetStatus);
      setAlertFeedback({
        type: 'success',
        message: `Status pengguna ${selectedUser.name} berhasil diubah menjadi ${targetStatus === 'active' ? 'Aktif' : 'Nonaktif'}.`,
      });
      setStatusModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      setAlertFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal mengubah status pengguna.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDetail = (u) => {
    setSelectedUser(u);
    setDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Pengguna</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola seluruh akun pengguna, pencari kerja, perusahaan, dan hak akses sistem.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200 self-start sm:self-auto">
          Total: {pagination.total} Pengguna
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
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{alertFeedback.message}</span>
          </div>
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
            placeholder="Cari nama atau email..."
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
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-blue-500"
          >
            <option value="">Semua Role</option>
            <option value="candidate">Kandidat</option>
            <option value="company">Perusahaan</option>
            <option value="admin">Administrator</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-blue-500"
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>

          {(search || roleFilter || statusFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setRoleFilter('');
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

      {/* Main Table Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12">
            <LoadingScreen message="Memuat daftar pengguna..." />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState message={error} onRetry={fetchUsers} />
          </div>
        ) : users.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Pengguna Tidak Ditemukan"
              message="Tidak ada akun pengguna yang sesuai dengan kriteria filter pencarian."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Pengguna</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Info Tambahan</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Terdaftar</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {users.map((u) => {
                  const isCurrentAdmin = u.id === currentAdmin?.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">
                            {u.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              {u.name}
                              {isCurrentAdmin && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                            u.role === 'admin'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : u.role === 'company'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-600">
                        {u.role === 'company' && u.company ? (
                          <div>
                            <span className="font-medium text-slate-800">{u.company.company_name}</span>
                            <span className="block text-slate-400">Verif: {u.company.verification_status}</span>
                          </div>
                        ) : u.role === 'candidate' && u.candidate_profile ? (
                          <div>
                            <span className="text-slate-800">{u.candidate_profile.full_name || '-'}</span>
                            <span className="block text-slate-400">{u.candidate_profile.phone || '-'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          ></span>
                          {u.status === 'active' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-500">
                        {new Date(u.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDetail(u)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 transition"
                          >
                            Detail
                          </button>
                          {u.status === 'active' ? (
                            <button
                              disabled={isCurrentAdmin}
                              onClick={() => handleOpenStatusModal(u, 'inactive')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                                isCurrentAdmin
                                  ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
                                  : 'text-rose-600 hover:bg-rose-50 border-rose-200'
                              }`}
                              title={isCurrentAdmin ? 'Tidak dapat menonaktifkan akun sendiri' : 'Nonaktifkan Pengguna'}
                            >
                              Nonaktifkan
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenStatusModal(u, 'active')}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition"
                            >
                              Aktifkan
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
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

      {/* Confirmation Modal for Status Change */}
      {statusModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  targetStatus === 'inactive' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Konfirmasi {targetStatus === 'active' ? 'Aktivasi' : 'Penonaktifan'} Akun
                </h3>
                <p className="text-xs text-slate-500">Periksa kembali sebelum melanjutkan</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Apakah Anda yakin ingin {targetStatus === 'active' ? 'mengaktifkan' : 'menonaktifkan'} akun{' '}
              <strong className="text-slate-900">{selectedUser.name}</strong> ({selectedUser.email})?{' '}
              {targetStatus === 'inactive' && 'Pengguna ini tidak akan dapat login ke platform sementara akun nonaktif.'}
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  setStatusModalOpen(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmStatusChange}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition ${
                  targetStatus === 'active'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                } disabled:opacity-50`}
              >
                {actionLoading ? 'Memproses...' : `Ya, ${targetStatus === 'active' ? 'Aktifkan' : 'Nonaktifkan'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {detailModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-base flex items-center justify-center">
                  {selectedUser.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedUser.name}</h3>
                  <p className="text-xs text-slate-400">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  setSelectedUser(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 block">Role</span>
                  <span className="font-semibold text-slate-800 capitalize">{selectedUser.role}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Status Akun</span>
                  <span className="font-semibold text-slate-800 capitalize">{selectedUser.status}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Tanggal Registrasi</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(selectedUser.created_at).toLocaleString('id-ID')}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">ID Pengguna</span>
                  <span className="font-semibold text-slate-800">#{selectedUser.id}</span>
                </div>
              </div>

              {selectedUser.role === 'company' && selectedUser.company && (
                <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Profil Perusahaan</h4>
                  <p className="text-sm font-semibold text-slate-800">{selectedUser.company.company_name}</p>
                  <p className="text-xs text-slate-600">{selectedUser.company.address || 'Alamat belum diatur'}</p>
                  <div className="flex gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span>Telepon: {selectedUser.company.phone || '-'}</span>
                    <span>Status: <strong className="text-blue-600">{selectedUser.company.verification_status}</strong></span>
                  </div>
                </div>
              )}

              {selectedUser.role === 'candidate' && selectedUser.candidate_profile && (
                <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Profil Kandidat</h4>
                  <p className="text-sm font-semibold text-slate-800">{selectedUser.candidate_profile.full_name || selectedUser.name}</p>
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span>Telepon: {selectedUser.candidate_profile.phone || '-'}</span>
                    <span>Gender: {selectedUser.candidate_profile.gender || '-'}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  setSelectedUser(null);
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

export default UserManagement;
