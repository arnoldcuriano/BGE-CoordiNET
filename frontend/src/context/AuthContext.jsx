import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    loading: true,
    isAuthenticated: false,
    userRole: null,
    firstName: null,
    lastName: null,
    profilePicture: null,
    isApproved: false,
    accessPermissions: {},
  });

  const fetchUser = async () => {
    try {
      console.log('AuthContext: Starting auth check at', new Date().toISOString());
      const response = await axios.get('http://localhost:5000/auth/user', { 
        withCredentials: true,
        timeout: 5000
      });
      console.log('AuthContext: /auth/user response received at', new Date().toISOString(), response.data);
      if (response.data) {
        setAuthState({
          loading: false,
          isAuthenticated: true,
          userRole: response.data.role,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          profilePicture: response.data.profilePicture,
          isApproved: response.data.isApproved || false,
          accessPermissions: response.data.accessPermissions || {},
        });
        console.log('AuthContext: User authenticated:', response.data);
      } else {
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          isAuthenticated: false,
          userRole: null,
        }));
        console.log('AuthContext: No user authenticated');
      }
    } catch (error) {
      console.error('AuthContext: Auth check failed at', new Date().toISOString(), error.message, error.response?.data);
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        isAuthenticated: false,
        userRole: null,
      }));
    }
  };

  const refreshUser = async () => {
    console.log('AuthContext: Refreshing user data');
    await fetchUser();
  };

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      if (!isMounted) return;
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
  }, []);

  useEffect(() => {
    if (authState.isAuthenticated && (!authState.userRole || Object.keys(authState.accessPermissions || {}).length === 0)) {
      console.log('AuthContext: Retrying fetch due to incomplete auth data');
      refreshUser();
    }
  }, [authState.isAuthenticated, authState.userRole, authState.accessPermissions]);

  const handleLogout = async () => {
    try {
      console.log('AuthContext: Initiating logout');
      const response = await axios.get('http://localhost:5000/auth/logout', { withCredentials: true });
      console.log('AuthContext: Logout response:', response.data);
      setAuthState({
        loading: false,
        isAuthenticated: false,
        userRole: null,
        firstName: null,
        lastName: null,
        profilePicture: null,
        isApproved: false,
        accessPermissions: {},
      });
      console.log('AuthContext: Logout successful');
      return true;
    } catch (error) {
      console.error('AuthContext: Logout failed:', error.message, error.response?.data);
      setAuthState({
        loading: false,
        isAuthenticated: false,
        userRole: null,
        firstName: null,
        lastName: null,
        profilePicture: null,
        isApproved: false,
        accessPermissions: {},
      });
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