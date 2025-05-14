import React from 'react';
import { Box, Typography, Button, Grid, Paper, Divider } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { keyframes } from '@mui/system';
import { AccountCircle, Help, Description, Settings } from '@mui/icons-material';
import { Link as MuiLink } from '@mui/material';

// Define animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const Welcome = () => {
  const { isDarkMode, muiTheme } = useTheme();
  const { authState, handleLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine the message based on user status
  const message = location.state?.message || (authState.isApproved
    ? 'You currently have access only to basic features. Please wait for the Super Admin to grant you access to core system pages.'
    : 'Your account is awaiting approval.');

  const user = authState.isAuthenticated
    ? {
        role: authState.userRole,
        firstName: authState.firstName,
        lastName: authState.lastName,
        profilePicture: authState.profilePicture,
        isApproved: authState.isApproved || false,
      }
    : null;

  const handleLogoutClick = async () => {
    const success = await handleLogout(navigate);
    if (success) {
      navigate('/login');
    }
  };

  return (
    <Box
      key={isDarkMode ? 'dark' : 'light'}
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: isDarkMode
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
          : 'linear-gradient(135deg, #e0f7fa 0%, #b3e5fc 100%)',
        position: 'relative',
        overflow: 'hidden',
        p: 3,
      }}
    >
      {/* Background Decorative Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: isDarkMode
            ? 'radial-gradient(circle at 20% 20%, rgba(66, 133, 244, 0.2) 0%, transparent 70%)'
            : 'radial-gradient(circle at 20% 20%, rgba(52, 168, 83, 0.2) 0%, transparent 70%)',
          zIndex: 0,
        }}
      />

      {/* Main Content */}
      <Paper
        elevation={3}
        sx={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '800px',
          width: '90%',
          p: { xs: 3, sm: 5 },
          borderRadius: '16px',
          background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${muiTheme?.palette?.border?.main}`,
          boxShadow: muiTheme?.custom?.shadow?.paper,
          animation: `${fadeIn} 1s ease-out`,
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h3"
          sx={{
            fontFamily: '"Poppins", sans-serif',
            fontWeight: 'bold',
            color: isDarkMode ? '#ffffff' : '#1976d2',
            mb: 2,
            animation: `${pulse} 2s infinite`,
          }}
        >
          Hello, {user?.firstName || 'User'}! 🎉
        </Typography>

        <Typography
          variant="h6"
          sx={{
            fontFamily: '"Poppins", sans-serif',
            color: isDarkMode ? '#cccccc' : '#666666',
            mb: 3,
          }}
        >
          Welcome to BGE CoordiNET
        </Typography>

        <Typography
          variant="body1"
          sx={{
            fontFamily: '"Poppins", sans-serif',
            color: isDarkMode ? '#bbbbbb' : '#555555',
            mb: 4,
            maxWidth: '600px',
            mx: 'auto',
          }}
        >
          {message} You can explore your account settings or get help while you wait.
        </Typography>

        <Divider sx={{ my: 3, borderColor: muiTheme?.palette?.border?.main }} />

        {/* Navigation Options */}
        <Grid container spacing={2} justifyContent="center">
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              startIcon={<AccountCircle />}
              onClick={() => navigate('/profile-settings')}
              sx={{
                fontFamily: '"Poppins", sans-serif',
                color: isDarkMode ? '#ffffff' : '#1976d2',
                borderColor: isDarkMode ? '#ffffff' : '#1976d2',
                borderRadius: '8px',
                width: '100%',
                py: 1,
                '&:hover': {
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(25, 118, 210, 0.1)',
                },
              }}
            >
              Profile Settings
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              startIcon={<Settings />}
              onClick={() => navigate('/account-settings')}
              sx={{
                fontFamily: '"Poppins", sans-serif',
                color: isDarkMode ? '#ffffff' : '#1976d2',
                borderColor: isDarkMode ? '#ffffff' : '#1976d2',
                borderRadius: '8px',
                width: '100%',
                py: 1,
                '&:hover': {
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(25, 118, 210, 0.1)',
                },
              }}
            >
              Account Settings
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              startIcon={<Help />}
              onClick={() => navigate('/help')}
              sx={{
                fontFamily: '"Poppins", sans-serif',
                color: isDarkMode ? '#ffffff' : '#1976d2',
                borderColor: isDarkMode ? '#ffffff' : '#1976d2',
                borderRadius: '8px',
                width: '100%',
                py: 1,
                '&:hover': {
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(25, 118, 210, 0.1)',
                },
              }}
            >
              Help
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              startIcon={<Description />}
              onClick={() => navigate('/patch-notes')}
              sx={{
                fontFamily: '"Poppins", sans-serif',
                color: isDarkMode ? '#ffffff' : '#1976d2',
                borderColor: isDarkMode ? '#ffffff' : '#1976d2',
                borderRadius: '8px',
                width: '100%',
                py: 1,
                '&:hover': {
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(25, 118, 210, 0.1)',
                },
              }}
            >
              Patch Notes
            </Button>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, borderColor: muiTheme?.palette?.border?.main }} />

        {/* Logout or Login Button */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          {authState.isAuthenticated ? (
            <Button
              variant="contained"
              onClick={handleLogoutClick}
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
              Logout
            </Button>
          ) : (
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
          )}
        </Box>

        {/* Contact Support Link */}
        <Typography
          variant="body2"
          sx={{
            mt: 3,
            fontFamily: '"Poppins", sans-serif',
            color: isDarkMode ? '#bbbbbb' : '#555555',
          }}
        >
          Need assistance?{' '}
          <MuiLink
            href="mailto:support@beglobalecommercecorp.com"
            sx={{
              fontFamily: '"Poppins", sans-serif',
              color: muiTheme?.palette?.primary?.main,
              textDecoration: 'none',
              '&:hover': { color: muiTheme?.palette?.secondary?.main },
            }}
          >
            Contact Support
          </MuiLink>
        </Typography>
      </Paper>
    </Box>
  );
};

export default Welcome;