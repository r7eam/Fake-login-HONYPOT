import { apiRequest } from './api';

export const favoritesApi = {
  // Add worker to favorites
  addFavorite: async (workerId) => {
    return await apiRequest('/favorites', {
      method: 'POST',
      body: JSON.stringify({
        worker_id: workerId
      })
    });
  },

  // Get all favorites
  getAllFavorites: async () => {
    return await apiRequest('/favorites');
  },

  // Get client's favorites
  getClientFavorites: async (clientId) => {
    return await apiRequest(`/favorites/client/${clientId}`);
  },

  // Check if worker is favorited
  checkFavorite: async (clientId, workerId) => {
    return await apiRequest(`/favorites/client/${clientId}/worker/${workerId}`);
  },

  // Remove favorite by ID
  removeFavorite: async (favoriteId) => {
    return await apiRequest(`/favorites/${favoriteId}`, {
      method: 'DELETE'
    });
  },

  // Remove favorite by client and worker
  removeFavoriteByWorker: async (clientId, workerId) => {
    return await apiRequest(`/favorites/client/${clientId}/worker/${workerId}`, {
      method: 'DELETE'
    });
  }
};
