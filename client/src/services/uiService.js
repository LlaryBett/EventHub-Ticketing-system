// services/uiService.js
import { api } from './api';

export const uiService = {
  /**
   * Get discover page content for public access (only active items)
   * @returns {Promise<Object>} Public discover page data
   */
  getPublicDiscoverContent: async () => {
    try {
      const response = await api.get('/discover');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching public discover content:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to load discover page',
        data: null
      };
    }
  },

  /**
   * Get all discover page content (ADMIN - includes inactive items)
   * @returns {Promise<Object>} Complete discover page data
   */
  getDiscoverContent: async () => {
    try {
      const response = await api.get('/discover/admin');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      // If admin access fails, try falling back to public endpoint
      try {
        console.warn('Admin access failed, falling back to public endpoint');
        return await uiService.getPublicDiscoverContent();
      } catch (fallbackError) {
        console.error('Error fetching discover content:', error);
        return {
          success: false,
          error: error.response?.data?.message || 'Failed to load discover page',
          data: null
        };
      }
    }
  },

  /**
   * Get hero slides for the discover page (PUBLIC - only active items)
   * @returns {Promise<Array>} Hero slides data
   */
  getHeroSlides: async () => {
    try {
      const response = await uiService.getPublicDiscoverContent();
      return {
        success: true,
        data: response.data?.heroSlides || []
      };
    } catch (error) {
      console.error('Error fetching hero slides:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to load hero slides',
        data: []
      };
    }
  },

  /**
   * Get categories for 3D carousel (PUBLIC - only active items)
   * @returns {Promise<Array>} Categories data
   */
  getCategories: async () => {
    try {
      const response = await uiService.getPublicDiscoverContent();
      return {
        success: true,
        data: response.data?.categories || []
      };
    } catch (error) {
      console.error('Error fetching categories:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to load categories',
        data: []
      };
    }
  },

  /**
   * Get curated collections (PUBLIC - only active items)
   * @returns {Promise<Array>} Collections data
   */
  getCollections: async () => {
    try {
      const response = await api.get('/discover');
      return {
        success: true,
        data: response.data.data.collections || []
      };
    } catch (error) {
      console.error('Error fetching collections:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to load collections',
        data: []
      };
    }
  },

  /**
   * Get quick search filters (PUBLIC - only active items)
   * @returns {Promise<Array>} Quick filters data
   */
  getQuickFilters: async () => {
    try {
      const response = await api.get('/discover');
      return {
        success: true,
        data: response.data.data.quickFilters || []
      };
    } catch (error) {
      console.error('Error fetching quick filters:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to load filters',
        data: []
      };
    }
  },

  // Admin functions (protected routes)
  
  /**
   * Create new discover configuration (Admin only)
   * @param {Object} config - Discover configuration
   * @returns {Promise<Object>} Created configuration
   */
  createDiscoverConfig: async (config) => {
    try {
      const response = await api.post('/discover', config);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error creating discover config:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create configuration',
        data: null
      };
    }
  },

  /**
   * Update discover configuration (Admin only)
   * @param {Object} config - Updated configuration
   * @returns {Promise<Object>} Updated configuration
   */
  updateDiscoverConfig: async (config) => {
    try {
      const response = await api.put('/discover', config);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error updating discover config:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update configuration',
        data: null
      };
    }
  },

  /**
   * Update specific section (Admin only)
   * @param {string} section - Section name
   * @param {Array} data - Section data
   * @returns {Promise<Object>} Updated section
   */
  updateSection: async (section, data) => {
    try {
      const response = await api.patch(`/discover/${section}`, { [section]: data });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error(`Error updating ${section}:`, error);
      return {
        success: false,
        error: error.response?.data?.message || `Failed to update ${section}`,
        data: null
      };
    }
  },

  /**
   * Deactivate discover configuration (Admin only)
   * @returns {Promise<Object>} Operation result
   */
  deactivateDiscoverConfig: async () => {
    try {
      const response = await api.delete('/discover');
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error deactivating discover config:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to deactivate configuration'
      };
    }
  },

  /**
   * Get discover configuration history (Admin only)
   * @param {Object} params - Pagination params
   * @returns {Promise<Object>} Configuration history
   */
  getDiscoverHistory: async (params = {}) => {
    try {
      const response = await api.get('/discover/history', { params });
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Error fetching discover history:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to load history',
        data: [],
        pagination: null
      };
    }
  }
};

export default uiService;