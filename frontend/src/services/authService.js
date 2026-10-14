import api from './api';

export const authService = {
  /**
   * Log in user with email and password.
   */
  async login(email, password) {
    const response = await api.post('/login', { email, password });
    return response.data;
  },

  /**
   * Register a new candidate or company user.
   */
  async register(data) {
    const response = await api.post('/register', data);
    return response.data;
  },

  /**
   * Log out currently authenticated user.
   */
  async logout() {
    const response = await api.post('/logout');
    return response.data;
  },

  /**
   * Fetch current authenticated user profile and role.
   */
  async getMe() {
    const response = await api.get('/me');
    return response.data;
  },
};

export default authService;
