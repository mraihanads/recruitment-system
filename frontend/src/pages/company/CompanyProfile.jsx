import React, { useState, useEffect, useCallback, useRef } from 'react';
import companyService from '../../services/companyService';
import LoadingScreen from '../../components/common/LoadingScreen';
import ErrorState from '../../components/common/ErrorState';

const verificationStatusConfig = {
  verified: {
    label: 'Terverifikasi',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    description: 'Perusahaan Anda telah diverifikasi oleh tim administrator. Anda memiliki akses penuh untuk membuka lowongan.',
    icon: (
      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  approved: {
    label: 'Terverifikasi',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    description: 'Dokumen ini telah disetujui oleh tim verifikator.',
  },
  pending: {
    label: 'Menunggu Verifikasi',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    description: 'Profil & dokumen perusahaan Anda saat ini sedang dalam antrean peninjauan oleh administrator.',
    icon: (
      <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  rejected: {
    label: 'Ditolak',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    description: 'Verifikasi perusahaan ditolak. Silakan periksa kembali keaslian dokumen Anda atau hubungi admin.',
    icon: (
      <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

const resolveMediaUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const clean = path.replace(/^public\//, '');
  return `http://127.0.0.1:8000/storage/${clean}`;
};

const CompanyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    description: '',
    phone: '',
    address: '',
    website: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Logo Upload State
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Document Upload State
  const [showDocModal, setShowDocModal] = useState(false);
  const [docFormData, setDocFormData] = useState({
    document_type: 'NIB (Nomor Induk Berusaha)',
    custom_type: '',
    document_file: null,
  });
  const [docUploading, setDocUploading] = useState(false);
  const [docError, setDocError] = useState('');
  const [deletingDocId, setDeletingDocId] = useState(null);

  const populateForm = (data) => {
    setFormData({
      company_name: data.company_name || '',
      description: data.description || '',
      phone: data.phone || '',
      address: data.address || '',
      website: data.website || '',
    });
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profRes, docRes] = await Promise.all([
        companyService.getProfile(),
        companyService.getDocuments().catch(() => ({ data: [] })),
      ]);

      if (profRes?.data) {
        setProfile(profRes.data);
        populateForm(profRes.data);
      }
      if (docRes?.data) {
        setDocuments(docRes.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat profil perusahaan dari server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Form Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancelEdit = () => {
    if (profile) populateForm(profile);
    setIsEditing(false);
    setFieldErrors({});
    setFeedback({ type: '', message: '' });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    setFeedback({ type: '', message: '' });

    try {
      const res = await companyService.updateProfile(formData);
      if (res?.data) {
        setProfile((prev) => ({ ...prev, ...res.data }));
        populateForm(res.data);
      }
      setIsEditing(false);
      setFeedback({ type: 'success', message: res?.message || 'Profil perusahaan berhasil diperbarui!' });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
        setFeedback({ type: 'error', message: 'Terdapat kesalahan pada isian form, silakan periksa kembali.' });
      } else {
        setFeedback({
          type: 'error',
          message: err.response?.data?.message || 'Gagal memperbarui profil perusahaan.',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // Logo Upload Handlers
  const handleLogoFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      setFeedback({ type: 'error', message: 'Format file logo harus berupa JPG, JPEG, atau PNG.' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'Ukuran file logo maksimal 2MB.' });
      return;
    }

    // Temporary preview
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);

    // Auto upload
    setLogoUploading(true);
    setFeedback({ type: '', message: '' });

    const uploadData = new FormData();
    uploadData.append('logo', file);

    try {
      const res = await companyService.uploadLogo(uploadData);
      if (res?.data) {
        setProfile((prev) => ({
          ...prev,
          logo: res.data.logo,
          logo_url: res.data.logo_url,
        }));
      }
      setFeedback({ type: 'success', message: 'Logo perusahaan berhasil diperbarui!' });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      setLogoPreview(null);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal mengunggah logo perusahaan.',
      });
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Document Upload Handlers
  const handleUploadDocument = async (e) => {
    e.preventDefault();
    setDocError('');

    const resolvedType =
      docFormData.document_type === 'Lainnya'
        ? docFormData.custom_type.trim()
        : docFormData.document_type;

    if (!resolvedType) {
      setDocError('Jenis dokumen wajib diisi.');
      return;
    }
    if (!docFormData.document_file) {
      setDocError('Silakan pilih berkas dokumen yang akan diunggah.');
      return;
    }

    const payload = new FormData();
    payload.append('document_type', resolvedType);
    payload.append('document_file', docFormData.document_file);

    setDocUploading(true);
    try {
      const res = await companyService.uploadDocument(payload);
      if (res?.data) {
        setDocuments((prev) => [res.data, ...prev]);
      }
      setShowDocModal(false);
      setDocFormData({
        document_type: 'NIB (Nomor Induk Berusaha)',
        custom_type: '',
        document_file: null,
      });
      setFeedback({ type: 'success', message: 'Dokumen verifikasi berhasil diunggah!' });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      setDocError(err.response?.data?.message || 'Gagal mengunggah dokumen.');
    } finally {
      setDocUploading(false);
    }
  };

  const handleDeleteDocument = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus dokumen ini?')) return;
    setDeletingDocId(id);
    try {
      await companyService.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setFeedback({ type: 'success', message: 'Dokumen berhasil dihapus.' });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal menghapus dokumen.',
      });
    } finally {
      setDeletingDocId(null);
    }
  };

  if (loading) {
    return <LoadingScreen message="Memuat profil perusahaan..." />;
  }

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <ErrorState
          title="Gagal Memuat Profil Perusahaan"
          message={error || 'Data profil perusahaan tidak dapat diakses.'}
          onRetry={loadData}
        />
      </div>
    );
  }

  const currentStatus = (profile.verification_status || 'pending').toLowerCase();
  const statusConfig = verificationStatusConfig[currentStatus] || verificationStatusConfig.pending;
  const currentLogoSrc = logoPreview || profile.logo_url || resolveMediaUrl(profile.logo);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Decorative background accent */}
        <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-bl from-blue-500/10 via-indigo-500/5 to-transparent rounded-bl-full pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start justify-between gap-6 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 min-w-0">
            {/* Company Logo Section */}
            <div className="relative group shrink-0">
              {currentLogoSrc ? (
                <img
                  src={currentLogoSrc}
                  alt={profile.company_name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-slate-100 shadow-xs"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-3xl flex items-center justify-center shadow-xs">
                  {profile.company_name ? profile.company_name[0].toUpperCase() : 'P'}
                </div>
              )}

              {/* Upload Overlay Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={logoUploading}
                className="absolute inset-0 bg-slate-900/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-bold p-1 text-center"
                title="Unggah Logo Baru"
              >
                {logoUploading ? (
                  <span className="animate-spin text-lg">⏳</span>
                ) : (
                  <>
                    <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Ubah Logo
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                className="hidden"
                onChange={handleLogoFileSelect}
              />
            </div>

            {/* Company Info Header */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Profil Perusahaan
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${statusConfig.color}`}
                  data-testid="company-verification-badge"
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusConfig.dot}`} />
                  {statusConfig.label}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {profile.company_name || 'Nama Perusahaan'}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-slate-500">
                {profile.user?.email && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {profile.user.email}
                  </span>
                )}
                {profile.phone && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {profile.phone}
                  </span>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Kunjungi Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Action Trigger in Header */}
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-2 shrink-0"
              data-testid="edit-profile-btn"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profil Perusahaan
            </button>
          )}
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback.message && (
        <div
          className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback({ type: '', message: '' })}
            className="text-slate-400 hover:text-slate-600 text-base leading-none"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Content Grid: 2 Kolom di Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri / Utama: Detail Profil Form & Dokumen */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Informasi Profil */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
                <span className="w-2 h-5 rounded-full bg-blue-600" />
                Informasi & Biodata Perusahaan
              </h2>
            </div>

            {isEditing ? (
              /* Edit Form Mode */
              <form onSubmit={handleSaveProfile} className="space-y-4" data-testid="company-profile-form">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Perusahaan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    placeholder="Contoh: PT Teknologi Inovasi Nusantara"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    required
                  />
                  {fieldErrors.company_name && (
                    <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.company_name[0]}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor Telepon
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Contoh: 081234567890 atau (021) 555-1234"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                    {fieldErrors.phone && (
                      <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.phone[0]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Website Resmi
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="Contoh: https://perusahaan.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                    {fieldErrors.website && (
                      <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.website[0]}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alamat Lengkap Kantor
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Alamat kantor pusat atau operasional..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                  {fieldErrors.address && (
                    <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.address[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Deskripsi Singkat / Profil Bisnis
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Jelaskan bidang usaha, visi misi, dan profil perusahaan Anda..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed"
                  />
                  {fieldErrors.description && (
                    <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.description[0]}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                  >
                    Batal
                  </button>
                </div>
              </form>
            ) : (
              /* View Mode */
              <div className="space-y-4 text-xs sm:text-sm text-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-xs font-medium mb-0.5">Nama Resmi</span>
                    <span className="font-bold text-slate-900">{profile.company_name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs font-medium mb-0.5">Nomor Telepon</span>
                    <span className="font-semibold text-slate-800">{profile.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs font-medium mb-0.5">Website Resmi</span>
                    {profile.website ? (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-semibold break-all"
                      >
                        {profile.website}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">Belum diisi</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs font-medium mb-0.5">Akun Pengguna</span>
                    <span className="font-semibold text-slate-800">{profile.user?.email || '-'}</span>
                  </div>
                </div>

                <div className="pb-4 border-b border-slate-100">
                  <span className="text-slate-400 block text-xs font-medium mb-1">Alamat Kantor</span>
                  <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                    {profile.address || <span className="text-slate-400 italic">Belum ada alamat kantor yang dicantumkan.</span>}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 block text-xs font-medium mb-1">Tentang Perusahaan</span>
                  <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                    {profile.description || <span className="text-slate-400 italic">Belum ada deskripsi profil perusahaan.</span>}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Card: Dokumen Verifikasi Perusahaan (Requirement 5) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
                  <span className="w-2 h-5 rounded-full bg-emerald-600" />
                  Dokumen Legalitas & Verifikasi
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Unggah dokumen resmi seperti NIB, SIUP, atau Akta untuk mempercepat proses verifikasi akun.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDocModal(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 shrink-0"
                data-testid="upload-document-btn"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Unggah Dokumen
              </button>
            </div>

            {/* List Documents */}
            {documents.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-xs font-semibold text-slate-600">Belum ada dokumen verifikasi yang diunggah.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Klik tombol &quot;Unggah Dokumen&quot; di atas untuk melampirkan berkas legalitas perusahaan.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => {
                  const docStatus = (doc.verification_status || 'pending').toLowerCase();
                  const badge = verificationStatusConfig[docStatus] || verificationStatusConfig.pending;
                  const docUrl = doc.document_url || resolveMediaUrl(doc.document_file);

                  return (
                    <div
                      key={doc.id}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {doc.document_type}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Diunggah: {formatDate(doc.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${badge.color}`}>
                          {badge.label}
                        </span>

                        {docUrl && (
                          <a
                            href={docUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white transition-colors"
                          >
                            Buka File
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc.id)}
                          disabled={deletingDocId === doc.id}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                          title="Hapus Dokumen"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan / Sidebar: Panduan & Status Verifikasi */}
        <div className="space-y-6">
          {/* Card: Status Akun */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Status Verifikasi Akun
            </h3>

            <div className={`p-4 rounded-2xl border ${statusConfig.color} space-y-2`}>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${statusConfig.dot}`} />
                <span className="text-sm font-extrabold">{statusConfig.label}</span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">
                {statusConfig.description}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-2">
              <p className="font-semibold text-slate-700">Keuntungan Akun Terverifikasi:</p>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>Badge verified pada profil & lowongan</li>
                <li>Lowongan dipromosikan ke pencarian kandidat</li>
                <li>Kepercayaan pelamar lebih tinggi</li>
              </ul>
            </div>
          </div>

          {/* Card: Panduan Dokumen */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Ketentuan Dokumen
            </h3>
            <ul className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Format yang diterima: <strong>PDF, JPG, JPEG, PNG</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Ukuran file maksimal <strong>5 MB</strong> per dokumen.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Pastikan teks dan stempel terlihat jelas serta tidak terpotong.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Upload Document Modal */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Unggah Dokumen Legalitas
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowDocModal(false);
                  setDocError('');
                }}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {docError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {docError}
              </div>
            )}

            <form onSubmit={handleUploadDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jenis Dokumen <span className="text-rose-500">*</span>
                </label>
                <select
                  value={docFormData.document_type}
                  onChange={(e) =>
                    setDocFormData((prev) => ({ ...prev, document_type: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  <option value="NIB (Nomor Induk Berusaha)">NIB (Nomor Induk Berusaha)</option>
                  <option value="SIUP (Surat Izin Usaha Perdagangan)">SIUP (Surat Izin Usaha Perdagangan)</option>
                  <option value="NPWP Perusahaan">NPWP Perusahaan</option>
                  <option value="Akta Pendirian Perusahaan">Akta Pendirian Perusahaan</option>
                  <option value="Tanda Daftar Perusahaan (TDP)">Tanda Daftar Perusahaan (TDP)</option>
                  <option value="Lainnya">Dokumen Lainnya (Ketik Manual)</option>
                </select>
              </div>

              {docFormData.document_type === 'Lainnya' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Dokumen Kustom <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={docFormData.custom_type}
                    onChange={(e) =>
                      setDocFormData((prev) => ({ ...prev, custom_type: e.target.value }))
                    }
                    placeholder="Contoh: Surat Keterangan Domisili Usaha"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Berkas Dokumen <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  onChange={(e) =>
                    setDocFormData((prev) => ({
                      ...prev,
                      document_file: e.target.files?.[0] || null,
                    }))
                  }
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">Maksimal 5MB (PDF, JPG, PNG)</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowDocModal(false);
                    setDocError('');
                  }}
                  disabled={docUploading}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={docUploading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {docUploading ? 'Mengunggah...' : 'Unggah Dokumen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyProfile;
