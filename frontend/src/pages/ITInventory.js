import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '../context/ThemeContext';

const ITInventory = () => {
  const { isDarkMode } = useTheme(); // Removed unused muiTheme

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: isDarkMode
          ? 'linear-gradient(135deg, #1a1a2e 0%, #121212 100%)'
          : 'linear-gradient(135deg, #f7f9fc 0%, #e8ecef 100%)',
        p: 4,
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontFamily: '"Poppins", sans-serif',
          color: isDarkMode ? '#e0e0e0' : '#1a1a2e',
        }}
      >
        IT Inventory
      </Typography>
      <Typography
        variant="body1"
        sx={{
          fontFamily: '"Poppins", sans-serif',
          color: isDarkMode ? '#b0b0b0' : '#666',
        }}
      >
        Manage IT inventory here.
      </Typography>
    </Box>
  );
};

export default ITInventory;