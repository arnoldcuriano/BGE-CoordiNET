import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ pageKey, isPublic = false, children }) => {
  const { authState, loading, refreshUser } = useAuth();

  useEffect(() => {
    if (!loading && !authState.isAuthenticated) {
      console.log('ProtectedRoute: Triggering refreshUser due to unauthenticated state');
      refreshUser();
    }
  }, [loading, authState.isAuthenticated, refreshUser]);

  if (loading) {
    console.log('ProtectedRoute: Loading auth state for pageKey:', pageKey);
    return <div>Loading...</div>;
  }

  console.log('ProtectedRoute: Current authState:', authState);

  // Handle public routes (e.g., /login, /signup)
  if (isPublic) {
    if (authState.isAuthenticated) {
      console.log('ProtectedRoute: User authenticated, redirecting to /dashboard');
      return <Navigate to="/dashboard" replace />;
    }
    return children ? children : <Outlet />;
  }

  // Handle unauthenticated users
  if (!authState.isAuthenticated) {
    console.log('ProtectedRoute: User not authenticated, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  // Handle unapproved users
  if (!authState.isApproved) {
    console.log('ProtectedRoute: User not approved, redirecting to /welcome');
    return <Navigate to="/welcome" replace />;
  }

  // Allow access to routes without pageKey (e.g., /no-access, /welcome)
  if (!pageKey) {
    console.log('ProtectedRoute: No pageKey provided, allowing access');
    return children ? children : <Outlet />;
  }

  // Grant superadmins unrestricted access
  if (authState.role === 'superadmin') {
    console.log('ProtectedRoute: Superadmin detected, granting unrestricted access to', pageKey);
    return children ? children : <Outlet />;
  }

  // Check access permissions for non-superadmin roles
  const hasAccess = authState.accessPermissions && authState.accessPermissions[pageKey] === true;

  // Redirect to Welcome Page if approved but no specific access
  const hasAnyAccess = Object.values(authState.accessPermissions || {}).some(permission => permission === true);
  if (authState.isApproved && !hasAnyAccess) {
    console.log('ProtectedRoute: Approved user with no specific access, redirecting to /welcome');
    return <Navigate to="/welcome" replace />;
  }

  console.log('ProtectedRoute: Checking access for', {
    pageKey,
    role: authState.role,
    accessPermissions: authState.accessPermissions,
    hasAccess,
  });

  return hasAccess ? (children ? children : <Outlet />) : (
    <Navigate to="/no-access" replace state={{ message: `Access denied to ${pageKey}` }} />
  );
};

export default ProtectedRoute;