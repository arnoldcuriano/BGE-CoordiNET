import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  useTheme as useMuiTheme,
  keyframes,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

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

const shake = keyframes`
  0% { transform: translateX(0); }
  20% { transform: translateX(-10px); }
  40% { transform: translateX(10px); }
  60% { transform: translateX(-10px); }
  80% { transform: translateX(10px); }
  100% { transform: translateX(0); }
`;

const ResetPassword = () => {
  const theme = useTheme();
  const muiTheme = useMuiTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { authState } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // Define the greenlight color from branding
  const greenLightColor = '#34A853'; // Solid green for text and borders

  useEffect(() => {
    if (authState.isAuthenticated && window.location.pathname === '/reset-password') {
      console.log('Authenticated user detected, redirecting based on role:', authState.role);
      const redirectPath = authState.role === 'viewer' ? '/welcome' : '/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [authState, navigate]);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('No token provided');
        return;
      }
      try {
        const response = await axios.post('/auth/validate-reset-token', { token });
        if (!response.data.valid) {
          setError('Invalid or expired token');
        }
      } catch (err) {
        setError('Failed to validate token');
      }
    };
    validateToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/auth/reset-password', { token, newPassword: password });
      setMessage(response.data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
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
        background: theme.isDarkMode
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
          : 'linear-gradient(135deg, #e0f7fa 0%, #b3e5fc 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          background: muiTheme.palette.background?.paper || 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: muiTheme.palette.border?.main || 'rgba(0, 0, 0, 0.1)',
          boxShadow: muiTheme.custom?.shadow?.paper || (theme.isDarkMode ? '0 8px 32px rgba(0, 0, 0, 0.5)' : '0 8px 32px rgba(0, 0, 0, 0.1)'),
          width: { xs: '100%', sm: '90%', md: '75%' },
          maxWidth: '450px',
          animation: error ? `${shake} 0.5s ease` : `${fadeIn} 0.8s ease-out`,
        }}
      >
        <Typography
          variant="h4"
          align="center"
          fontWeight="bold"
          gutterBottom
          sx={{
            fontFamily: "'Poppins', sans-serif",
            color: muiTheme.palette.primary?.main || '#4285F4',
          }}
        >
          Reset Password
        </Typography>
        <Typography
          variant="body1"
          align="center"
          sx={{
            fontFamily: "'Poppins', sans-serif",
            color: muiTheme.palette.text?.secondary || '#666',
            mb: 3,
          }}
        >
          Enter your new password
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleTogglePasswordVisibility}
                    edge="end"
                    sx={{
                      color: muiTheme.palette.text?.secondary || '#666',
                      '&:hover': {
                        color: greenLightColor, // Updated hover color
                      },
                    }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                background: muiTheme.palette.background?.listItem || 'rgba(255, 255, 255, 0.5)',
                transition: 'all 0.3s ease',
                '& fieldset': {
                  borderColor: muiTheme.palette.border?.main || 'rgba(0, 0, 0, 0.1)',
                },
                '&:hover fieldset': {
                  borderColor: greenLightColor, // Updated hover border color
                },
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: muiTheme.custom?.shadow?.listItem || (theme.isDarkMode ? '0 4px 15px rgba(0, 0, 0, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.1)'),
                },
                '&.Mui-focused fieldset': {
                  borderColor: greenLightColor, // Updated focused border color
                  boxShadow: `0 0 8px ${greenLightColor}33`, // Updated focused shadow
                },
                '&.Mui-focused': {
                  transform: 'translateY(-2px)',
                  boxShadow: muiTheme.custom?.shadow?.listItem || (theme.isDarkMode ? '0 4px 15px rgba(0, 0, 0, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.1)'),
                },
              },
              '& .MuiInputLabel-root': {
                fontFamily: "'Poppins', sans-serif",
                color: muiTheme.palette.text?.secondary || '#666',
              },
              '& .MuiInputBase-input': {
                fontFamily: "'Poppins', sans-serif",
                color: muiTheme.palette.text?.primary || '#333',
              },
            }}
            disabled={loading}
          />
          <TextField
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            fullWidth
            margin="normal"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleToggleConfirmPasswordVisibility}
                    edge="end"
                    sx={{
                      color: muiTheme.palette.text?.secondary || '#666',
                      '&:hover': {
                        color: greenLightColor, // Updated hover color
                      },
                    }}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                background: muiTheme.palette.background?.listItem || 'rgba(255, 255, 255, 0.5)',
                transition: 'all 0.3s ease',
                '& fieldset': {
                  borderColor: muiTheme.palette.border?.main || 'rgba(0, 0, 0, 0.1)',
                },
                '&:hover fieldset': {
                  borderColor: greenLightColor, // Updated hover border color
                },
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: muiTheme.custom?.shadow?.listItem || (theme.isDarkMode ? '0 4px 15px rgba(0, 0, 0, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.1)'),
                },
                '&.Mui-focused fieldset': {
                  borderColor: greenLightColor, // Updated focused border color
                  boxShadow: `0 0 8px ${greenLightColor}33`, // Updated focused shadow
                },
                '&.Mui-focused': {
                  transform: 'translateY(-2px)',
                  boxShadow: muiTheme.custom?.shadow?.listItem || (theme.isDarkMode ? '0 4px 15px rgba(0, 0, 0, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.1)'),
                },
              },
              '& .MuiInputLabel-root': {
                fontFamily: "'Poppins', sans-serif",
                color: muiTheme.palette.text?.secondary || '#666',
              },
              '& .MuiInputBase-input': {
                fontFamily: "'Poppins', sans-serif",
                color: muiTheme.palette.text?.primary || '#333',
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
          <Button
            variant="outlined"
            fullWidth
            onClick={handleBackToLogin}
            sx={{
              mt: 2,
              color: muiTheme.palette.text?.secondary || '#666',
              borderColor: muiTheme.palette.border?.main || 'rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              py: 1.5,
              transition: 'transform 0.2s, box-shadow 0.3s',
              '&:hover': {
                borderColor: greenLightColor, // Updated hover border color
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                transform: 'scale(1.02)',
              },
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            Back to Login
          </Button>
        </form>
        {message && (
          <Typography
            variant="body2"
            align="center"
            sx={{
              mt: 2,
              color: muiTheme.palette.success?.main || '#4caf50',
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            {message}
          </Typography>
        )}
        {error && (
          <Typography
            variant="body2"
            align="center"
            sx={{
              mt: 2,
              color: muiTheme.palette.error?.main || '#f44336',
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            {error}
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default ResetPassword;