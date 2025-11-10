import { useState, useEffect } from 'react';
import { favoritesApi } from '../config/favoritesApi';
import { useAuth } from '../context/AuthContext';

// Get client's favorites
export const useClientFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id || user?.role !== 'client') {
      console.log('useClientFavorites - No user or not client');
      setIsLoading(false);
      return;
    }

    const fetchFavorites = async () => {
      try {
        setIsLoading(true);
        const response = await favoritesApi.getClientFavorites(user.id);
        const data = response.success ? response.data : response;
        console.log('useClientFavorites - Fetched favorites:', {
          userId: user.id,
          response,
          data,
          count: Array.isArray(data) ? data.length : 0
        });
        setFavorites(data);
        setIsError(false);
      } catch (err) {
        console.error('useClientFavorites - Error:', err);
        setIsError(true);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [user?.id, user?.role]);

  return { data: favorites, isLoading, isError, error };
};

// Check if a worker is favorited
export const useCheckFavorite = (workerId) => {
  const { user } = useAuth();
  const [favorite, setFavorite] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavorite = async () => {
    if (!user?.id || !workerId || user?.role !== 'client') {
      setIsLoading(false);
      setFavorite(null);
      return;
    }

    try {
      setIsLoading(true);
      const response = await favoritesApi.checkFavorite(user.id, workerId);
      
      // Extract data from response
      let data = response.success ? response.data : response;
      
      // If data is an empty object or doesn't have an id, treat as null
      if (!data || typeof data !== 'object' || !data.id) {
        data = null;
      }
      
      console.log('useCheckFavorite - workerId:', workerId, 'response:', response, 'data:', data);
      setFavorite(data);
    } catch (err) {
      console.error('Error checking favorite:', err);
      setFavorite(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorite();
  }, [user?.id, workerId, user?.role]);

  return { data: favorite, isLoading, refetch: fetchFavorite };
};

// Toggle favorite (add/remove)
export const useToggleFavorite = () => {
  const { user } = useAuth();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async ({ workerId, isFavorited, onSuccess }) => {
    if (!user || user.role !== 'client') {
      console.error('Only clients can toggle favorites');
      return;
    }

    console.log('useToggleFavorite - toggling favorite:', {
      workerId,
      isFavorited,
      action: isFavorited ? 'REMOVE' : 'ADD'
    });

    try {
      setIsPending(true);
      setError(null);
      
      let response;
      if (isFavorited) {
        console.log('Removing favorite for worker:', workerId);
        response = await favoritesApi.removeFavoriteByWorker(user.id, workerId);
      } else {
        console.log('Adding favorite for worker:', workerId);
        response = await favoritesApi.addFavorite(workerId);
      }
      
      // Handle response
      const result = response.success ? response.data : response;
      console.log('Toggle favorite result:', result);
      
      // Call success callback to refresh data
      if (onSuccess) {
        onSuccess();
      }
      
      return result;
    } catch (err) {
      console.error('Toggle favorite error:', err);
      setError(err);
      throw err; // Re-throw to allow error handling
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending, error };
};
