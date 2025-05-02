import React from 'react';
import { Typography, Box } from '@mui/material';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const ProfileSettings = ({ isDarkMode, toggleTheme }) => {
  const { authState } = useAuth();
  const user = authState.isAuthenticated ? {
    role: authState.userRole,
    firstName: authState.firstName,
    lastName: authState.lastName,
    profilePicture: authState.profilePicture,
  } : null;

  return (
    <Layout isDarkMode={isDarkMode} toggleTheme={toggleTheme} user={user}>
      <Box sx={{ mt: 8 }}>
        <Typography variant="h4">Profile Settings</Typography>
        <Typography>Manage your profile settings here.</Typography>
      </Box>
    </Layout>
  );
};

export default ProfileSettings;