import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import candidateService from '../../services/candidateService';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

const CandidateSavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSavedJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await candidateService.getSavedJobs();
      if (res?.success) {
        setSavedJobs(res.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat lowongan tersimpan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedJobs();
  }, [fetchSavedJobs]);

  const handleUnsave = async (jobId) => {
    setActionLoading(true);
    try {
      await candidateService.unsaveJob(jobId);
      setSavedJobs((prev) => prev.filter((item) => item.job_id !== jobId && item.job_vacancy?.id !== jobId));
    } catch (err) {
      console.error('Failed to unsave job', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lowongan Tersimpan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Daftar lowongan kerja yang Anda bookmark untuk dilamar di kemudian hari.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200 self-start sm:self-auto">
          {savedJobs.length} Lowongan Disimpan
        </div>
      </div>

      {loading ? (
        <div className="py-12">
          <LoadingScreen message="Memuat lowongan tersimpan..." />
        </div>
      ) : error ? (
        <div className="p-8 bg-white rounded-2xl border border-slate-200">
          <ErrorState message={error} onRetry={fetchSavedJobs} />
        </div>
      ) : savedJobs.length === 0 ? (
        <div className="p-8 bg-white rounded-2xl border border-slate-200">
          <EmptyState
            title="Belum Ada Lowongan Tersimpan"
            message="Anda belum menyimpan lowongan kerja apapun. Jelajahi lowongan dan klik ikon simpan."
            actionText="Cari Lowongan Sekarang"
            onAction={() => window.location.href = '/candidate/jobs'}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {savedJobs.map((item) => {
            const job = item.job_vacancy;
            if (!job) return null;
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-blue-600 text-sm overflow-hidden shrink-0">
                      {job.company?.logo ? (
                        <img src={job.company.logo} alt={job.company?.company_name} className="w-full h-full object-cover" />
                      ) : (
                        job.company?.company_name?.charAt(0)?.toUpperCase() || 'C'
                      )}
                    </div>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleUnsave(job.id)}
                      className="text-rose-500 hover:text-rose-700 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition"
                      title="Hapus dari tersimpan"
                    >
                      Batal Simpan
                    </button>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 line-clamp-1">{job.title}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{job.company?.company_name}</p>

                  <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                      {job.location}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium capitalize">
                      {job.employment_type?.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium">
                      {job.category?.name}
                    </span>
                  </div>

                  {job.skills && job.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {job.skills.slice(0, 3).map((s) => (
                        <span key={s.id} className="text-[10px] font-semibold bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-100">
                          {s.name}
                        </span>
                      ))}
                      {job.skills.length > 3 && (
                        <span className="text-[10px] text-slate-400">+{job.skills.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Batas: {job.deadline ? new Date(job.deadline).toLocaleDateString('id-ID') : '-'}
                  </span>
                  <Link
                    to={`/candidate/jobs/${job.id}`}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
                  >
                    Lihat Detail →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CandidateSavedJobs;
