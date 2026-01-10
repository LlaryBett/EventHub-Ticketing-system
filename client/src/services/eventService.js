// client/src/services/eventService.js
import { api } from './api';

class EventService {
  // Get all events - PUBLIC ENDPOINT (no auth required)
  async getAllEvents(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      // Add filter parameters if provided
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });
      
      const queryString = params.toString();
      const url = `/events${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      // Don't redirect for public endpoints - just return empty data
      console.error('Error fetching events (public endpoint):', error);
      
      // Return consistent response format even on error
      return {
        success: false,
        error: error.message,
        data: [],
        pagination: null
      };
    }
  }

  // Get featured events - PUBLIC ENDPOINT (no auth required)
  async getFeaturedEvents() {
    try {
      const response = await api.get('/events/featured');
      return response.data;
    } catch (error) {
      console.error('Error fetching featured events (public endpoint):', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Get event by ID - PUBLIC ENDPOINT (no auth required)
  async getEventById(id) {
    try {
      const response = await api.get(`/events/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event by ID (public endpoint):', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  // Get stories for discover page - PUBLIC ENDPOINT (no auth required)
  async getDiscoverStories(limit = 20) {
    try {
      const response = await api.get(`/events/stories/discover?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching discover stories (public endpoint):', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Get stories for a specific event - PUBLIC ENDPOINT (no auth required)
  async getEventStories(eventId) {
    try {
      const response = await api.get(`/events/stories/event/${eventId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event stories (public endpoint):', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // PROTECTED ENDPOINTS (require authentication)

  // Register for an event - PROTECTED ENDPOINT
  async registerForEvent(eventId) {
    try {
      const response = await api.post(`/events/${eventId}/register`);
      return response.data;
    } catch (error) {
      this.handleProtectedError(error);
    }
  }

  // ADDED: Reserve spots for free events (bypasses checkout) - PROTECTED ENDPOINT
  async reserveFreeSpots(eventId, ticketId, quantity) {
    try {
      const response = await api.post(`/events/${eventId}/reserve`, {
        ticketId,
        quantity
      });
      return response.data;
    } catch (error) {
      this.handleProtectedError(error);
    }
  }

  // Create a new event (admin/organizer only) - PROTECTED ENDPOINT
  async createEvent(eventData) {
    try {
      const response = await api.post('/events', eventData);
      return response.data;
    } catch (error) {
      this.handleProtectedError(error);
    }
  }

  // Update an event (admin/organizer only) - PROTECTED ENDPOINT
  async updateEvent(id, eventData) {
    try {
      const response = await api.put(`/events/${id}`, eventData);
      return response.data;
    } catch (error) {
      this.handleProtectedError(error);
    }
  }

  // Delete an event (admin/organizer only) - PROTECTED ENDPOINT
  async deleteEvent(id) {
    try {
      const response = await api.delete(`/events/${id}`);
      return response.data;
    } catch (error) {
      this.handleProtectedError(error);
    }
  }

  // Get stories for organizer - PROTECTED ENDPOINT
  async getOrganizerStories() {
    try {
      const response = await api.get('/events/stories/organizer');
      return response.data;
    } catch (error) {
      this.handleProtectedError(error);
    }
  }

  // Create a new story - PROTECTED ENDPOINT
  async createStory(storyData) {
    try {
      const response = await api.post('/events/stories', storyData);
      return response.data;
    } catch (error) {
      this.handleProtectedError(error);
    }
  }

  // Update a story - PROTECTED ENDPOINT
  async updateStory(storyId, storyData) {
    try {
      const response = await api.put(`/events/stories/${storyId}`, storyData);
      return response.data;
    } catch (error) {
      this.handleProtectedError(error);
    }
  }

  // Delete a story - PROTECTED ENDPOINT
  async deleteStory(storyId) {
    try {
      const response = await api.delete(`/events/stories/${storyId}`);
      return response.data;
    } catch (error) {
      this.handleProtectedError(error);
    }
  }

  // Handle errors for PROTECTED endpoints only (redirects on auth errors)
  handleProtectedError(error) {
    if (error.isAuthError) {
      // Redirect to login for protected endpoints
      window.location.href = '/login';
      throw new Error('Authentication required. Please log in again.');
    }
    
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    throw new Error(error.message || 'An unexpected error occurred');
  }
}

// Export as a singleton instance
export const eventService = new EventService();