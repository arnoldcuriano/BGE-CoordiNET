import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NoAccess = ({ isDarkMode, toggleTheme }) => {
  const navigate = useNavigate();
  const { handleLogout } = useAuth();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: isDarkMode
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
          : 'linear-gradient(135deg, #e0f7fa 0%, #b3e5fc 100%)',
        p: 3,
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontFamily: '"Poppins", sans-serif',
          fontWeight: 'bold',
          color: isDarkMode ? '#ffffff' : '#1976d2',
          mb: 2,
        }}
      >
        Access Denied
      </Typography>
      <Typography
        variant="body1"
        sx={{
          fontFamily: '"Poppins", sans-serif',
          color: isDarkMode ? '#cccccc' : '#666666',
          mb: 3,
        }}
      >
        You do not have access to this page. Please contact an administrator.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={() => navigate('/login')}
          sx={{
            fontFamily: '"Poppins", sans-serif',
            background: 'linear-gradient(90deg, #4285F4, #34A853)',
            color: '#ffffff',
            borderRadius: '8px',
            '&:hover': {
              background: 'linear-gradient(90deg, #34A853, #4285F4)',
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3)',
            },
          }}
        >
          Go to Login
        </Button>
        <Button
          variant="outlined"
          onClick={() => handleLogout(navigate)}
          sx={{
            fontFamily: '"Poppins", sans-serif',
            color: isDarkMode ? '#ffffff' : '#1976d2',
            borderColor: isDarkMode ? '#ffffff' : '#1976d2',
            borderRadius: '8px',
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );
};

export default NoAccess;