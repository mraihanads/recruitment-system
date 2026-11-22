import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import candidateService from '../../services/candidateService';
import ApplicationCard from '../../components/candidate/ApplicationCard';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

const filterTabs = [
  { value: '', label: 'Semua Status' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'screening', label: 'Screening' },
  { value: 'interview', label: 'Interview' },
  { value: 'test', label: 'Test' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
];

const MyApplications = () => {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch applications from backend with status filter parameter
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (selectedStatus) {
        params.status = selectedStatus;
      }
      const res = await candidateService.getApplications(params);
      if (res?.success) {
        setApplications(res.data || []);
      } else {
        throw new Error(res?.message || 'Gagal memuat daftar lamaran.');
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat data lamaran kerja.');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Client-side search filtering (since backend does not have search query param)
  const filteredApplications = useMemo(() => {
    if (!searchQuery.trim()) return applications;
    const query = searchQuery.toLowerCase().trim();
    return applications.filter((app) => {
      const job = app.job_vacancy || app.jobVacancy || {};
      const company = job.company || {};
      const titleMatch = (job.title || '').toLowerCase().includes(query);
      const companyMatch = (company.company_name || '').toLowerCase().includes(query);
      return titleMatch || companyMatch;
    });
  }, [applications, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-7">
        <span className="text-xs font-mono uppercase tracking-wider text-blue-700 font-semibold block mb-1.5">
          Status Seleksi
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-1">
          Riwayat Lamaran Kerja Saya
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
          Pantau progres seluruh proses lamaran kerja Anda secara berkala, mulai dari tahap seleksi administrasi, tes, wawancara, hingga pengumuman penerimaan.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Status Tabs / Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setSelectedStatus(tab.value)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                  selectedStatus === tab.value
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
                data-testid={`filter-tab-${tab.value || 'all'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input for Job/Company */}
          <div className="relative min-w-[240px] md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari posisi atau perusahaan..."
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingScreen message="Memuat daftar lamaran kerja..." />
      ) : error ? (
        <ErrorState
          title="Gagal Memuat Lamaran"
          message={error}
          onRetry={fetchApplications}
        />
      ) : filteredApplications.length === 0 ? (
        <EmptyState
          title="Belum ada lamaran."
          description={
            selectedStatus || searchQuery
              ? 'Tidak ada lamaran yang cocok dengan kriteria pencarian atau status yang dipilih.'
              : 'Anda belum melamar ke lowongan manapun saat ini. Temukan pekerjaan impian Anda dan lamar sekarang!'
          }
          actionLabel="Cari Lowongan"
          onAction={() => navigate('/candidate/jobs')}
        />
      ) : (
        <>
          {/* Result Counter */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Menampilkan {filteredApplications.length} lamaran
              {selectedStatus && ` dengan status "${selectedStatus}"`}
              {searchQuery && ` untuk pencarian "${searchQuery}"`}
            </span>
          </div>

          {/* Applications Grid: 2 Kolom di Desktop, 1 di Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredApplications.map((app) => (
              <ApplicationCard key={app.id} application={app} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MyApplications;
