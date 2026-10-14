import React, { useState } from 'react';
import { Link } from 'react-router-dom';

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

const JobCard = ({
  job,
  isSaved = false,
  onToggleSave,
  className = '',
}) => {
  const [saving, setSaving] = useState(false);
  const [localSaved, setLocalSaved] = useState(isSaved);

  // Sync state if prop changes
  React.useEffect(() => {
    setLocalSaved(isSaved);
  }, [isSaved]);

  const handleSaveClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (saving) return;

    const previousState = localSaved;
    const newState = !previousState;
    setLocalSaved(newState);
    setSaving(true);

    try {
      if (onToggleSave) {
        await onToggleSave(job.id, previousState);
      }
    } catch {
      // Revert if error
      setLocalSaved(previousState);
    } finally {
      setSaving(false);
    }
  };

  const formattedSalary = (() => {
    if (job.salary_min && job.salary_max) {
      return `${formatCurrency(job.salary_min)} - ${formatCurrency(job.salary_max)}`;
    }
    if (job.salary_min) return `Mulai ${formatCurrency(job.salary_min)}`;
    if (job.salary_max) return `Hingga ${formatCurrency(job.salary_max)}`;
    return null;
  })();

  const empType = employmentTypeLabels[job.employment_type] || job.employment_type || 'Full Time';

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between group ${className}`}
      data-testid={`job-card-${job.id}`}
    >
      <div>
        {/* Header: Company & Save Button */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            {job.company?.logo ? (
              <img
                src={job.company.logo}
                alt={job.company.company_name}
                className="w-11 h-11 rounded-xl object-cover border border-slate-100 shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center shrink-0 border border-blue-100 text-sm">
                {job.company?.company_name ? job.company.company_name[0].toUpperCase() : 'C'}
              </div>
            )}
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-slate-500 truncate">
                {job.company?.company_name || 'Perusahaan'}
              </h4>
              <Link
                to={`/candidate/jobs/${job.id}`}
                className="text-base font-bold text-slate-800 hover:text-blue-600 transition-colors line-clamp-1 group-hover:text-blue-600"
              >
                {job.title}
              </Link>
            </div>
          </div>

          {/* Bookmark / Save Button */}
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={saving}
            title={localSaved ? 'Hapus dari Simpanan' : 'Simpan Lowongan'}
            className={`p-2 rounded-xl transition-all border shrink-0 ${
              localSaved
                ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600 hover:bg-slate-100'
            }`}
            data-testid={`save-btn-${job.id}`}
          >
            <svg
              className={`w-5 h-5 ${localSaved ? 'fill-current' : 'none'}`}
              fill={localSaved ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </button>
        </div>

        {/* Badges / Meta tags */}
        <div className="flex flex-wrap items-center gap-2 mb-3.5">
          {job.category?.name && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
              {job.category.name}
            </span>
          )}
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
            {empType}
          </span>
          {job.status && job.status !== 'active' && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100">
              Ditutup
            </span>
          )}
        </div>

        {/* Location & Salary Info */}
        <div className="space-y-1.5 text-xs text-slate-500 mb-4">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{job.location || 'Indonesia'}</span>
          </div>
          {formattedSalary && (
            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formattedSalary}</span>
            </div>
          )}
          {job.deadline && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Batas: {formatDate(job.deadline)}</span>
            </div>
          )}
        </div>

        {/* Skills Tag Cloud */}
        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {job.skills.slice(0, 3).map((skill) => (
              <span
                key={skill.id}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200/60"
              >
                {skill.name}
              </span>
            ))}
            {job.skills.length > 3 && (
              <span className="px-1.5 py-0.5 rounded-md text-[11px] text-slate-400">
                +{job.skills.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Actions Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 mt-auto">
        <span className="text-xs font-semibold text-slate-400">
          {localSaved ? (
            <span className="text-amber-600 font-bold inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Tersimpan
            </span>
          ) : (
            <span>Tersedia</span>
          )}
        </span>
        <Link
          to={`/candidate/jobs/${job.id}`}
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

export default JobCard;
