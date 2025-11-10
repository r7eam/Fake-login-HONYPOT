import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress, Alert, Container } from '@mui/material';

/**
 * AdminRoute Component
 * Protects routes that require admin role
 * Redirects non-admin users to home page
 */
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has admin role
  if (user?.role !== 'admin') {
    return (
      <Container sx={{ mt: 12 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <strong>غير مصرح</strong>
          <br />
          هذه الصفحة متاحة للمدراء فقط. ليس لديك صلاحية الوصول.
        </Alert>
      </Container>
    );
  }

  // User is admin, render the protected component
  return children;
};

export default AdminRoute;
