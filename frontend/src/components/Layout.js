import React, { useState, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';

const Layout = ({ children }) => {
  const { authState } = useAuth();
  const { isDarkMode } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Construct user object from authState
  const user = authState.isAuthenticated
    ? {
        role: authState.userRole,
        firstName: authState.firstName,
        lastName: authState.lastName,
        profilePicture: authState.profilePicture,
      }
    : null;

  // Initialize isCollapsed based on window size
  useEffect(() => {
    const handleResize = () => {
      const isSmallScreen = window.innerWidth < 900;
      setIsCollapsed(isSmallScreen);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar handleDrawerToggle={handleDrawerToggle} user={user} />
      <Sidebar
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
        user={user}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: {
            xs: '100%',
            sm: `calc(100% - ${isCollapsed ? 64 : 240}px)`,
          },
          background: isDarkMode
            ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
            : 'linear-gradient(135deg, #e0f7fa 0%, #b3e5fc 100%)',
          minHeight: '100vh',
        }}
      >
        {authState.loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size={40} sx={{ color: isDarkMode ? '#ffffff' : '#1976d2' }} />
          </Box>
        ) : (
          children
        )}
      </Box>
    </Box>
  );
};

export default Layout;