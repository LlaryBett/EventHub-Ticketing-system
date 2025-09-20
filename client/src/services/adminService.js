import { api } from './api';

// ========== USER MANAGEMENT ==========

// Get all users
export const getUsers = async (params = {}) => {
  try {
    const response = await api.get('/user/admin/users', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const response = await api.get(`/user/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update user
export const updateUser = async (userId, userData) => {
  try {
    const response = await api.put(`/user/admin/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Deactivate/activate user
export const deactivateUser = async (userId, status) => {
  try {
    const response = await api.patch(`/user/admin/users/${userId}/status`, { status });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Delete user
export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/user/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get user statistics
export const getUserStatistics = async () => {
  try {
    const response = await api.get('/user/admin/statistics/users');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Search users
export const searchUsers = async (query, limit = 10) => {
  try {
    const response = await api.get(`/user/admin/users/search/${query}`, {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ========== ORGANIZER MANAGEMENT ==========

// Get all organizers
export const getOrganizers = async (params = {}) => {
  try {
    const response = await api.get('/user/admin/organizers', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get organizer by ID
export const getOrganizerById = async (organizerId) => {
  try {
    const response = await api.get(`/user/admin/organizers/${organizerId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Verify organizer
export const verifyOrganizer = async (organizerId, verificationData) => {
  try {
    console.log("verifyOrganizer called with ID:", organizerId);
    console.log("verificationData:", verificationData);

    const response = await api.patch(
      `/user/admin/organizers/${organizerId}/verification`,
      verificationData
    );

    console.log("verifyOrganizer response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "verifyOrganizer error:",
      error.response?.data || error.message
    );
    throw error.response?.data || error.message;
  }
};



// ========== UTILITY FUNCTIONS ==========

// Check if user is admin
export const isAdmin = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return false;
  
  try {
    const user = JSON.parse(userStr);
    return user.role === 'admin' || user.userType === 'admin';
  } catch {
    return false;
  }
};

// Get admin dashboard stats
export const getDashboardStats = async () => {
  try {
    const [usersStats, organizersData] = await Promise.all([
      getUserStatistics(),
      getOrganizers()
    ]);

    return {
      totalUsers: usersStats.data?.totalUsers || 0,
      totalOrganizers: usersStats.data?.totalOrganizers || 0,
      activeUsers: usersStats.data?.activeUsers || 0,
      pendingOrganizers: organizersData.data?.filter(org => 
        org.verificationStatus === 'pending'
      ).length || 0,
      monthlyRegistrations: usersStats.data?.monthlyRegistrations || []
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export default {
  // User Management
  getUsers,
  getUserById,
  updateUser,
  deactivateUser,
  deleteUser,
  getUserStatistics,
  searchUsers,
  
  // Organizer Management
  getOrganizers,
  getOrganizerById,
  verifyOrganizer,
  
  // Utilities
  isAdmin,
  getDashboardStats
};