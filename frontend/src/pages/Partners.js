import React, { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Typography, Box, keyframes } from '@mui/material';
import Layout from '../components/Layout';

// Define animations (same as Dashboard.js)
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

const Partners = () => {
  const { isDarkMode, muiTheme } = useTheme();
  const { authState } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authState.isAuthenticated) {
      navigate('/login');
    }
  }, [authState, navigate]);

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
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: muiTheme.palette.primary.main,
              fontWeight: 'bold',
            }}
          >
            Partners
          </Typography>
          <Typography
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: muiTheme.palette.text.secondary,
            }}
          >
            Content Here
          </Typography>
        </Box>
      </Box>
    </Layout>
  );
};

export default Partners;