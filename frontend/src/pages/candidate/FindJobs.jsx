import React, { useState, useEffect, useCallback, useRef } from 'react';
import candidateService from '../../services/candidateService';
import JobCard from '../../components/candidate/JobCard';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

const employmentTypeOptions = [
  { value: '', label: 'Semua Tipe' },
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'internship', label: 'Internship' },
  { value: 'freelance', label: 'Freelance' },
];

const FindJobs = () => {
  // Filters & Search State
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [locationTerm, setLocationTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedEmploymentType, setSelectedEmploymentType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Data State
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [categories, setCategories] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState(new Set());

  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Debounce search and location typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setLocationTerm(locationInput.trim());
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [locationInput]);

  // Load Categories & Saved Jobs once on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catRes, savedRes] = await Promise.allSettled([
          candidateService.getJobCategories(),
          candidateService.getSavedJobs(),
        ]);

        if (catRes.status === 'fulfilled' && catRes.value?.success) {
          setCategories(catRes.value.data || []);
        }

        if (savedRes.status === 'fulfilled' && savedRes.value?.success) {
          const ids = new Set((savedRes.value.data || []).map((item) => item.job_id || item.jobVacancy?.id));
          setSavedJobIds(ids);
        }
      } catch (e) {
        // Non-blocking metadata error
      }
    };
    fetchMetadata();
  }, []);

  // Fetch Jobs based on active filters and page
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        per_page: 9,
      };

      if (searchTerm) params.search = searchTerm;
      if (locationTerm) params.location = locationTerm;
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedEmploymentType) params.employment_type = selectedEmploymentType;

      const res = await candidateService.getJobs(params);
      if (res?.success) {
        setJobs(res.data.data || []);
        setPagination({
          currentPage: res.data.current_page,
          lastPage: res.data.last_page,
          total: res.data.total,
          from: res.data.from,
          to: res.data.to,
        });
      } else {
        throw new Error(res?.message || 'Gagal memuat lowongan.');
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat lowongan.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, locationTerm, selectedCategory, selectedEmploymentType, currentPage]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleToggleSave = async (jobId, wasSaved) => {
    try {
      if (wasSaved) {
        await candidateService.unsaveJob(jobId);
        setSavedJobIds((prev) => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
        showToast('Lowongan dihapus dari daftar tersimpan.', 'info');
      } else {
        await candidateService.saveJob(jobId);
        setSavedJobIds((prev) => {
          const next = new Set(prev);
          next.add(jobId);
          return next;
        });
        showToast('Lowongan berhasil disimpan!', 'success');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal memperbarui status bookmark.';
      showToast(msg, 'error');
      throw err;
    }
  };

  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setLocationInput('');
    setLocationTerm('');
    setSelectedCategory('');
    setSelectedEmploymentType('');
    setCurrentPage(1);
  };

  const isFiltered = Boolean(searchTerm || locationTerm || selectedCategory || selectedEmploymentType);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl text-xs font-bold shadow-xl border animate-in slide-in-from-bottom duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : toastMessage.type === 'error'
              ? 'bg-rose-600 text-white border-rose-500'
              : 'bg-slate-800 text-white border-slate-700'
          }`}
        >
          {toastMessage.message}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-md shadow-blue-500/10">
        <h1 className="text-xl sm:text-2xl font-black mb-2">Eksplorasi Lowongan Pekerjaan</h1>
        <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
          Temukan karier impian Anda yang paling cocok dengan keahlian dan minat profil Anda. Gunakan filter untuk menyaring lowongan relevan.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        {/* Row 1: Search Keyword & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Keyword Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              id="job-search-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari berdasarkan judul pekerjaan, skill, atau perusahaan..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 placeholder:text-slate-400 transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            )}
          </div>

          {/* Location Filter Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <input
              type="text"
              id="job-location-input"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="Filter kota atau lokasi (misal: Jakarta, Surabaya)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 placeholder:text-slate-400 transition-all"
            />
            {locationInput && (
              <button
                type="button"
                onClick={() => setLocationInput('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Category Dropdown & Employment Type & Reset Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
          {/* Category Dropdown */}
          <div className="flex-1 min-w-[200px]">
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Employment Type Selector */}
          <div className="flex-1 min-w-[180px]">
            <select
              id="employment-type-select"
              value={selectedEmploymentType}
              onChange={(e) => {
                setSelectedEmploymentType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            >
              {employmentTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filter Button */}
          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors shrink-0 flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingScreen message="Memuat daftar lowongan pekerjaan..." />
      ) : error ? (
        <ErrorState
          title="Gagal Memuat Lowongan"
          message={error}
          onRetry={fetchJobs}
        />
      ) : jobs.length === 0 ? (
        <EmptyState
          title="Lowongan tidak ditemukan"
          description={
            isFiltered
              ? 'Tidak ditemukan lowongan dengan kata kunci atau filter yang Anda pilih. Coba atur ulang filter pencarian Anda.'
              : 'Belum ada lowongan yang tersedia saat ini.'
          }
          actionLabel={isFiltered ? 'Reset Filter' : undefined}
          onAction={isFiltered ? handleResetFilters : undefined}
        />
      ) : (
        <>
          {/* Result Info Counter */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Menampilkan {pagination?.from || 1}-{pagination?.to || jobs.length} dari total {pagination?.total || jobs.length} lowongan
            </span>
          </div>

          {/* Jobs Grid: 2-3 Columns on Desktop, 1 on Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isSaved={savedJobIds.has(job.id)}
                onToggleSave={handleToggleSave}
              />
            ))}
          </div>

          {/* Pagination (Requirement 7) */}
          {pagination && pagination.lastPage > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              {/* Previous */}
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  currentPage <= 1
                    ? 'text-slate-300 bg-slate-50 cursor-not-allowed border border-slate-100'
                    : 'text-slate-700 bg-white hover:bg-slate-100 border border-slate-200'
                }`}
              >
                &larr; Previous
              </button>

              {/* Page Number Buttons */}
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.lastPage }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              {/* Next */}
              <button
                type="button"
                disabled={currentPage >= pagination.lastPage}
                onClick={() => setCurrentPage((prev) => Math.min(pagination.lastPage, prev + 1))}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  currentPage >= pagination.lastPage
                    ? 'text-slate-300 bg-slate-50 cursor-not-allowed border border-slate-100'
                    : 'text-slate-700 bg-white hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Next &rarr;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FindJobs;
