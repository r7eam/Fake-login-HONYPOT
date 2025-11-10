import { useState, useEffect } from 'react';
import { workersApi } from '../config/workersApi';
import { requestsApi } from '../config/requestsApi';

/**
 * Hook to fetch workers with filters and pagination
 * @param {Object} filters - Filter parameters
 * @returns {Object} { workers, meta, loading, error, refetch }
 */
export const useWorkers = (filters = {}) => {
  const [workers, setWorkers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWorkers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await workersApi.getAllWorkers(filters);
      const data = response.success ? response.data : response;
      // Handle both paginated and non-paginated responses
      if (data.data && data.meta) {
        setWorkers(data.data);
        setMeta(data.meta);
      } else {
        setWorkers(Array.isArray(data) ? data : [data]);
        setMeta(null);
      }
    } catch (err) {
      setError(err.message || 'فشل في تحميل العمال');
      console.error('Error fetching workers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [JSON.stringify(filters)]);

  return { workers, meta, loading, error, refetch: fetchWorkers };
};

/**
 * Hook to fetch single worker by ID
 * @param {number} workerId - Worker ID
 * @returns {Object} { worker, loading, error, refetch }
 */
export const useWorker = (workerId) => {
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWorker = async () => {
    if (!workerId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await workersApi.getWorkerById(workerId);
      const data = response.success ? response.data : response;
      setWorker(data);
    } catch (err) {
      setError(err.message || 'فشل في تحميل بيانات العامل');
      console.error('Error fetching worker:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorker();
  }, [workerId]);

  return { worker, loading, error, refetch: fetchWorker };
};

/**
 * Hook to fetch worker by user ID
 * @param {number} userId - User ID
 * @returns {Object} { worker, loading, error, refetch }
 */
export const useWorkerByUserId = (userId) => {
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWorker = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await workersApi.getWorkerByUserId(userId);
      const data = response.success ? response.data : response;
      setWorker(data);
    } catch (err) {
      setError(err.message || 'فشل في تحميل بيانات العامل');
      console.error('Error fetching worker:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorker();
  }, [userId]);

  return { worker, loading, error, refetch: fetchWorker };
};

/**
 * Hook to fetch worker by ID (using useQuery pattern)
 * @param {number} workerId - Worker ID
 * @returns {Object} React Query-like response
 */
export const useWorkerById = (workerId) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWorker = async () => {
    if (!workerId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const result = await workersApi.getWorkerById(workerId);
      setData(result);
    } catch (err) {
      setError(err);
      console.error('Error fetching worker:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorker();
  }, [workerId]);

  return { data, isLoading, error, refetch: fetchWorker };
};

/**
 * Hook to fetch requests for a specific worker
 * @param {number} workerId - Worker ID
 * @returns {Object} React Query-like response
 */
export const useRequestsByWorker = (workerId) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRequests = async () => {
    if (!workerId) {
      console.log('useRequestsByWorker: No workerId provided');
      return;
    }
    
    console.log('useRequestsByWorker: Fetching requests for worker ID:', workerId);
    setIsLoading(true);
    setError(null);
    try {
      const result = await requestsApi.getWorkerRequests(workerId);
      console.log('useRequestsByWorker: Received requests:', result);
      setData(result);
    } catch (err) {
      console.error('useRequestsByWorker: Error fetching worker requests:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [workerId]);

  return { data, isLoading, error, refetch: fetchRequests };
};

/**
 * Hook to update a request (mutation pattern)
 * @returns {Object} React Query-like mutation
 */
export const useUpdateRequest = () => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async ({ requestId, data, isStatus = false }, options = {}) => {
    setIsPending(true);
    setError(null);
    try {
      let result;
      if (isStatus) {
        // Use the status update endpoint
        result = await requestsApi.updateRequestStatus(requestId, data);
      } else {
        // Use the regular update endpoint
        result = await requestsApi.updateRequest(requestId, data);
      }
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      return result;
    } catch (err) {
      console.error('useUpdateRequest: Error updating request:', err);
      setError(err);
      if (options.onError) {
        options.onError(err);
      }
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending, error };
};

/**
 * Hook to manage worker operations (create, update, delete, upload)
 * @returns {Object} Operations and state
 */
export const useWorkerOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const createWorker = async (workerData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const newWorker = await workersApi.createWorker(workerData);
      setSuccess('تم إنشاء ملف العامل بنجاح');
      return newWorker;
    } catch (err) {
      setError(err.message || 'فشل في إنشاء ملف العامل');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateWorker = async (workerId, workerData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const updatedWorker = await workersApi.updateWorker(workerId, workerData);
      setSuccess('تم تحديث ملف العامل بنجاح');
      return updatedWorker;
    } catch (err) {
      setError(err.message || 'فشل في تحديث ملف العامل');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteWorker = async (workerId) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await workersApi.deleteWorker(workerId);
      setSuccess('تم حذف العامل بنجاح');
      return true;
    } catch (err) {
      setError(err.message || 'فشل في حذف العامل');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadProfileImage = async (workerId, imageFile) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);
    
    try {
      const result = await workersApi.uploadProfileImage(workerId, imageFile);
      setSuccess('تم رفع الصورة بنجاح');
      setUploadProgress(100);
      return result;
    } catch (err) {
      setError(err.message || 'فشل في رفع الصورة');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadMyProfileImage = async (imageFile) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);
    
    try {
      const result = await workersApi.uploadMyProfileImage(imageFile);
      setSuccess('تم رفع الصورة بنجاح');
      setUploadProgress(100);
      return result;
    } catch (err) {
      setError(err.message || 'فشل في رفع الصورة');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (workerId, isAvailable) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const updatedWorker = await workersApi.toggleAvailability(workerId, isAvailable);
      setSuccess(isAvailable ? 'تم تفعيل الحساب بنجاح' : 'تم تعطيل الحساب بنجاح');
      return updatedWorker;
    } catch (err) {
      setError(err.message || 'فشل في تغيير حالة التوفر');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return {
    loading,
    error,
    success,
    uploadProgress,
    createWorker,
    updateWorker,
    deleteWorker,
    uploadProfileImage,
    uploadMyProfileImage,
    toggleAvailability,
    clearMessages,
  };
};