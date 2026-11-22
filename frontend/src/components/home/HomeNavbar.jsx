import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const HomeNavbar = ({ isAuthenticated, user, dashboardPath, jobsPath }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/92 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <img
            src="/logo.png"
            alt="RecruitMatch"
            className="w-8 h-8 rounded-lg object-contain"
          />
          <span className="font-bold text-slate-950 text-[17px] tracking-tight">
            RecruitMatch
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7 text-[13px] font-medium text-slate-600">
          <a href="#beranda" className="hover:text-slate-950 transition-colors">
            Beranda
          </a>
          <Link to={jobsPath} className="hover:text-slate-950 transition-colors">
            Lowongan
          </Link>
          <a href="#fitur" className="hover:text-slate-950 transition-colors">
            Perusahaan
          </a>
          <a href="#cara-kerja" className="hover:text-slate-950 transition-colors">
            Tentang Kami
          </a>
        </nav>

        {/* Desktop Auth Actions */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          {isAuthenticated ? (
            <Link
              to={dashboardPath}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#0b1120] hover:bg-blue-700 transition-colors"
            >
              <span>Dashboard ({user?.name?.split(' ')[0] || 'Akun'})</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 transition-colors"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#0b1120] hover:bg-blue-700 transition-colors"
              >
                Daftar
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-colors"
          aria-label="Buka menu navigasi"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3">
          <nav className="flex flex-col space-y-1 text-sm font-medium text-slate-700">
            <a
              href="#beranda"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Beranda
            </a>
            <Link
              to={jobsPath}
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Lowongan
            </Link>
            <a
              href="#fitur"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Perusahaan
            </a>
            <a
              href="#cara-kerja"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Tentang Kami
            </a>
          </nav>

          <div className="pt-3 border-t border-slate-100 flex items-center gap-2.5">
            {isAuthenticated ? (
              <Link
                to={dashboardPath}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 px-4 rounded-lg text-xs font-semibold text-white bg-[#0b1120]"
              >
                Dashboard ({user?.name?.split(' ')[0] || 'Akun'})
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2.5 px-4 rounded-lg text-xs font-semibold text-slate-700 border border-slate-300"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2.5 px-4 rounded-lg text-xs font-semibold text-white bg-[#0b1120]"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default HomeNavbar;
