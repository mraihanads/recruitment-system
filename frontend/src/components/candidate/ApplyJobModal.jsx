import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import candidateService from '../../services/candidateService';

const ApplyJobModal = ({
  isOpen,
  onClose,
  job,
  matchData,
  candidateProfile,
  onApplySuccess,
}) => {
  const [coverLetterFiles, setCoverLetterFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !job) return null;

  const matchPercentage = matchData?.match_percentage ?? 0;
  const hasCv = Boolean(candidateProfile?.cv_file);

  const missingBiodata = [];
  if (!candidateProfile?.full_name?.trim()) missingBiodata.push('Nama Lengkap');
  if (!candidateProfile?.phone?.trim()) missingBiodata.push('Nomor Telepon');
  if (!candidateProfile?.gender) missingBiodata.push('Jenis Kelamin');
  if (!candidateProfile?.birth_date) missingBiodata.push('Tanggal Lahir');
  if (!candidateProfile?.address?.trim()) missingBiodata.push('Alamat Domisili');
  if (!candidateProfile?.bio?.trim()) missingBiodata.push('Ringkasan Profil (Bio)');

  const isBiodataComplete = missingBiodata.length === 0;
  const canApply = isBiodataComplete && hasCv && coverLetterFiles.length > 0;

  const handleAddFiles = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    setCoverLetterFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const newUnique = selected.filter((f) => !existingNames.has(f.name));
      return [...prev, ...newUnique];
    });
    e.target.value = '';
  };

  const handleRemoveFile = (indexToRemove) => {
    setCoverLetterFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isBiodataComplete) {
      setErrorMessage(`Silakan lengkapi biodata Anda terlebih dahulu (${missingBiodata.join(', ')}) di menu Profil sebelum melamar.`);
      return;
    }

    if (!hasCv) {
      setErrorMessage('Anda belum mengunggah CV. Silakan unggah CV terlebih dahulu di menu Profil sebelum melamar.');
      return;
    }

    if (coverLetterFiles.length === 0) {
      setErrorMessage('Silakan unggah minimal 1 berkas Surat Lamaran / Dokumen Persyaratan yang diminta perusahaan.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      coverLetterFiles.forEach((file) => {
        payload.append('cover_letter_files[]', file, file.name);
      });

      const res = await candidateService.applyJob(job.id, payload);
      if (res?.success) {
        setCoverLetterFiles([]);
        onApplySuccess(res.data);
      } else {
        setErrorMessage(res?.message || 'Gagal mengirimkan lamaran. Silakan coba lagi.');
      }
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.message) {
        setErrorMessage(resp.message);
      } else if (err.response?.status === 422) {
        setErrorMessage('Data lamaran tidak valid atau persyaratan belum terpenuhi.');
      } else if (err.response?.status === 401) {
        setErrorMessage('Sesi telah berakhir. Silakan login kembali.');
      } else if (err.response?.status === 403) {
        setErrorMessage('Akses ditolak. Anda tidak memiliki izin untuk melamar.');
      } else {
        setErrorMessage('Terjadi kesalahan jaringan saat mengirim lamaran.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Konfirmasi Lamaran Kerja</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kirimkan resume dan surat lamaran Anda ke perusahaan
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Job Info Summary */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{job.title}</h4>
                <p className="text-xs font-semibold text-slate-500">{job.company?.company_name}</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700">
                {job.location || 'Indonesia'}
              </span>
            </div>

            {/* Skill Match Preview */}
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Kecocokan Keterampilan (Skill Match):</span>
              <span
                className={`font-bold px-2 py-0.5 rounded-md ${
                  matchPercentage >= 75
                    ? 'bg-emerald-100 text-emerald-700'
                    : matchPercentage >= 50
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {matchPercentage}% Match
              </span>
            </div>
          </div>

          {/* Biodata Completeness Section */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Status Kelengkapan Biodata Diri
            </label>
            {isBiodataComplete ? (
              <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      Biodata Diri Lengkap
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      {candidateProfile.full_name} • {candidateProfile.phone}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-white px-2 py-1 rounded-md border border-emerald-200">
                  Lengkap
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-800 space-y-1.5">
                <p className="font-bold text-amber-900">
                  Biodata diri Anda belum lengkap!
                </p>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Wajib dilengkapi sebelum melamar: <strong>{missingBiodata.join(', ')}</strong>.
                </p>
                <Link
                  to="/candidate/profile"
                  className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 underline pt-0.5"
                >
                  Lengkapi Biodata di Menu Profil &rarr;
                </Link>
              </div>
            )}
          </div>

          {/* CV Section */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              CV / Resume yang Digunakan
            </label>
            {hasCv ? (
              <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {candidateProfile.cv_file.split('/').pop()}
                    </p>
                    <p className="text-[11px] text-emerald-700">CV Profil Aktif terpasang</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-white px-2 py-1 rounded-md border border-emerald-200">
                  Siap
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-800 space-y-2">
                <p className="font-semibold">
                  Anda belum mengunggah dokumen CV di profil Anda.
                </p>
                <Link
                  to="/candidate/profile"
                  className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 underline"
                >
                  Buka Profil untuk Upload CV &rarr;
                </Link>
              </div>
            )}
          </div>

          {/* Cover Letter / Requirements Multi-File Upload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="cover-letter-file" className="block text-xs font-bold text-slate-700">
                Unggah Surat Lamaran & Berkas Persyaratan <span className="text-rose-500">*</span>
              </label>
              {coverLetterFiles.length > 0 ? (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ✓ {coverLetterFiles.length} Berkas Dipilih
                </span>
              ) : (
                <span className="text-[11px] text-amber-600 font-semibold">Wajib Diunggah</span>
              )}
            </div>

            {job.requirements && (
              <div className="mb-2.5 p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-[11px] text-slate-600">
                <span className="font-bold text-blue-900 block mb-0.5">Persyaratan yang Diminta Perusahaan:</span>
                <p className="whitespace-pre-line line-clamp-3 leading-relaxed">{job.requirements}</p>
              </div>
            )}

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="cover-letter-file"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {coverLetterFiles.length > 0 ? 'Tambah Berkas Lainnya' : 'Pilih Berkas (Bisa Banyak File)'}
                </label>
                <input
                  id="cover-letter-file"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                  onChange={handleAddFiles}
                  disabled={submitting}
                  className="hidden"
                />
                <span className="text-[11px] text-slate-400">
                  Bisa pilih beberapa file sekaligus
                </span>
              </div>

              {coverLetterFiles.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {coverLetterFiles.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white border border-emerald-200 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        disabled={submitting}
                        className="text-rose-500 hover:text-rose-700 font-bold text-xs px-1.5 py-0.5 rounded hover:bg-rose-50 shrink-0"
                        title="Hapus berkas ini"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[11px] text-slate-400">
                Lampirkan Surat Lamaran beserta dokumen persyaratan yang diminta perusahaan seperti Ijazah, Transkrip, Sertifikat, dll. (Format: PDF, DOC, DOCX, JPG, PNG, ZIP — Maks 10MB/file).
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || !canApply}
              className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all ${
                submitting || !canApply
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
              }`}
            >
              {submitting ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Mengirimkan Lamaran...
                </>
              ) : (
                'Kirim Lamaran Sekarang'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyJobModal;
