import { apiRequest } from './api';

export const neighborhoodsApi = {
  // Get all neighborhoods
  getAllNeighborhoods: async () => {
    return await apiRequest('/neighborhoods');
  },

  // Get neighborhoods by area
  getNeighborhoodsByArea: async (area) => {
    const allNeighborhoods = await apiRequest('/neighborhoods');
    return allNeighborhoods.filter(n => n.area === area);
  },

  // Get a specific neighborhood
  getNeighborhoodById: async (neighborhoodId) => {
    return await apiRequest(`/neighborhoods/${neighborhoodId}`);
  },

  // Create a neighborhood (admin only)
  createNeighborhood: async (data) => {
    return await apiRequest('/neighborhoods', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Update a neighborhood (admin only)
  updateNeighborhood: async (neighborhoodId, data) => {
    return await apiRequest(`/neighborhoods/${neighborhoodId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  // Delete a neighborhood (admin only)
  deleteNeighborhood: async (neighborhoodId) => {
    return await apiRequest(`/neighborhoods/${neighborhoodId}`, {
      method: 'DELETE'
    });
  }
};
