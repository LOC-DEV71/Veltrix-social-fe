import axiosClient from '../axiosClient';

export const adminAuthService = {
  // POST /api/admin/auth/login
  login: async (email, password) => {
    const response = await axiosClient.post('/api/admin/auth/login', { email, password });
    return response.data;
  },

  // GET /api/admin/auth/me
  getMe: async () => {
    const response = await axiosClient.get('/api/admin/auth/me');
    return response.data;
  },

  // POST /api/admin/auth/logout
  logout: async () => {
    const response = await axiosClient.post('/api/admin/auth/logout');
    return response.data;
  }
};

export default adminAuthService;
