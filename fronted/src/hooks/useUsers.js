import { useState, useEffect } from 'react';
import { usersApi } from '../config/usersApi';

/**
 * Hook to fetch and manage all users
 * @returns {Object} { users, loading, error, refetch }
 */
export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await usersApi.getAllUsers();
      const data = response.success ? response.data : response;
      setUsers(data);
    } catch (err) {
      setError(err.message || 'فشل في تحميل المستخدمين');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, error, refetch: fetchUsers };
};

/**
 * Hook to fetch a single user by ID
 * @param {number} userId - User ID
 * @returns {Object} { user, loading, error, refetch }
 */
export const useUser = (userId) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUser = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await usersApi.getUserById(userId);
      const data = response.success ? response.data : response;
      setUser(data);
    } catch (err) {
      setError(err.message || 'فشل في تحميل بيانات المستخدم');
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [userId]);

  return { user, loading, error, refetch: fetchUser };
};

/**
 * Hook to manage user operations (create, update, delete)
 * @returns {Object} Operations and state
 */
export const useUserOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const createUser = async (userData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await usersApi.createUser(userData);
      const newUser = response.success ? response.data : response;
      setSuccess('تم إنشاء المستخدم بنجاح');
      return newUser;
    } catch (err) {
      setError(err.message || 'فشل في إنشاء المستخدم');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId, userData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await usersApi.updateUser(userId, userData);
      const updatedUser = response.success ? response.data : response;
      setSuccess('تم تحديث المستخدم بنجاح');
      return updatedUser;
    } catch (err) {
      setError(err.message || 'فشل في تحديث المستخدم');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await usersApi.deleteUser(userId);
      setSuccess('تم حذف المستخدم بنجاح');
      return true;
    } catch (err) {
      setError(err.message || 'فشل في حذف المستخدم');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyUser = async (userId, emailVerified = true, phoneVerified = true) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await usersApi.verifyUser(userId, {
        email_verified: emailVerified,
        phone_verified: phoneVerified,
      });
      const updatedUser = response.success ? response.data : response;
      setSuccess('تم توثيق المستخدم بنجاح');
      return updatedUser;
    } catch (err) {
      setError(err.message || 'فشل في توثيق المستخدم');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, isActive) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await usersApi.toggleUserStatus(userId, isActive);
      const updatedUser = response.success ? response.data : response;
      setSuccess(isActive ? 'تم تفعيل المستخدم بنجاح' : 'تم تعطيل المستخدم بنجاح');
      return updatedUser;
    } catch (err) {
      setError(err.message || 'فشل في تغيير حالة المستخدم');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const changeUserRole = async (userId, role) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await usersApi.changeUserRole(userId, role);
      const updatedUser = response.success ? response.data : response;
      setSuccess('تم تغيير دور المستخدم بنجاح');
      return updatedUser;
    } catch (err) {
      setError(err.message || 'فشل في تغيير دور المستخدم');
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
    createUser,
    updateUser,
    deleteUser,
    verifyUser,
    toggleUserStatus,
    changeUserRole,
    clearMessages,
  };
};
