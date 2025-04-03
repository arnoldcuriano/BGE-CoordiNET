import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ children, isPublic = false, user }) => {
  const [searchParams] = useSearchParams();
  const googleSuccess = searchParams.get('loginSuccess');

  // If user is undefined (initial load before auth check in App.js), show loading
  if (user === undefined) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Handle public routes (login, forgot-password)
  if (isPublic) {
    // If authenticated, redirect based on role after Google auth success
    if (user) {
      if (googleSuccess) {
        return (
          <Navigate
            to={user.role === 'superadmin' ? '/superadmin-dashboard' : '/dashboard'}
            replace
          />
        );
      }
      return <Navigate to="/dashboard" replace />;
    }
    return children; // Not authenticated, render public page (e.g., Login)
  }

  // Handle protected routes
  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;