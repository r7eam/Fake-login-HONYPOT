import { useState, useEffect } from 'react';
import { professionsApi } from '../config/professionsApi';

// Get all professions
export const useProfessions = () => {
  const [professions, setProfessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfessions = async () => {
      try {
        setIsLoading(true);
        const response = await professionsApi.getAllProfessions();
        // Handle the response structure from apiRequest
        const data = response.success ? response.data : response;
        // Ensure data is always an array
        setProfessions(Array.isArray(data) ? data : []);
        setIsError(false);
      } catch (err) {
        console.error('Error fetching professions:', err);
        setIsError(true);
        setError(err);
        setProfessions([]); // Set empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfessions();
  }, []);

  return { data: professions, isLoading, isError, error };
};

// Get active professions only
export const useActiveProfessions = () => {
  const [professions, setProfessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActiveProfessions = async () => {
      try {
        setIsLoading(true);
        const response = await professionsApi.getActiveProfessions();
        // Handle the response structure from apiRequest
        const data = response.success ? response.data : response;
        setProfessions(Array.isArray(data) ? data : []);
        setIsError(false);
      } catch (err) {
        console.error('Error fetching active professions:', err);
        setIsError(true);
        setError(err);
        setProfessions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveProfessions();
  }, []);
  
  return { data: professions, isLoading, isError, error };
};

// Create profession (admin)
export const useCreateProfession = () => {
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  const mutateAsync = async (data) => {
    try {
      setIsPending(true);
      setIsError(false);
      const result = await professionsApi.createProfession(data);
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

// Update profession (admin)
export const useUpdateProfession = () => {
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  const mutateAsync = async ({ professionId, data }) => {
    try {
      setIsPending(true);
      setIsError(false);
      const result = await professionsApi.updateProfession(professionId, data);
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

// Delete profession (admin)
export const useDeleteProfession = () => {
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  const mutateAsync = async (professionId) => {
    try {
      setIsPending(true);
      setIsError(false);
      const result = await professionsApi.deleteProfession(professionId);
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
