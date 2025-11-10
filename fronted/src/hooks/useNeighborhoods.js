import { useState, useEffect } from 'react';
import { neighborhoodsApi } from '../config/neighborhoodsApi';

// Get all neighborhoods
export const useNeighborhoods = () => {
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNeighborhoods = async () => {
      try {
        setIsLoading(true);
        const response = await neighborhoodsApi.getAllNeighborhoods();
        // Handle the response structure from apiRequest
        const data = response.success ? response.data : response;
        // Ensure data is always an array
        setNeighborhoods(Array.isArray(data) ? data : []);
        setIsError(false);
      } catch (err) {
        console.error('Error fetching neighborhoods:', err);
        setIsError(true);
        setError(err);
        setNeighborhoods([]); // Set empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchNeighborhoods();
  }, []);

  return { data: neighborhoods, isLoading, isError, error };
};

// Get neighborhoods by area
export const useNeighborhoodsByArea = (area) => {
  const { data: neighborhoods, isLoading, isError, error } = useNeighborhoods();
  
  const filteredNeighborhoods = area 
    ? neighborhoods.filter(n => n.area === area)
    : neighborhoods;
  
  return { data: filteredNeighborhoods, isLoading, isError, error };
};

// Create neighborhood (admin)
export const useCreateNeighborhood = () => {
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  const mutateAsync = async (data) => {
    try {
      setIsPending(true);
      setIsError(false);
      const result = await neighborhoodsApi.createNeighborhood(data);
      return result;
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

// Update neighborhood (admin)
export const useUpdateNeighborhood = () => {
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  const mutateAsync = async ({ neighborhoodId, data }) => {
    try {
      setIsPending(true);
      setIsError(false);
      const result = await neighborhoodsApi.updateNeighborhood(neighborhoodId, data);
      return result;
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

// Delete neighborhood (admin)
export const useDeleteNeighborhood = () => {
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  const mutateAsync = async (neighborhoodId) => {
    try {
      setIsPending(true);
      setIsError(false);
      const result = await neighborhoodsApi.deleteNeighborhood(neighborhoodId);
      return result;
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
