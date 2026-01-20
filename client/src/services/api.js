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

// List of public endpoints that don't require auth token
const PUBLIC_ENDPOINTS = [
  '/events',              // GET events (browsing)
  '/events/featured',     // GET featured events
  '/events/stories/discover', // GET discover stories
  '/discover',            // GET discover page content
  '/categories',          // GET categories
  '/events/stories/event/', // GET event stories (partial match)
];

// Check if a URL is a public endpoint
const isPublicEndpoint = (url, method) => {
  // Only GET requests can be public
  if (method !== 'get' && method !== 'GET') {
    return false;
  }
  
  // Check if URL matches any public endpoint
  return PUBLIC_ENDPOINTS.some(endpoint => {
    // For partial matches (like /events/stories/event/)
    if (endpoint.endsWith('/')) {
      return url.includes(endpoint);
    }
    // For exact or prefix matches
    return url === endpoint || url.startsWith(endpoint + '/');
  });
};

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Only add token for non-public endpoints or if explicitly needed
    if (token && !isPublicEndpoint(config.url, config.method)) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (token) {
      // For debugging - log when we skip token for public endpoints
      console.log(`Skipping token for public ${config.method} request to: ${config.url}`);
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
    const originalRequest = error.config;
    
    // Handle 401 errors
    if (error.response?.status === 401) {
      // Don't redirect for public endpoints
      if (isPublicEndpoint(originalRequest?.url, originalRequest?.method)) {
        console.log('401 on public endpoint - not redirecting');
        // Just reject the error without redirecting
        const publicError = new Error(error.response?.data?.message || 'Access denied');
        return Promise.reject(publicError);
      }
      
      // For protected endpoints, clear token and redirect
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