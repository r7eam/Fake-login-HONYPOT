import { useState, useEffect } from 'react';
import { reviewsApi } from '../config/reviewsApi';

// Get all reviews for a worker
export const useWorkerReviews = (workerId) => {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!workerId) {
      setIsLoading(false);
      return;
    }

    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        const response = await reviewsApi.getWorkerReviews(workerId);
        // Handle the response structure from apiRequest
        const data = response.success ? response.data : response;
        // Ensure data is always an array
        setReviews(Array.isArray(data) ? data : []);
        setIsError(false);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setIsError(true);
        setError(err);
        setReviews([]); // Set empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [workerId]);

  return { data: reviews, isLoading, isError, error };
};

// Create a review
export const useCreateReview = () => {
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  const mutateAsync = async ({ requestId, rating, comment }) => {
    try {
      setIsPending(true);
      setIsError(false);
      const response = await reviewsApi.createReview(requestId, rating, comment);
      // Handle the response structure from apiRequest
      const data = response.success ? response.data : response;
      return data;
    } catch (err) {
      setIsError(true);
      setError(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending, isError, error };
};
