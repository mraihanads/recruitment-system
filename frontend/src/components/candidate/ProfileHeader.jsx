import React, { useRef, useState } from 'react';
import candidateService from '../../services/candidateService';

const ProfileHeader = ({ profile, onPhotoUpdated, onCvUpdated }) => {
  const photoInputRef = useRef(null);
  const cvInputRef = useRef(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [cvLoading, setCvLoading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [cvError, setCvError] = useState('');
  const [photoSuccess, setPhotoSuccess] = useState('');
  const [cvSuccess, setCvSuccess] = useState('');

  const handlePhotoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPhotoError('');
    setPhotoSuccess('');

    // Frontend validation: max 2MB, JPG/JPEG/PNG
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setPhotoError('Format foto harus berupa JPG, JPEG, atau PNG.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Ukuran foto melebihi batas maksimal 2MB.');
      return;
    }

    setPhotoLoading(true);
    try {
      const res = await candidateService.uploadPhoto(file);
      setPhotoSuccess(res?.message || 'Foto profil berhasil diperbarui.');
      if (onPhotoUpdated) onPhotoUpdated(res.data);
    } catch (err) {
      setPhotoError(
        err.response?.data?.message ||
        err.response?.data?.errors?.photo?.[0] ||
        'Gagal mengunggah foto profil.'
      );
    } finally {
      setPhotoLoading(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleCvSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCvError('');
    setCvSuccess('');

    // Frontend validation: max 5MB, PDF/DOC/DOCX
    const allowedExts = ['.pdf', '.doc', '.docx'];
    const fileName = file.name.toLowerCase();
    const hasValidExt = allowedExts.some((ext) => fileName.endsWith(ext));

    if (!hasValidExt) {
      setCvError('Format file CV harus berupa PDF, DOC, atau DOCX.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCvError('Ukuran file CV melebihi batas maksimal 5MB.');
      return;
    }

    setCvLoading(true);
    try {
      const res = await candidateService.uploadCv(file);
      setCvSuccess(res?.message || 'File CV berhasil diunggah.');
      if (onCvUpdated) onCvUpdated(res.data);
    } catch (err) {
      setCvError(
        err.response?.data?.message ||
        err.response?.data?.errors?.cv_file?.[0] ||
        'Gagal mengunggah file CV.'
      );
    } finally {
      setCvLoading(false);
      if (cvInputRef.current) cvInputRef.current.value = '';
    }
  };

  const photoUrl = profile?.photo_url || (profile?.photo ? `http://127.0.0.1:8000/storage/${profile.photo}` : null);
  const cvUrl = profile?.cv_url || (profile?.cv_file ? `http://127.0.0.1:8000/storage/${profile.cv_file}` : null);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        {/* Left: Avatar + Details */}
        <div className="flex items-center gap-5">
          {/* Avatar with Camera Overlay */}
          <div className="relative group shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center overflow-hidden shadow-md ring-4 ring-blue-50">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={profile?.full_name || 'Kandidat'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{profile?.full_name?.[0] || 'K'}</span>
              )}
            </div>

            {/* Hidden Input & Upload Button */}
            <input
              type="file"
              ref={photoInputRef}
              onChange={handlePhotoSelect}
              accept="image/jpeg,image/png,image/jpg"
              className="hidden"
            />
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={photoLoading}
              title="Ganti foto profil (Maks 2MB)"
              className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-white text-slate-700 hover:text-blue-600 border border-slate-200 shadow-sm flex items-center justify-center transition-all hover:scale-105"
            >
              {photoLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>

          {/* Text Info */}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {profile?.full_name || 'Profil Kandidat'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Aktif
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5 font-medium">
              {profile?.user?.email || ''}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 font-medium">
              {profile?.phone && <span>📞 {profile.phone}</span>}
              {profile?.gender && <span className="capitalize">⚧ {profile.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</span>}
              {profile?.address && <span>📍 {profile.address}</span>}
            </div>
          </div>
        </div>

        {/* Right: CV Badge & Upload Action */}
        <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
          <input
            type="file"
            ref={cvInputRef}
            onChange={handleCvSelect}
            accept=".pdf,.doc,.docx"
            className="hidden"
          />

          <div className="flex items-center gap-2">
            {cvUrl ? (
              <a
                href={cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-xl border border-blue-200 flex items-center gap-1.5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Lihat / Unduh CV
              </a>
            ) : (
              <span className="px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-semibold rounded-xl border border-slate-200">
                Belum Ada CV
              </span>
            )}

            <button
              onClick={() => cvInputRef.current?.click()}
              disabled={cvLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {cvLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Mengunggah...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>{cvUrl ? 'Ganti CV' : 'Upload CV'}</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">Format: PDF, DOC, DOCX (Maks 5MB)</p>
        </div>
      </div>

      {/* Messages */}
      {(photoError || cvError) && (
        <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {photoError || cvError}
        </div>
      )}
      {(photoSuccess || cvSuccess) && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
          {photoSuccess || cvSuccess}
        </div>
      )}
    </div>
  );
};

export default ProfileHeader;
