import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const roleBadgeStyles = {
  admin: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  company: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  candidate: 'bg-blue-50 text-blue-700 border-blue-200',
};

const roleLabels = {
  admin: 'Administrator',
  company: 'Company / Recruiter',
  candidate: 'Pencari Kerja',
};

const Navbar = ({ title = 'Dashboard', onMenuClick }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Toggle Navigation"
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
          {title}
        </h1>
      </div>

      {/* Right: User Information & Actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* User Badge Info */}
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-semibold text-slate-800 leading-tight">
            {user?.name || 'Pengguna'}
          </span>
          <span
            className={`mt-0.5 inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
              roleBadgeStyles[role] || 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {roleLabels[role] || role}
          </span>
        </div>

        {/* User Initials Avatar */}
        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center shadow-xs select-none">
          {getInitials(user?.name)}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          title="Keluar dari akun"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
