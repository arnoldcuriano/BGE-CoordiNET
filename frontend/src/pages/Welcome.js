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
      <Box sx={{ mt: 8, p: 2 }}>
        <Typography variant="h4">Welcome</Typography>
        <Typography>The Admin is preparing your access.</Typography>
      </Box>
    </Layout>
  );
};

export default Welcome;