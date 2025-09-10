import { api } from './api';

// Register an attendee
export const registerAttendee = async (userData) => {
  try {
    const response = await api.post('/auth/register/attendee', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Register an organizer - Step 1
export const registerOrganizerStep1 = async (userData) => {
  try {
    const response = await api.post('/auth/register/organizer/step1', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Register an organizer - Step 2
export const registerOrganizerStep2 = async (userData) => {
  try {
    const response = await api.post('/auth/register/organizer/step2', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Login user
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    console.log('Login API response:', response.data); // Debug log
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      
      // Map "data" to "user" to match your frontend expectation
      const userData = response.data.data || response.data.user;
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Return the formatted response that your AuthContext expects
      return {
        token: response.data.token,
        user: userData,
        message: response.data.message || 'Login successful'
      };
    }
    
    throw new Error('No token received from server');
    
  } catch (error) {
    console.error('Login API error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Login failed';
    const formattedError = new Error(errorMessage);
    
    if (error.response) {
      formattedError.response = error.response;
    }
    
    throw formattedError;
  }
};

// Forgot password
export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/auth/forgotpassword', { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Reset password
export const resetPassword = async (resetToken, password) => {
  try {
    const response = await api.put(`/auth/resetpassword/${resetToken}`, { password });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Logout user
export const logout = async () => {
  try {
    const response = await api.get('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return response.data;
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    throw error.response?.data || error.message;
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

// Get current user from localStorage
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

// Get user role
export const getUserRole = () => {
  const user = getCurrentUser();
  return user ? user.role : null;
};

// Check if user is an organizer
export const isOrganizer = () => {
  const role = getUserRole();
  return role === 'organizer';
};

// Check if user is an attendee
export const isAttendee = () => {
  const role = getUserRole();
  return role === 'attendee';
};