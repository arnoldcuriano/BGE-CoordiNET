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
    setIsCollapsed(!isCollapsed);
    console.log('Layout - isCollapsed:', isCollapsed); // Debugging
  };

  // Toggle mobile drawer
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        handleDrawerToggle={handleDrawerToggle}
        user={user}
        handleLogout={handleLogout}
        logoutLoading={logoutLoading}
        isCollapsed={isCollapsed} // Pass isCollapsed to Navbar
      />
      <Sidebar
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
        isCollapsed={isCollapsed} // Pass isCollapsed to Sidebar
        toggleCollapse={toggleCollapse}
        user={user}
        handleLogout={handleLogout}
        logoutLoading={logoutLoading}
      />
      <MainContent isCollapsed={isCollapsed} /> {/* Pass isCollapsed to MainContent */}
    </Box>
  );
};

export default Layout;