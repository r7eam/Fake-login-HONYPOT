import { apiRequest } from './api';

const API_BASE_URL = 'http://localhost:3000';

// Portfolio API Service
export const portfolioApi = {
  /**
   * Create a new portfolio item (manual - with pre-existing image URL)
   * @param {Object} data - Portfolio data
   * @param {string} data.image_url - Image URL path
   * @param {string} [data.description] - Optional description
   * @param {number} [data.worker_id] - Optional worker ID (for admins)
   * @returns {Promise<Object>} Created portfolio item
   */
  createPortfolioItem: async (data) => {
    return apiRequest('/worker-portfolio', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Create a new portfolio item with image upload (recommended)
   * @param {FormData} formData - Form data containing image file and optional description
   * @returns {Promise<Object>} Created portfolio item with message
   */
  uploadPortfolioWithImage: async (formData) => {
    const token = localStorage.getItem('access_token'); // Changed from 'token' to 'access_token'
    
    const response = await fetch(`${API_BASE_URL}/worker-portfolio/upload-with-image`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData, // Don't set Content-Type, browser will set it with boundary
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload portfolio item');
    }

    return response.json();
  },

  /**
   * Upload multiple portfolio images at once
   * @param {FormData} formData - Form data containing multiple image files
   * @returns {Promise<Object>} Created portfolio items with message
   */
  uploadMultiplePortfolioImages: async (formData) => {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${API_BASE_URL}/worker-portfolio/upload-multiple-images`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload portfolio items');
    }

    return response.json();
  },

  /**
   * Get all portfolio items from all workers
   * @returns {Promise<Array>} Array of portfolio items with worker details
   */
  getAllPortfolioItems: async () => {
    return apiRequest('/worker-portfolio', {
      method: 'GET',
    });
  },

  /**
   * Get a specific portfolio item by ID
   * @param {number} id - Portfolio item ID
   * @returns {Promise<Object>} Portfolio item with worker details
   */
  getPortfolioItemById: async (id) => {
    return apiRequest(`/worker-portfolio/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Get all portfolio items for a specific worker
   * @param {number} workerId - Worker ID
   * @returns {Promise<Array>} Array of portfolio items for the worker
   */
  getPortfolioByWorkerId: async (workerId) => {
    return apiRequest(`/worker-portfolio/worker/${workerId}`, {
      method: 'GET',
    });
  },

  /**
   * Update a portfolio item
   * @param {number} id - Portfolio item ID
   * @param {Object} data - Updated data
   * @param {string} [data.image_url] - Optional new image URL
   * @param {string} [data.description] - Optional new description
   * @returns {Promise<Object>} Updated portfolio item
   */
  updatePortfolioItem: async (id, data) => {
    return apiRequest(`/worker-portfolio/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a portfolio item
   * @param {number} id - Portfolio item ID
   * @returns {Promise<Object>} Deleted portfolio item
   */
  deletePortfolioItem: async (id) => {
    return apiRequest(`/worker-portfolio/${id}`, {
      method: 'DELETE',
    });
  },
};

export default portfolioApi;
