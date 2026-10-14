import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LandingPage = () => {
  const { isAuthenticated, role, user } = useAuth();

  const getDashboardPath = () => {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'company') return '/company/dashboard';
    if (role === 'candidate') return '/candidate/dashboard';
    return '/login';
  };

  const getJobsPath = () => {
    if (role === 'candidate') return '/candidate/jobs';
    return '/jobs';
  };

  const sampleFeaturedJobs = [
    {
      id: 1,
      title: 'Senior Frontend Engineer (React)',
      company: 'PT Inovasi Digital Nusantara',
      location: 'Jakarta Selatan (Hybrid)',
      type: 'Full Time',
      category: 'Teknologi Informasi',
      salary: 'Rp 15.000.000 - Rp 25.000.000',
      skills: ['React', 'JavaScript', 'Tailwind CSS', 'TypeScript'],
      deadline: '31 Des 2026',
    },
    {
      id: 2,
      title: 'Backend Developer (Laravel / PHP)',
      company: 'TechSolusi Global',
      location: 'Bandung (Remote)',
      type: 'Full Time',
      category: 'Teknologi Informasi',
      salary: 'Rp 12.000.000 - Rp 20.000.000',
      skills: ['Laravel', 'PHP', 'MySQL', 'REST API'],
      deadline: '15 Nov 2026',
    },
    {
      id: 3,
      title: 'UI/UX & Product Designer',
      company: 'Kreatif Studio Indonesia',
      location: 'Surabaya (On-site)',
      type: 'Full Time',
      category: 'Desain Grafis & Multimedia',
      salary: 'Rp 8.000.000 - Rp 14.000.000',
      skills: ['Figma', 'UI/UX Design', 'User Research', 'Prototyping'],
      deadline: '20 Des 2026',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 sm:px-10 py-3.5 flex items-center justify-between shadow-xs">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-lg shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            RM
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-slate-900 text-lg tracking-tight leading-none">RecruitMatch</span>
            <span className="text-[10px] font-semibold text-blue-600 tracking-wider uppercase mt-0.5">Talent Matching</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            to={getJobsPath()}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-600 rounded-xl transition-colors"
          >
            Lowongan Kerja
          </Link>

          {isAuthenticated ? (
            <Link
              to={getDashboardPath()}
              className="px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              <span>Dashboard ({user?.name?.split(' ')[0]})</span>
              <span>&rarr;</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-600 rounded-xl transition-colors"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                className="px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
              >
                Daftar Sekarang
              </Link>
            </div>
          )}
        </nav>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-blue-50/30 to-slate-50 py-16 sm:py-24 px-6 sm:px-10 border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-100/70 text-blue-800 border border-blue-200 mb-6 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Platform Rekrutmen Cerdas Berbasis Kecocokan Skill
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight mb-6">
            Temukan Pekerjaan yang Tepat untuk Kariermu
          </h1>

          <p className="text-slate-600 text-sm sm:text-lg mb-8 leading-relaxed max-w-2xl mx-auto">
            RecruitMatch menghadirkan sistem pencocokan cerdas antara kualifikasi keahlian kandidat dan kriteria lowongan perusahaan secara transparan, terukur, dan efisien.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
            <Link
              to={getJobsPath()}
              className="px-7 sm:px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Temukan Lowongan</span>
            </Link>

            {!isAuthenticated ? (
              <Link
                to="/register"
                className="px-7 sm:px-8 py-3.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-sm sm:text-base rounded-xl shadow-2xs transition-all"
              >
                Daftar Sekarang
              </Link>
            ) : (
              <Link
                to={getDashboardPath()}
                className="px-7 sm:px-8 py-3.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-sm sm:text-base rounded-xl shadow-2xs transition-all"
              >
                Buka Dashboard
              </Link>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="mt-12 pt-8 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">100%</div>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">Matching Presisi</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-blue-600">Terintegrasi</div>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">Alur Rekrutmen</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600">Terverifikasi</div>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">Perusahaan Resmi</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-amber-600">Real-Time</div>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">Pantau Lamaran</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION: CARA KERJA */}
      <section className="py-16 sm:py-20 px-6 sm:px-10 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Alur Mudah & Transparan</h2>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">Cara Kerja RecruitMatch</h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
              Hanya butuh 4 tahapan ringkas untuk menghubungkan keahlian Anda dengan lowongan yang paling relevan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center mb-4 text-base shadow-sm">
                1
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Lengkapi Profil</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Daftar dan isi riwayat pendidikan, pengalaman kerja, portofolio, serta daftar keahlian (skills) Anda.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center mb-4 text-base shadow-sm">
                2
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Pencocokan Cerdas</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Algoritma sistem menghitung skor kecocokan skill (misal 100%, 75%) terhadap setiap lowongan pekerjaan.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center mb-4 text-base shadow-sm">
                3
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Lamar & Pantau</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kirim lamaran dengan satu klik dan pantau tahapan seleksi secara transparan di timeline lamaran.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center mb-4 text-base shadow-sm">
                4
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Wawancara & Diterima</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dapatkan jadwal interview online/offline lengkap dengan link meeting dan penawaran kerja resmi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION: FITUR UTAMA */}
      <section className="py-16 sm:py-20 px-6 sm:px-10 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Solusi Rekrutmen Modern</h2>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">Fitur Utama Platform</h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
              Dirancang untuk memudahkan kandidat menemukan karir ideal dan recruiter menemukan kandidat paling kompeten.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Presisi Skill Matching</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Lihat secara rinci keahlian apa yang sudah sesuai (Matched Skills) dan keahlian yang masih dibutuhkan (Missing Skills).
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Pelacakan Status Real-Time</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Setiap perubahan tahapan dari Diajukan, Screening, Interview, hingga Diterima tercatat lengkap dalam timeline interaktif.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 border border-purple-100">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Manajemen Interview Terpadu</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Penjadwalan wawancara langsung terhubung dengan link meeting daring atau panduan lokasi offline beserta notifikasi otomatis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION: LOWONGAN TERBARU */}
      <section className="py-16 sm:py-20 px-6 sm:px-10 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">Peluang Unggulan</h2>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">Lowongan Kerja Terbaru</h3>
            </div>
            <Link
              to={getJobsPath()}
              className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Lihat Semua Lowongan</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sampleFeaturedJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                      {job.category}
                    </span>
                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                      {job.type}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 mb-1 hover:text-blue-600 transition-colors">
                    {job.title}
                  </h4>
                  <p className="text-xs font-semibold text-slate-500 mb-3">{job.company}</p>

                  <div className="space-y-1 text-xs text-slate-500 mb-4">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                      <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{job.salary}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {job.skills.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Batas: {job.deadline}</span>
                  <Link
                    to={getJobsPath()}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 text-xs font-bold transition-all"
                  >
                    Detail & Lamar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. SECTION: KEUNGGULAN PLATFORM */}
      <section className="py-16 sm:py-20 px-6 sm:px-10 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Mengapa Memilih Kami</h2>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">Keunggulan Platform RecruitMatch</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-5">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center mx-auto mb-4 text-xl">
                ✓
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1.5">Akurasi & Presisi</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kalkulasi otomatis mengeliminasi tebakan dan mengedepankan kualifikasi relevan.
              </p>
            </div>

            <div className="text-center p-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 font-extrabold flex items-center justify-center mx-auto mb-4 text-xl">
                🛡
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1.5">Perusahaan Terverifikasi</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Seluruh perusahaan melalui proses verifikasi dokumen legal oleh administrator.
              </p>
            </div>

            <div className="text-center p-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 font-extrabold flex items-center justify-center mx-auto mb-4 text-xl">
                ⚡
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1.5">Notifikasi Cepat</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pemberitahuan instan saat status lamaran berubah atau undangan wawancara tiba.
              </p>
            </div>

            <div className="text-center p-5">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 font-extrabold flex items-center justify-center mx-auto mb-4 text-xl">
                🔒
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1.5">Keamanan Data</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Privasi kandidat dan dokumen perusahaan dilindungi sistem otorisasi berlapis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. SECTION: CTA PENUTUP */}
      <section className="py-16 sm:py-20 px-6 sm:px-10 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-black mb-4 tracking-tight">
            Siap Memulai Langkah Karirmu Selanjutnya?
          </h2>
          <p className="text-blue-100 text-xs sm:text-base mb-8 max-w-xl mx-auto leading-relaxed">
            Bergabunglah sekarang dengan ratusan kandidat dan perusahaan terkemuka yang telah mempercayai RecruitMatch.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/register"
                  className="px-8 py-3.5 bg-white hover:bg-slate-100 text-blue-700 font-bold text-sm sm:text-base rounded-xl shadow-lg transition-all"
                >
                  Daftar Sekarang &rarr;
                </Link>
                <Link
                  to={getJobsPath()}
                  className="px-8 py-3.5 bg-blue-700/80 hover:bg-blue-700 text-white border border-blue-400/30 font-bold text-sm sm:text-base rounded-xl transition-all"
                >
                  Jelajahi Lowongan
                </Link>
              </>
            ) : (
              <Link
                to={getDashboardPath()}
                className="px-8 py-3.5 bg-white hover:bg-slate-100 text-blue-700 font-bold text-sm sm:text-base rounded-xl shadow-lg transition-all"
              >
                Buka Dashboard Saya &rarr;
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-6 sm:px-10 border-t border-slate-800 text-xs">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-sm">
              RM
            </div>
            <span className="font-bold text-white text-sm">RecruitMatch</span>
            <span className="text-slate-500">|</span>
            <span>Sistem Informasi Rekrutmen & Pencocokan Kandidat</span>
          </div>

          <div className="flex items-center gap-5">
            <Link to={getJobsPath()} className="hover:text-white transition-colors">Lowongan</Link>
            <Link to="/login" className="hover:text-white transition-colors">Masuk</Link>
            <Link to="/register" className="hover:text-white transition-colors">Daftar</Link>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-6 pt-6 border-t border-slate-800 text-center text-slate-500 text-[11px]">
          &copy; {new Date().getFullYear()} RecruitMatch. Hak Cipta Dilindungi Undang-Undang.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
