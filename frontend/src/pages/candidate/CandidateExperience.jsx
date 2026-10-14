import React, { useState, useEffect, useCallback } from 'react';
import candidateService from '../../services/candidateService';
import ProfileTabs from '../../components/candidate/ProfileTabs';
import SectionCard from '../../components/dashboard/SectionCard';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

const initialForm = {
  company_name: '',
  position: '',
  start_date: '',
  end_date: '',
  description: '',
  is_current: false,
};

const CandidateExperience = () => {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form / Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });

  // Delete target
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchExperiences = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await candidateService.getExperiences();
      setExperiences(res.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Gagal memuat data pengalaman kerja dari server.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExperiences();
  }, [fetchExperiences]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData(initialForm);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setFormData({
      company_name: item.company_name || '',
      position: item.position || '',
      start_date: item.start_date ? item.start_date.substring(0, 10) : '',
      end_date: item.end_date ? item.end_date.substring(0, 10) : '',
      description: item.description || '',
      is_current: !item.end_date,
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
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setFeedbackMessage({ type: '', text: '' });

    // Payload adjustment for current position
    const payload = {
      company_name: formData.company_name,
      position: formData.position,
      start_date: formData.start_date,
      end_date: formData.is_current ? null : formData.end_date || null,
      description: formData.description,
    };

    // Frontend validation: end_date >= start_date
    if (payload.start_date && payload.end_date && payload.end_date < payload.start_date) {
      setFieldErrors({ end_date: ['Tanggal selesai tidak boleh lebih awal dari tanggal mulai.'] });
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await candidateService.updateExperience(editingId, payload);
        setFeedbackMessage({ type: 'success', text: 'Pengalaman kerja berhasil diperbarui.' });
      } else {
        await candidateService.createExperience(payload);
        setFeedbackMessage({ type: 'success', text: 'Pengalaman kerja berhasil ditambahkan.' });
      }
      closeModal();
      fetchExperiences();
      setTimeout(() => setFeedbackMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
      } else {
        setFeedbackMessage({
          type: 'error',
          text: err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data pengalaman.',
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
      await candidateService.deleteExperience(deleteTarget.id);
      setDeleteTarget(null);
      setFeedbackMessage({ type: 'success', text: 'Pengalaman kerja berhasil dihapus.' });
      fetchExperiences();
      setTimeout(() => setFeedbackMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      setFeedbackMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal menghapus pengalaman kerja.',
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
        title="Pengalaman Kerja"
        subtitle="Daftar rekam jejak karir profesional dan kontribusi Anda di perusahaan sebelumnya"
        action={
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Pengalaman
          </button>
        }
      >
        {loading ? (
          <LoadingScreen message="Memuat daftar pengalaman kerja..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchExperiences} />
        ) : experiences.length === 0 ? (
          <EmptyState
            title="Belum Ada Pengalaman Kerja"
            description="Tambahkan pengalaman kerja atau magang Anda untuk menarik perhatian recruiter."
            actionLabel="+ Tambah Pengalaman Sekarang"
            onAction={openAddModal}
          />
        ) : (
          <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 my-2">
            {experiences.map((exp) => (
              <div key={exp.id} className="relative group">
                {/* Timeline Bullet */}
                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-blue-50"></div>

                <div className="p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-blue-200 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      {exp.position}
                    </h4>
                    <p className="text-sm font-semibold text-blue-600 mt-0.5">
                      🏢 {exp.company_name}
                    </p>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      📅 {exp.start_date?.substring(0, 7) || exp.start_date} s/d {exp.end_date ? exp.end_date.substring(0, 7) : 'Sekarang (Aktif)'}
                    </p>
                    {exp.description && (
                      <p className="text-xs text-slate-600 mt-3 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {exp.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                    <button
                      onClick={() => openEditModal(exp)}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Pengalaman"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(exp)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Hapus Pengalaman"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Modal Form Tambah / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-lg font-bold text-slate-800">
                {editingId ? 'Edit Pengalaman Kerja' : 'Tambah Pengalaman Kerja'}
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
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1" htmlFor="company_name">
                  Nama Perusahaan <span className="text-rose-500">*</span>
                </label>
                <input
                  id="company_name"
                  name="company_name"
                  type="text"
                  required
                  placeholder="PT Teknologi Solusi"
                  value={formData.company_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                {fieldErrors.company_name && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.company_name[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1" htmlFor="position">
                  Posisi / Jabatan <span className="text-rose-500">*</span>
                </label>
                <input
                  id="position"
                  name="position"
                  type="text"
                  required
                  placeholder="Backend Developer"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                {fieldErrors.position && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.position[0]}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1" htmlFor="start_date">
                    Tanggal Mulai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="start_date"
                    name="start_date"
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  {fieldErrors.start_date && (
                    <p className="text-xs text-rose-600 mt-1">{fieldErrors.start_date[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1" htmlFor="end_date">
                    Tanggal Selesai
                  </label>
                  <input
                    id="end_date"
                    name="end_date"
                    type="date"
                    disabled={formData.is_current}
                    value={formData.is_current ? '' : formData.end_date}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                  {fieldErrors.end_date && (
                    <p className="text-xs text-rose-600 mt-1">{fieldErrors.end_date[0]}</p>
                  )}
                </div>
              </div>

              {/* Checkbox Masih Bekerja */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="is_current"
                  name="is_current"
                  type="checkbox"
                  checked={formData.is_current}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="is_current" className="text-xs font-semibold text-slate-700 select-none cursor-pointer">
                  Saya saat ini masih bekerja di posisi ini
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1" htmlFor="description">
                  Deskripsi Pekerjaan & Pencapaian
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="Menjelaskan tanggung jawab utama dan pencapaian selama bertugas..."
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
                  {submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Pengalaman'}
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
            <h4 className="text-base font-bold text-slate-900 mb-2">Hapus Pengalaman Kerja?</h4>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus pengalaman di <strong className="text-slate-700">{deleteTarget.company_name}</strong>? Tindakan ini tidak dapat dibatalkan.
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

export default CandidateExperience;
