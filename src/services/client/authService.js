import axiosClient from '../axiosClient';

export const authService = {
  // POST /api/auth/login
  login: async (email, password) => {
    const response = await axiosClient.post('/api/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  // POST /api/auth/register
  register: async (username, email, password) => {
    const response = await axiosClient.post('/api/auth/register', { username, email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  }
};

export default authService;
