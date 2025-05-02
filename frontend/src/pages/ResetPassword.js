import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Switch,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff, DarkMode, LightMode } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const ResetPassword = ({ isDarkMode, toggleTheme }) => {
  const theme = useTheme();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  // Debugging: Log when the component renders and the token value
  console.log('ResetPassword.js: Rendering ResetPassword component');
  console.log('ResetPassword.js: Token from URL:', token);
  console.log('ResetPassword.js: isDarkMode:', isDarkMode);

  useEffect(() => {
    if (!token) {
      setMessage('Invalid or missing reset token');
      console.log('ResetPassword.js: No token found, setting error message');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      console.log('ResetPassword.js: Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setMessage('Password must be at least 8 characters long');
      console.log('ResetPassword.js: Password too short');
      return;
    }

    setLoading(true);
    console.log('ResetPassword.js: Submitting reset password request with token:', token);
    try {
      const { data } = await axios.post(
        'http://localhost:5000/auth/reset-password',
        { token, newPassword },
        { withCredentials: true }
      );
      setMessage(data.message);
      console.log('ResetPassword.js: Reset password successful, message:', data.message);
      setTimeout(() => {
        console.log('ResetPassword.js: Redirecting to /login');
        navigate('/login');
      }, 3000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error resetting password';
      setMessage(errorMessage);
      console.log('ResetPassword.js: Error resetting password:', errorMessage, error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNewPasswordVisibility = () => {
    setShowNewPassword((prev) => !prev);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'var(--background-color)',
        position: 'relative',
        overflow: 'hidden',
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
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 2,
        }}
      >
        <Switch
          checked={isDarkMode}
          onChange={toggleTheme}
          icon={<LightMode sx={{ color: '#ffb300' }} />}
          checkedIcon={<DarkMode sx={{ color: 'var(--primary-color)' }} />}
        />
      </Box>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: { xs: '20px', sm: '40px' },
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            width: { xs: '100%', sm: '90%', md: '75%' },
            maxWidth: '450px',
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            background: 'var(--card-background)',
            backdropFilter: 'blur(10px)',
            border: 'var(--list-item-border)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <Typography
            variant="h4"
            align="center"
            fontWeight="bold"
            gutterBottom
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: 'var(--primary-color)',
            }}
          >
            Reset Password
          </Typography>
          <Typography
            variant="body1"
            align="center"
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: 'var(--secondary-text-color)',
              mb: 3,
            }}
          >
            Enter your new password
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              margin="normal"
              required
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleToggleNewPasswordVisibility}
                      edge="end"
                      sx={{ color: 'var(--secondary-text-color)' }}
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  background: theme.palette.background?.listItem || 'rgba(255, 255, 255, 0.5)',
                  transition: 'all 0.3s ease',
                  '& fieldset': {
                    borderColor: theme.palette.border?.main || 'rgba(0, 0, 0, 0.1)',
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.secondary?.main || '#34A853',
                  },
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.custom?.shadow?.listItem || (isDarkMode ? '0 4px 15px rgba(0, 0, 0, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.1)'),
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.secondary?.main || '#34A853',
                    boxShadow: `0 0 8px ${theme.palette.secondary?.main || '#34A853'}33`,
                  },
                  '&.Mui-focused': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.custom?.shadow?.listItem || (isDarkMode ? '0 4px 15px rgba(0, 0, 0, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.1)'),
                  },
                },
                '& .MuiInputLabel-root': {
                  fontFamily: "'Poppins', sans-serif",
                  color: 'var(--secondary-text-color)',
                },
                '& .MuiInputBase-input': {
                  fontFamily: "'Poppins', sans-serif",
                  color: 'var(--text-color)',
                },
              }}
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              required
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleToggleConfirmPasswordVisibility}
                      edge="end"
                      sx={{ color: 'var(--secondary-text-color)' }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  background: theme.palette.background?.listItem || 'rgba(255, 255, 255, 0.5)',
                  transition: 'all 0.3s ease',
                  '& fieldset': {
                    borderColor: theme.palette.border?.main || 'rgba(0, 0, 0, 0.1)',
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.secondary?.main || '#34A853',
                  },
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.custom?.shadow?.listItem || (isDarkMode ? '0 4px 15px rgba(0, 0, 0, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.1)'),
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.secondary?.main || '#34A853',
                    boxShadow: `0 0 8px ${theme.palette.secondary?.main || '#34A853'}33`,
                  },
                  '&.Mui-focused': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.custom?.shadow?.listItem || (isDarkMode ? '0 4px 15px rgba(0, 0, 0, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.1)'),
                  },
                },
                '& .MuiInputLabel-root': {
                  fontFamily: "'Poppins', sans-serif",
                  color: 'var(--secondary-text-color)',
                },
                '& .MuiInputBase-input': {
                  fontFamily: "'Poppins', sans-serif",
                  color: 'var(--text-color)',
                },
              }}
              disabled={loading}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                mt: 3,
                background: 'linear-gradient(90deg, #4285F4, #34A853)',
                color: '#ffffff',
                fontWeight: 'bold',
                borderRadius: '8px',
                py: 1.5,
                mb: 2,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.2s, box-shadow 0.3s',
                '&:hover': {
                  background: 'linear-gradient(90deg, #34A853, #4285F4)',
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3)',
                  transform: 'scale(1.02)',
                },
                '&:disabled': {
                  background: 'linear-gradient(90deg, #4285F4, #34A853)',
                  opacity: 0.6,
                },
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
            </Button>
          </form>
          {message && (
            <Typography
              variant="body2"
              align="center"
              sx={{
                mt: 2,
                color: message.includes('successfully') ? 'var(--secondary-color)' : '#d32f2f',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {message}
            </Typography>
          )}
          <Button
            onClick={() => navigate('/login')}
            sx={{
              mt: 2,
              color: 'var(--primary-color)',
              fontFamily: "'Poppins', sans-serif",
              '&:hover': { color: 'var(--secondary-color)' },
            }}
          >
            Back to Login
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ResetPassword;