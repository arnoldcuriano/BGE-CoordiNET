import * as React from 'react';
import {
  Box,
  Typography,
  Toolbar,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import MainContent from '../components/MainContent';

export default function DashboardLayoutBasic({ isDarkMode, toggleTheme }) {
  const [logoutLoading, setLogoutLoading] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState(null); // Start with null instead of default values
  const navigate = useNavigate();

  // Enhanced auth check with proper error handling
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('http://localhost:5000/auth/user', { 
          withCredentials: true 
        });
        
        console.log('Full user data from backend:', response.data);
        
        if (!response.data) {
          throw new Error('No user data received');
        }

        setUser({
          displayName: response.data.displayName || 
                     `${response.data.firstName} ${response.data.lastName}`,
          profilePicture: response.data.profilePicture || '/static/images/avatar/1.jpg',
          role: response.data.role || 'viewer',
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          email: response.data.email
        });

        localStorage.setItem('isAuthenticated', 'true');
      } catch (error) {
        console.error('Authentication error:', error);
        localStorage.removeItem('isAuthenticated');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    // Always check auth, don't rely on localStorage alone
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await axios.get('http://localhost:5000/auth/logout', { 
        withCredentials: true 
      });
      localStorage.removeItem('isAuthenticated');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLogoutLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Layout
      isDarkMode={isDarkMode}
      toggleTheme={toggleTheme}
      user={user}
      handleLogout={handleLogout}
      logoutLoading={logoutLoading}
    >
      <MainContent />
    </Layout>
  );
}