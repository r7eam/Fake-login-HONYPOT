import { useState, useEffect } from 'react';
import { portfolioApi } from '../config/portfolioApi';

/**
 * Hook to fetch all portfolio items
 * @returns {Object} { data: Array, isLoading: boolean, isError: boolean, error: Error, refetch: Function }
 */
export const useAllPortfolioItems = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const response = await portfolioApi.getAllPortfolioItems();
      const result = response.success ? response.data : response;
      setData(result);
    } catch (err) {
      setIsError(true);
      setError(err);
      console.error('Error fetching all portfolio items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, isLoading, isError, error, refetch: fetchData };
};

/**
 * Hook to fetch portfolio items for a specific worker
 * @param {number} workerId - Worker ID
 * @returns {Object} { data: Array, isLoading: boolean, isError: boolean, error: Error, refetch: Function }
 */
export const useWorkerPortfolio = (workerId) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (!workerId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setIsError(false);
      const response = await portfolioApi.getPortfolioByWorkerId(workerId);
      const result = response.success ? response.data : response;
      setData(result);
    } catch (err) {
      setIsError(true);
      setError(err);
      console.error(`Error fetching portfolio for worker ${workerId}:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [workerId]);

  return { data, isLoading, isError, error, refetch: fetchData };
};

/**
 * Hook to fetch a single portfolio item by ID
 * @param {number} portfolioId - Portfolio item ID
 * @returns {Object} { data: Object, isLoading: boolean, isError: boolean, error: Error, refetch: Function }
 */
export const usePortfolioItem = (portfolioId) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (!portfolioId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setIsError(false);
      const response = await portfolioApi.getPortfolioItemById(portfolioId);
      const result = response.success ? response.data : response;
      setData(result);
    } catch (err) {
      setIsError(true);
      setError(err);
      console.error(`Error fetching portfolio item ${portfolioId}:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [portfolioId]);

  return { data, isLoading, isError, error, refetch: fetchData };
};

/**
 * Hook to upload a portfolio item with image
 * @returns {Object} { uploadPortfolio: Function, isUploading: boolean, isError: boolean, error: Error }
 */
export const useUploadPortfolio = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  const uploadPortfolio = async (formData) => {
    try {
      setIsUploading(true);
      setIsError(false);
      setError(null);
      const response = await portfolioApi.uploadPortfolioWithImage(formData);
      const result = response.success ? response.data : response;
      return result;
    } catch (err) {
      setIsError(true);
      setError(err);
      console.error('Error uploading portfolio item:', err);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadPortfolio, isUploading, isError, error };
};

/**
 * Hook to create a portfolio item (manual with image URL)
 * @returns {Object} { createPortfolio: Function, isCreating: boolean, isError: boolean, error: Error }
 */
export const useCreatePortfolio = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  const createPortfolio = async (data) => {
    try {
      setIsCreating(true);
      setIsError(false);
      setError(null);
      const response = await portfolioApi.createPortfolioItem(data);
      const result = response.success ? response.data : response;
      return result;
    } catch (err) {
      setIsError(true);
      setError(err);
      console.error('Error creating portfolio item:', err);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  return { createPortfolio, isCreating, isError, error };
};

/**
 * Hook to update a portfolio item
 * @returns {Object} { updatePortfolio: Function, isUpdating: boolean, isError: boolean, error: Error }
 */
export const useUpdatePortfolio = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  const updatePortfolio = async (id, data) => {
    try {
      setIsUpdating(true);
      setIsError(false);
      setError(null);
      const response = await portfolioApi.updatePortfolioItem(id, data);
      const result = response.success ? response.data : response;
      return result;
    } catch (err) {
      setIsError(true);
      setError(err);
      console.error(`Error updating portfolio item ${id}:`, err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  return { updatePortfolio, isUpdating, isError, error };
};

/**
 * Hook to delete a portfolio item
 * @returns {Object} { deletePortfolio: Function, isDeleting: boolean, isError: boolean, error: Error }
 */
export const useDeletePortfolio = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  const deletePortfolio = async (id) => {
    try {
      setIsDeleting(true);
      setIsError(false);
      setError(null);
      const response = await portfolioApi.deletePortfolioItem(id);
      const result = response.success ? response.data : response;
      return result;
    } catch (err) {
      setIsError(true);
      setError(err);
      console.error(`Error deleting portfolio item ${id}:`, err);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deletePortfolio, isDeleting, isError, error };
};

/**
 * Combined hook for portfolio operations with unified state management
 * @returns {Object} Portfolio operations with loading, error, and success states
 */
export const usePortfolioOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const uploadPortfolioImage = async (imageFile, description = '') => {
    try {
      setLoading(true);
      clearMessages();

      const formData = new FormData();
      formData.append('image', imageFile);
      if (description) {
        formData.append('description', description);
      }

      const response = await portfolioApi.uploadPortfolioWithImage(formData);
      setSuccess('تم رفع الصورة بنجاح');
      return response;
    } catch (err) {
      const errorMessage = err.message || 'فشل في رفع الصورة';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadMultiplePortfolioImages = async (imageFiles, description = '') => {
    try {
      setLoading(true);
      clearMessages();

      const formData = new FormData();
      
      // Append all image files
      for (let i = 0; i < imageFiles.length; i++) {
        formData.append('images', imageFiles[i]);
      }
      
      if (description) {
        formData.append('description', description);
      }

      const response = await portfolioApi.uploadMultiplePortfolioImages(formData);
      setSuccess(`تم رفع ${imageFiles.length} صورة بنجاح`);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'فشل في رفع الصور';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePortfolioItem = async (id) => {
    try {
      setLoading(true);
      clearMessages();

      const response = await portfolioApi.deletePortfolioItem(id);
      setSuccess('تم حذف الصورة بنجاح');
      return response;
    } catch (err) {
      const errorMessage = err.message || 'فشل في حذف الصورة';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    uploadPortfolioImage,
    uploadMultiplePortfolioImages,
    deletePortfolioItem,
    loading,
    error,
    success,
    clearMessages,
  };
};
