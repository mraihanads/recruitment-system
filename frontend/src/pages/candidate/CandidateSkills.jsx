import React, { useState, useEffect, useCallback } from 'react';
import candidateService from '../../services/candidateService';
import ProfileTabs from '../../components/candidate/ProfileTabs';
import SectionCard from '../../components/dashboard/SectionCard';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

const CandidateSkills = () => {
  const [candidateSkills, setCandidateSkills] = useState([]);
  const [masterSkills, setMasterSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Multi-selector state
  const [selectedSkillIds, setSelectedSkillIds] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [candSkillsRes, masterSkillsRes] = await Promise.all([
        candidateService.getCandidateSkills(),
        candidateService.getMasterSkills(),
      ]);

      setCandidateSkills(candSkillsRes.data || []);
      setMasterSkills(masterSkillsRes.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Gagal memuat data keahlian dari server.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleSelectSkill = (skillId) => {
    setSelectedSkillIds((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId]
    );
  };

  const handleAddSkills = async (e) => {
    e.preventDefault();
    setFeedbackMessage({ type: '', text: '' });

    if (selectedSkillIds.length === 0) {
      setFeedbackMessage({ type: 'error', text: 'Silakan pilih minimal satu keahlian terlebih dahulu.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await candidateService.addSkills(selectedSkillIds);
      if (Array.isArray(res.data)) {
        setCandidateSkills(res.data);
      } else {
        await fetchData();
      }
      const addedCount = selectedSkillIds.length;
      setSelectedSkillIds([]);
      setSearchFilter('');
      setFeedbackMessage({
        type: 'success',
        text: `${addedCount} keahlian berhasil ditambahkan ke profil Anda.`,
      });
      setTimeout(() => setFeedbackMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      setFeedbackMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal menambahkan keahlian.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveSkill = async (skillId, skillName) => {
    setRemovingId(skillId);
    setFeedbackMessage({ type: '', text: '' });
    try {
      await candidateService.removeSkill(skillId);
      setCandidateSkills((prev) => prev.filter((s) => s.id !== skillId));
      setFeedbackMessage({ type: 'success', text: `Skill "${skillName}" berhasil dihapus dari profil.` });
      setTimeout(() => setFeedbackMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      setFeedbackMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal menghapus skill.',
      });
    } finally {
      setRemovingId(null);
    }
  };

  // Filter master skills for selector
  const availableSkills = masterSkills
    .filter((s) => !candidateSkills.some((cs) => cs.id === s.id))
    .filter((s) => s.name.toLowerCase().includes(searchFilter.toLowerCase()));

  return (
    <div>
      <ProfileTabs />

      {/* Global Feedback Alert */}
      {feedbackMessage.text && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm flex items-center justify-between border ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            onClick={() => setFeedbackMessage({ type: '', text: '' })}
            className="text-xs font-bold hover:underline"
          >
            ✕
          </button>
        </div>
      )}

      {/* Add Skill Box */}
      <SectionCard
        title="Tambah Keahlian Baru"
        subtitle="Klik untuk memilih beberapa keahlian sekaligus dari daftar master skill, lalu tekan Simpan"
        className="mb-6"
      >
        <form onSubmit={handleAddSkills} className="space-y-4">
          {/* Search Filter & Selection Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Cari nama keahlian (contoh: React, PHP, Excel, Accounting)..."
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-sm"
                >
                  ✕
                </button>
              )}
            </div>

            {selectedSkillIds.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
                  {selectedSkillIds.length} keahlian dipilih
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSkillIds([])}
                  className="text-xs text-slate-500 hover:text-rose-600 font-medium underline"
                >
                  Reset Pilihan
                </button>
              </div>
            )}
          </div>

          {/* Multi-select Skill Pills */}
          {availableSkills.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center text-xs text-slate-500">
              {searchFilter
                ? `Tidak ada keahlian yang cocok dengan kata kunci "${searchFilter}".`
                : 'Semua keahlian di sistem sudah Anda tambahkan ke profil.'}
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 max-h-60 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {availableSkills.map((skill) => {
                  const isSelected = selectedSkillIds.includes(skill.id);
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => toggleSelectSkill(skill.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-100/70'
                      }`}
                    >
                      <span>{isSelected ? '✓' : '+'}</span>
                      <span>{skill.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Sistem menggunakan daftar keahlian Anda untuk menghitung persentase kecocokan dengan setiap lowongan kerja.
            </p>

            <button
              type="submit"
              disabled={submitting || selectedSkillIds.length === 0}
              className="px-5 py-2.5 bg-slate-900 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>
                  + Simpan Keahlian Terpilih {selectedSkillIds.length > 0 ? `(${selectedSkillIds.length})` : ''}
                </span>
              )}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* Candidate Owned Skills List */}
      <SectionCard
        title={`Daftar Keahlian Saya (${candidateSkills.length})`}
        subtitle="Keahlian yang saat ini tercatat di profil Anda"
      >
        {loading ? (
          <LoadingScreen message="Memuat daftar keahlian..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : candidateSkills.length === 0 ? (
          <EmptyState
            title="Belum Ada Keahlian Ditambahkan"
            description="Pilih satu atau beberapa keahlian di atas untuk mengaktifkan fitur pencocokan lowongan otomatis."
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {candidateSkills.map((skill) => (
              <span
                key={skill.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200/90 hover:bg-slate-200/70 transition-colors"
              >
                <span>{skill.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill.id, skill.name)}
                  disabled={removingId === skill.id}
                  title={`Hapus skill ${skill.name}`}
                  className="w-4 h-4 rounded-full text-slate-400 hover:text-rose-600 flex items-center justify-center text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {removingId === skill.id ? '…' : '✕'}
                </button>
              </span>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default CandidateSkills;
