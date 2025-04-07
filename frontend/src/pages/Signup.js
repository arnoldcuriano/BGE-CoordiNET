import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Paper,
} from '@mui/material';
import axios from 'axios';

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const { confirmPassword, ...registerData } = formData;

    try {
      const response = await axios.post('http://localhost:5000/auth/register', registerData);
      console.log('User registered:', response.data);
      setSuccess('Registration successful! Awaiting admin approval.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      console.error('Signup error:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Registration failed');
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  console.log('Rendering Signup component');

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)', // Gradient from primary to secondary
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
            Sign Up
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: '#4a4a4a', mb: 3, textAlign: 'center' }} // --text-color
          >
            Your registration will be reviewed by an administrator.
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              margin="normal"
              required
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#4285F4' }, // --primary-color
                  '&:hover fieldset': { borderColor: '#34A853' }, // --secondary-color
                },
              }}
            />
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              margin="normal"
              required
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#4285F4' },
                  '&:hover fieldset': { borderColor: '#34A853' },
                },
              }}
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#4285F4' },
                  '&:hover fieldset': { borderColor: '#34A853' },
                },
              }}
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#4285F4' },
                  '&:hover fieldset': { borderColor: '#34A853' },
                },
              }}
            />
            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              margin="normal"
              required
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#4285F4' },
                  '&:hover fieldset': { borderColor: '#34A853' },
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              sx={{
                mt: 3,
                backgroundColor: '#4285F4', // --primary-color
                '&:hover': { backgroundColor: '#34A853' }, // --secondary-color
                color: '#ffffff',
                fontWeight: 'bold',
                borderRadius: 1,
                py: 1.5,
                width: '100%',
              }}
            >
              Sign Up
            </Button>
          </form>
          <Button
            variant="text"
            onClick={handleBackToLogin}
            sx={{
              mt: 2,
              color: '#4285F4', // --primary-color
              '&:hover': { color: '#34A853' }, // --secondary-color
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

export default Signup;