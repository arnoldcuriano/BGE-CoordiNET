import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Typography,
  TextField,
  Button,
  Link as MuiLink,
  Box,
  Divider,
  CircularProgress,
  Paper,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { Public, Settings, ConfirmationNumber } from '@mui/icons-material';
import axios from 'axios';

const Login = ({ setUser, isDarkMode, toggleTheme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const checkAuthAfterRedirect = async () => {
      const loginSuccess = searchParams.get('loginSuccess');
      if (loginSuccess) {
        try {
          setGoogleLoading(true);
          await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate delay
          const response = await axios.get('http://localhost:5000/auth/user', { withCredentials: true });
          if (response.data) {
            setUser(response.data);
            localStorage.setItem('isAuthenticated', 'true');
            navigate('/dashboard', { replace: true });
          }
        } catch (error) {
          console.error('Post-auth verification failed:', error);
        } finally {
          setGoogleLoading(false);
        }
      }
    };
    checkAuthAfterRedirect();
  }, [searchParams, navigate, setUser]);

  useEffect(() => {
    const checkInitialAuth = async () => {
      const authState = localStorage.getItem('isAuthenticated');
      if (authState === 'true') {
        try {
          const response = await axios.get('http://localhost:5000/auth/user', { withCredentials: true });
          if (response.data) {
            setUser(response.data);
            navigate('/dashboard', { replace: true });
          }
        } catch (error) {
          localStorage.removeItem('isAuthenticated');
        }
      }
    };
    checkInitialAuth();
  }, [navigate, setUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/auth/login', { email, password }, { withCredentials: true });
      // Fetch user data and update state before navigating
      const response = await axios.get('http://localhost:5000/auth/user', { withCredentials: true });
      if (response.data) {
        setUser(response.data);
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    window.location.replace('http://localhost:5000/auth/google');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        background: 'linear-gradient(to right, #34A853, #4285F4)',
        flexDirection: { xs: 'column', sm: 'row' },
      }}
    >
      {/* Left Panel */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          padding: { xs: '30px 15px', sm: '40px 20px', md: '60px 40px' },
          textAlign: 'center',
          order: { xs: 2, sm: 1 },
        }}
      >
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Welcome Back!
        </Typography>
        <Box sx={{ width: { xs: '90%', sm: '85%', md: '75%' }, marginTop: '30px' }}>
          {[
            {
              icon: <Public sx={{ fontSize: 50, color: '#ffffff' }} />,
              title: 'Visit our Main Website',
              link: 'https://beglobalecommercecorp.com/',
              text: 'Explore more about us and stay updated.',
            },
            {
              icon: <Settings sx={{ fontSize: 50, color: '#ffffff' }} />,
              title: 'Login to GreatDay Account',
              link: 'https://app.greatdayhr.com/',
              text: 'Manage your GreatDay profile and tasks.',
            },
            {
              icon: <ConfirmationNumber sx={{ fontSize: 50, color: '#ffffff' }} />,
              title: 'Need Support?',
              link: 'mailto:arnoldcuriano84@gmail.com',
              text: 'Contact our support team for assistance.',
            },
          ].map((item, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: { xs: '16px', sm: '24px' },
                marginBottom: '20px',
                transition: '0.3s',
                '&:hover': { boxShadow: '0 4px 15px rgba(0,0,0,0.3)', transform: 'translateY(-5px)' },
              }}
            >
              {item.icon}
              <Box sx={{ flexGrow: 1, marginLeft: { xs: '12px', sm: '16px' } }}>
                <Typography variant="h5" sx={{ textDecoration: 'none' }}>
                  <MuiLink href={item.link} target="_blank" color="inherit" sx={{ textDecoration: 'none' }}>
                    {item.title}
                  </MuiLink>
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  {item.text}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Right Panel */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          padding: { xs: '30px 15px', sm: '40px 20px', md: '60px 40px' },
          order: { xs: 1, sm: 2 },
          position: 'relative',
        }}
      >
        <img
          src="/images/bge-logo-tr.png"
          alt="BGE Logo"
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            width: '180px',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
          }}
        />
        <Paper
          elevation={6}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 2,
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            width: { xs: '100%', sm: '90%', md: '75%' },
            mt: 6,
          }}
        >
          <Typography
            variant="h4"
            align="center"
            fontWeight="bold"
            gutterBottom
            sx={{ color: '#4285F4' }}
          >
            Sign In
          </Typography>
          <Typography
            variant="body1"
            align="center"
            sx={{ color: '#4a4a4a', mb: 3 }}
          >
            Access your account
          </Typography>
          <form onSubmit={handleSubmit}>
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
                  '& fieldset': { borderColor: '#4285F4' },
                  '&:hover fieldset': { borderColor: '#34A853' },
                },
              }}
              disabled={loading}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#4285F4' },
                  '&:hover fieldset': { borderColor: '#34A853' },
                },
              }}
              disabled={loading}
            />
            <MuiLink
              component={Link}
              to="/forgot-password"
              sx={{ display: 'block', textAlign: 'center', mb: 2, color: '#4285F4' }}
            >
              Forgot Password?
            </MuiLink>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                backgroundColor: '#4285F4',
                '&:hover': { backgroundColor: '#34A853' },
                color: '#ffffff',
                fontWeight: 'bold',
                borderRadius: 1,
                py: 1.5,
                mb: 2,
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
            </Button>
          </form>
          <Divider sx={{ my: 2 }}>OR</Divider>
          <Button
            variant="outlined"
            fullWidth
            disabled={googleLoading}
            sx={{
              mt: 2,
              textTransform: 'none',
              fontSize: '16px',
              color: '#4285F4',
              borderColor: '#4285F4',
              '&:hover': { borderColor: '#34A853', color: '#34A853' },
            }}
            startIcon={
              googleLoading ? (
                <CircularProgress size={20} />
              ) : (
                <img src="/images/icons8-google-48.png" alt="Google" style={{ width: '20px', height: '20px' }} />
              )
            }
            onClick={handleGoogleLogin}
          >
            {googleLoading ? 'Signing in...' : 'Sign in with Google'}
          </Button>
          <Typography variant="body2" align="center" sx={{ mt: 3, color: '#4a4a4a' }}>
            Don’t have an account?{' '}
            <MuiLink
              component={Link}
              to="/signup"
              sx={{ color: '#4285F4', fontWeight: 'bold', '&:hover': { color: '#34A853' } }}
            >
              Sign up
            </MuiLink>
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default Login;