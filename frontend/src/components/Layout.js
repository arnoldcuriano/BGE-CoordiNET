import React, { useState, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Layout = ({ children }) => {
  const { authState } = useAuth();
  const { isDarkMode, muiTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [open, setOpen] = useState(false);

  // Extract transition values with fallbacks
  const transitionDuration = muiTheme.transitions?.duration?.leavingScreen ?? 300;
  const transitionEasing = muiTheme.transitions?.easing?.easeInOut ?? 'ease-in-out';

  // Debug logging to inspect muiTheme.transitions
  console.log('Layout: muiTheme.transitions:', muiTheme.transitions);

  const user = authState.isAuthenticated
    ? {
        role: authState.userRole,
        firstName: authState.firstName,
        lastName: authState.lastName,
        profilePicture: authState.profilePicture,
      }
    : null;

  useEffect(() => {
    const handleResize = () => {
      const isSmallScreen = window.innerWidth < 900;
      setOpen(!isSmallScreen);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <Box key={isDarkMode ? 'dark' : 'light'} sx={{ display: 'flex' }}>
      <Navbar
        handleDrawerToggle={handleDrawerToggle}
        user={user}
        open={open}
        handleDrawerOpen={handleDrawerOpen}
        handleDrawerClose={handleDrawerClose}
      />
      <Sidebar
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
        open={open}
        handleDrawerOpen={handleDrawerOpen}
        handleDrawerClose={handleDrawerClose}
        user={user}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: '64px',
          width: {
            xs: '100%',
            sm: `calc(100% - ${open ? 260 : 70}px)`,
          },
          background: muiTheme.custom.gradients.backgroundDefault,
          minHeight: '100vh',
          transition: `width ${transitionDuration}ms ${transitionEasing}`,
        }}
      >
        {authState.loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size={40} sx={{ color: muiTheme.palette.primary.main }} />
          </Box>
        ) : (
          children
        )}
      </Box>
    </Box>
  );
};

export default Layout;