import React from 'react';

const colorStyles = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-100',
    ring: 'ring-blue-500/20',
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-100',
    ring: 'ring-emerald-500/20',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-100',
    ring: 'ring-amber-500/20',
  },
  rose: {
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    border: 'border-rose-100',
    ring: 'ring-rose-500/20',
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    border: 'border-indigo-100',
    ring: 'ring-indigo-500/20',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-100',
    ring: 'ring-purple-500/20',
  },
};

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
  badge,
}) => {
  const current = colorStyles[color] || colorStyles.blue;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs sm:text-sm font-semibold text-slate-500 tracking-wide uppercase">
          {title}
        </span>
        {icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${current.bg} ${current.text} ${current.border} border`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {value !== undefined && value !== null ? value : 0}
        </span>
        {badge && (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-500 mt-2 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default StatCard;
