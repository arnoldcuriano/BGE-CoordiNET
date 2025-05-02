import React, { useState } from 'react';
import { Box, Toolbar, Typography, useTheme } from '@mui/material';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const Dashboard = ({ isDarkMode, toggleTheme, isCollapsed, toggleCollapse, handleLogout }) => {
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const backgroundGradient = theme.custom?.gradients?.backgroundDefault || (
    isDarkMode
      ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
      : 'linear-gradient(135deg, #e0f7fa 0%, #b3e5fc 100%)'
  );

  return (
    <Box
      sx={{
        display: 'flex',
        background: backgroundGradient,
        minHeight: '100vh',
      }}
    >
      <Navbar
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        handleDrawerToggle={handleDrawerToggle}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
        handleLogout={handleLogout}
      />
      <Sidebar
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
        isCollapsed={isCollapsed}
        isDarkMode={isDarkMode}
        toggleCollapse={toggleCollapse}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <Toolbar />
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              background: theme.palette.background.listItem,
              boxShadow: theme.custom?.shadow?.paper,
              flex: '1 1 300px',
            }}
          >
            <Typography variant="h6">Total Members</Typography>
            <Typography variant="h4" sx={{ mt: 1, color: theme.palette.primary.main }}>
              42
            </Typography>
          </Box>
          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              background: theme.palette.background.listItem,
              boxShadow: theme.custom?.shadow?.paper,
              flex: '1 1 300px',
            }}
          >
            <Typography variant="h6">Pending Approvals</Typography>
            <Typography variant="h4" sx={{ mt: 1, color: theme.palette.primary.main }}>
              5
            </Typography>
          </Box>
          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              background: theme.palette.background.listItem,
              boxShadow: theme.custom?.shadow?.paper,
              flex: '1 1 300px',
            }}
          >
            <Typography variant="h6">Recent Activity</Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              Last login: 5 minutes ago
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;