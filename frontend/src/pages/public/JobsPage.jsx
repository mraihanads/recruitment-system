import React, { useState, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import EmptyState from '../../components/common/EmptyState';

const initialVacancies = [
  {
    id: 1,
    title: 'Senior Frontend Engineer (React)',
    company: 'PT Inovasi Digital Nusantara',
    location: 'Jakarta Selatan',
    employment_type: 'full_time',
    category: 'Teknologi Informasi',
    salary_min: 15000000,
    salary_max: 25000000,
    deadline: '2026-12-31',
    skills: ['React', 'JavaScript', 'Tailwind CSS', 'TypeScript'],
  },
  {
    id: 2,
    title: 'Backend Developer (Laravel / PHP)',
    company: 'TechSolusi Global',
    location: 'Bandung',
    employment_type: 'full_time',
    category: 'Teknologi Informasi',
    salary_min: 12000000,
    salary_max: 20000000,
    deadline: '2026-11-15',
    skills: ['Laravel', 'PHP', 'MySQL', 'REST API'],
  },
  {
    id: 3,
    title: 'UI/UX & Product Designer',
    company: 'Kreatif Studio Indonesia',
    location: 'Surabaya',
    employment_type: 'full_time',
    category: 'Desain Grafis & Multimedia',
    salary_min: 8000000,
    salary_max: 14000000,
    deadline: '2026-12-20',
    skills: ['Figma', 'UI/UX Design', 'User Research', 'Prototyping'],
  },
  {
    id: 4,
    title: 'Digital Marketing & Content Strategist',
    company: 'Media Kreasi Mandiri',
    location: 'Jakarta Pusat',
    employment_type: 'part_time',
    category: 'Pemasaran & Komunikasi',
    salary_min: 6000000,
    salary_max: 10000000,
    deadline: '2026-11-30',
    skills: ['SEO', 'Content Writing', 'Copywriting', 'Social Media'],
  },
  {
    id: 5,
    title: 'Junior QA & Software Tester',
    company: 'PT Inovasi Digital Nusantara',
    location: 'Yogyakarta',
    employment_type: 'internship',
    category: 'Teknologi Informasi',
    salary_min: 3500000,
    salary_max: 5500000,
    deadline: '2026-12-10',
    skills: ['Manual Testing', 'API Testing', 'Bug Reporting'],
  },
];

const employmentTypeLabels = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  internship: 'Internship',
  freelance: 'Freelance',
};

const formatCurrency = (val) => {
  if (!val) return null;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

const JobsPage = () => {
  const { isAuthenticated, role, user } = useAuth();

  // If candidate is logged in, redirect directly to candidate jobs view for matching percentage
  if (isAuthenticated && role === 'candidate') {
    return <Navigate to="/candidate/jobs" replace />;
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const categories = useMemo(() => {
    return Array.from(new Set(initialVacancies.map((j) => j.category)));
  }, []);

  const filteredJobs = useMemo(() => {
    return initialVacancies.filter((job) => {
      const matchSearch =
        !searchTerm ||
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.skills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCat = !selectedCategory || job.category === selectedCategory;
      const matchType = !selectedType || job.employment_type === selectedType;

      return matchSearch && matchCat && matchType;
    });
  }, [searchTerm, selectedCategory, selectedType]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedType('');
  };

  const isFiltered = Boolean(searchTerm || selectedCategory || selectedType);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 sm:px-10 py-3.5 flex items-center justify-between shadow-xs">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-lg shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            RM
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-slate-900 text-lg tracking-tight leading-none">RecruitMatch</span>
            <span className="text-[10px] font-semibold text-blue-600 tracking-wider uppercase mt-0.5">Eksplorasi Karir</span>
          </div>
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            to="/"
            className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Beranda
          </Link>
          <Link
            to="/login"
            className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors"
          >
            Masuk
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all"
          >
            Daftar
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 sm:px-10 py-8 sm:py-12">
        {/* Header Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
            Jelajahi Lowongan Kerja
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Temukan posisi yang sesuai dengan keahlian Anda. Masuk ke akun Anda untuk melihat persentase kecocokan skill dan melamar langsung ke perusahaan.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs mb-8 space-y-3.5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              id="public-job-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari berdasarkan judul pekerjaan, perusahaan, atau keahlian (misal: React, Laravel, Figma)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 placeholder:text-slate-400 transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            >
              <option value="">Semua Tipe Pekerjaan</option>
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="internship">Internship</option>
              <option value="freelance">Freelance</option>
            </select>

            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Results Info Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1 mb-4">
          <span>Menampilkan {filteredJobs.length} lowongan pekerjaan</span>
          {!isAuthenticated && (
            <span className="text-blue-600 font-medium">
              <Link to="/login" className="hover:underline">Login</Link> untuk melihat skor kecocokan profil Anda
            </span>
          )}
        </div>

        {/* Job Cards Grid */}
        {filteredJobs.length === 0 ? (
          <EmptyState
            title="Lowongan tidak ditemukan"
            description="Tidak ada lowongan yang sesuai dengan kriteria pencarian atau filter yang dipilih. Coba atur ulang kata kunci."
            actionLabel={isFiltered ? 'Reset Filter' : undefined}
            onAction={isFiltered ? handleResetFilters : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700">
                      {job.category}
                    </span>
                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      {employmentTypeLabels[job.employment_type] || job.employment_type}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                    {job.title}
                  </h3>
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
                      <span>
                        {formatCurrency(job.salary_min)} - {formatCurrency(job.salary_max)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400">
                      <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Batas: {formatDate(job.deadline)}</span>
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
                  <Link
                    to="/login"
                    className="w-full text-center py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 text-xs font-bold transition-all"
                  >
                    Login untuk Melamar & Cek Match &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} RecruitMatch. Sistem Rekrutmen & Pencocokan Kandidat.
      </footer>
    </div>
  );
};

export default JobsPage;
