import { useState, useEffect } from 'react';
import { requestsApi } from '../config/requestsApi';

/**
 * Hook to fetch all requests
 */
export const useRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestsApi.getAllRequests();
      const data = response.success ? response.data : response;
      setRequests(data);
    } catch (err) {
      setError(err.message || 'فشل في تحميل الطلبات');
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return { requests, loading, error, refetch: fetchRequests };
};

/**
 * Hook to fetch single request
 */
export const useRequest = (requestId) => {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRequest = async () => {
    if (!requestId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await requestsApi.getRequestById(requestId);
      const data = response.success ? response.data : response;
      setRequest(data);
    } catch (err) {
      setError(err.message || 'فشل في تحميل تفاصيل الطلب');
      console.error('Error fetching request:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [requestId]);

  return { request, loading, error, refetch: fetchRequest };
};

/**
 * Hook to fetch client's requests
 */
export const useClientRequests = (clientId) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRequests = async () => {
    if (!clientId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await requestsApi.getClientRequests(clientId);
      const data = response.success ? response.data : response;
      setRequests(data);
    } catch (err) {
      setError(err.message || 'فشل في تحميل الطلبات');
      console.error('Error fetching client requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [clientId]);

  return { requests, loading, error, refetch: fetchRequests };
};

/**
 * Hook to fetch worker's requests
 */
export const useWorkerRequests = (workerId) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRequests = async () => {
    if (!workerId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await requestsApi.getWorkerRequests(workerId);
      const data = response.success ? response.data : response;
      setRequests(data);
    } catch (err) {
      setError(err.message || 'فشل في تحميل الطلبات');
      console.error('Error fetching worker requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [workerId]);

  return { requests, loading, error, refetch: fetchRequests };
};

/**
 * Hook for request operations (create, update, delete, status changes)
 */
export const useRequestOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const createRequest = async (requestData) => {
    setLoading(true);
    clearMessages();
    try {
      const response = await requestsApi.createRequest(requestData);
      const data = response.success ? response.data : response;
      setSuccess('تم إنشاء الطلب بنجاح');
      return data;
    } catch (err) {
      setError(err.message || 'فشل في إنشاء الطلب');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRequest = async (requestId, requestData) => {
    setLoading(true);
    clearMessages();
    try {
      const response = await requestsApi.updateRequest(requestId, requestData);
      const data = response.success ? response.data : response;
      setSuccess('تم تحديث الطلب بنجاح');
      return data;
    } catch (err) {
      setError(err.message || 'فشل في تحديث الطلب');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteRequest = async (requestId) => {
    setLoading(true);
    clearMessages();
    try {
      const response = await requestsApi.deleteRequest(requestId);
      const data = response.success ? response.data : response;
      setSuccess('تم حذف الطلب بنجاح');
      return data;
    } catch (err) {
      setError(err.message || 'فشل في حذف الطلب');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (requestId) => {
    setLoading(true);
    clearMessages();
    try {
      const response = await requestsApi.acceptRequest(requestId);
      const data = response.success ? response.data : response;
      setSuccess('تم قبول الطلب بنجاح');
      return data;
    } catch (err) {
      setError(err.message || 'فشل في قبول الطلب');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const rejectRequest = async (requestId, reason) => {
    setLoading(true);
    clearMessages();
    try {
      const response = await requestsApi.rejectRequest(requestId, reason);
      const data = response.success ? response.data : response;
      setSuccess('تم رفض الطلب');
      return data;
    } catch (err) {
      setError(err.message || 'فشل في رفض الطلب');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const completeRequest = async (requestId) => {
    setLoading(true);
    clearMessages();
    try {
      const response = await requestsApi.completeRequest(requestId);
      const data = response.success ? response.data : response;
      setSuccess('تم إكمال الطلب بنجاح');
      return data;
    } catch (err) {
      setError(err.message || 'فشل في إكمال الطلب');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelRequest = async (requestId) => {
    setLoading(true);
    clearMessages();
    try {
      const response = await requestsApi.cancelRequest(requestId);
      const data = response.success ? response.data : response;
      setSuccess('تم إلغاء الطلب');
      return data;
    } catch (err) {
      setError(err.message || 'فشل في إلغاء الطلب');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    success,
    createRequest,
    updateRequest,
    deleteRequest,
    acceptRequest,
    rejectRequest,
    completeRequest,
    cancelRequest,
    clearMessages,
  };
};
