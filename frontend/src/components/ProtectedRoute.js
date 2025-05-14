import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, isPublic = false, pageKey }) => {
  const { authState, refreshUser } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute: Current authState:', authState);

  useEffect(() => {
    if (!authState.isAuthenticated && !isPublic && !authState.loading) {
      console.log('ProtectedRoute: Triggering refreshUser due to unauthenticated state');
      refreshUser();
    }
  }, [authState.isAuthenticated, authState.loading, isPublic, refreshUser]);

  if (authState.loading) {
    return null; // Or a loading indicator
  }

  if (isPublic) {
    if (authState.isAuthenticated) {
      console.log('ProtectedRoute: User authenticated, checking approval status');
      if (!authState.isApproved) {
        console.log('ProtectedRoute: User not approved, redirecting to /welcome');
        return <Navigate to="/welcome" state={{ message: 'Your account is awaiting approval.' }} replace />;
      }

      // Define core system page keys (excluding public routes)
      const corePageKeys = [
        'dashboard',
        'member',
        'partners',
        'hrManagement',
        'projects',
        'itInventory',
        'quickTools',
        'superadminDashboard',
        'analytics',
        'financeManagement'
      ];

      // Check if user has access to any core page
      const hasCoreAccess = corePageKeys.some(key => authState.accessPermissions?.[key] === true);

      if (hasCoreAccess) {
        // Redirect to the first accessible core page
        const redirectRoutes = [
          { key: 'dashboard', path: '/dashboard' },
          { key: 'hrManagement', path: '/hr-management' },
          { key: 'partners', path: '/partners' },
          { key: 'projects', path: '/projects' },
          { key: 'itInventory', path: '/it-inventory' },
          { key: 'quickTools', path: '/quick-tools' },
          { key: 'superadminDashboard', path: '/superadmin-dashboard' },
          { key: 'analytics', path: '/analytics' },
          { key: 'financeManagement', path: '/finance-management' },
        ];

        const accessibleRoute = redirectRoutes.find(route => authState.accessPermissions?.[route.key] === true);
        const redirectPath = accessibleRoute ? accessibleRoute.path : '/welcome';
        const redirectState = accessibleRoute ? {} : { message: 'Welcome! Please wait for the Super Admin to assign your permissions.' };
        console.log('ProtectedRoute: Redirecting to:', redirectPath);
        return <Navigate to={redirectPath} state={redirectState} replace />;
      } else {
        console.log('ProtectedRoute: No core access, redirecting to /welcome');
        return <Navigate to="/welcome" state={{ message: 'Welcome! Please wait for the Super Admin to assign your permissions.' }} replace />;
      }
    }
    return children;
  }

  if (!authState.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Prevent unapproved users from accessing protected routes
  if (!authState.isApproved) {
    console.log('ProtectedRoute: User not approved, redirecting to /welcome');
    return <Navigate to="/welcome" state={{ message: 'Your account is awaiting approval.' }} replace />;
  }

  // Define public routes that all approved users can access
  const publicPageKeys = ['settings', 'help', 'patchNotes'];
  if (pageKey && publicPageKeys.includes(pageKey)) {
    console.log('ProtectedRoute: Allowing access to public route:', pageKey);
    return children;
  }

  if (pageKey) {
    const hasAccess = authState.userRole === 'superadmin' || authState.accessPermissions?.[pageKey] === true;
    if (authState.userRole === 'superadmin') {
      console.log('ProtectedRoute: Superadmin detected, granting unrestricted access to', location.pathname);
      return children;
    }
    if (!hasAccess) {
      console.log('ProtectedRoute: Access denied to', pageKey, 'redirecting to /welcome');
      return <Navigate to="/welcome" state={{ message: 'You do not have access to this page. Please contact an administrator.' }} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;