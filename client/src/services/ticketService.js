import { api } from './api';

/**
 * Ticket Service - Handles all ticket-related API calls
 * Uses consistent error handling pattern with authService
 */
const ticketService = {
  /**
   * Get all tickets for an event
   * @param {string} eventId - Event ID
   * @returns {Promise} Event tickets data
   */
  getEventTickets: async (eventId) => {
    try {
      const response = await api.get(`/ticket/event/${eventId}`); // Changed to singular
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get a single ticket by ID
   * @param {string} ticketId - Ticket ID
   * @returns {Promise} Ticket data
   */
  getTicket: async (ticketId) => {
    try {
      const response = await api.get(`/ticket/${ticketId}`); // Changed to singular
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Lookup tickets by email (for guest users)
   * @param {string} email - Email address used for booking
   * @returns {Promise} Tickets data
   */
  lookupTicketsByEmail: async (email) => {
    try {
      const response = await api.get(`/ticket/lookup/email?email=${encodeURIComponent(email)}`); // Changed to singular
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get current user's tickets (for logged-in users)
   * @returns {Promise} User's tickets data
   */
  getMyTickets: async () => {
    try {
      const response = await api.get('/ticket/user/mytickets'); // Changed to singular
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Create new ticket (organizer only)
   * @param {string} eventId - Event ID
   * @param {Object} ticketData - Ticket data
   * @param {string} ticketData.type - Ticket type
   * @param {number} ticketData.price - Ticket price
   * @param {number} ticketData.quantity - Ticket quantity
   * @param {string} ticketData.description - Ticket description
   * @param {Array} ticketData.benefits - Ticket benefits
   * @param {Date} ticketData.salesEnd - Sales end date
   * @param {number} ticketData.minOrder - Minimum order quantity
   * @param {number} ticketData.maxOrder - Maximum order quantity
   * @returns {Promise} Created ticket data
   */
  createTicket: async (eventId, ticketData) => {
    try {
      const response = await api.post(`/ticket/event/${eventId}`, ticketData); // Changed to singular
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update ticket (organizer only)
   * @param {string} ticketId - Ticket ID
   * @param {Object} ticketData - Updated ticket data
   * @returns {Promise} Updated ticket data
   */
  updateTicket: async (ticketId, ticketData) => {
    try {
      const response = await api.put(`/ticket/${ticketId}`, ticketData); // Changed to singular
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Delete ticket (organizer only)
   * @param {string} ticketId - Ticket ID
   * @returns {Promise} Success message
   */
  deleteTicket: async (ticketId) => {
    try {
      const response = await api.delete(`/ticket/${ticketId}`); // Changed to singular
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Reserve tickets for purchase
   * @param {string} ticketId - Ticket ID
   * @param {number} quantity - Quantity to reserve
   * @returns {Promise} Reservation data
   */
  reserveTickets: async (ticketId, quantity) => {
    try {
      const response = await api.post(`/ticket/${ticketId}/reserve`, { quantity }); // Changed to singular
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default ticketService;