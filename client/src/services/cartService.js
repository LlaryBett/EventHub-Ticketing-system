import { api } from './api';

/**
 * Cart Service - Handles all cart-related API calls
 * Uses consistent error handling pattern with authService
 */
const cartService = {
  /**
   * Get current user's cart
   * @returns {Promise} Cart data
   */
  getCart: async () => {
    try {
      const response = await api.get('/cart');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Add item to cart
   * @param {Object} itemData - Item data to add to cart
   * @param {string} itemData.eventId - Event ID
   * @param {number} itemData.quantity - Quantity of tickets
   * @param {string} itemData.ticketType - Type of ticket (e.g., 'adult', 'child')
   * @param {number} itemData.price - Price per ticket
   * @returns {Promise} Updated cart data
   */
  addToCart: async (itemData) => {
    try {
      const response = await api.post('/cart', itemData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update cart item quantity
   * @param {string} itemId - Cart item ID
   * @param {number} quantity - New quantity
   * @returns {Promise} Updated cart data
   */
  updateCartItem: async (itemId, quantity) => {
    try {
      const response = await api.put(`/cart/${itemId}`, { quantity });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Remove single item from cart
   * @param {string} itemId - Cart item ID to remove
   * @returns {Promise} Updated cart data
   */
  removeFromCart: async (itemId) => {
    try {
      const response = await api.delete(`/cart/${itemId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Clear entire cart
   * @returns {Promise} Success message
   */
  clearCart: async () => {
    try {
      const response = await api.delete('/cart');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default cartService;