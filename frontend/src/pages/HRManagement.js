import React from 'react';
import { Typography, Box } from '@mui/material';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const HRManagement = ({ isDarkMode, toggleTheme }) => {
  const { authState } = useAuth();
  const user = authState.isAuthenticated
    ? {
        role: authState.userRole,
        firstName: authState.firstName,
        lastName: authState.lastName,
        profilePicture: authState.profilePicture,
      }
    : null;

  return (
    <Layout isDarkMode={isDarkMode} toggleTheme={toggleTheme} user={user}>
      <Box sx={{ mt: 8, p: 2 }}>
        <Typography variant="h4" sx={{ fontFamily: '"Poppins", sans-serif' }}>HR Management</Typography>
        <Typography sx={{ fontFamily: '"Poppins", sans-serif' }}>Coming soon...</Typography>
      </Box>
    </Layout>
  );
};

export default HRManagement;