import { apiRequest, API_ENDPOINTS } from './api';

/**
 * Users API Service
 * Handles all user management endpoints (Admin only for most operations)
 */

export const usersApi = {
  /**
   * Get all users
   * @returns {Promise} Array of users
   */
  getAllUsers: async () => {
    const response = await apiRequest(API_ENDPOINTS.USERS, {
      method: 'GET',
    });
    
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'فشل في تحميل المستخدمين');
  },

  /**
   * Get user by ID
   * @param {number} userId - User ID
   * @returns {Promise} User object
   */
  getUserById: async (userId) => {
    const response = await apiRequest(`${API_ENDPOINTS.USERS}/${userId}`, {
      method: 'GET',
    });
    
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'فشل في تحميل بيانات المستخدم');
  },

  /**
   * Create new user (Admin only)
   * @param {Object} userData - User data
   * @returns {Promise} Created user object
   */
  createUser: async (userData) => {
    const response = await apiRequest(API_ENDPOINTS.USERS, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'فشل في إنشاء المستخدم');
  },

  /**
   * Update user (Admin only)
   * @param {number} userId - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise} Updated user object
   */
  updateUser: async (userId, userData) => {
    const response = await apiRequest(`${API_ENDPOINTS.USERS}/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
    
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'فشل في تحديث المستخدم');
  },

  /**
   * Delete user (Admin only)
   * @param {number} userId - User ID
   * @returns {Promise} Success message
   */
  deleteUser: async (userId) => {
    const response = await apiRequest(`${API_ENDPOINTS.USERS}/${userId}`, {
      method: 'DELETE',
    });
    
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'فشل في حذف المستخدم');
  },

  /**
   * Verify user email/phone (Admin only)
   * @param {number} userId - User ID
   * @param {Object} verificationData - { email_verified, phone_verified }
   * @returns {Promise} Updated user object
   */
  verifyUser: async (userId, verificationData) => {
    return usersApi.updateUser(userId, verificationData);
  },

  /**
   * Activate/Deactivate user (Admin only)
   * @param {number} userId - User ID
   * @param {boolean} isActive - Active status
   * @returns {Promise} Updated user object
   */
  toggleUserStatus: async (userId, isActive) => {
    return usersApi.updateUser(userId, { is_active: isActive });
  },

  /**
   * Change user role (Admin only)
   * @param {number} userId - User ID
   * @param {string} role - New role (client, worker, admin)
   * @returns {Promise} Updated user object
   */
  changeUserRole: async (userId, role) => {
    return usersApi.updateUser(userId, { role });
  },
};
