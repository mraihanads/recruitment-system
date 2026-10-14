import React from 'react';
import ApplicationStatusBadge from './ApplicationStatusBadge';

const formatDateTime = (dateString) => {
  if (!dateString) return { date: '-', time: '' };
  try {
    const d = new Date(dateString);
    const date = d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const time = d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return { date, time: `${time} WIB` };
  } catch {
    return { date: dateString, time: '' };
  }
};

const ApplicationTimeline = ({ histories = [], currentStatus = 'submitted' }) => {
  if (!histories || histories.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500">
        Belum ada riwayat perubahan status lamaran.
      </div>
    );
  }

  return (
    <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {histories.map((item, index) => {
        const isLatest = index === histories.length - 1;
        const { date, time } = formatDateTime(item.created_at);

        return (
          <div key={item.id || index} className="relative group">
            {/* Timeline Dot Indicator */}
            <div
              className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-4 border-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-110 ${
                isLatest
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-300 text-slate-600'
              }`}
            >
              {isLatest ? (
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>

            {/* Content Card */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isLatest
                  ? 'bg-blue-50/40 border-blue-200/80 shadow-2xs'
                  : 'bg-white border-slate-100 shadow-2xs'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <ApplicationStatusBadge status={item.status} size="sm" />
                  {isLatest && (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-md">
                      Status Terkini
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  {date} {time && `• ${time}`}
                </span>
              </div>

              {item.note && (
                <p className="text-xs text-slate-600 leading-relaxed mt-2 pt-2 border-t border-slate-100/80">
                  {item.note}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ApplicationTimeline;
