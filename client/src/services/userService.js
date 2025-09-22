import { api } from './api';

// Get current user profile
export const getMe = async () => {
  try {
    const response = await api.get('/user/me');
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    throw new Error(errorMessage);
  }
};

// Get user profile by ID
export const getUserProfile = async (userId) => {
  try {
    const response = await api.get(`/user/${userId}`);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    throw new Error(errorMessage);
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
    // Handle validation errors specifically
    if (error.response?.data?.errors) {
      throw new Error(error.response.data.errors.map(err => err.msg).join(', '));
    }
    const errorMessage = error.response?.data?.message || error.message;
    throw new Error(errorMessage);
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
    if (error.response?.data?.errors) {
      throw new Error(error.response.data.errors.map(err => err.msg).join(', '));
    }
    const errorMessage = error.response?.data?.message || error.message;
    throw new Error(errorMessage);
  }
};

// Update organizer profile
export const updateOrganizerProfile = async (profileData) => {
  try {
    const response = await api.put('/user/organizer/profile', profileData);
    return response.data;
  } catch (error) {
    if (error.response?.data?.errors) {
      throw new Error(error.response.data.errors.map(err => err.msg).join(', '));
    }
    const errorMessage = error.response?.data?.message || error.message;
    throw new Error(errorMessage);
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
    const errorMessage = error.response?.data?.message || error.message;
    throw new Error(errorMessage);
  }
};

// Get events for a user by ID
export const getUserEvents = async (userId) => {
  try {
    console.log('[getUserEvents] userId:', userId); // log the incoming userId

    const url = `/user/${userId}/events`;
    console.log('[getUserEvents] Requesting URL:', url); // log the URL being requested

    const response = await api.get(url);

    console.log('[getUserEvents] Response data:', response.data); // log response from backend

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    console.error('[getUserEvents] Error:', errorMessage); // log the error
    throw new Error(errorMessage);
  }
};

// Get order history for a user
export const getOrderHistory = async (userId) => {
  try {
    console.log('[getOrderHistory] userId:', userId);

    // Match backend route → /user/:id/orders
    const url = `/user/${userId}/orders`;
    console.log('[getOrderHistory] Requesting URL:', url);

    const response = await api.get(url);

    console.log('[getOrderHistory] Response data:', response.data);

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    console.error('[getOrderHistory] Error:', errorMessage);
    throw new Error(errorMessage);
  }
};

// Get all issued tickets for a user
export const getUserTickets = async (userId) => {
  try {
    console.log('[getUserTickets] userId:', userId);

    // Backend route: /user/:id/tickets
    const url = `/user/${userId}/tickets`;
    console.log('[getUserTickets] Requesting URL:', url);

    const response = await api.get(url);

    console.log('[getUserTickets] Response data:', response.data);

    // Should return { success: true, data: [ ...tickets ] } or similar
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    console.error('[getUserTickets] Error:', errorMessage);
    throw new Error(errorMessage);
  }
};

// ===== ORGANIZER ATTENDEE MANAGEMENT FUNCTIONS =====

// Get all attendees for organizer's events
export const getOrganizerAttendees = async () => {
  try {
    console.log('[getOrganizerAttendees] Fetching all attendees for organizer');

    const response = await api.get('/user/organizer/attendees');

    console.log('[getOrganizerAttendees] Response data:', response.data);

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    console.error('[getOrganizerAttendees] Error:', errorMessage);
    throw new Error(errorMessage);
  }
};

// Get attendees for a specific event
export const getEventAttendees = async (eventId) => {
  try {
    console.log('[getEventAttendees] eventId:', eventId);

    const url = `/user/organizer/events/${eventId}/attendees`;
    console.log('[getEventAttendees] Requesting URL:', url);

    const response = await api.get(url);

    console.log('[getEventAttendees] Response data:', response.data);

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    console.error('[getEventAttendees] Error:', errorMessage);
    throw new Error(errorMessage);
  }
};

// Export attendees data for an event
export const exportEventAttendees = async (eventId, format = 'csv') => {
  try {
    console.log('[exportEventAttendees] eventId:', eventId, 'format:', format);

    const url = `/user/organizer/events/${eventId}/attendees/export?format=${format}`;
    console.log('[exportEventAttendees] Requesting URL:', url);

    const response = await api.get(url, {
      responseType: 'blob' // Important for file downloads
    });

    console.log('[exportEventAttendees] Export successful');

    return response; // Return full response for file handling
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    console.error('[exportEventAttendees] Error:', errorMessage);
    throw new Error(errorMessage);
  }
};

// Check in an attendee
export const checkInAttendee = async (ticketCode) => {
  try {
    console.log('🔹 [checkInAttendee] Called with ticketCode:', ticketCode);

    if (!ticketCode) {
      console.warn('⚠️ [checkInAttendee] ticketCode is undefined or empty!');
      throw new Error('Ticket code is required to check in.');
    }

    const url = `/user/organizer/tickets/${ticketCode}/checkin`;
    console.log('🔹 [checkInAttendee] Requesting URL:', url);

    const response = await api.post(url);
    console.log('✅ [checkInAttendee] Response status:', response.status);
    console.log('✅ [checkInAttendee] Response data:', response.data);

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    console.error('❌ [checkInAttendee] Error:', errorMessage);

    if (error.response) {
      console.error('❌ [checkInAttendee] Response data:', error.response.data);
      console.error('❌ [checkInAttendee] Response status:', error.response.status);
    }

    throw new Error(errorMessage);
  }
};


// Utility function to handle CSV download
export const downloadAttendeesCSV = async (eventId, eventTitle) => {
  try {
    const response = await exportEventAttendees(eventId, 'csv');
    
    // Create blob link and trigger download
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${eventTitle || 'event'}-attendees.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    console.log('[downloadAttendeesCSV] Download triggered successfully');
  } catch (error) {
    console.error('[downloadAttendeesCSV] Error:', error);
    throw error;
  }
};

// ===== PLACEHOLDER FUNCTIONS =====

// Placeholder: Get event recommendations for a user
export const getEventRecommendations = async (userId) => {
  // TODO: Implement actual logic or API call
  return [];
};

// Placeholder: Get attendee networking list for a user
export const getAttendeeNetworkingList = async (userId) => {
  // TODO: Implement actual logic or API call
  return [];
};

// Placeholder: Get event photos for a user
export const getEventPhotos = async (userId) => {
  // TODO: Implement actual logic or API call
  return [];
};

// Placeholder: Get spending analytics for a user
export const getSpendingAnalytics = async (userId) => {
  // TODO: Implement actual logic or API call
  return {};
};