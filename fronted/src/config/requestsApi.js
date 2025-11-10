import { apiRequest } from './api';

const REQUESTS_BASE = '/requests';

export const requestsApi = {
  // Get all requests
  getAllRequests: async () => {
    const response = await apiRequest(REQUESTS_BASE, { method: 'GET' });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'فشل في تحميل الطلبات');
  },

  // Get request by ID
  getRequestById: async (requestId) => {
    const response = await apiRequest(`${REQUESTS_BASE}/${requestId}`, {
      method: 'GET',
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'فشل في تحميل تفاصيل الطلب');
  },

  // Get requests by client ID
  getClientRequests: async (clientId) => {
    const response = await apiRequest(`${REQUESTS_BASE}/client/${clientId}`, {
      method: 'GET',
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'فشل في تحميل طلبات العميل');
  },

  // Get requests by worker ID
  getWorkerRequests: async (workerId) => {
    const response = await apiRequest(`${REQUESTS_BASE}/worker/${workerId}`, {
      method: 'GET',
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'فشل في تحميل طلبات العامل');
  },

  // Create new request
  createRequest: async (requestData) => {
    const response = await apiRequest(REQUESTS_BASE, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'فشل في إنشاء الطلب');
  },

  // Update request
  updateRequest: async (requestId, requestData) => {
    const response = await apiRequest(`${REQUESTS_BASE}/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify(requestData),
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'فشل في تحديث الطلب');
  },

  // Update request status
  updateRequestStatus: async (requestId, statusData) => {
    const response = await apiRequest(`${REQUESTS_BASE}/${requestId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'فشل في تحديث حالة الطلب');
  },

  // Delete request
  deleteRequest: async (requestId) => {
    const response = await apiRequest(`${REQUESTS_BASE}/${requestId}`, {
      method: 'DELETE',
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'فشل في حذف الطلب');
  },

  // Convenience methods for status updates
  acceptRequest: async (requestId) => {
    return requestsApi.updateRequestStatus(requestId, { status: 'accepted' });
  },

  rejectRequest: async (requestId, reason) => {
    return requestsApi.updateRequestStatus(requestId, { 
      status: 'rejected',
      rejected_reason: reason 
    });
  },

  completeRequest: async (requestId) => {
    return requestsApi.updateRequestStatus(requestId, { status: 'completed' });
  },

  cancelRequest: async (requestId) => {
    return requestsApi.updateRequestStatus(requestId, { status: 'cancelled' });
  },
};
