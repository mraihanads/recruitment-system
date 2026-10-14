import api from './api';

export const candidateService = {
  /**
   * Profile Details
   */
  async getProfile() {
    const res = await api.get('/candidate/profile');
    return res.data;
  },

  async updateProfile(data) {
    const res = await api.put('/candidate/profile', data);
    return res.data;
  },

  async uploadPhoto(file) {
    const formData = new FormData();
    formData.append('photo', file);
    const res = await api.post('/candidate/profile/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async uploadCv(file) {
    const formData = new FormData();
    formData.append('cv_file', file);
    const res = await api.post('/candidate/profile/cv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  /**
   * Education CRUD
   */
  async getEducations() {
    const res = await api.get('/candidate/educations');
    return res.data;
  },

  async createEducation(data) {
    const res = await api.post('/candidate/educations', data);
    return res.data;
  },

  async updateEducation(id, data) {
    const res = await api.put(`/candidate/educations/${id}`, data);
    return res.data;
  },

  async deleteEducation(id) {
    const res = await api.delete(`/candidate/educations/${id}`);
    return res.data;
  },

  /**
   * Experience CRUD
   */
  async getExperiences() {
    const res = await api.get('/candidate/experiences');
    return res.data;
  },

  async createExperience(data) {
    const res = await api.post('/candidate/experiences', data);
    return res.data;
  },

  async updateExperience(id, data) {
    const res = await api.put(`/candidate/experiences/${id}`, data);
    return res.data;
  },

  async deleteExperience(id) {
    const res = await api.delete(`/candidate/experiences/${id}`);
    return res.data;
  },

  /**
   * Portfolio CRUD
   */
  async getPortfolios() {
    const res = await api.get('/candidate/portfolios');
    return res.data;
  },

  async createPortfolio(formDataOrData) {
    const isFormData = formDataOrData instanceof FormData;
    const res = await api.post('/candidate/portfolios', formDataOrData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return res.data;
  },

  async updatePortfolio(id, formDataOrData) {
    const isFormData = formDataOrData instanceof FormData;
    if (isFormData) {
      // In Laravel, file upload on update works best via POST with _method=PUT
      formDataOrData.append('_method', 'PUT');
      const res = await api.post(`/candidate/portfolios/${id}`, formDataOrData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } else {
      const res = await api.put(`/candidate/portfolios/${id}`, formDataOrData);
      return res.data;
    }
  },

  async deletePortfolio(id) {
    const res = await api.delete(`/candidate/portfolios/${id}`);
    return res.data;
  },

  /**
   * Skills
   */
  async getCandidateSkills() {
    const res = await api.get('/candidate/skills');
    return res.data;
  },

  async getMasterSkills() {
    const res = await api.get('/skills');
    return res.data;
  },

  async addSkill(skillId) {
    const res = await api.post('/candidate/skills', { skill_id: skillId });
    return res.data;
  },

  async removeSkill(skillId) {
    const res = await api.delete(`/candidate/skills/${skillId}`);
    return res.data;
  },

  /**
   * Jobs & Application (STEP 14B)
   */
  async getJobs(params = {}) {
    const res = await api.get('/jobs', { params });
    return res.data;
  },

  async getJobCategories() {
    const res = await api.get('/job-categories');
    return res.data;
  },

  async getJobDetail(id) {
    const res = await api.get(`/jobs/${id}`);
    return res.data;
  },

  async getJobMatch(id) {
    const res = await api.get(`/jobs/${id}/match`);
    return res.data;
  },

  async saveJob(id) {
    const res = await api.post(`/jobs/${id}/save`);
    return res.data;
  },

  async unsaveJob(id) {
    const res = await api.delete(`/jobs/${id}/save`);
    return res.data;
  },

  async getSavedJobs() {
    const res = await api.get('/candidate/saved-jobs');
    return res.data;
  },

  async applyJob(id, data = {}) {
    const res = await api.post(`/jobs/${id}/apply`, data);
    return res.data;
  },

  /**
   * Applications (STEP 14C)
   */
  async getApplications(params = {}) {
    const res = await api.get('/candidate/applications', { params });
    return res.data;
  },

  async getApplicationDetail(id) {
    const res = await api.get(`/candidate/applications/${id}`);
    return res.data;
  },

  /**
   * Candidate Interviews & Notifications (STEP 17)
   */
  async getInterviews() {
    const res = await api.get('/candidate/interviews');
    return res.data;
  },

  async getInterviewDetail(id) {
    const res = await api.get(`/candidate/interviews/${id}`);
    return res.data;
  },

  async getNotifications() {
    const res = await api.get('/candidate/notifications');
    return res.data;
  },

  async markNotificationRead(id) {
    const res = await api.patch(`/candidate/notifications/${id}/read`);
    return res.data;
  },

  async markAllNotificationsRead() {
    const res = await api.patch('/candidate/notifications/read-all');
    return res.data;
  },
};

export default candidateService;
