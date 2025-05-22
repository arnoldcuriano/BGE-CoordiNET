import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Button, Alert } from '@mui/material';
import axios from 'axios';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(`/auth/verify-email/${token}`);
        setSuccess(response.data.message);
        setTimeout(() => navigate('/login'), 3000);
      } catch (error) {
        setError(error.response?.data?.message || 'Email verification failed');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      p: 3
    }}>
      <Box sx={{
        maxWidth: 500,
        width: '100%',
        p: 4,
        boxShadow: 3,
        borderRadius: 2,
        textAlign: 'center'
      }}>
        <Typography variant="h4" gutterBottom>
          Email Verification
        </Typography>

        {loading && (
          <>
            <CircularProgress sx={{ my: 2 }} />
            <Typography>Verifying your email...</Typography>
          </>
        )}

        {error && (
          <>
            <Alert severity="error" sx={{ my: 2 }}>
              {error}
            </Alert>
            <Button 
              variant="contained" 
              onClick={() => navigate('/login')}
              sx={{ mt: 2 }}
            >
              Go to Login
            </Button>
          </>
        )}

        {success && (
          <Alert severity="success" sx={{ my: 2 }}>
            {success}
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default VerifyEmail;