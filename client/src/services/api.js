// client/src/services/api.js
import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL)
    ? import.meta.env.VITE_API_URL
    : 'https://eventhub-ticketing-system.onrender.com/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token to requests automatically ok 
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Preserve backend error message if available
      const authError = new Error(error.response?.data?.message || 'Session expired. Please login again.');
      authError.isAuthError = true;
      return Promise.reject(authError);
    }

    // Preserve backend error structure
    if (error.response?.data) {
      return Promise.reject({
        ...error,
        message: error.response.data.message,
        details: error.response.data.details
      });
    }

    return Promise.reject(error);
  }
);

// Export api as a named export
export { api };