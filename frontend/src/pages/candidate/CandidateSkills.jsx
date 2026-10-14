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

  // Selector state
  const [selectedSkillId, setSelectedSkillId] = useState('');
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

  const handleAddSkill = async (e) => {
    e.preventDefault();
    setFeedbackMessage({ type: '', text: '' });

    if (!selectedSkillId) {
      setFeedbackMessage({ type: 'error', text: 'Silakan pilih keahlian terlebih dahulu.' });
      return;
    }

    const skillIdInt = parseInt(selectedSkillId, 10);
    // Frontend duplicate check
    const alreadyHas = candidateSkills.some((s) => s.id === skillIdInt);
    if (alreadyHas) {
      setFeedbackMessage({ type: 'error', text: 'Skill ini sudah ditambahkan ke profil Anda.' });
      return;
    }

    setSubmitting(true);
    try {
      await candidateService.addSkill(skillIdInt);
      const addedSkill = masterSkills.find((s) => s.id === skillIdInt);
      if (addedSkill) {
        setCandidateSkills((prev) => [...prev, addedSkill]);
      } else {
        fetchData();
      }
      setSelectedSkillId('');
      setSearchFilter('');
      setFeedbackMessage({ type: 'success', text: `Skill "${addedSkill?.name || ''}" berhasil ditambahkan.` });
      setTimeout(() => setFeedbackMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      setFeedbackMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal menambahkan skill.',
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
        subtitle="Pilih keahlian teknis atau kompetensi dari daftar master skill sistem"
        className="mb-6"
      >
        <form onSubmit={handleAddSkill} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Searchable Skill Selector */}
            <div className="flex-1">
              <select
                id="skill-select"
                value={selectedSkillId}
                onChange={(e) => setSelectedSkillId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
              >
                <option value="">-- Pilih Keahlian yang Anda Kuasai --</option>
                {availableSkills.map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedSkillId}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Menambahkan...</span>
                </>
              ) : (
                <>
                  <span>+ Tambah Skill</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-400">
            💡 Sistem rekrutmen akan menggunakan keahlian ini untuk menghitung persentase kecocokan (*match percentage*) dengan lowongan kerja yang relevan.
          </p>
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
            description="Tambahkan keahlian Anda melalui form di atas untuk mengaktifkan fitur pencocokan lowongan otomatis."
          />
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {candidateSkills.map((skill) => (
              <span
                key={skill.id}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-blue-50 text-blue-800 border border-blue-200/80 shadow-2xs hover:bg-blue-100 transition-colors"
              >
                <span>⚡ {skill.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill.id, skill.name)}
                  disabled={removingId === skill.id}
                  title={`Hapus skill ${skill.name}`}
                  className="w-4 h-4 rounded-full text-blue-400 hover:text-rose-600 flex items-center justify-center text-xs font-bold transition-colors disabled:opacity-50"
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
