import React from 'react';
import { Typography, Box } from '@mui/material';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme'; // Custom hook for ThemeContext


const Members = ({ isDarkMode, toggleTheme }) => {
  const { authState } = useAuth();
  
  const user = authState.isAuthenticated
    ? {
        role: authState.role, // Updated from userRole to role
        firstName: authState.firstName,
        lastName: authState.lastName,
        profilePicture: authState.profilePicture,
      }
    : null;

  return (
    <Layout isDarkMode={isDarkMode} toggleTheme={toggleTheme} user={user}>
      <Box sx={{ mt: 8, p: 2 }}>
        <Typography variant="h4">Members</Typography>
        <Typography>Coming soon...</Typography>
      </Box>
    </Layout>
  );
};

export default Members;