import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import axios from 'axios';
import Layout from '../components/Layout';
import MainContent from '../components/MainContent';

export default function DashboardLayoutBasic({ isDarkMode, toggleTheme, user, setUser }) {
  const navigate = useNavigate();
  const [logoutLoading, setLogoutLoading] = React.useState(false);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/auth/logout', { withCredentials: true });
      console.log('Logout response:', response.data); // Debug
      localStorage.removeItem('isAuthenticated');
      setUser(null); // Reset user state
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error.response?.data || error.message);
    } finally {
      setLogoutLoading(false);
    }
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
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