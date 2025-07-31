import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

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
    employeeId: null,
    department: null,
    status: null,
    position: null,
    contactNumber: null,
    birthdate: null,
    gender: null,
    civilStatus: null,
    governmentIds: { sss: '', philHealth: '', tin: '', pagIbig: '' },
    hireDate: null,
  });
  const [hasLoggedOut, setHasLoggedOut] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchUser = useCallback(async () => {
    if (hasFetched || hasLoggedOut) {
      console.log('AuthContext: Skipping fetchUser due to prior fetch or logout');
      setAuthState((prev) => ({ ...prev, loading: false }));
      return;
    }

    try {
      console.log('AuthContext: Fetching user data');
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
          employeeId: response.data.employeeId || null,
          department: response.data.department || null,
          status: response.data.status || null,
          position: response.data.position || null,
          contactNumber: response.data.contactNumber || null,
          birthdate: response.data.birthdate || null,
          gender: response.data.gender || null,
          civilStatus: response.data.civilStatus || null,
          governmentIds: response.data.governmentIds || { sss: '', philHealth: '', tin: '', pagIbig: '' },
          hireDate: response.data.hireDate || null,
        });
      } else {
        throw new Error('No user data');
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
        email: null,
        profilePicture: null,
        isApproved: false,
        accessPermissions: {},
        employeeId: null,
        department: null,
        status: null,
        position: null,
        contactNumber: null,
        birthdate: null,
        gender: null,
        civilStatus: null,
        governmentIds: { sss: '', philHealth: '', tin: '', pagIbig: '' },
        hireDate: null,
      });
    } finally {
      setHasFetched(true);
    }
  }, [hasLoggedOut, hasFetched]);

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      if (!isMounted || hasFetched || hasLoggedOut) {
        console.log('AuthContext: Skipping fetchUser due to unmount, prior fetch, or logout');
        setAuthState((prev) => ({ ...prev, loading: false }));
        return;
      }
      await fetchUser();
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [fetchUser, hasFetched, hasLoggedOut]);

  const login = async (email, password, rememberMe) => {
    try {
      console.log('AuthContext: Attempting login with email:', email);
      const response = await axios.post('/auth/login', { email, password, rememberMe }, { withCredentials: true });
      setHasLoggedOut(false);
      setHasFetched(false);
      await fetchUser();
      return response.data;
    } catch (error) {
      console.error('AuthContext: Login failed:', error.message, error.response?.data);
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
        employeeId: null,
        department: null,
        status: null,
        position: null,
        contactNumber: null,
        birthdate: null,
        gender: null,
        civilStatus: null,
        governmentIds: { sss: '', philHealth: '', tin: '', pagIbig: '' },
        hireDate: null,
      });
      setHasLoggedOut(true);
      setHasFetched(false);
      toast.success('Logged out successfully');
      if (navigate) navigate('/login');
      return true;
    } catch (error) {
      console.error('AuthContext: Logout failed:', error.message, error.response?.data);
      toast.error('Logout failed');
      setHasLoggedOut(true);
      setHasFetched(false);
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
