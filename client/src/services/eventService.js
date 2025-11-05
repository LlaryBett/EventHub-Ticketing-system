// client/src/services/eventService.js
import { api } from './api';

class EventService {
  // Get all events
  async getAllEvents(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      // Add filter parameters if provided
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      
      const queryString = params.toString();
      const url = `/events${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get featured events
  async getFeaturedEvents() {
    try {
      const response = await api.get('/events/featured');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get event by ID
  async getEventById(id) {
    try {
      const response = await api.get(`/events/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Register for an event
  async registerForEvent(eventId) {
    try {
      const response = await api.post(`/events/${eventId}/register`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Create a new event (admin/organizer only)
  async createEvent(eventData) {
    try {
      const response = await api.post('/events', eventData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Update an event (admin/organizer only)
  async updateEvent(id, eventData) {
    try {
      const response = await api.put(`/events/${id}`, eventData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Delete an event (admin/organizer only)
  async deleteEvent(id) {
    try {
      const response = await api.delete(`/events/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // STORIES FUNCTIONALITY

  // Get stories for discover page
  async getDiscoverStories(limit = 20) {
    try {
      const response = await api.get(`/events/stories/discover?limit=${limit}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get stories for organizer
  async getOrganizerStories() {
    try {
      const response = await api.get('/events/stories/organizer');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Create a new story
  async createStory(storyData) {
    try {
      const response = await api.post('/events/stories', storyData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Update a story
  async updateStory(storyId, storyData) {
    try {
      const response = await api.put(`/events/stories/${storyId}`, storyData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Delete a story
  async deleteStory(storyId) {
    try {
      const response = await api.delete(`/events/stories/${storyId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get stories for a specific event
  async getEventStories(eventId) {
    try {
      const response = await api.get(`/events/stories/event/${eventId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Handle API errors consistently
  handleError(error) {
    if (error.isAuthError) {
      // Redirect to login or show authentication modal
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