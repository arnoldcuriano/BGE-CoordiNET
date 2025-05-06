import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  useTheme as useMuiTheme,
  keyframes,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme'; // Custom hook for ThemeContext

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

const Signup = () => {
  const theme = useTheme();
  const muiTheme = useMuiTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { authState } = useAuth();

  useEffect(() => {
    if (authState.isAuthenticated && window.location.pathname === '/signup') {
      console.log('Authenticated user detected, redirecting based on role:', authState.userRole);
      const redirectPath = authState.userRole === 'viewer' ? '/welcome' : '/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [authState, navigate]);

  const validatePassword = (pwd) => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(pwd);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setLoading(true);

    // Validate password strength
    if (!validatePassword(password)) {
      setPasswordError('Your password must be at least 8 characters long and include Symbols (!@#$%^&)"**');
      setLoading(false);
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/auth/register', {
        firstName,
        lastName,
        email,
        password,
      });
      setMessage(response.data.message);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const handleClickShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleClickShowConfirmPassword = () => {
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
          animation: (error || passwordError || confirmPasswordError) ? `${shake} 0.5s ease` : `${fadeIn} 0.8s ease-out`,
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
          Sign Up
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
          Create a new account
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="First Name"
            fullWidth
            margin="normal"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                background: muiTheme.palette.background?.listItem || 'rgba(255, 255, 255, 0.5)',
                transition: 'all 0.3s ease',
                '& fieldset': {
                  borderColor: muiTheme.palette.border?.main || 'rgba(0, 0, 0, 0.1)',
                },
                '&:hover fieldset': {
                  borderColor: muiTheme.palette.secondary?.main || '#34A853',
                },
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: muiTheme.custom?.shadow?.listItem || (theme.isDarkMode ? '0 4px 15px rgba(0, 0, 0, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.1)'),
                },
                '&.Mui-focused fieldset': {
                  borderColor: muiTheme.palette.secondary?.main || '#34A853',
                  boxShadow: `0 0 8px ${muiTheme.palette.secondary?.main || '#34A853'}33`,
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
            label="Last Name"
            fullWidth
            margin="normal"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                background: muiTheme.palette.background?.listItem || 'rgba(255, 255, 255, 0.5)',
                transition: 'all 0.3s ease',
                '& fieldset': {
                  borderColor: muiTheme.palette.border?.main || 'rgba(0, 0, 0, 0.1)',
                },
                '&:hover fieldset': {
                  borderColor: muiTheme.palette.secondary?.main || '#34A853',
                },
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: muiTheme.custom?.shadow?.listItem || (theme.isDarkMode ? '0 4px 15px rgba(0, 0, 0, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.1)'),
                },
                '&.Mui-focused fieldset': {
                  borderColor: muiTheme.palette.secondary?.main || '#34A853',
                  boxShadow: `0 0 8px ${muiTheme.palette.secondary?.main || '#34A853'}33`,
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
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                background: muiTheme.palette.background?.listItem || 'rgba(255, 255, 255, 0.5)',
                transition: 'all 0.3s ease',
                '& fieldset': {
                  borderColor: muiTheme.palette.border?.main || 'rgba(0, 0, 0, 0.1)',
                },
                '&:hover fieldset': {
                  borderColor: muiTheme.palette.secondary?.main || '#34A853',
                },
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: muiTheme.custom?.shadow?.listItem || (theme.isDarkMode ? '0 4px 15px rgba(0, 0, 0, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.1)'),
                },
                '&.Mui-focused fieldset': {
                  borderColor: muiTheme.palette.secondary?.main || '#34A853',
                  boxShadow: `0 0 8px ${muiTheme.palette.secondary?.main || '#34A853'}33`,
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
            label="Password"
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
                    onClick={handleClickShowPassword}
                    edge="end"
                    sx={{ color: muiTheme.palette.text?.secondary || '#666' }}
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
                  borderColor: muiTheme.palette.secondary?.main || '#34A853',
                },
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: muiTheme.custom?.shadow?.listItem || (theme.isDarkMode ? '0 4px 15px rgba(0, 0, 0, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.1)'),
                },
                '&.Mui-focused fieldset': {
                  borderColor: muiTheme.palette.secondary?.main || '#34A853',
                  boxShadow: `0 0 8px ${muiTheme.palette.secondary?.main || '#34A853'}33`,
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
          {passwordError && (
            <Typography
              variant="body2"
              align="center"
              sx={{
                mt: 1,
                color: muiTheme.palette.error?.main || '#f44336',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {passwordError}
            </Typography>
          )}
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
                    onClick={handleClickShowConfirmPassword}
                    edge="end"
                    sx={{ color: muiTheme.palette.text?.secondary || '#666' }}
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
                  borderColor: muiTheme.palette.secondary?.main || '#34A853',
                },
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: muiTheme.custom?.shadow?.listItem || (theme.isDarkMode ? '0 4px 15px rgba(0, 0, 0, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.1)'),
                },
                '&.Mui-focused fieldset': {
                  borderColor: muiTheme.palette.secondary?.main || '#34A853',
                  boxShadow: `0 0 8px ${muiTheme.palette.secondary?.main || '#34A853'}33`,
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
          {confirmPasswordError && (
            <Typography
              variant="body2"
              align="center"
              sx={{
                mt: 1,
                color: muiTheme.palette.error?.main || '#f44336',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {confirmPasswordError}
            </Typography>
          )}
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
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
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
                borderColor: muiTheme.palette.secondary?.main || '#34A853',
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

export default Signup;