// Frontend: components/ProtectedRoute.js
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const ProtectedRoute = ({ children, isAuthenticatedPage }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const authState = localStorage.getItem('isAuthenticated');
      console.log('localStorage isAuthenticated:', authState); // Debugging

      if (authState === 'true') {
        setIsAuthenticated(true);
        setLoading(false);
      } else {
        try {
          const response = await axios.get('http://localhost:5000/auth/user', { withCredentials: true });
          console.log('Backend response:', response.data); // Debugging
          localStorage.setItem('isAuthenticated', 'true'); // Update localStorage
          setIsAuthenticated(true);
          setLoading(false);
        } catch (error) {
          console.error('Authentication error:', error); // Debugging
          localStorage.removeItem('isAuthenticated'); // Clear localStorage
          setIsAuthenticated(false);
          setLoading(false);
        }
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Show a loading spinner or skeleton
  }

  // If the page is for authenticated users (e.g., Dashboard)
  if (!isAuthenticatedPage && !isAuthenticated) {
    console.log('Redirecting to /login'); // Debugging
    return <Navigate to="/login" replace />;
  }

  // If the page is for unauthenticated users (e.g., Login)
  if (isAuthenticatedPage && isAuthenticated) {
    console.log('Redirecting to /dashboard'); // Debugging
    return <Navigate to="/dashboard" replace />;
  }

  // Allow access to the requested page
  return children;
};

export default ProtectedRoute;