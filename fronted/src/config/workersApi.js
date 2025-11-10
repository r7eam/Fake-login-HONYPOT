import { apiRequest, API_BASE_URL } from './api';

const WORKERS_BASE = '/workers';

/**
 * Workers API Service
 * Handles all worker profile endpoints
 */

export const workersApi = {
  /**
   * Get all workers with filters and pagination
   * @param {Object} filters - Filter parameters
   * @returns {Promise} Workers data with pagination metadata
   */
  getAllWorkers: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add all filter parameters
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `${WORKERS_BASE}?${queryString}` : WORKERS_BASE;
    
    const response = await apiRequest(endpoint, { method: 'GET' });
    
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'فشل في تحميل العمال');
  },

  /**
   * Get worker by ID
   * @param {number} workerId - Worker ID
   * @returns {Promise} Worker object
   */
  getWorkerById: async (workerId) => {
    const response = await apiRequest(`${WORKERS_BASE}/${workerId}`, {
      method: 'GET',
    });
    
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'فشل في تحميل بيانات العامل');
  },

  /**
   * Get worker by user ID
   * @param {number} userId - User ID
   * @returns {Promise} Worker object
   */
  getWorkerByUserId: async (userId) => {
    const response = await apiRequest(`${WORKERS_BASE}/user/${userId}`, {
      method: 'GET',
    });
    
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'فشل في تحميل بيانات العامل');
  },

  /**
   * Create worker profile
   * @param {Object} workerData - Worker data
   * @returns {Promise} Created worker object
   */
  createWorker: async (workerData) => {
    const response = await apiRequest(WORKERS_BASE, {
      method: 'POST',
      body: JSON.stringify(workerData),
    });
    
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'فشل في إنشاء ملف العامل');
  },

  /**
   * Update worker profile
   * @param {number} workerId - Worker ID
   * @param {Object} workerData - Updated worker data
   * @returns {Promise} Updated worker object
   */
  updateWorker: async (workerId, workerData) => {
    const response = await apiRequest(`${WORKERS_BASE}/${workerId}`, {
      method: 'PATCH',
      body: JSON.stringify(workerData),
    });
    
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'فشل في تحديث ملف العامل');
  },

  /**
   * Delete worker profile (Admin only)
   * @param {number} workerId - Worker ID
   * @returns {Promise} Success message
   */
  deleteWorker: async (workerId) => {
    const response = await apiRequest(`${WORKERS_BASE}/${workerId}`, {
      method: 'DELETE',
    });
    
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'فشل في حذف العامل');
  },

  /**
   * Upload profile image for worker
   * @param {number} workerId - Worker ID
   * @param {File} imageFile - Image file
   * @returns {Promise} Upload result with image URL
   */
  uploadProfileImage: async (workerId, imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    const token = localStorage.getItem('access_token');
    const response = await fetch(
      `${API_BASE_URL}${WORKERS_BASE}/${workerId}/upload-profile-image`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'فشل في رفع الصورة');
    }

    return data;
  },

  /**
   * Upload my profile image (convenience endpoint for current user)
   * @param {File} imageFile - Image file
   * @returns {Promise} Upload result with image URL
   */
  uploadMyProfileImage: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    const token = localStorage.getItem('access_token');
    const response = await fetch(
      `${API_BASE_URL}${WORKERS_BASE}/upload-my-profile-image`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'فشل في رفع الصورة');
    }

    return data;
  },

  /**
   * Toggle worker availability
   * @param {number} workerId - Worker ID
   * @param {boolean} isAvailable - Availability status
   * @returns {Promise} Updated worker object
   */
  toggleAvailability: async (workerId, isAvailable) => {
    return workersApi.updateWorker(workerId, { is_available: isAvailable });
  },

  /**
   * Get all requests for a specific worker
   * @param {number} workerId - Worker ID
   * @returns {Promise} Array of requests
   */
  getWorkerRequests: async (workerId) => {
    const response = await apiRequest(`/requests/worker/${workerId}`, {
      method: 'GET',
    });
    
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'فشل في تحميل الطلبات');
  },

  /**
   * Update a request
   * @param {number} requestId - Request ID
   * @param {Object} updateData - Update data
   * @param {boolean} isStatus - Whether this is a status update
   * @returns {Promise} Updated request
   */
  updateRequest: async (requestId, updateData, isStatus = false) => {
    const endpoint = isStatus ? `/requests/${requestId}/status` : `/requests/${requestId}`;
    
    const response = await apiRequest(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
    
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'فشل في تحديث الطلب');
  },
};
