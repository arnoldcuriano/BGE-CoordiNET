import React from 'react';
import { Box, Typography } from '@mui/material'; // Removed unused Button import
import { useTheme } from '../context/ThemeContext';

const AccountSettings = () => {
  const { muiTheme } = useTheme(); 

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: muiTheme.custom.gradients.backgroundDefault,
        p: 4,
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontFamily: muiTheme.typography.fontFamily,
          color: muiTheme.palette.primary.main,
        }}
      >
        Account Settings
      </Typography>
      <Typography
        variant="body1"
        sx={{
          fontFamily: muiTheme.typography.fontFamily,
          color: muiTheme.palette.text.secondary,
        }}
      >
        Manage your account settings here.
      </Typography>
      {/* Add more account settings UI as needed */}
    </Box>
  );
};

export default AccountSettings;