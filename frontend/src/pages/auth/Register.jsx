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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-100 p-8 sm:p-10 my-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-600 text-white font-extrabold text-2xl shadow-lg shadow-blue-500/30 mb-4">
            SR
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Buat Akun Baru</h1>
          <p className="text-slate-500 text-sm mt-1">
            Bergabunglah sebagai Kandidat atau Perusahaan
          </p>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
            <svg className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="leading-relaxed font-medium">{successMessage}</span>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
            <svg className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Daftar Sebagai:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium cursor-pointer transition-all ${
                  formData.role === 'candidate'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="candidate"
                  checked={formData.role === 'candidate'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <span>👤 Pencari Kerja</span>
              </label>

              <label
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium cursor-pointer transition-all ${
                  formData.role === 'company'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="company"
                  checked={formData.role === 'company'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <span>🏢 Perusahaan</span>
              </label>
            </div>
            {fieldErrors.role && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.role[0]}</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="name">
              {formData.role === 'company' ? 'Nama Perusahaan / PIC' : 'Nama Lengkap'}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder={formData.role === 'company' ? 'PT Teknologi Nusantara' : 'Muhammad Raihan'}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 focus:outline-none transition-all ${
                fieldErrors.name
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
              }`}
            />
            {fieldErrors.name && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.name[0]}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="nama@email.com"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 focus:outline-none transition-all ${
                fieldErrors.email
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
              }`}
            />
            {fieldErrors.email && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.email[0]}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimal 8 karakter"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 focus:outline-none transition-all ${
                fieldErrors.password
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
              }`}
            />
            {fieldErrors.password && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.password[0]}</p>
            )}
          </div>

          {/* Password Confirmation */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="password_confirmation">
              Konfirmasi Password
            </label>
            <input
              id="password_confirmation"
              name="password_confirmation"
              type="password"
              required
              value={formData.password_confirmation}
              onChange={handleChange}
              placeholder="Ulangi password"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 focus:outline-none transition-all ${
                fieldErrors.password_confirmation
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
              }`}
            />
            {fieldErrors.password_confirmation && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.password_confirmation[0]}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Mendaftarkan...</span>
              </>
            ) : (
              <span>Daftar Sekarang</span>
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-600">
            Sudah memiliki akun?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
