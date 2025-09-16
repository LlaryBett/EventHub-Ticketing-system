// C:\Users\Admin\E-Ticket Application\client\src\services\notificationService.js
import { api } from './api';

// Get all notifications for a user
export const getUserNotifications = async (userId) => {
  try {
    const response = await api.get(`/notifications/user/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get a single notification
export const getNotification = async (notificationId) => {
  try {
    const response = await api.get(`/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Mark a notification as read
export const markAsRead = async (notificationId) => {
  try {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Mark all notifications as read for a user
export const markAllAsRead = async (userId) => {
  try {
    const response = await api.patch(`/notifications/user/${userId}/read-all`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Delete a notification
export const deleteNotification = async (notificationId) => {
  try {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Clear all notifications for a user
export const clearAllNotifications = async (userId) => {
  try {
    const response = await api.delete(`/notifications/user/${userId}/clear-all`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get notification preferences for a user
export const getNotificationPreferences = async (userId) => {
  try {
    const response = await api.get(`/notifications/user/${userId}/preferences`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update notification preferences for a user
export const updateNotificationPreferences = async (userId, preferences) => {
  try {
    const response = await api.put(`/notifications/user/${userId}/preferences`, preferences);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Create a new notification (typically for internal/admin use)
export const createNotification = async (notificationData) => {
  try {
    const response = await api.post('/notifications', notificationData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get unread notification count for a user
export const getUnreadCount = async (userId) => {
  try {
    const response = await api.get(`/notifications/user/${userId}/unread-count`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Subscribe to push notifications (for web push)
export const subscribeToPushNotifications = async (subscription) => {
  try {
    const response = await api.post('/notifications/push/subscribe', subscription);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPushNotifications = async (subscriptionId) => {
  try {
    const response = await api.delete(`/notifications/push/unsubscribe/${subscriptionId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get user's push notification subscriptions
export const getPushSubscriptions = async (userId) => {
  try {
    const response = await api.get(`/notifications/push/user/${userId}/subscriptions`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Export all services as a default object
const notificationService = {
  getUserNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
  createNotification,
  getUnreadCount,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getPushSubscriptions
};

export default notificationService;