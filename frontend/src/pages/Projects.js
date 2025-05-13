import React from 'react';
import { Box, Typography, useTheme as useMuiTheme } from '@mui/material';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';

const ProfileSettings = () => {
  const muiTheme = useMuiTheme();
  const { isDarkMode } = useTheme();
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
    <Layout user={user}>
      <Box
        sx={{
          minHeight: '100vh',
          background: isDarkMode
            ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
            : 'linear-gradient(135deg, #e0f7fa 0%, #b3e5fc 100%)',
          p: 2,
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            fontFamily: '"Poppins", sans-serif',
            color: isDarkMode ? '#ffffff' : '#1976d2',
          }}
        >
          Profile Settings
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Poppins", sans-serif',
            color: isDarkMode ? '#cccccc' : '#666666',
          }}
        >
          Manage your profile settings here.
        </Typography>
      </Box>
    </Layout>
  );
};

export default ProfileSettings;