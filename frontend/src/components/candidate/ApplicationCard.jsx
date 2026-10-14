import React from 'react';
import { Link } from 'react-router-dom';
import ApplicationStatusBadge from './ApplicationStatusBadge';

const employmentTypeLabels = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  internship: 'Internship',
  freelance: 'Freelance',
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

const ApplicationCard = ({ application }) => {
  const job = application.job_vacancy || application.jobVacancy || {};
  const company = job.company || {};
  const empType = employmentTypeLabels[job.employment_type] || job.employment_type || 'Full Time';
  const matchPercentage = Math.round(application.match_percentage ?? 0);

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between group"
      data-testid={`application-card-${application.id}`}
    >
      <div>
        {/* Top Header: Company & Status Badge */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3 min-w-0">
            {company.logo ? (
              <img
                src={company.logo}
                alt={company.company_name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center shrink-0 border border-blue-100 text-sm">
                {company.company_name ? company.company_name[0].toUpperCase() : 'C'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 truncate">
                {company.company_name || 'Perusahaan'}
              </p>
              <Link
                to={`/candidate/applications/${application.id}`}
                className="text-base font-bold text-slate-800 hover:text-blue-600 transition-colors line-clamp-1 group-hover:text-blue-600"
              >
                {job.title || 'Lowongan Pekerjaan'}
              </Link>
            </div>
          </div>

          <ApplicationStatusBadge status={application.status} size="md" />
        </div>

        {/* Tags & Meta Info */}
        <div className="flex flex-wrap items-center gap-2 mb-3.5">
          {job.category?.name && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
              {job.category.name}
            </span>
          )}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
            {empType}
          </span>
          {job.location && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {job.location}
            </span>
          )}
        </div>

        {/* Match Percentage & Application Date */}
        <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-2 border border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Kecocokan Kualifikasi:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-md ${
                matchPercentage >= 75
                  ? 'bg-emerald-100 text-emerald-700'
                  : matchPercentage >= 50
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {matchPercentage}% Match
            </span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                matchPercentage >= 75
                  ? 'bg-emerald-500'
                  : matchPercentage >= 50
                  ? 'bg-amber-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(matchPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Info & Action */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
        <div className="text-slate-400 space-y-0.5">
          <p>
            Melamar: <span className="font-semibold text-slate-600">{formatDate(application.applied_at)}</span>
          </p>
          {job.deadline && (
            <p className="text-[11px]">
              Batas: <span className="text-slate-500">{formatDate(job.deadline)}</span>
            </p>
          )}
        </div>

        <Link
          to={`/candidate/applications/${application.id}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-2xs group/btn"
        >
          Lihat Detail
          <svg className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default ApplicationCard;
