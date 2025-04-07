import React, { useState } from 'react';
import { Box } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MainContent from './MainContent';

const Layout = ({ isDarkMode, toggleTheme, user, handleLogout, logoutLoading }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Toggle sidebar collapse/expand
  const toggleCollapse = () => {
    console.log('Before toggle - isCollapsed:', isCollapsed);
    setIsCollapsed((prev) => {
      const newState = !prev;
      console.log('After toggle - isCollapsed:', newState);
      return newState;
    });
  };

  // Toggle mobile drawer
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Log when Layout renders to confirm props
  console.log('Layout rendering with props:', { isDarkMode, user, logoutLoading, isCollapsed });

  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        handleDrawerToggle={handleDrawerToggle}
        user={user}
        handleLogout={handleLogout}
        logoutLoading={logoutLoading}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
      />
      <Sidebar
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
        user={user}
        handleLogout={handleLogout}
        logoutLoading={logoutLoading}
        isDarkMode={isDarkMode}
      />
      <MainContent isCollapsed={isCollapsed} isDarkMode={isDarkMode} />
    </Box>
  );
};

export default Layout;