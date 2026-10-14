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
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !job) return null;

  const matchPercentage = matchData?.match_percentage ?? 0;
  const hasCv = Boolean(candidateProfile?.cv_file);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!hasCv) {
      setErrorMessage('Anda belum mengunggah CV. Silakan unggah CV terlebih dahulu di menu Profil sebelum melamar.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        cover_letter: coverLetter.trim() || null,
      };

      const res = await candidateService.applyJob(job.id, payload);
      if (res?.success) {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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

          {/* Cover Letter Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="cover-letter" className="block text-xs font-bold text-slate-700">
                Surat Lamaran (Cover Letter)
              </label>
              <span className="text-[11px] text-slate-400 font-medium">Opsional</span>
            </div>
            <textarea
              id="cover-letter"
              rows={4}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Jelaskan secara singkat alasan Anda tertarik dan kualifikasi yang Anda miliki untuk posisi ini..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 placeholder:text-slate-400 transition-all resize-none"
              disabled={submitting}
            />
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
              disabled={submitting || !hasCv}
              className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all ${
                submitting || !hasCv
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
