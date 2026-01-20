import { api } from './api';

// ========== USER MANAGEMENT ==========

// Create user (admin only)
export const createUser = async (userData) => {
  try {
    console.log('Creating user with data:', userData);
    const response = await api.post('/user/admin/users', userData);
    return response.data;
  } catch (error) {
    console.error('Create user error:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

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
    console.log('Updating user:', userId, 'with data:', userData);
    const response = await api.put(`/user/admin/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error('Update user error:', error.response?.data || error.message);
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

// Get organizer by user ID - NOTE: This route doesn't exist yet, you need to add it
export const getOrganizerByUserId = async (userId) => {
  try {
    const response = await api.get(`/user/admin/organizers/user/${userId}`);
    return response.data;
  } catch (error) {
    // If route doesn't exist, we'll get organizers and filter
    if (error.response?.status === 404) {
      console.log('Route not found, falling back to filtering organizers');
      const organizers = await getOrganizers();
      const organizer = organizers.data?.find(org => 
        org.userId?._id === userId || 
        org.userId?.id === userId ||
        org.userId === userId
      );
      
      if (organizer) {
        return {
          success: true,
          data: organizer
        };
      }
      
      throw new Error('Organizer not found for this user');
    }
    throw error.response?.data || error.message;
  }
};

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

// Delete organizer - NOTE: This route doesn't exist yet
export const deleteOrganizer = async (organizerId) => {
  try {
    // Try to use user delete endpoint if organizer delete doesn't exist
    const response = await api.delete(`/user/admin/users/${organizerId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ========== ADMIN ROUTES ==========

// Get admin dashboard stats
export const getAdminDashboardStats = async () => {
  try {
    const response = await api.get('/user/admin/dashboard');
    return response.data;
  } catch (error) {
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

// Get admin dashboard stats (comprehensive)
export const getDashboardStats = async () => {
  try {
    const [usersStats, organizersData, dashboardStats] = await Promise.all([
      getUserStatistics(),
      getOrganizers(),
      getAdminDashboardStats()
    ]);

    // Use dashboard stats if available, otherwise fall back to manual calculation
    if (dashboardStats.success) {
      return dashboardStats.data;
    }

    return {
      totalUsers: usersStats.data?.totalUsers || 0,
      totalOrganizers: usersStats.data?.totalOrganizers || 0,
      activeUsers: usersStats.data?.activeUsers || 0,
      pendingOrganizers: organizersData.data?.filter(org => 
        org.verificationStatus === 'pending'
      ).length || 0,
      monthlyRegistrations: usersStats.data?.monthlyRegistrations || [],
      totalEvents: dashboardStats.data?.totalEvents || 0,
      totalRevenue: dashboardStats.data?.totalRevenue || 0,
      recentUsers: dashboardStats.data?.recentUsers || []
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export default {
  // User Management
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deactivateUser,
  deleteUser,
  getUserStatistics,
  searchUsers,

  // Organizer Management
  getOrganizerByUserId,
  getOrganizers,
  getOrganizerById,
  verifyOrganizer,
  deleteOrganizer,

  // Utilities
  isAdmin,
  getDashboardStats,
  getAdminDashboardStats
};