import React from 'react';

export const statusConfig = {
  submitted: {
    label: 'Diajukan',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    message: 'Lamaran berhasil dikirim.',
  },
  screening: {
    label: 'Screening',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    message: 'Lamaran sedang dalam proses screening.',
  },
  interview: {
    label: 'Wawancara',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    message: 'Anda masuk ke tahap wawancara.',
  },
  test: {
    label: 'Tes',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
    message: 'Anda masuk ke tahap tes.',
  },
  accepted: {
    label: 'Diterima',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    message: 'Selamat! Anda diterima.',
  },
  rejected: {
    label: 'Ditolak',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    message: 'Lamaran belum berhasil pada posisi ini.',
  },
};

const ApplicationStatusBadge = ({ status = 'submitted', size = 'md', className = '' }) => {
  const normalizedStatus = (status || 'submitted').toLowerCase();
  const config = statusConfig[normalizedStatus] || {
    label: status,
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    message: 'Status dalam pemrosesan.',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3.5 py-1.5 text-xs sm:text-sm font-bold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg font-semibold border ${config.color} ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
      data-testid={`status-badge-${normalizedStatus}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`}></span>
      {config.label}
    </span>
  );
};

export default ApplicationStatusBadge;
