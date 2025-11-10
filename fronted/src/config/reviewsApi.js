import { apiRequest } from './api';

export const reviewsApi = {
  // Create a review for a completed request
  createReview: async (requestId, rating, comment) => {
    return await apiRequest('/reviews', {
      method: 'POST',
      body: JSON.stringify({
        request_id: requestId,
        rating,
        comment
      })
    });
  },

  // Get all reviews
  getAllReviews: async () => {
    return await apiRequest('/reviews');
  },

  // Get a specific review
  getReviewById: async (reviewId) => {
    return await apiRequest(`/reviews/${reviewId}`);
  },

  // Get all reviews for a worker
  getWorkerReviews: async (workerId) => {
    return await apiRequest(`/reviews/worker/${workerId}`);
  },

  // Update a review
  updateReview: async (reviewId, data) => {
    return await apiRequest(`/reviews/${reviewId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  // Delete a review
  deleteReview: async (reviewId) => {
    return await apiRequest(`/reviews/${reviewId}`, {
      method: 'DELETE'
    });
  }
};
