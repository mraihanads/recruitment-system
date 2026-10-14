import React, { useState, useEffect, useCallback, useRef } from 'react';
import candidateService from '../../services/candidateService';
import ProfileTabs from '../../components/candidate/ProfileTabs';
import SectionCard from '../../components/dashboard/SectionCard';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

const initialForm = {
  title: '',
  description: '',
  project_url: '',
};

const CandidatePortfolio = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form / Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);

  const fileInputRef = useRef(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPortfolios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await candidateService.getPortfolios();
      setPortfolios(res.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Gagal memuat portofolio kandidat dari server.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolios();
  }, [fetchPortfolios]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData(initialForm);
    setImageFile(null);
    setImagePreview(null);
    setExistingImage(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setFormData({
      title: item.title || '',
      description: item.description || '',
      project_url: item.project_url || '',
    });
    setImageFile(null);
    setImagePreview(null);
    setExistingImage(item.image);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(initialForm);
    setImageFile(null);
    setImagePreview(null);
    setExistingImage(null);
    setFieldErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setFieldErrors((prev) => ({ ...prev, image: ['Format gambar harus JPG, JPEG, atau PNG.'] }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFieldErrors((prev) => ({ ...prev, image: ['Ukuran gambar maksimal 2MB.'] }));
      return;
    }

    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setFeedbackMessage({ type: '', text: '' });

    // Validate project_url if provided
    if (formData.project_url && !formData.project_url.startsWith('http://') && !formData.project_url.startsWith('https://')) {
      setFieldErrors({ project_url: ['URL proyek harus diawali dengan http:// atau https://'] });
      return;
    }

    const dataPayload = new FormData();
    dataPayload.append('title', formData.title);
    if (formData.description) dataPayload.append('description', formData.description);
    if (formData.project_url) dataPayload.append('project_url', formData.project_url);
    if (imageFile) dataPayload.append('image', imageFile);

    setSubmitting(true);
    try {
      if (editingId) {
        await candidateService.updatePortfolio(editingId, dataPayload);
        setFeedbackMessage({ type: 'success', text: 'Portofolio berhasil diperbarui.' });
      } else {
        await candidateService.createPortfolio(dataPayload);
        setFeedbackMessage({ type: 'success', text: 'Portofolio baru berhasil ditambahkan.' });
      }
      closeModal();
      fetchPortfolios();
      setTimeout(() => setFeedbackMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
      } else {
        setFeedbackMessage({
          type: 'error',
          text: err.response?.data?.message || 'Terjadi kesalahan saat menyimpan portofolio.',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await candidateService.deletePortfolio(deleteTarget.id);
      setDeleteTarget(null);
      setFeedbackMessage({ type: 'success', text: 'Portofolio berhasil dihapus.' });
      fetchPortfolios();
      setTimeout(() => setFeedbackMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      setFeedbackMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal menghapus portofolio.',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <ProfileTabs />

      {/* Global Feedback Alert */}
      {feedbackMessage.text && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm flex items-center justify-between border ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            onClick={() => setFeedbackMessage({ type: '', text: '' })}
            className="text-xs font-bold hover:underline"
          >
            ✕
          </button>
        </div>
      )}

      <SectionCard
        title="Galeri Portofolio & Proyek"
        subtitle="Pamerkan proyek nyata, tautan karya, dan hasil kerja terbaik yang pernah Anda bangun"
        action={
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Portofolio
          </button>
        }
      >
        {loading ? (
          <LoadingScreen message="Memuat galeri portofolio..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchPortfolios} />
        ) : portfolios.length === 0 ? (
          <EmptyState
            title="Belum Ada Portofolio"
            description="Tampilkan proyek nyata untuk membuktikan keahlian Anda kepada perusahaan perekrut."
            actionLabel="+ Tambah Portofolio Pertama"
            onAction={openAddModal}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {portfolios.map((item) => {
              const imgUrl = item.image
                ? item.image.startsWith('http')
                  ? item.image
                  : `http://127.0.0.1:8000/storage/${item.image}`
                : null;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  {/* Thumbnail / Header */}
                  <div>
                    <div className="h-44 w-full bg-slate-100 relative overflow-hidden flex items-center justify-center">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={item.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-300">
                          <svg className="w-10 h-10 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs font-semibold text-slate-400">Tanpa Gambar</span>
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <h4 className="text-base font-bold text-slate-900 truncate" title={item.title}>
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer & Actions */}
                  <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-slate-100/80">
                    <div>
                      {item.project_url ? (
                        <a
                          href={item.project_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                        >
                          Lihat Project ↗
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Internal Proyek</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Portofolio"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Portofolio"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Modal Tambah / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-lg font-bold text-slate-800">
                {editingId ? 'Edit Portofolio' : 'Tambah Portofolio'}
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1" htmlFor="title">
                  Judul Proyek / Portofolio <span className="text-rose-500">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  placeholder="Aplikasi E-Commerce Laravel & React"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                {fieldErrors.title && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.title[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1" htmlFor="project_url">
                  Tautan / URL Proyek <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  id="project_url"
                  name="project_url"
                  type="url"
                  placeholder="https://github.com/username/project"
                  value={formData.project_url}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                {fieldErrors.project_url && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.project_url[0]}</p>
                )}
              </div>

              {/* Upload Gambar Thumbnail */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Gambar / Tangkapan Layar Proyek <span className="text-slate-400 font-normal">(Maks 2MB)</span>
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/jpeg,image/png,image/jpg"
                  className="hidden"
                />

                <div className="flex items-center gap-4">
                  {(imagePreview || existingImage) && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                      <img
                        src={imagePreview || (existingImage.startsWith('http') ? existingImage : `http://127.0.0.1:8000/storage/${existingImage}`)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    {imagePreview || existingImage ? 'Ganti Gambar' : 'Pilih Gambar'}
                  </button>
                </div>
                {fieldErrors.image && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.image[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1" htmlFor="description">
                  Deskripsi Proyek & Teknologi yang Digunakan
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="Jelaskan fitur utama, peran Anda, dan stack teknologi yang dipakai..."
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Portofolio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 font-bold text-xl flex items-center justify-center mx-auto mb-4">
              ⚠️
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Hapus Portofolio?</h4>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus portofolio <strong className="text-slate-700">{deleteTarget.title}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidatePortfolio;
