import { apiRequest } from './api';

export const professionsApi = {
  // Get all professions
  getAllProfessions: async () => {
    return await apiRequest('/professions');
  },

  // Get active professions only
  getActiveProfessions: async () => {
    return await apiRequest('/professions/active');
  },

  // Get a specific profession
  getProfessionById: async (professionId) => {
    return await apiRequest(`/professions/${professionId}`);
  },

  // Create a profession (admin only)
  createProfession: async (data) => {
    return await apiRequest('/professions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Update a profession (admin only)
  updateProfession: async (professionId, data) => {
    return await apiRequest(`/professions/${professionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  // Delete a profession (admin only)
  deleteProfession: async (professionId) => {
    return await apiRequest(`/professions/${professionId}`, {
      method: 'DELETE'
    });
  }
};
