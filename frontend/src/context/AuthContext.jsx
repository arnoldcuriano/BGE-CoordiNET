import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
    email: null,
    profilePicture: null,
    isApproved: false,
    accessPermissions: {},
  });
  const [hasLoggedOut, setHasLoggedOut] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const fetchUser = useCallback(async () => {
    if (isFetching || hasLoggedOut) {
      console.log('AuthContext: Skipping fetchUser due to ongoing fetch or logout');
      return;
    }

    setIsFetching(true);
    let attempts = 0;
    const maxAttempts = 3;
    const initialRetryDelay = 500; // Reduced initial delay for faster retries

    while (attempts < maxAttempts) {
      try {
        console.log('AuthContext: Fetching user data, attempt', attempts + 1);
        setAuthState((prev) => ({ ...prev, loading: true }));
        const response = await axios.get('/auth/user', { withCredentials: true, timeout: 5000 });
        if (response.data && response.data.role) {
          console.log('AuthContext: User data fetched successfully:', response.data);
          setAuthState({
            loading: false,
            isAuthenticated: true,
            userRole: response.data.role,
            role: response.data.role,
            firstName: response.data.firstName,
            lastName: response.data.lastName,
            email: response.data.email,
            profilePicture: response.data.profilePicture,
            isApproved: response.data.isApproved || false,
            accessPermissions: response.data.accessPermissions || {},
          });
          break;
        } else {
          throw new Error('No user data');
        }
      } catch (error) {
        console.error('AuthContext: Auth check failed at', new Date().toISOString(), error.message);
        attempts++;
        if (attempts === maxAttempts) {
          console.log('AuthContext: Max attempts reached, setting authState to unauthenticated');
          setAuthState({
            loading: false,
            isAuthenticated: false,
            userRole: null,
            role: null,
            firstName: null,
            lastName: null,
            email: null,
            profilePicture: null,
            isApproved: false,
            accessPermissions: {},
          });
        } else {
          // Exponential backoff with a reduced initial delay
          const delay = initialRetryDelay * Math.pow(2, attempts);
          console.log(`AuthContext: Retrying after ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } finally {
        if (attempts >= maxAttempts) {
          setIsFetching(false);
        }
      }
    }
    setIsFetching(false);
  }, [hasLoggedOut]);

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      if (!isMounted || hasLoggedOut || isFetching) {
        console.log('AuthContext: Skipping fetchUser due to unmount, logout, or ongoing fetch');
        setAuthState((prev) => ({ ...prev, loading: false }));
        return;
      }
      await fetchUser();
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [fetchUser, hasLoggedOut]);

  const login = async (email, password, rememberMe) => {
    try {
      const response = await axios.post('/auth/login', { email, password, rememberMe }, { withCredentials: true });
      setHasLoggedOut(false);
      await fetchUser();
      return response.data;
    } catch (error) {
      console.error('AuthContext: Login failed:', error.message);
      throw error;
    }
  };

  const handleLogout = async (navigate) => {
    try {
      await axios.get('/auth/logout', { withCredentials: true });
      setAuthState({
        loading: false,
        isAuthenticated: false,
        userRole: null,
        role: null,
        firstName: null,
        lastName: null,
        email: null,
        profilePicture: null,
        isApproved: false,
        accessPermissions: {},
      });
      setHasLoggedOut(true);
      if (navigate) navigate('/login');
      return true;
    } catch (error) {
      console.error('AuthContext: Logout failed:', error.message);
      setHasLoggedOut(true);
      if (navigate) navigate('/login');
      return false;
    }
  };

  const updateUser = (updates) => {
    setAuthState((prevState) => ({
      ...prevState,
      ...updates,
    }));
  };

  return (
    <AuthContext.Provider value={{ authState, setAuthState, login, handleLogout, fetchUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};