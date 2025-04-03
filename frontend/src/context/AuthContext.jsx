import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    loading: true,
    isAuthenticated: false,
    userRole: null,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('http://localhost:5000/auth/user', {
          withCredentials: true
        });

        if (response.data) {
          setAuthState({
            loading: false,
            isAuthenticated: true,
            userRole: response.data.role
          });
          localStorage.setItem('isAuthenticated', 'true');
        }
      } catch (error) {
        setAuthState({
          loading: false,
          isAuthenticated: false,
          userRole: null
        });
        localStorage.removeItem('isAuthenticated');
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ authState, setAuthState }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);
