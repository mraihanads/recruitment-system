import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import companyService from '../../services/companyService';
import LoadingScreen from '../../components/common/LoadingScreen';

const CreateJob = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [masterSkills, setMasterSkills] = useState([]);
  const [initLoading, setInitLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    description: '',
    requirements: '',
    location: '',
    employment_type: 'full_time',
    salary_min: '',
    salary_max: '',
    education: 'D3/S1 Teknik Informatika atau bidang terkait',
    deadline: '',
    status: 'active',
    skills: [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [skillSearch, setSkillSearch] = useState('');

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [catsRes, skillsRes] = await Promise.all([
          companyService.getJobCategories(),
          companyService.getMasterSkills(),
        ]);
        if (catsRes?.data) setCategories(catsRes.data);
        if (skillsRes?.data) setMasterSkills(skillsRes.data);
      } catch (err) {
        setErrorMessage('Gagal memuat kategori atau keahlian dari server.');
      } finally {
        setInitLoading(false);
      }
    };

    fetchMasterData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleSkill = (skillId) => {
    setFormData((prev) => {
      const exists = prev.skills.includes(skillId);
      const nextSkills = exists
        ? prev.skills.filter((id) => id !== skillId)
        : [...prev.skills, skillId];
      return { ...prev, skills: nextSkills };
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = ['Judul lowongan wajib diisi.'];
    if (!formData.category_id) errors.category_id = ['Kategori pekerjaan wajib dipilih.'];
    if (!formData.location.trim()) errors.location = ['Lokasi penempatan kerja wajib diisi.'];
    if (!formData.description.trim()) errors.description = ['Deskripsi pekerjaan wajib diisi.'];
    if (!formData.requirements.trim()) errors.requirements = ['Persyaratan kualifikasi wajib diisi.'];
    if (!formData.deadline) errors.deadline = ['Batas waktu lamaran (deadline) wajib diisi.'];

    if (formData.salary_min && formData.salary_max) {
      if (Number(formData.salary_min) > Number(formData.salary_max)) {
        errors.salary_max = ['Gaji maksimal tidak boleh lebih kecil dari gaji minimal.'];
      }
    }

    if (formData.skills.length === 0) {
      errors.skills = ['Pilih minimal 1 keahlian (skill) yang dibutuhkan untuk lowongan ini.'];
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setErrorMessage('');

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMessage('Silakan lengkapi seluruh isian wajib pada formulir.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        category_id: Number(formData.category_id),
        description: formData.description.trim(),
        requirements: formData.requirements.trim(),
        location: formData.location.trim(),
        employment_type: formData.employment_type,
        salary_min: formData.salary_min ? Number(formData.salary_min) : null,
        salary_max: formData.salary_max ? Number(formData.salary_max) : null,
        education: formData.education.trim() || null,
        deadline: formData.deadline,
        status: formData.status,
        skills: formData.skills,
      };

      const res = await companyService.createJob(payload);
      if (res?.success) {
        navigate('/company/jobs', {
          state: { successMessage: 'Lowongan pekerjaan baru berhasil diterbitkan!' },
        });
      } else {
        throw new Error(res?.message || 'Gagal menerbitkan lowongan.');
      }
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
        setErrorMessage('Terdapat kesalahan validasi dari server.');
      } else {
        setErrorMessage(
          err.response?.data?.message || 'Terjadi kesalahan saat membuat lowongan pekerjaan.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (initLoading) {
    return <LoadingScreen message="Menyiapkan formulir lowongan..." />;
  }

  const filteredSkills = masterSkills.filter((s) =>
    s.name.toLowerCase().includes(skillSearch.toLowerCase().trim())
  );

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/company/jobs"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Daftar Lowongan
        </Link>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="pb-5 mb-6 border-b border-slate-100">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">
            Buat Lowongan Pekerjaan Baru
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Lengkapi data spesifikasi pekerjaan, kualifikasi yang dibutuhkan, dan skill yang relevan untuk menarik kandidat terbaik.
          </p>
        </div>

        {errorMessage && (
          <div className="p-4 mb-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="text-rose-500 hover:text-rose-700 text-base leading-none"
            >
              &times;
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" data-testid="create-job-form">
          {/* Section 1: Informasi Dasar */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-4 rounded-full bg-blue-600" />
              1. Informasi Posisi Pekerjaan
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Judul Posisi Lowongan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Contoh: Junior Full Stack Developer"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                required
                data-testid="job-title-input"
              />
              {fieldErrors.title && (
                <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.title[0]}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori Pekerjaan <span className="text-rose-500">*</span>
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                  required
                  data-testid="job-category-select"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.category_id && (
                  <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.category_id[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipe Pekerjaan <span className="text-rose-500">*</span>
                </label>
                <select
                  name="employment_type"
                  value={formData.employment_type}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                  required
                  data-testid="job-employment-select"
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="internship">Internship</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lokasi Penempatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Contoh: Banda Aceh atau Remote"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                  data-testid="job-location-input"
                />
                {fieldErrors.location && (
                  <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.location[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pendidikan Minimal
                </label>
                <input
                  type="text"
                  name="education"
                  value={formData.education}
                  onChange={handleInputChange}
                  placeholder="Contoh: D3/S1 Teknik Informatika"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gaji Minimal (IDR)
                </label>
                <input
                  type="number"
                  name="salary_min"
                  value={formData.salary_min}
                  onChange={handleInputChange}
                  placeholder="Contoh: 4000000"
                  min="0"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  data-testid="salary-min-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gaji Maksimal (IDR)
                </label>
                <input
                  type="number"
                  name="salary_max"
                  value={formData.salary_max}
                  onChange={handleInputChange}
                  placeholder="Contoh: 6000000"
                  min="0"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  data-testid="salary-max-input"
                />
                {fieldErrors.salary_max && (
                  <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.salary_max[0]}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Batas Akhir Lamaran (Deadline) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                  required
                  data-testid="job-deadline-input"
                />
                {fieldErrors.deadline && (
                  <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.deadline[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Publikasi Awal
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                >
                  <option value="active">Aktif (Langsung Publikasikan)</option>
                  <option value="draft">Draft (Simpan Sementara)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Deskripsi & Persyaratan */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-4 rounded-full bg-indigo-600" />
              2. Deskripsi & Kualifikasi
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Deskripsi Pekerjaan <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Jelaskan peran, tanggung jawab utama, dan lingkup kerja posisi ini..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed"
                required
                data-testid="job-description-input"
              />
              {fieldErrors.description && (
                <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.description[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Persyaratan & Kualifikasi <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleInputChange}
                rows={4}
                placeholder="Sebutkan pengalaman kerja, latar belakang, dan keahlian yang disyaratkan..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed"
                required
                data-testid="job-requirements-input"
              />
              {fieldErrors.requirements && (
                <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.requirements[0]}</p>
              )}
            </div>
          </div>

          {/* Section 3: Keahlian (Skills) */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-4 rounded-full bg-emerald-600" />
                  3. Kebutuhan Keahlian (Skills Matching) <span className="text-rose-500">*</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Skill ini digunakan oleh sistem untuk menghitung persentase kecocokan (Skill Matching) kandidat.
                </p>
              </div>

              <div className="text-xs text-slate-500 font-bold">
                {formData.skills.length} skill terpilih
              </div>
            </div>

            {/* Search filter for skills */}
            <div className="relative max-w-sm">
              <input
                type="text"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                placeholder="Cari keahlian (PHP, React, MySQL, dll)..."
                className="w-full pl-3.5 pr-8 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              {skillSearch && (
                <button
                  type="button"
                  onClick={() => setSkillSearch('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-sm"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Skills Pills */}
            <div className="flex flex-wrap gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-100 max-h-56 overflow-y-auto">
              {filteredSkills.map((skill) => {
                const isSelected = formData.skills.includes(skill.id);
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => handleToggleSkill(skill.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                    data-testid={`skill-pill-${skill.id}`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {skill.name}
                  </button>
                );
              })}
            </div>
            {fieldErrors.skills && (
              <p className="text-[11px] text-rose-600">{fieldErrors.skills[0]}</p>
            )}
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/company/jobs')}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 inline-flex items-center gap-2"
              data-testid="submit-job-button"
            >
              {submitting ? 'Menerbitkan...' : 'Terbitkan Lowongan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJob;
