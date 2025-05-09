import React from 'react';
import { Typography, Box } from '@mui/material';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const Welcome = ({ isDarkMode, toggleTheme }) => {
  const { authState } = useAuth();
  const user = authState.isAuthenticated
    ? {
        role: authState.userRole,
        firstName: authState.firstName,
        lastName: authState.lastName,
        profilePicture: authState.profilePicture,
        isApproved: authState.isApproved || false,
      }
    : null;

  console.log('Welcome.js: User object:', user);

  return (
    <Layout isDarkMode={isDarkMode} toggleTheme={toggleTheme} user={user}>
      <Box sx={{ mt: 8, p: 2, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {user?.firstName || 'User'}!
        </Typography>
        <Typography variant="body1" sx={{ maxWidth: '600px', mx: 'auto', color: isDarkMode ? '#ccc' : '#666' }}>
          Your account has been approved, but access to specific features is still being prepared by the admin. Please check back later or contact support for assistance.
        </Typography>
      </Box>
    </Layout>
  );
};

export default Welcome;
