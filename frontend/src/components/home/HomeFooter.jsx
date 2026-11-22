import React from 'react';
import { Link } from 'react-router-dom';

const HomeFooter = ({ isAuthenticated, dashboardPath, jobsPath, postJobPath }) => {
  return (
    <footer className="bg-white border-t border-slate-200/90 text-slate-600 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-3.5">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="RecruitMatch"
                className="w-8 h-8 rounded-lg object-contain"
              />
              <span className="font-bold text-slate-950 text-base tracking-tight">
                RecruitMatch
              </span>
            </Link>
            <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed max-w-sm">
              Platform rekrutmen dan pencocokan kompetensi yang membantu kandidat menemukan posisi yang tepat serta memudahkan perusahaan menyaring talenta secara terukur.
            </p>
          </div>

          {/* Navigation Column */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-900">
              Navigasi
            </h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li>
                <a href="#beranda" className="hover:text-slate-950 transition-colors">
                  Beranda
                </a>
              </li>
              <li>
                <Link to={jobsPath} className="hover:text-slate-950 transition-colors">
                  Lowongan Kerja
                </Link>
              </li>
              <li>
                <a href="#cara-kerja" className="hover:text-slate-950 transition-colors">
                  Cara Kerja
                </a>
              </li>
              <li>
                <a href="#fitur" className="hover:text-slate-950 transition-colors">
                  Fitur Platform
                </a>
              </li>
            </ul>
          </div>

          {/* Services Column */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-900">
              Layanan
            </h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li>
                <a href="#skill-matching" className="hover:text-slate-950 transition-colors">
                  Pencocokan Skill Otomatis
                </a>
              </li>
              <li>
                <Link to={jobsPath} className="hover:text-slate-950 transition-colors">
                  Portal Pencari Kerja
                </Link>
              </li>
              <li>
                <Link to={postJobPath} className="hover:text-slate-950 transition-colors">
                  Portal Perusahaan &amp; Recruiter
                </Link>
              </li>
              <li>
                <a href="#fitur" className="hover:text-slate-950 transition-colors">
                  Penjadwalan Wawancara
                </a>
              </li>
            </ul>
          </div>

          {/* Account Column */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-900">
              Akses Akun
            </h4>
            <ul className="space-y-2 text-xs text-slate-500">
              {isAuthenticated ? (
                <li>
                  <Link to={dashboardPath} className="hover:text-slate-950 transition-colors font-medium text-slate-800">
                    Buka Dashboard &rarr;
                  </Link>
                </li>
              ) : (
                <>
                  <li>
                    <Link to="/login" className="hover:text-slate-950 transition-colors">
                      Masuk
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" className="hover:text-slate-950 transition-colors">
                      Daftar Kandidat
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" className="hover:text-slate-950 transition-colors">
                      Daftar Perusahaan
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <p>&copy; {new Date().getFullYear()} RecruitMatch. Seluruh hak cipta dilindungi.</p>
          <p className="font-mono">Recruitment &amp; Skill Matching System</p>
        </div>
      </div>
    </footer>
  );
};

export default HomeFooter;
