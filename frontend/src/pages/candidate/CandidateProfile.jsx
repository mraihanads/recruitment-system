import React, { useState, useEffect, useCallback } from 'react';
import candidateService from '../../services/candidateService';
import ProfileHeader from '../../components/candidate/ProfileHeader';
import ProfileTabs from '../../components/candidate/ProfileTabs';
import SectionCard from '../../components/dashboard/SectionCard';
import LoadingScreen from '../../components/common/LoadingScreen';
import ErrorState from '../../components/common/ErrorState';

const CandidateProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit form state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    gender: '',
    birth_date: '',
    address: '',
    bio: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await candidateService.getProfile();
      if (res?.data) {
        setProfile(res.data);
        populateForm(res.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Gagal memuat profil kandidat dari server.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const populateForm = (data) => {
    setFormData({
      full_name: data.full_name || '',
      phone: data.phone || '',
      gender: data.gender || '',
      birth_date: data.birth_date ? data.birth_date.substring(0, 10) : '',
      address: data.address || '',
      bio: data.bio || '',
    });
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCancel = () => {
    if (profile) populateForm(profile);
    setIsEditing(false);
    setFieldErrors({});
    setSaveError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    setSaveError('');
    setSaveSuccess('');

    try {
      const res = await candidateService.updateProfile(formData);
      setProfile(res.data);
      populateForm(res.data);
      setSaveSuccess(res?.message || 'Profil berhasil diperbarui.');
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
        setSaveError('Silakan periksa kembali data yang dimasukkan.');
      } else {
        setSaveError(
          err.response?.data?.message ||
          'Terjadi kesalahan saat menyimpan profil.'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Memuat informasi biodata kandidat..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchProfile} />;
  }

  return (
    <div>
      {/* Profile Header with Avatar & CV Actions */}
      <ProfileHeader
        profile={profile}
        onPhotoUpdated={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
        onCvUpdated={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
      />

      {/* Tabs */}
      <ProfileTabs />

      {/* Success Notification */}
      {saveSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">{saveSuccess}</span>
        </div>
      )}

      {/* Error Notification */}
      {saveError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{saveError}</span>
        </div>
      )}

      {/* Form Section */}
      <SectionCard
        title="Informasi Pribadi & Kontak"
        subtitle="Kelola data identitas diri dan informasi kontak Anda"
        action={
          !isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit Biodata
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          )
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5" htmlFor="full_name">
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                disabled={!isEditing}
                value={formData.full_name}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all ${
                  isEditing
                    ? fieldErrors.full_name
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'
                }`}
              />
              {fieldErrors.full_name && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.full_name[0]}</p>
              )}
            </div>

            {/* Email (Read-Only) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5" htmlFor="email">
                Alamat Email <span className="text-slate-400 font-normal">(Akun Utama)</span>
              </label>
              <input
                id="email"
                type="email"
                readOnly
                disabled
                value={profile?.user?.email || ''}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-400 mt-1">Email terikat pada akun login dan tidak dapat diubah di sini.</p>
            </div>

            {/* Nomor Telepon */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5" htmlFor="phone">
                Nomor Telepon / WhatsApp
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                disabled={!isEditing}
                placeholder="08xxxxxxxxxx"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all ${
                  isEditing
                    ? fieldErrors.phone
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'
                }`}
              />
              {fieldErrors.phone && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.phone[0]}</p>
              )}
            </div>

            {/* Jenis Kelamin */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5" htmlFor="gender">
                Jenis Kelamin
              </label>
              <select
                id="gender"
                name="gender"
                disabled={!isEditing}
                value={formData.gender}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all ${
                  isEditing
                    ? 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'
                }`}
              >
                <option value="">-- Pilih Jenis Kelamin --</option>
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
              </select>
              {fieldErrors.gender && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.gender[0]}</p>
              )}
            </div>

            {/* Tanggal Lahir */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5" htmlFor="birth_date">
                Tanggal Lahir
              </label>
              <input
                id="birth_date"
                name="birth_date"
                type="date"
                disabled={!isEditing}
                value={formData.birth_date}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all ${
                  isEditing
                    ? 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'
                }`}
              />
              {fieldErrors.birth_date && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.birth_date[0]}</p>
              )}
            </div>

            {/* Alamat */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5" htmlFor="address">
                Alamat Domisili
              </label>
              <input
                id="address"
                name="address"
                type="text"
                disabled={!isEditing}
                placeholder="Kota / Alamat lengkap"
                value={formData.address}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all ${
                  isEditing
                    ? 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'
                }`}
              />
              {fieldErrors.address && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.address[0]}</p>
              )}
            </div>
          </div>

          {/* Bio / Ringkasan Diri */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5" htmlFor="bio">
              Bio / Ringkasan Profil Singkat
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              disabled={!isEditing}
              placeholder="Ceritakan tentang keahlian utama, pengalaman profesional, dan minat karir Anda..."
              value={formData.bio}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all ${
                isEditing
                  ? 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'
              }`}
            />
            {fieldErrors.bio && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.bio[0]}</p>
            )}
          </div>

          {isEditing && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          )}
        </form>
      </SectionCard>
    </div>
  );
};

export default CandidateProfile;
