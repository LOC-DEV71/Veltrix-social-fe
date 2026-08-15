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

  // POST /api/auth/send-otp
  sendOTP: async (email) => {
    const response = await axiosClient.post('/api/auth/send-otp', { email });
    return response.data;
  },

  // POST /api/auth/verify-otp
  verifyOTP: async (email, code) => {
    const response = await axiosClient.post('/api/auth/verify-otp', { email, code });
    return response.data;
  },

  // POST /api/auth/register
  register: async (username, email, password, otpCode) => {
    const response = await axiosClient.post('/api/auth/register', { username, email, password, otpCode });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  // POST /api/auth/google
  googleLogin: async (credential) => {
    const response = await axiosClient.post('/api/auth/google', { credential });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  }
};

export default authService;
