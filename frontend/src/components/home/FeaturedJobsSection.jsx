import React from 'react';
import { Link } from 'react-router-dom';

const employmentTypeMap = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  internship: 'Internship',
  freelance: 'Freelance',
  contract: 'Kontrak',
};

const formatSalary = (min, max) => {
  if (!min && !max) return null;
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

const FeaturedJobsSection = ({ jobs, loading, jobsPath, getJobDetailPath }) => {
  return (
    <section id="lowongan-terbaru" className="py-16 sm:py-22 bg-slate-50/80 border-b border-slate-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-blue-700 font-semibold block mb-2">
              Lowongan Aktif
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
              Lowongan Kerja Terbaru
            </h2>
          </div>
          <Link
            to={jobsPath}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-700 transition-colors self-start sm:self-auto"
          >
            <span>Lihat semua lowongan</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-slate-200/90 p-6 animate-pulse space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-200" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3.5 w-2/3 bg-slate-200 rounded" />
                    <div className="h-3 w-1/2 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="h-5 w-4/5 bg-slate-200 rounded" />
                <div className="space-y-2">
                  <div className="h-3.5 w-1/2 bg-slate-100 rounded" />
                  <div className="h-3.5 w-2/3 bg-slate-100 rounded" />
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div className="h-3 w-24 bg-slate-100 rounded" />
                  <div className="h-8 w-24 bg-slate-200 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          /* Empty State — Strictly Real API Data, No Fake Jobs */
          <div className="bg-white rounded-lg border border-slate-200/90 p-10 sm:p-12 text-center max-w-xl mx-auto">
            <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center mx-auto mb-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-950 mb-1.5">
              Belum Ada Lowongan Aktif Saat Ini
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
              Lowongan pekerjaan yang dipublikasikan oleh perusahaan terverifikasi akan langsung tampil secara otomatis di sini.
            </p>
            <Link
              to={jobsPath}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0b1120] hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
            >
              <span>Jelajahi Halaman Lowongan</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        ) : (
          /* Real Jobs Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {jobs.map((job) => {
              const salaryText = formatSalary(job.salary_min, job.salary_max);

              return (
                <article
                  key={job.id}
                  className="bg-white rounded-lg border border-slate-200/90 p-5 sm:p-6 hover:border-slate-400 hover:shadow-[0_6px_24px_-12px_rgba(15,23,42,0.12)] transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Company Row */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {job.company?.logo ? (
                          <img
                            src={job.company.logo}
                            alt={job.company.company_name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[#0b1120] text-white font-semibold text-sm flex items-center justify-center shrink-0">
                            {job.company?.company_name
                              ? job.company.company_name[0].toUpperCase()
                              : 'P'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            {job.company?.company_name || 'Perusahaan Terverifikasi'}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {job.category?.name || 'Umum'}
                          </p>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80 shrink-0">
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

                    {/* Location & Salary */}
                    <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{job.location || 'Indonesia'}</span>
                      </div>

                      {salaryText && (
                        <div className="flex items-center gap-2 font-medium text-slate-800">
                          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="truncate">{salaryText}</span>
                        </div>
                      )}
                    </div>

                    {/* Skills Preview */}
                    {Array.isArray(job.skills) && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {job.skills.slice(0, 3).map((s, idx) => (
                          <span
                            key={s.id || idx}
                            className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200/80"
                          >
                            {s.name || s}
                          </span>
                        ))}
                        {job.skills.length > 3 && (
                          <span className="px-1.5 py-0.5 text-[11px] font-mono text-slate-400">
                            +{job.skills.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Tutup {formatDeadline(job.deadline)}
                    </span>
                    <Link
                      to={getJobDetailPath(job.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0b1120] hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                    >
                      <span>Lihat Detail</span>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedJobsSection;
