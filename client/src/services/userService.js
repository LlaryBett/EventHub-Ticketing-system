import { api } from './api';

// Get current user profile
export const getMe = async () => {
  try {
    const response = await api.get('/user/me');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get user profile by ID
export const getUserProfile = async (userId) => {
  try {
    const response = await api.get(`/user/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update user details
export const updateDetails = async (userData) => {
  try {
    const response = await api.put('/user/updatedetails', userData);
    if (response.data.data) {
      // Update localStorage user data
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, ...response.data.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update password
export const updatePassword = async (passwords) => {
  try {
    const response = await api.put('/user/updatepassword', passwords);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update organizer profile
export const updateOrganizerProfile = async (profileData) => {
  try {
    const response = await api.put('/user/organizer/profile', profileData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Delete user account
export const deleteAccount = async () => {
  try {
    const response = await api.delete('/user/delete');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get events for a user by ID
export const getUserEvents = async (userId) => {
  try {
    const response = await api.get(`/user/${userId}/events`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};