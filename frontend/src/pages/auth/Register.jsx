import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'candidate', // Only 'candidate' or 'company' allowed
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const res = await register(formData);
      setSuccessMessage(res?.message || 'Pendaftaran berhasil! Mengalihkan ke halaman login...');

      // Redirect to /login after successful registration
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } catch (err) {
      if (err.response) {
        const { status, data } = err.response;
        if (status === 422) {
          setErrorMessage(data?.message || 'Validasi data pendaftaran gagal.');
          if (data?.errors) {
            setFieldErrors(data.errors);
          }
        } else {
          setErrorMessage(data?.message || 'Gagal melakukan pendaftaran. Silakan coba lagi.');
        }
      } else if (err.request) {
        setErrorMessage('Gagal terhubung ke server backend.');
      } else {
        setErrorMessage('Terjadi kesalahan yang tidak terduga.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCompany = formData.role === 'company';

  return (
    <div className="min-h-screen bg-[#f8fafc] relative flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Subtle Dot-Matrix Texture & Soft Top Wash */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-blue-50/80 via-blue-50/20 to-transparent pointer-events-none" />

      {/* Back to Home Link */}
      <div className="relative z-10 w-full max-w-[480px] mb-4 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Beranda
        </Link>
      </div>

      {/* Main Centered Auth Card */}
      <div className="relative z-10 w-full max-w-[480px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.1)] overflow-hidden">
        {/* Refined Top Accent Strip */}
        <div className="h-1 w-full bg-gradient-to-r from-slate-900 via-blue-600 to-slate-900" />

        <div className="p-7 sm:p-9">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-13 h-13 rounded-xl bg-slate-50 border border-slate-200/90 shadow-2xs p-2.5 mx-auto mb-4 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="JobConnect"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-slate-950 tracking-tight">
              Buat Akun Baru
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Daftar sebagai Pencari Kerja atau Perusahaan di JobConnect
            </p>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
              <svg className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="leading-relaxed font-medium">{successMessage}</span>
            </div>
          )}

          {/* Global Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <svg className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Sleek Segmented Role Switcher */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Daftar Sebagai
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200/70">
                <label
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold cursor-pointer transition-all ${!isCompany
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="candidate"
                    checked={!isCompany}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Pencari Kerja</span>
                </label>

                <label
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold cursor-pointer transition-all ${isCompany
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="company"
                    checked={isCompany}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                  </svg>
                  <span>Perusahaan</span>
                </label>
              </div>
              {fieldErrors.role && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.role[0]}</p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="name">
                {isCompany ? 'Nama Perusahaan / PIC' : 'Nama Lengkap'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isCompany ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    )}
                  </svg>
                </span>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={isCompany ? 'Contoh: PT Reyy Digital Group' : 'Masukkan nama lengkap'}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 bg-slate-50/40 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 ${fieldErrors.name
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                      : 'border-slate-200/90 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10'
                    }`}
                />
              </div>
              {fieldErrors.name && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.name[0]}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="nama@email.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 bg-slate-50/40 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 ${fieldErrors.email
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                      : 'border-slate-200/90 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10'
                    }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.email[0]}</p>
              )}
            </div>

            {/* Password & Confirmation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimal 8 karakter"
                    className={`w-full px-3.5 pr-9 py-2.5 rounded-xl border text-sm text-slate-900 bg-slate-50/40 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 ${fieldErrors.password
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                        : 'border-slate-200/90 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {showPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" />
                      ) : (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.password[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="password_confirmation">
                  Konfirmasi Password
                </label>
                <input
                  id="password_confirmation"
                  name="password_confirmation"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  placeholder="Ulangi password"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-slate-50/40 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 ${fieldErrors.password_confirmation
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                      : 'border-slate-200/90 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10'
                    }`}
                />
                {fieldErrors.password_confirmation && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.password_confirmation[0]}</p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Mendaftarkan...</span>
                  </>
                ) : (
                  <span>Daftar Sekarang</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Distinct Subtle Card Footer */}
        <div className="bg-slate-50/90 border-t border-slate-100 px-7 py-4 text-center">
          <p className="text-xs sm:text-sm text-slate-600">
            Sudah memiliki akun?{' '}
            <Link to="/login" className="font-semibold text-blue-700 hover:text-blue-800 hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>

      {/* Subtle Copyright */}
      <p className="relative z-10 mt-6 text-[11px] text-slate-400">
        &copy; {new Date().getFullYear()} JobConnect — Sistem Rekrutmen &amp; Pencocokan Kandidat
      </p>
    </div>
  );
};

export default Register;
