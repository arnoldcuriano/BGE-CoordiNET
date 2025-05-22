import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Box, Typography, TextField, Button, Alert, keyframes } from '@mui/material';
import Layout from '../components/Layout';

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

const AccountSettings = () => {
  const { isDarkMode, muiTheme } = useTheme();
  const { authState, fetchUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (authState.loading) {
      return;
    }
    if (!authState.isAuthenticated) {
      navigate('/login');
    } else if (authState.user) {
      setEmail(authState.user.email || '');
    }
  }, [authState, navigate]);

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await axios.post('/auth/update-email', {
        email,
      }, { withCredentials: true });
      await fetchUser();
      setSuccess('Email updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update email');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await axios.post('/auth/update-password', {
        currentPassword,
        newPassword,
      }, { withCredentials: true });
      setSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await axios.post('/auth/delete-account', {}, {
        withCredentials: true,
      });
      setSuccess('Account deleted successfully');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account');
    }
  };

  if (authState.loading) {
    return (
      <Layout>
        <Typography
          sx={{
            fontFamily: "'Poppins', sans-serif",
            color: muiTheme.palette.text.secondary,
            textAlign: 'center',
            mt: 8,
          }}
        >
          Loading...
        </Typography>
      </Layout>
    );
  }

  if (!authState.isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <Box
        sx={{
          minHeight: '100vh',
          background: muiTheme.custom.gradients.backgroundDefault,
          p: { xs: 2, sm: 3, md: 4 },
          position: 'relative',
          overflow: 'hidden',
          animation: `${fadeIn} 0.8s ease-out`,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: isDarkMode
              ? 'radial-gradient(circle at 30% 30%, rgba(66, 133, 244, 0.2) 0%, transparent 70%)'
              : 'radial-gradient(circle at 30% 30%, rgba(52, 168, 83, 0.2) 0%, transparent 70%)',
            zIndex: 0,
          }}
        />
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
            backdropFilter: isDarkMode ? 'blur(10px)' : 'blur(15px)',
            borderRadius: '16px',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
            padding: { xs: '20px', sm: '30px' },
            mt: { xs: 2, sm: 3 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography
            component="h1"
            variant="h5"
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: muiTheme.palette.primary.main,
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            Account Settings
          </Typography>
          {error && (
            <Alert
              severity="error"
              sx={{
                mt: 2,
                width: '100%',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {error}
            </Alert>
          )}
          {success && (
            <Alert
              severity="success"
              sx={{
                mt: 2,
                width: '100%',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {success}
            </Alert>
          )}
          <Box component="form" onSubmit={handleEmailChange} sx={{ mt: 1, width: '100%' }}>
            <Typography
              variant="h6"
              sx={{
                fontFamily: "'Poppins', sans-serif",
                color: muiTheme.palette.primary.main,
                fontWeight: 'bold',
              }}
            >
              Change Email
            </Typography>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="New Email Address"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputLabelProps={{
                style: {
                  fontFamily: "'Poppins', sans-serif",
                  color: muiTheme.palette.text.secondary,
                },
              }}
              InputProps={{
                style: {
                  fontFamily: "'Poppins', sans-serif",
                  color: muiTheme.palette.text.primary,
                },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 2,
                mb: 2,
                background: 'linear-gradient(90deg, #4285F4, #34A853)',
                color: '#ffffff',
                fontWeight: 'bold',
                borderRadius: '8px',
                py: 1.5,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.2s, box-shadow 0.3s',
                '&:hover': {
                  background: 'linear-gradient(90deg, #34A853, #4285F4)',
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3)',
                  transform: 'scale(1.02)',
                },
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Update Email
            </Button>
          </Box>
          <Box component="form" onSubmit={handlePasswordChange} sx={{ mt: 3, width: '100%' }}>
            <Typography
              variant="h6"
              sx={{
                fontFamily: "'Poppins', sans-serif",
                color: muiTheme.palette.primary.main,
                fontWeight: 'bold',
              }}
            >
              Change Password
            </Typography>
            <TextField
              margin="normal"
              required
              fullWidth
              name="currentPassword"
              label="Current Password"
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              InputLabelProps={{
                style: {
                  fontFamily: "'Poppins', sans-serif",
                  color: muiTheme.palette.text.secondary,
                },
              }}
              InputProps={{
                style: {
                  fontFamily: "'Poppins', sans-serif",
                  color: muiTheme.palette.text.primary,
                },
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="newPassword"
              label="New Password"
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              InputLabelProps={{
                style: {
                  fontFamily: "'Poppins', sans-serif",
                  color: muiTheme.palette.text.secondary,
                },
              }}
              InputProps={{
                style: {
                  fontFamily: "'Poppins', sans-serif",
                  color: muiTheme.palette.text.primary,
                },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 2,
                mb: 2,
                background: 'linear-gradient(90deg, #4285F4, #34A853)',
                color: '#ffffff',
                fontWeight: 'bold',
                borderRadius: '8px',
                py: 1.5,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.2s, box-shadow 0.3s',
                '&:hover': {
                  background: 'linear-gradient(90deg, #34A853, #4285F4)',
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3)',
                  transform: 'scale(1.02)',
                },
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Update Password
            </Button>
          </Box>
          <Box sx={{ mt: 3, width: '100%' }}>
            <Typography
              variant="h6"
              sx={{
                fontFamily: "'Poppins', sans-serif",
                color: muiTheme.palette.primary.main,
                fontWeight: 'bold',
              }}
            >
              Delete Account
            </Typography>
            <Button
              fullWidth
              variant="contained"
              color="error"
              onClick={handleDeleteAccount}
              sx={{
                mt: 2,
                borderRadius: '8px',
                py: 1.5,
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Delete Account
            </Button>
          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

export default AccountSettings;