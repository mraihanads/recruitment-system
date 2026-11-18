import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const employmentTypeMap = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  internship: 'Internship',
  freelance: 'Freelance',
  contract: 'Kontrak',
};

const formatSalary = (min, max) => {
  if (!min && !max) return 'Kompensasi Kompetitif';
  const fmt = (val) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `Mulai ${fmt(min)}`;
  return `Hingga ${fmt(max)}`;
};

const formatDeadline = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const LandingPage = () => {
  const { isAuthenticated, role, user } = useAuth();
  const navigate = useNavigate();

  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [platformStats, setPlatformStats] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hero Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchHomeData = async () => {
      try {
        const [jobsRes, statsRes, catsRes] = await Promise.allSettled([
          api.get('/public/jobs', { params: { per_page: 6 } }),
          api.get('/public/stats'),
          api.get('/public/job-categories'),
        ]);

        if (!isMounted) return;

        if (jobsRes.status === 'fulfilled') {
          const payload = jobsRes.value.data?.data;
          const list = payload?.data || payload || [];
          setFeaturedJobs(Array.isArray(list) ? list : []);
        } else {
          setFeaturedJobs([]);
        }

        if (statsRes.status === 'fulfilled' && statsRes.value.data?.success) {
          setPlatformStats(statsRes.value.data.data);
        }

        if (catsRes.status === 'fulfilled') {
          const catList = catsRes.value.data?.data || [];
          setCategories(Array.isArray(catList) ? catList : []);
        }
      } catch {
        if (isMounted) {
          setFeaturedJobs([]);
        }
      } finally {
        if (isMounted) {
          setLoadingJobs(false);
        }
      }
    };

    fetchHomeData();
    return () => {
      isMounted = false;
    };
  }, []);

  const getDashboardPath = () => {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'company') return '/company/dashboard';
    if (role === 'candidate') return '/candidate/dashboard';
    return '/login';
  };

  const getJobsPath = () => {
    if (isAuthenticated && role === 'candidate') return '/candidate/jobs';
    return '/jobs';
  };

  const getPostJobPath = () => {
    if (isAuthenticated && role === 'company') return '/company/jobs/create';
    if (isAuthenticated && role === 'admin') return '/admin/jobs';
    return '/register';
  };

  const getJobDetailPath = (jobId) => {
    if (isAuthenticated && role === 'candidate') return `/candidate/jobs/${jobId}`;
    return `/jobs/${jobId}`;
  };

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (isAuthenticated && role === 'candidate') {
      navigate('/candidate/jobs');
      return;
    }
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (selectedCat) params.set('category', selectedCat);
    const qs = params.toString();
    navigate(qs ? `/jobs?${qs}` : '/jobs');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased flex flex-col">
      {/* =========================================================
          1. NAVBAR
          ========================================================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img
              src="/logo.png"
              alt="JobConnect"
              className="w-9 h-9 rounded-xl object-contain"
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-900 text-lg tracking-tight leading-none">
                JobConnect
              </span>
              <span className="text-[10px] font-semibold text-blue-600 tracking-wider uppercase mt-0.5">
                Talent Matching
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#beranda" className="hover:text-slate-900 transition-colors">
              Beranda
            </a>
            <Link to={getJobsPath()} className="hover:text-slate-900 transition-colors">
              Lowongan
            </Link>
            <a href="#cara-kerja" className="hover:text-slate-900 transition-colors">
              Cara Kerja
            </a>
            <a href="#untuk-perusahaan" className="hover:text-slate-900 transition-colors">
              Perusahaan
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to={getDashboardPath()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
              >
                <span>Dashboard ({user?.name?.split(' ')[0]})</span>
                <span>&rarr;</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-950 transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3">
            <div className="flex flex-col space-y-1.5 text-sm font-medium text-slate-700">
              <a href="#beranda" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-50">
                Beranda
              </a>
              <Link to={getJobsPath()} onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-50">
                Lowongan
              </Link>
              <a href="#cara-kerja" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-50">
                Cara Kerja
              </a>
              <a href="#untuk-perusahaan" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-50">
                Perusahaan
              </a>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2.5">
              {isAuthenticated ? (
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 px-4 rounded-lg text-xs font-semibold text-white bg-slate-900"
                >
                  Dashboard ({user?.name?.split(' ')[0]})
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2.5 px-4 rounded-lg text-xs font-semibold text-slate-700 border border-slate-300"
                  >
                    Masuk
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2.5 px-4 rounded-lg text-xs font-semibold text-white bg-slate-900"
                  >
                    Daftar
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* =========================================================
          2. HERO & SEARCH SECTION (Clean Commercial Job Portal Style)
          ========================================================= */}
      <section id="beranda" className="bg-white pt-12 pb-14 sm:pt-16 sm:pb-20 border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-5xl font-bold text-slate-950 tracking-tight leading-[1.15]">
              Temukan pekerjaan yang sesuai dengan keahlian Anda.
            </h1>
            <p className="text-slate-600 text-base sm:text-lg mt-4 leading-relaxed max-w-2xl">
              Telusuri peluang karier dari perusahaan yang telah diverifikasi, ukur persentase kecocokan kompetensi Anda secara langsung, dan pantau proses lamaran dalam satu tempat.
            </p>
          </div>

          {/* Functional Job Search Bar */}
          <form
            onSubmit={handleHeroSearch}
            className="mt-8 bg-white p-2 rounded-xl border border-slate-300 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-4xl"
          >
            <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2">
              <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari posisi, keahlian, atau nama perusahaan..."
                className="w-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <div className="sm:w-64 sm:border-l border-slate-200 px-3 py-2">
              <select
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
                className="w-full text-sm text-slate-700 bg-transparent focus:outline-none"
              >
                <option value="">Semua Kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-lg bg-slate-900 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shrink-0 cursor-pointer"
            >
              Cari Lowongan
            </button>
          </form>

          {/* Quick Stats */}
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 pt-6 border-t border-slate-100 max-w-4xl text-xs text-slate-500">
            {platformStats ? (
              <>
                <span>
                  <strong className="text-slate-900 font-semibold">{platformStats.active_jobs ?? 0}</strong> Lowongan Aktif
                </span>
                <span>
                  <strong className="text-slate-900 font-semibold">{platformStats.verified_companies ?? 0}</strong> Perusahaan Terverifikasi
                </span>
                <span>
                  <strong className="text-slate-900 font-semibold">{platformStats.total_categories ?? 0}</strong> Bidang Industri
                </span>
              </>
            ) : (
              <span>Menampilkan lowongan dari perusahaan yang telah diverifikasi resmi.</span>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================
          3. FEATURED JOBS (Exact Card Design Approved by User)
          ========================================================= */}
      <section className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-blue-700 font-semibold block mb-2">
                Peluang Karier
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
                Lowongan Kerja Terbaru
              </h2>
            </div>
            <Link
              to={getJobsPath()}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-900 hover:text-blue-700 transition-colors self-start sm:self-auto"
            >
              <span>Lihat Seluruh Lowongan</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {loadingJobs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-200" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-2/3 bg-slate-200 rounded" />
                      <div className="h-3 w-1/2 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-full bg-slate-100 rounded" />
                  <div className="h-4 w-3/4 bg-slate-100 rounded" />
                  <div className="pt-4 border-t border-slate-100 flex justify-between">
                    <div className="h-4 w-24 bg-slate-100 rounded" />
                    <div className="h-8 w-24 bg-slate-200 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredJobs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center max-w-2xl mx-auto">
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Belum Ada Lowongan Aktif Saat Ini
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
                Lowongan pekerjaan dari perusahaan mitra yang telah diverifikasi oleh administrator akan langsung ditampilkan di sini.
              </p>
              <Link
                to={getJobsPath()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
              >
                <span>Buka Halaman Eksplorasi Lowongan</span>
                <span>&rarr;</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-xl border border-slate-200/90 p-6 hover:border-slate-400 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Company Info & Type */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {job.company?.logo ? (
                          <img
                            src={job.company.logo}
                            alt={job.company.company_name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0">
                            {job.company?.company_name ? job.company.company_name[0].toUpperCase() : 'C'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {job.company?.company_name || 'Perusahaan Terverifikasi'}
                          </p>
                          <span className="text-[11px] font-medium text-slate-700 block truncate">
                            {job.category?.name || 'Umum'}
                          </span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-slate-100 text-slate-900 border border-slate-200/80 shrink-0">
                        {employmentTypeMap[job.employment_type] || job.employment_type || 'Full Time'}
                      </span>
                    </div>

                    {/* Job Title */}
                    <Link
                      to={getJobDetailPath(job.id)}
                      className="text-base font-bold text-slate-950 group-hover:text-blue-700 transition-colors block mb-3 line-clamp-1"
                    >
                      {job.title}
                    </Link>

                    {/* Meta: Location & Salary */}
                    <div className="space-y-1.5 text-xs text-slate-800 mb-4">
                      <div className="flex items-center gap-2 font-medium">
                        <svg className="w-3.5 h-3.5 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{job.location || 'Indonesia'}</span>
                      </div>

                      <div className="flex items-center gap-2 font-semibold text-slate-950">
                        <svg className="w-3.5 h-3.5 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatSalary(job.salary_min, job.salary_max)}</span>
                      </div>
                    </div>

                    {/* Required Skills Preview */}
                    {Array.isArray(job.skills) && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {job.skills.slice(0, 4).map((s, idx) => (
                          <span
                            key={s.id || idx}
                            className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-50 text-slate-800 border border-slate-200/90"
                          >
                            {s.name || s}
                          </span>
                        ))}
                        {job.skills.length > 4 && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold text-slate-700">
                            +{job.skills.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-700 font-mono">
                      Tutup: {formatDeadline(job.deadline)}
                    </span>
                    <Link
                      to={getJobDetailPath(job.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                    >
                      <span>Lihat Detail</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================
          4. HOW IT WORKS & SKILL MATCHING (Editorial 2-Column Split)
          ========================================================= */}
      <section id="cara-kerja" className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: How Skill Matching Works */}
            <div className="lg:col-span-5 space-y-5">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight leading-snug">
                Cara kerja pencocokan keahlian & seleksi lamaran.
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Ketika Anda melihat detail lowongan, sistem secara otomatis mencocokkan daftar keahlian di profil Anda dengan kualifikasi yang dibutuhkan oleh perusahaan.
              </p>

              {/* Clean Light Card Example (Matching the Job Card aesthetic) */}
              <div className="bg-slate-50 rounded-xl border border-slate-200/90 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Contoh Indikator Kecocokan</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    80% Match
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: '80%' }} />
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-500 font-medium mr-1">Terpenuhi:</span>
                    {['PHP', 'Laravel', 'React.js', 'MySQL'].map((sk) => (
                      <span key={sk} className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-medium text-[11px]">
                        ✓ {sk}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-500 font-medium mr-1">Belum ada:</span>
                    <span className="px-2 py-0.5 rounded bg-white text-slate-400 border border-slate-200 text-[11px]">
                      Docker
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Clean Numbered Steps */}
            <div className="lg:col-span-7 divide-y divide-slate-200/80 border-t border-b border-slate-200/80">
              <div className="py-5 flex items-start gap-4">
                <span className="text-sm font-mono font-bold text-blue-700 pt-0.5">01</span>
                <div>
                  <h3 className="text-base font-bold text-slate-950">Lengkapi Biodata, CV, & Daftar Keahlian</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    Buat akun kandidat, lengkapi biodata diri, unggah berkas CV resmi Anda, dan tambahkan keahlian yang Anda kuasai pada menu profil.
                  </p>
                </div>
              </div>

              <div className="py-5 flex items-start gap-4">
                <span className="text-sm font-mono font-bold text-blue-700 pt-0.5">02</span>
                <div>
                  <h3 className="text-base font-bold text-slate-950">Tinjau Detail Lowongan & Skor Kecocokan</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    Pilih lowongan yang sesuai, pelajari deskripsi tugas, jadwal wawancara, tanggal pengumuman, serta lihat persentase kecocokan skill Anda.
                  </p>
                </div>
              </div>

              <div className="py-5 flex items-start gap-4">
                <span className="text-sm font-mono font-bold text-blue-700 pt-0.5">03</span>
                <div>
                  <h3 className="text-base font-bold text-slate-950">Unggah Surat Lamaran & Berkas Persyaratan</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    Kirimkan lamaran dengan melampirkan berkas surat lamaran beserta dokumen pendukung yang disyaratkan oleh perusahaan (bisa lebih dari satu file).
                  </p>
                </div>
              </div>

              <div className="py-5 flex items-start gap-4">
                <span className="text-sm font-mono font-bold text-blue-700 pt-0.5">04</span>
                <div>
                  <h3 className="text-base font-bold text-slate-950">Pantau Tahapan Seleksi & Jadwal Wawancara</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    Terima pembaruan status lamaran mulai dari tahap screening, undangan jadwal wawancara online/offline, hingga pengumuman hasil seleksi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          5. FOR CANDIDATES & FOR COMPANIES (2-Panel Editorial Layout)
          ========================================================= */}
      <section id="untuk-perusahaan" className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Panel 1: For Candidates */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-7 sm:p-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-blue-700 font-semibold block mb-2">
                  Untuk Pencari Kerja
                </span>
                <h3 className="text-xl font-bold text-slate-950 mb-3">
                  Lamar pekerjaan dengan transparansi penuh.
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                  Tidak perlu lagi menebak apakah profil Anda sesuai atau menunggu tanpa kepastian. Semua informasi persyaratan dan jadwal tahapan seleksi ditampilkan sejak awal.
                </p>

                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 mb-8">
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                    <span>Manajemen profil ringkas: Biodata, CV, dan Keahlian</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                    <span>Indikator persentase kecocokan skill di setiap lowongan</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                    <span>Dukungan unggah multi-berkas persyaratan lamaran</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                    <span>Timeline status lamaran & jadwal wawancara terintegrasi</span>
                  </li>
                </ul>
              </div>

              <div>
                <Link
                  to={isAuthenticated ? getDashboardPath() : '/register'}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                >
                  <span>{isAuthenticated ? 'Buka Dashboard' : 'Daftar Sebagai Kandidat'}</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>

            {/* Panel 2: For Companies */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-7 sm:p-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-blue-700 font-semibold block mb-2">
                  Untuk Perusahaan & Recruiter
                </span>
                <h3 className="text-xl font-bold text-slate-950 mb-3">
                  Kelola rekrutmen dan saring pelamar lebih cepat.
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                  Publikasikan lowongan setelah akun perusahaan Anda diverifikasi oleh administrator, dan tinjau pelamar yang masuk berdasarkan tingkat kecocokan kompetensi.
                </p>

                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 mb-8">
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                    <span>Verifikasi legalitas perusahaan (NIB, NPWP, & Akta Pendirian)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                    <span>Pengaturan batas lamaran, rentang wawancara, & tanggal pengumuman</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                    <span>Review CV, berkas persyaratan, dan skor kecocokan pelamar</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                    <span>Penjadwalan interview online/offline & laporan statistik</span>
                  </li>
                </ul>
              </div>

              <div>
                <Link
                  to={getPostJobPath()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                >
                  <span>{isAuthenticated && role === 'company' ? 'Buat Lowongan Baru' : 'Daftarkan Perusahaan'}</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          6. FOOTER
          ========================================================= */}
      <footer className="bg-white text-slate-500 py-10 border-t border-slate-200/80 text-xs mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="JobConnect"
              className="w-7 h-7 rounded-lg object-contain"
            />
            <span className="font-bold text-slate-900 text-sm">JobConnect</span>
            <span className="text-slate-300">|</span>
            <span>Sistem Rekrutmen & Pencocokan Kompetensi Kandidat</span>
          </div>

          <div className="flex items-center gap-6 font-medium text-slate-600">
            <Link to={getJobsPath()} className="hover:text-slate-950 transition-colors">
              Lowongan
            </Link>
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="hover:text-slate-950 transition-colors">
                  Masuk
                </Link>
                <Link to="/register" className="hover:text-slate-950 transition-colors">
                  Daftar
                </Link>
              </>
            ) : (
              <Link to={getDashboardPath()} className="hover:text-slate-950 transition-colors">
                Dashboard
              </Link>
            )}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <p>&copy; {new Date().getFullYear()} JobConnect. Hak cipta dilindungi.</p>
          <p>Talent Matching & Recruitment Management Platform</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
