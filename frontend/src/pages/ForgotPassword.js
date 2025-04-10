import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Added for "Back to Login"
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Alert,
} from '@mui/material';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/auth/forgot-password', { email });
      setMessage(response.data.message);
      setError('');
      setTimeout(() => navigate('/login'), 2000); // Redirect after success
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send reset link');
      setMessage('');
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)', // Gradient background
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 2,
            backgroundColor: '#ffffff', // --background-color
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // --card-shadow
          }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{ color: '#4285F4', fontWeight: 'bold', textAlign: 'center' }} // --primary-color
          >
            Forgot Password
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: '#4a4a4a', mb: 3, textAlign: 'center' }} // --text-color
          >
            Enter your email to receive a password reset link.
          </Typography>
          {message && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#4285F4' }, // --primary-color
                  '&:hover fieldset': { borderColor: '--secondary-color' }, // --secondary-color
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              sx={{
                mt: 3,
                backgroundColor: '#4285F4', // --primary-color
                '&:hover': { backgroundColor: '--secondary-color' }, // --secondary-color
                color: '#ffffff',
                fontWeight: 'bold',
                borderRadius: 1,
                py: 1.5,
                width: '100%',
              }}
            >
              Send Reset Link
            </Button>
          </form>
          <Button
            variant="text"
            onClick={handleBackToLogin}
            sx={{
              mt: 2,
              color: '--primary-color', // --primary-color
              '&:hover': { color: '--secondary-color' }, // --secondary-color
              width: '100%',
            }}
          >
            Back to Login
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPassword;