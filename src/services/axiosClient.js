import axios from 'axios';

// Create a unified Axios instance with withCredentials enabled for HttpOnly cookies
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true // Crucial: Allows browser to automatically send and receive credentials cookies
});

// Request Interceptor: Attach Bearer token from localStorage as fallback
axiosClient.interceptors.request.use(
  (config) => {
    // Crucial: Distinguish between admin and user tokens to avoid sending user tokens to admin APIs
    const isAdminApi = config.url && config.url.includes('/api/admin');
    const token = isAdminApi 
      ? localStorage.getItem('admin_token') 
      : localStorage.getItem('token');
      
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global 401 Unauthorized catcher
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAdminApi = error.config.url.includes('/api/admin');
      
      if (isAdminApi) {
        console.warn('🔒 Admin Session unauthorized/expired. Redirecting to admin login...');
        window.location.href = '/admin/login';
      } else {
        console.warn('🔒 User Session unauthorized/expired. Redirecting to user login...');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
