import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import candidateService from '../../services/candidateService';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

const CandidateInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await candidateService.getInterviews();
      if (res?.success) {
        setInterviews(res.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat jadwal wawancara.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  const filteredInterviews = interviews.filter((item) => {
    if (filter === 'scheduled') return item.status === 'scheduled';
    if (filter === 'completed') return item.status === 'completed';
    if (filter === 'cancelled') return item.status === 'cancelled';
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Selesai
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Dibatalkan
          </span>
        );
      case 'scheduled':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            Terjadwal
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Jadwal Wawancara</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau jadwal dan informasi sesi interview yang diundang oleh perusahaan.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200 self-start sm:self-auto">
          {interviews.length} Wawancara Terdaftar
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Semua ({interviews.length})
        </button>
        <button
          onClick={() => setFilter('scheduled')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            filter === 'scheduled' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Akan Datang ({interviews.filter((i) => i.status === 'scheduled').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            filter === 'completed' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Selesai ({interviews.filter((i) => i.status === 'completed').length})
        </button>
      </div>

      {loading ? (
        <div className="py-12">
          <LoadingScreen message="Memuat jadwal wawancara Anda..." />
        </div>
      ) : error ? (
        <div className="p-8 bg-white rounded-2xl border border-slate-200">
          <ErrorState message={error} onRetry={fetchInterviews} />
        </div>
      ) : filteredInterviews.length === 0 ? (
        <div className="p-8 bg-white rounded-2xl border border-slate-200">
          <EmptyState
            title="Tidak Ada Jadwal Wawancara"
            message={
              filter === 'scheduled'
                ? 'Tidak ada wawancara mendatang yang dijadwalkan.'
                : 'Belum ada undangan wawancara dari perusahaan.'
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredInterviews.map((item) => {
            const job = item.application?.job_vacancy;
            const company = job?.company;
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        {company?.company_name}
                      </span>
                      <h3 className="font-bold text-base text-slate-900 mt-0.5">{job?.title}</h3>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2 mt-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Tanggal:</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(item.interview_date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Waktu:</span>
                      <span className="font-semibold text-slate-800">Pukul {item.interview_time} WIB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Metode:</span>
                      <span className="font-semibold text-blue-700 uppercase">{item.method}</span>
                    </div>

                    {item.method === 'online' && item.meeting_link && (
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-slate-500 block mb-1">Tautan Wawancara Online:</span>
                        <a
                          href={item.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-blue-600 underline hover:text-blue-800 break-all"
                        >
                          {item.meeting_link}
                        </a>
                      </div>
                    )}

                    {item.method === 'offline' && item.location && (
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-slate-500 block">Lokasi:</span>
                        <span className="font-semibold text-slate-800">{item.location}</span>
                      </div>
                    )}

                    {item.notes && (
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-slate-500 block">Catatan Tambahan:</span>
                        <p className="text-slate-700 italic mt-0.5">{item.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">ID Sesi #{item.id}</span>
                  {item.application_id && (
                    <Link
                      to={`/candidate/applications/${item.application_id}`}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Lihat Berkas Lamaran →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CandidateInterviews;
