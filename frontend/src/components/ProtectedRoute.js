import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, isPublic = false, pageKey = null }) => {
  const { authState, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  console.log('ProtectedRoute: Viewer accessPermissions:', authState.accessPermissions, 'pageKey:', pageKey);

  if (isPublic) {
    return authState.isAuthenticated ? <Navigate to="/dashboard" /> : children;
  }

  if (!authState.isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (authState.userRole === 'superadmin') {
    return children;
  }

  // Check access permissions for non-superadmin users
  if (pageKey && authState.userRole !== 'superadmin') {
    const hasAccess = authState.accessPermissions?.[pageKey] === true;
    if (!hasAccess) {
      console.log(`Access denied for pageKey: ${pageKey}`);
      return <Navigate to="/no-access" />;
    }
  }

  return children;
};

export default ProtectedRoute;