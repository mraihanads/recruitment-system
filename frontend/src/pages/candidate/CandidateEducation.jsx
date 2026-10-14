import React, { useState, useEffect, useCallback } from 'react';
import candidateService from '../../services/candidateService';
import ProfileTabs from '../../components/candidate/ProfileTabs';
import SectionCard from '../../components/dashboard/SectionCard';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

const initialForm = {
  institution: '',
  degree: '',
  major: '',
  start_year: '',
  end_year: '',
  description: '',
};

const CandidateEducation = () => {
  const [educations, setEducations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEducations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await candidateService.getEducations();
      setEducations(res.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Gagal memuat data riwayat pendidikan dari server.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEducations();
  }, [fetchEducations]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData(initialForm);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setFormData({
      institution: item.institution || '',
      degree: item.degree || '',
      major: item.major || '',
      start_year: item.start_year || '',
      end_year: item.end_year || '',
      description: item.description || '',
    });
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(initialForm);
    setFieldErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setFeedbackMessage({ type: '', text: '' });

    // Frontend validation: end_year >= start_year
    const startY = parseInt(formData.start_year, 10);
    const endY = formData.end_year ? parseInt(formData.end_year, 10) : null;
    if (endY && startY && endY < startY) {
      setFieldErrors({ end_year: ['Tahun selesai tidak boleh lebih kecil dari tahun mulai.'] });
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await candidateService.updateEducation(editingId, formData);
        setFeedbackMessage({ type: 'success', text: 'Riwayat pendidikan berhasil diperbarui.' });
      } else {
        await candidateService.createEducation(formData);
        setFeedbackMessage({ type: 'success', text: 'Riwayat pendidikan baru berhasil ditambahkan.' });
      }
      closeModal();
      fetchEducations();
      setTimeout(() => setFeedbackMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
      } else {
        setFeedbackMessage({
          type: 'error',
          text: err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data pendidikan.',
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
      await candidateService.deleteEducation(deleteTarget.id);
      setDeleteTarget(null);
      setFeedbackMessage({ type: 'success', text: 'Riwayat pendidikan berhasil dihapus.' });
      fetchEducations();
      setTimeout(() => setFeedbackMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      setFeedbackMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal menghapus riwayat pendidikan.',
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
        title="Riwayat Pendidikan"
        subtitle="Tambahkan latar belakang akademis mulai dari tingkat SMA/SMK, Sarjana, hingga Pascasarjana"
        action={
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Pendidikan
          </button>
        }
      >
        {loading ? (
          <LoadingScreen message="Memuat daftar pendidikan..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchEducations} />
        ) : educations.length === 0 ? (
          <EmptyState
            title="Belum Ada Riwayat Pendidikan"
            description="Tambahkan data pendidikan Anda untuk meningkatkan peluang pencocokan lowongan kerja."
            actionLabel="+ Tambah Pendidikan Sekarang"
            onAction={openAddModal}
          />
        ) : (
          <div className="space-y-4">
            {educations.map((edu) => (
              <div
                key={edu.id}
                className="p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-blue-200 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center shrink-0 border border-blue-100">
                    🎓
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      {edu.institution}
                    </h4>
                    <p className="text-sm font-semibold text-slate-700 mt-0.5">
                      {edu.degree} — {edu.major}
                    </p>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      📅 {edu.start_year} - {edu.end_year || 'Sekarang'}
                    </p>
                    {edu.description && (
                      <p className="text-xs text-slate-600 mt-3 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {edu.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                  <button
                    onClick={() => openEditModal(edu)}
                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Pendidikan"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(edu)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Hapus Pendidikan"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Modal Form Tambah / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-lg font-bold text-slate-800">
                {editingId ? 'Edit Riwayat Pendidikan' : 'Tambah Riwayat Pendidikan'}
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
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1" htmlFor="institution">
                  Nama Institusi / Universitas <span className="text-rose-500">*</span>
                </label>
                <input
                  id="institution"
                  name="institution"
                  type="text"
                  required
                  placeholder="Contoh: Universitas Indonesia"
                  value={formData.institution}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                {fieldErrors.institution && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.institution[0]}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1" htmlFor="degree">
                    Jenjang <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="degree"
                    name="degree"
                    type="text"
                    required
                    placeholder="S1, D4, D3, SMA"
                    value={formData.degree}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  {fieldErrors.degree && (
                    <p className="text-xs text-rose-600 mt-1">{fieldErrors.degree[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1" htmlFor="major">
                    Jurusan / Program Studi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="major"
                    name="major"
                    type="text"
                    required
                    placeholder="Teknik Informatika"
                    value={formData.major}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  {fieldErrors.major && (
                    <p className="text-xs text-rose-600 mt-1">{fieldErrors.major[0]}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1" htmlFor="start_year">
                    Tahun Mulai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="start_year"
                    name="start_year"
                    type="number"
                    required
                    min={1950}
                    max={new Date().getFullYear() + 5}
                    placeholder="2019"
                    value={formData.start_year}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  {fieldErrors.start_year && (
                    <p className="text-xs text-rose-600 mt-1">{fieldErrors.start_year[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1" htmlFor="end_year">
                    Tahun Selesai <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    id="end_year"
                    name="end_year"
                    type="number"
                    min={1950}
                    placeholder="2023"
                    value={formData.end_year}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  {fieldErrors.end_year && (
                    <p className="text-xs text-rose-600 mt-1">{fieldErrors.end_year[0]}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1" htmlFor="description">
                  Deskripsi / IPK / Prestasi
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="IPK 3.85, fokus pada riset web modern..."
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
                  {submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Pendidikan'}
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
            <h4 className="text-base font-bold text-slate-900 mb-2">Hapus Riwayat Pendidikan?</h4>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus pendidikan di <strong className="text-slate-700">{deleteTarget.institution}</strong>? Tindakan ini tidak dapat dibatalkan.
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

export default CandidateEducation;
