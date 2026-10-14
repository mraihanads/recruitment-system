import api from './api';

const companyService = {
  /**
   * Get authenticated company profile details.
   */
  async getProfile() {
    const res = await api.get('/company/profile');
    return res.data;
  },

  /**
   * Update company profile information.
   * @param {Object} data - { company_name, description, address, phone, website }
   */
  async updateProfile(data) {
    const res = await api.put('/company/profile', data);
    return res.data;
  },

  /**
   * Upload company logo file.
   * @param {FormData} formData - with 'logo' field
   */
  async uploadLogo(formData) {
    const res = await api.post('/company/profile/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  /**
   * Get all uploaded verification documents.
   */
  async getDocuments() {
    const res = await api.get('/company/documents');
    return res.data;
  },

  /**
   * Upload a new company verification document.
   * @param {FormData} formData - with 'document_type' and 'document_file' fields
   */
  async uploadDocument(formData) {
    const res = await api.post('/company/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  /**
   * Delete a company verification document.
   * @param {number|string} id
   */
  async deleteDocument(id) {
    const res = await api.delete(`/company/documents/${id}`);
    return res.data;
  },

  /**
   * Get company dashboard summary statistics.
   */
  async getDashboard() {
    const res = await api.get('/company/dashboard');
    return res.data;
  },

  /**
   * ==========================================
   * Company Job Vacancies (STEP 15B)
   * ==========================================
   */

  /**
   * Get all jobs created by authenticated company.
   * @param {Object} params - { search, status, category_id }
   */
  async getJobs(params = {}) {
    const res = await api.get('/company/jobs', { params });
    return res.data;
  },

  /**
   * Get single job vacancy detail by ID.
   * @param {number|string} id
   */
  async getJobDetail(id) {
    const res = await api.get(`/company/jobs/${id}`);
    return res.data;
  },

  /**
   * Create a new job vacancy.
   * @param {Object} data
   */
  async createJob(data) {
    const res = await api.post('/company/jobs', data);
    return res.data;
  },

  /**
   * Update an existing job vacancy.
   * @param {number|string} id
   * @param {Object} data
   */
  async updateJob(id, data) {
    const res = await api.put(`/company/jobs/${id}`, data);
    return res.data;
  },

  /**
   * Delete a job vacancy.
   * @param {number|string} id
   */
  async deleteJob(id) {
    const res = await api.delete(`/company/jobs/${id}`);
    return res.data;
  },

  /**
   * Change status of a job vacancy (draft, active, closed).
   * @param {number|string} id
   * @param {string} status
   */
  async updateJobStatus(id, status) {
    const res = await api.patch(`/company/jobs/${id}/status`, { status });
    return res.data;
  },

  /**
   * Master Data: Job Categories
   */
  async getJobCategories() {
    const res = await api.get('/job-categories');
    return res.data;
  },

  /**
   * Master Data: Skills
   */
  async getMasterSkills() {
    const res = await api.get('/skills');
    return res.data;
  },

  /**
   * ==========================================
   * Company Applicant Management (STEP 15C)
   * ==========================================
   */

  /**
   * List all applicants for company jobs.
   * @param {Object} params - { job_id, status }
   */
  async getApplicants(params = {}) {
    const res = await api.get('/company/applications', { params });
    return res.data;
  },

  /**
   * Get detailed applicant & application info.
   * @param {number|string} id
   */
  async getApplicantDetail(id) {
    const res = await api.get(`/company/applications/${id}`);
    return res.data;
  },

  /**
   * Get candidate skill matching breakdown for this application.
   * @param {number|string} id
   */
  async getApplicantMatch(id) {
    const res = await api.get(`/company/applications/${id}/match`);
    return res.data;
  },

  /**
   * Update applicant status and log status history with optional note.
   * @param {number|string} id
   * @param {string} status - submitted, screening, interview, test, accepted, rejected
   * @param {string|null} note
   */
  async updateApplicationStatus(id, status, note = null) {
    const payload = { status };
    if (note) payload.note = note;
    const res = await api.patch(`/company/applications/${id}/status`, payload);
    return res.data;
  },

  /**
   * Get internal notes for an application.
   * @param {number|string} id
   */
  async getApplicationNotes(id) {
    const res = await api.get(`/company/applications/${id}/notes`);
    return res.data;
  },

  /**
   * Add internal note for an application.
   * @param {number|string} id
   * @param {string} note
   */
  async addApplicationNote(id, note) {
    const res = await api.post(`/company/applications/${id}/notes`, { note });
    return res.data;
  },

  // ==========================================
  // COMPANY INTERVIEWS (STEP 15D)
  // ==========================================

  /**
   * List all company interviews.
   * @param {object} params
   */
  async getInterviews(params = {}) {
    const res = await api.get('/company/interviews', { params });
    return res.data;
  },

  /**
   * Get specific interview details.
   * @param {number|string} id
   */
  async getInterviewDetail(id) {
    const res = await api.get(`/company/interviews/${id}`);
    return res.data;
  },

  /**
   * Get all interviews for a specific application.
   * @param {number|string} applicationId
   */
  async getApplicationInterviews(applicationId) {
    const res = await api.get(`/company/applications/${applicationId}/interviews`);
    return res.data;
  },

  /**
   * Schedule a new interview for an application.
   * @param {number|string} applicationId
   * @param {object} data - { interview_date, interview_time, method, location, meeting_link, notes }
   */
  async createInterview(applicationId, data) {
    const res = await api.post(`/company/applications/${applicationId}/interviews`, data);
    return res.data;
  },

  /**
   * Update interview schedule and details.
   * @param {number|string} id
   * @param {object} data
   */
  async updateInterview(id, data) {
    const res = await api.put(`/company/interviews/${id}`, data);
    return res.data;
  },

  /**
   * Update status of an interview.
   * @param {number|string} id
   * @param {string} status - scheduled, completed, cancelled
   */
  async updateInterviewStatus(id, status) {
    const res = await api.patch(`/company/interviews/${id}/status`, { status });
    return res.data;
  },

  // ==========================================
  // COMPANY REPORTS & STATISTICS (STEP 15E)
  // ==========================================

  /**
   * Get recruitment reports and statistics.
   * @param {object} params - { period: 'all' | 'month' | '3months' | 'year' }
   */
  async getReports(params = {}) {
    const res = await api.get('/company/reports', { params });
    return res.data;
  },

  // ==========================================
  // COMPANY NOTIFICATIONS
  // ==========================================

  async getNotifications() {
    const res = await api.get('/company/notifications');
    return res.data;
  },

  async markNotificationRead(id) {
    const res = await api.patch(`/company/notifications/${id}/read`);
    return res.data;
  },

  async markAllNotificationsRead() {
    const res = await api.patch('/company/notifications/read-all');
    return res.data;
  },
};

export default companyService;

