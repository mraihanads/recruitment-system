import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const user = await login(email, password);

      // Redirect strictly based on Laravel response user.role
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'company') {
        navigate('/company/dashboard', { replace: true });
      } else if (user.role === 'candidate') {
        navigate('/candidate/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      if (err.response) {
        const { status, data } = err.response;
        if (status === 401) {
          setErrorMessage(data?.message || 'Email atau password yang Anda masukkan salah.');
        } else if (status === 403) {
          setErrorMessage(data?.message || 'Akun Anda tidak aktif atau akses ditolak.');
        } else if (status === 422) {
          setErrorMessage(data?.message || 'Silakan periksa kembali format isian Anda.');
          if (data?.errors) {
            setFieldErrors(data.errors);
          }
        } else {
          setErrorMessage(data?.message || 'Terjadi kesalahan pada server. Silakan coba lagi.');
        }
      } else if (err.request) {
        setErrorMessage('Gagal terhubung ke server backend. Pastikan server Laravel sedang berjalan.');
      } else {
        setErrorMessage('Terjadi kesalahan yang tidak terduga.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div className="relative z-10 w-full max-w-[430px] mb-4 flex items-center justify-between">
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
      <div className="relative z-10 w-full max-w-[430px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.1)] overflow-hidden">
        {/* Refined Top Accent Strip */}
        <div className="h-1 w-full bg-gradient-to-r from-slate-900 via-blue-600 to-slate-900" />

        <div className="p-7 sm:p-9">
          {/* Header */}
          <div className="text-center mb-7">
            <div className="w-13 h-13 rounded-xl bg-slate-50 border border-slate-200/90 shadow-2xs p-2.5 mx-auto mb-4 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="JobConnect"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-slate-950 tracking-tight">
              Selamat Datang
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Masuk ke akun JobConnect Anda untuk melanjutkan
            </p>
          </div>

          {/* Global Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <svg className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm text-slate-900 bg-slate-50/40 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 ${fieldErrors.password
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                    : 'border-slate-200/90 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.password[0]}</p>
              )}
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
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Masuk</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Distinct Subtle Card Footer */}
        <div className="bg-slate-50/90 border-t border-slate-100 px-7 py-4 text-center">
          <p className="text-xs sm:text-sm text-slate-600">
            Belum memiliki akun?{' '}
            <Link to="/register" className="font-semibold text-blue-700 hover:text-blue-800 hover:underline">
              Daftar sekarang
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

export default Login;
