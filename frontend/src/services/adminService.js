import api from './api';

const adminService = {
  // Dashboard
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  // Users Management
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },
  getUser: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },
  updateUserStatus: async (id, status) => {
    const response = await api.patch(`/admin/users/${id}/status`, { status });
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  // Company Management & Verification
  getCompanies: async (params = {}) => {
    const response = await api.get('/admin/companies', { params });
    return response.data;
  },
  getCompany: async (id) => {
    const response = await api.get(`/admin/companies/${id}`);
    return response.data;
  },
  verifyCompany: async (id, verification_status) => {
    const response = await api.patch(`/admin/companies/${id}/verify`, { verification_status });
    return response.data;
  },

  // Company Documents
  getDocuments: async (params = {}) => {
    const response = await api.get('/admin/documents', { params });
    return response.data;
  },
  getDocument: async (id) => {
    const response = await api.get(`/admin/documents/${id}`);
    return response.data;
  },
  verifyDocument: async (id, verification_status) => {
    const response = await api.patch(`/admin/documents/${id}/verify`, { verification_status });
    return response.data;
  },

  // Jobs Moderation
  getJobs: async (params = {}) => {
    const response = await api.get('/admin/jobs', { params });
    return response.data;
  },
  getJob: async (id) => {
    const response = await api.get(`/admin/jobs/${id}`);
    return response.data;
  },
  updateJobStatus: async (id, status) => {
    const response = await api.patch(`/admin/jobs/${id}/status`, { status });
    return response.data;
  },
  deleteJob: async (id) => {
    const response = await api.delete(`/admin/jobs/${id}`);
    return response.data;
  },

  // Job Categories
  getCategories: async (params = {}) => {
    const response = await api.get('/admin/categories', { params });
    return response.data;
  },
  getCategory: async (id) => {
    const response = await api.get(`/admin/categories/${id}`);
    return response.data;
  },
  createCategory: async (data) => {
    const response = await api.post('/admin/categories', data);
    return response.data;
  },
  updateCategory: async (id, data) => {
    const response = await api.put(`/admin/categories/${id}`, data);
    return response.data;
  },
  deleteCategory: async (id) => {
    const response = await api.delete(`/admin/categories/${id}`);
    return response.data;
  },

  // Applications Monitoring
  getApplications: async (params = {}) => {
    const response = await api.get('/admin/applications', { params });
    return response.data;
  },
  getApplication: async (id) => {
    const response = await api.get(`/admin/applications/${id}`);
    return response.data;
  },
  updateApplicationStatus: async (id, data) => {
    const response = await api.patch(`/admin/applications/${id}/status`, data);
    return response.data;
  },

  // Interviews Monitoring
  getInterviews: async (params = {}) => {
    const response = await api.get('/admin/interviews', { params });
    return response.data;
  },
  getInterview: async (id) => {
    const response = await api.get(`/admin/interviews/${id}`);
    return response.data;
  },

  // Reports
  getReports: async () => {
    const response = await api.get('/admin/reports');
    return response.data;
  },

  // Notifications
  getNotifications: async () => {
    const response = await api.get('/admin/notifications');
    return response.data;
  },
  markNotificationRead: async (id) => {
    const response = await api.patch(`/admin/notifications/${id}/read`);
    return response.data;
  },
  markAllNotificationsRead: async () => {
    const response = await api.patch('/admin/notifications/read-all');
    return response.data;
  },
};

export default adminService;
