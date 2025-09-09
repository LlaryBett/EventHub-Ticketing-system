// client/src/services/categoriesService.js
import { api } from './api';

class CategoriesService {
  // Get all categories
  async getAllCategories(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      // Add filter parameters if provided
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      
      const queryString = params.toString();
      const url = `/categories${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get category by ID
  async getCategoryById(id) {
    try {
      const response = await api.get(`/categories/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Create a new category (admin only)
  async createCategory(categoryData) {
    try {
      const response = await api.post('/categories', categoryData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Update a category (admin only)
  async updateCategory(id, categoryData) {
    try {
      const response = await api.put(`/categories/${id}`, categoryData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Delete a category (admin only)
  async deleteCategory(id) {
    try {
      const response = await api.delete(`/categories/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get category statistics overview (admin only)
  async getCategoryStats() {
    try {
      const response = await api.get('/categories/stats/overview');
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
export const categoriesService = new CategoriesService();