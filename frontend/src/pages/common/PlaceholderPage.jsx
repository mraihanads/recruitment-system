import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import SectionCard from '../../components/dashboard/SectionCard';

const PlaceholderPage = ({ title, moduleName, description, backLink = '../dashboard' }) => {
  const location = useLocation();

  const formattedName = moduleName || location.pathname.split('/').filter(Boolean).pop()?.replace('-', ' ').toUpperCase() || 'MODUL';

  return (
    <div className="space-y-6">
      <SectionCard
        title={title || `Modul ${formattedName}`}
        subtitle="Halaman dasar telah terhubung dalam sistem navigasi role-based."
        action={
          <Link
            to={backLink}
            className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            ← Kembali ke Dashboard
          </Link>
        }
      >
        <div className="p-8 sm:p-12 text-center rounded-xl bg-slate-50/70 border border-slate-100">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 font-bold text-lg flex items-center justify-center mx-auto mb-4">
            📌
          </div>
          <h4 className="text-base font-bold text-slate-800 mb-2">
            {title || `Fondasi Halaman: ${formattedName}`}
          </h4>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
            {description || 'Fitur detail dan operasi manajemen untuk modul ini akan diimplementasikan pada langkah pengerjaan berikutnya.'}
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Rute & Hak Akses Terverifikasi (STEP 13B)
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

export default PlaceholderPage;
