import React, { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

const JobCategories = () => {
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Form Modal (Add / Edit)
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', description: '' });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [alertFeedback, setAlertFeedback] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        per_page: 10,
      };
      if (search.trim()) params.search = search.trim();

      const res = await adminService.getCategories(params);
      if (res?.success) {
        setCategories(res.data.data || []);
        setPagination({
          current_page: res.data.current_page,
          last_page: res.data.last_page,
          total: res.data.total,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat kategori pekerjaan.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({ id: null, name: '', description: '' });
    setFormErrors({});
    setFormModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setIsEditing(true);
    setFormData({ id: cat.id, name: cat.name, description: cat.description || '' });
    setFormErrors({});
    setFormModalOpen(true);
  };

  const handleOpenDelete = (cat) => {
    setCategoryToDelete(cat);
    setDeleteModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    if (!formData.name.trim()) {
      setFormErrors({ name: ['Nama kategori wajib diisi.'] });
      return;
    }

    setFormSubmitting(true);
    try {
      if (isEditing) {
        await adminService.updateCategory(formData.id, {
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
        });
        setAlertFeedback({
          type: 'success',
          message: `Kategori "${formData.name}" berhasil diperbarui.`,
        });
      } else {
        await adminService.createCategory({
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
        });
        setAlertFeedback({
          type: 'success',
          message: `Kategori baru "${formData.name}" berhasil ditambahkan.`,
        });
      }
      setFormModalOpen(false);
      fetchCategories();
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        setAlertFeedback({
          type: 'error',
          message: err.response?.data?.message || 'Gagal menyimpan kategori.',
        });
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setDeleteLoading(true);
    try {
      await adminService.deleteCategory(categoryToDelete.id);
      setAlertFeedback({
        type: 'success',
        message: `Kategori "${categoryToDelete.name}" berhasil dihapus.`,
      });
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (err) {
      setAlertFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal menghapus kategori.',
      });
      setDeleteModalOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kategori Pekerjaan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola taksonomi kategori industri lowongan kerja di platform.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
            Total: {pagination.total} Kategori
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition flex items-center gap-1.5"
          >
            <span className="text-base font-bold">+</span> Tambah Kategori
          </button>
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

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="w-full md:w-80 relative">
          <input
            type="text"
            placeholder="Cari kategori..."
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
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12">
            <LoadingScreen message="Memuat kategori pekerjaan..." />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState message={error} onRetry={fetchCategories} />
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Kategori Tidak Ditemukan"
              message="Belum ada data kategori yang sesuai."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Nama Kategori</th>
                  <th className="py-3.5 px-4">Deskripsi</th>
                  <th className="py-3.5 px-4">Jumlah Lowongan</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-4 sm:px-6">
                      <span className="font-semibold text-slate-900">{c.name}</span>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-600 max-w-md">
                      {c.description || <span className="text-slate-400 italic">Tidak ada deskripsi</span>}
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {c.job_vacancies_count || 0} Lowongan
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleOpenDelete(c)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                            Number(c.job_vacancies_count) > 0
                              ? 'text-slate-400 border-slate-200 hover:bg-slate-50'
                              : 'text-rose-600 hover:bg-rose-50 border-rose-200'
                          }`}
                          title={
                            Number(c.job_vacancies_count) > 0
                              ? 'Kategori sedang digunakan oleh lowongan'
                              : 'Hapus kategori'
                          }
                        >
                          Hapus
                        </button>
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

      {/* Add / Edit Category Modal */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Kategori Pekerjaan' : 'Tambah Kategori Baru'}
              </h3>
              <button
                onClick={() => setFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nama Kategori <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Misal: Information Technology"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                    formErrors.name ? 'border-rose-400 focus:ring-rose-100' : 'border-slate-200'
                  } focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100`}
                />
                {formErrors.name && (
                  <p className="text-xs text-rose-500 mt-1">{formErrors.name[0]}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Deskripsi singkat mengenai lingkup kategori pekerjaan ini..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={formSubmitting}
                  onClick={() => setFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {formSubmitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Tambahkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && categoryToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Hapus Kategori</h3>
                <p className="text-xs text-slate-500">Konfirmasi penghapusan kategori</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Apakah Anda yakin ingin menghapus kategori{' '}
              <strong className="text-slate-900">"{categoryToDelete.name}"</strong>?
              {Number(categoryToDelete.job_vacancies_count) > 0 && (
                <span className="block mt-2 font-medium text-rose-600">
                  Perhatian: Kategori ini memiliki {categoryToDelete.job_vacancies_count} lowongan terkait dan tidak dapat dihapus.
                </span>
              )}
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => {
                  setDeleteModalOpen(false);
                  setCategoryToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteLoading || Number(categoryToDelete.job_vacancies_count) > 0}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 transition"
              >
                {deleteLoading ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobCategories;
