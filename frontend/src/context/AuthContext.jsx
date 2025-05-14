import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    loading: true,
    isAuthenticated: false,
    userRole: null,
    role: null,
    firstName: null,
    lastName: null,
    profilePicture: null,
    isApproved: false,
    accessPermissions: {},
  });
  const [hasLoggedOut, setHasLoggedOut] = useState(false);

  const fetchUser = async () => {
    try {
      setAuthState((prev) => ({
        ...prev,
        loading: true,
      }));
      console.log('AuthContext: Starting auth check at', new Date().toISOString());
      const response = await axios.get('http://localhost:5000/auth/user', {
        withCredentials: true,
        timeout: 5000,
      });
      console.log('AuthContext: /auth/user response received at', new Date().toISOString(), response.data);
      if (response.data && response.data.role) {
        setAuthState({
          loading: false,
          isAuthenticated: true,
          userRole: response.data.role,
          role: response.data.role,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          profilePicture: response.data.profilePicture,
          isApproved: response.data.isApproved || false,
          accessPermissions: response.data.accessPermissions || {},
        });
        console.log('AuthContext: User authenticated:', response.data);
        setHasLoggedOut(false); // Reset logout flag on successful authentication
      } else {
        setAuthState({
          loading: false,
          isAuthenticated: false,
          userRole: null,
          role: null,
          firstName: null,
          lastName: null,
          profilePicture: null,
          isApproved: false,
          accessPermissions: {},
        });
        console.log('AuthContext: No user authenticated');
      }
    } catch (error) {
      console.error('AuthContext: Auth check failed at', new Date().toISOString(), error.message, error.response?.data);
      setAuthState({
        loading: false,
        isAuthenticated: false,
        userRole: null,
        role: null,
        firstName: null,
        lastName: null,
        profilePicture: null,
        isApproved: false,
        accessPermissions: {},
      });
    }
  };

  const refreshUser = async () => {
    console.log('AuthContext: Refreshing user data');
    await fetchUser();
  };

  // Initial auth check on mount
  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      if (!isMounted) return;
      if (hasLoggedOut) {
        console.log('AuthContext: Skipping fetchUser after logout');
        setAuthState((prev) => ({
          ...prev,
          loading: false,
        }));
        return;
      }
      await fetchUser();
    };

    const timeoutId = setTimeout(() => {
      if (isMounted && authState.loading) {
        console.warn('AuthContext: Auth check timed out after 10 seconds, forcing loading to false');
        setAuthState((prev) => ({
          ...prev,
          loading: false,
        }));
      }
    }, 10000);

    checkAuth();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLoggedOut]); // Intentionally omitting authState.loading to prevent re-triggering

  // Retry fetch if auth data is incomplete
  useEffect(() => {
    if (authState.isAuthenticated && (!authState.userRole || Object.keys(authState.accessPermissions || {}).length === 0)) {
      console.log('AuthContext: Retrying fetch due to incomplete auth data');
      refreshUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.isAuthenticated, authState.userRole, authState.accessPermissions]); // Intentionally omitting refreshUser as it's stable

  const handleLogout = async (navigate) => {
    try {
      console.log('AuthContext: Initiating logout');
      const response = await axios.get('http://localhost:5000/auth/logout', { withCredentials: true });
      console.log('AuthContext: Logout response:', response.data);
      setAuthState({
        loading: false,
        isAuthenticated: false,
        userRole: null,
        role: null,
        firstName: null,
        lastName: null,
        profilePicture: null,
        isApproved: false,
        accessPermissions: {},
      });
      setHasLoggedOut(true); // Set logout flag
      console.log('AuthContext: Logout successful');
      return true;
    } catch (error) {
      console.error('AuthContext: Logout failed:', error.message, error.response?.data);
      setAuthState({
        loading: false,
        isAuthenticated: false,
        userRole: null,
        role: null,
        firstName: null,
        lastName: null,
        profilePicture: null,
        isApproved: false,
        accessPermissions: {},
      });
      setHasLoggedOut(true); // Set logout flag even on error
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ authState, setAuthState, handleLogout, refreshUser, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};