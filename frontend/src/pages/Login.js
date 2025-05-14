import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Typography,
  TextField,
  Button,
  Link as MuiLink,
  Box,
  Divider,
  CircularProgress,
  Paper,
  FormControlLabel,
  Checkbox,
  IconButton,
  InputAdornment,
  Switch,
  keyframes,
} from '@mui/material';
import { Public, Settings, ConfirmationNumber, Visibility, VisibilityOff, DarkMode, LightMode } from '@mui/icons-material';
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

const underline = keyframes`
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
`;

const bounce = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const glow = keyframes`
  0% { box-shadow: 0 0 5px rgba(52, 168, 83, 0.2); }
  50% { box-shadow: 0 0 15px rgba(52, 168, 83, 0.5); }
  100% { box-shadow: 0 0 5px rgba(52, 168, 83, 0.2); }
`;

const Login = () => {
  console.log('Login.js: Component function called');

  const { isDarkMode, toggleTheme, muiTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { fetchUser, authState } = useAuth();
  const navigate = useNavigate();

  // Define the greenlight color from branding
  const greenLightColor = '#34A853'; // Solid green for text and borders
  const greenLightHoverBackground = 'rgba(52, 168, 83, 0.1)'; // Light green for backgrounds

  console.log('Login.js: useTheme values:', { isDarkMode, toggleTheme, muiTheme });
  console.log('Login.js: useAuth values:', { fetchUser, authState });
  console.log('Login.js: Rendering Login component');
  console.log('Login.js: authState:', authState);
  console.log('Login.js: isDarkMode from ThemeContext:', isDarkMode);
  console.log('Login.js: muiTheme text.primary:', muiTheme?.palette?.text?.primary);
  console.log('Login.js: muiTheme text.secondary:', muiTheme?.palette?.text?.secondary);

  // Redirect if authenticated
  useEffect(() => {
    if (authState.isAuthenticated) {
      console.log('Login.js: User is authenticated, determining redirect...');
      if (!authState.isApproved) {
        console.log('Login.js: User not approved, redirecting to /welcome');
        navigate('/welcome', { state: { message: 'Your account is awaiting approval.' }, replace: true });
        return;
      }

      // Superadmins go directly to dashboard
      if (authState.userRole === 'superadmin') {
        console.log('Login.js: Superadmin detected, redirecting to /dashboard');
        navigate('/dashboard', { replace: true });
        return;
      }

      // Define core system page keys (excluding public routes)
      const corePageKeys = [
        'dashboard',
        'member',
        'partners',
        'hrManagement',
        'projects',
        'itInventory',
        'quickTools',
        'superadminDashboard',
        'analytics',
        'financeManagement'
      ];

      // Check if user has access to any core page
      const hasCoreAccess = corePageKeys.some(key => authState.accessPermissions?.[key] === true);

      if (hasCoreAccess) {
        // Redirect to the first accessible core page
        const redirectRoutes = [
          { key: 'dashboard', path: '/dashboard' },
          { key: 'hrManagement', path: '/hr-management' },
          { key: 'partners', path: '/partners' },
          { key: 'projects', path: '/projects' },
          { key: 'itInventory', path: '/it-inventory' },
          { key: 'quickTools', path: '/quick-tools' },
          { key: 'superadminDashboard', path: '/superadmin-dashboard' },
          { key: 'analytics', path: '/analytics' },
          { key: 'financeManagement', path: '/finance-management' },
        ];

        const accessibleRoute = redirectRoutes.find(route => authState.accessPermissions?.[route.key] === true);
        const redirectPath = accessibleRoute ? accessibleRoute.path : '/welcome';
        const redirectState = accessibleRoute ? {} : { message: 'Welcome! Please wait for the Super Admin to assign your permissions.' };
        console.log('Login.js: Redirecting to:', redirectPath);
        navigate(redirectPath, { state: redirectState, replace: true });
      } else {
        // If no core access, redirect to /welcome
        console.log('Login.js: No core access, redirecting to /welcome');
        navigate('/welcome', { state: { message: 'Welcome! Please wait for the Super Admin to assign your permissions.' }, replace: true });
      }
    }
  }, [authState.isAuthenticated, authState.isApproved, authState.userRole, authState.accessPermissions, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      console.log('Login.js: Local login attempt:', { email, rememberMe });
      const loginResponse = await axios.post(
        'http://localhost:5000/auth/login',
        { email, password, rememberMe },
        { withCredentials: true }
      );
      console.log('Login.js: Login request successful, response:', loginResponse.data);
      console.log('Login.js: Fetching user data after login');
      await fetchUser();
      console.log('Login.js: fetchUser completed, authState updated:', authState);
    } catch (error) {
      console.error('Login.js: Local login error:', error.message, error.response?.data);
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      setMessage(errorMessage);
      console.log('Login.js: Error message set:', errorMessage);
      // If the backend rejects the login due to unapproved status, redirect to /welcome
      if (error.response?.status === 403 && error.response?.data?.message === 'Your account is awaiting approval.') {
        navigate('/welcome', { state: { message: error.response.data.message }, replace: true });
      }
    } finally {
      setLoading(false);
      console.log('Login.js: Login attempt completed, loading set to false');
    }
  };

  const handleGoogleLogin = () => {
    console.log('Login.js: Initiating Google login');
    setGoogleLoading(true);
    window.location.replace('http://localhost:5000/auth/google');
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleForgotPasswordClick = () => {
    console.log('Login.js: Navigating to /forgot-password');
  };

  const handleSignupClick = () => {
    console.log('Login.js: Navigating to /signup');
  };

  // Show loading indicator only during form submission
  if (loading || googleLoading) {
    console.log('Login.js: Form submission in progress, showing loading indicator');
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  console.log('Login.js: Rendering login form UI');

  return (
    <Box
      key={`login-${isDarkMode}`}
      sx={{
        display: 'flex',
        minHeight: '100vh',
        background: muiTheme?.palette?.background?.default,
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
          checkedIcon={<DarkMode sx={{ color: muiTheme?.palette?.primary?.main }} />}
        />
      </Box>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: { xs: '30px 15px', sm: '40px 20px', md: '60px 40px' },
          textAlign: 'center',
          order: { xs: 2, sm: 1 },
          zIndex: 1,
          position: 'relative',
          background: isDarkMode ? 'transparent' : 'rgba(255, 255, 247, 0.1)',
          backdropFilter: isDarkMode ? 'none' : 'blur(15px)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 2,
          }}
        >
          <img
            src="/images/bge-logo-tr.png"
            alt="BGE Logo"
            style={{
              width: '180px',
              filter: isDarkMode ? 'drop-shadow(0 0 10px rgba(255,255,255,0.3))' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
            }}
          />
        </Box>
        <Box
          sx={{
            width: { xs: '90%', sm: '85%', md: '75%' },
            background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
            backdropFilter: isDarkMode ? 'blur(10px)' : 'blur(15px)',
            borderRadius: '16px',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
            padding: { xs: '20px', sm: '30px' },
            mt: { xs: 16, sm: 12 },
          }}
        >
          <Typography
            variant="h3"
            fontWeight="bold"
            gutterBottom
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: muiTheme?.palette?.primary?.main,
            }}
          >
            Welcome Back!
          </Typography>
          <Box sx={{ mt: '30px' }}>
            {[
              {
                icon: <Public sx={{ fontSize: 50, color: muiTheme?.palette?.primary?.main }} />,
                title: 'Visit our Main Website',
                link: 'https://beglobalecommercecorp.com/',
                text: 'Explore more about us and stay updated.',
              },
              {
                icon: <Settings sx={{ fontSize: 50, color: muiTheme?.palette?.primary?.main }} />,
                title: 'Login to GreatDay Account',
                link: 'https://app.greatdayhr.com/',
                text: 'Manage your GreatDay profile and tasks.',
              },
              {
                icon: <ConfirmationNumber sx={{ fontSize: 50, color: muiTheme?.palette?.primary?.main }} />,
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
                  background: muiTheme?.palette?.background?.listItem,
                  borderRadius: '12px',
                  padding: { xs: '16px', sm: '24px' },
                  marginBottom: '16px',
                  transition: 'all 0.3s ease',
                  border: `1px solid ${muiTheme?.palette?.border?.main}`,
                  boxShadow: muiTheme?.custom?.shadow?.listItem,
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: muiTheme?.custom?.shadow?.paper,
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : greenLightHoverBackground, // Updated hover background
                    animation: `${glow} 1.5s infinite`,
                  },
                }}
              >
                {item.icon}
                <Box sx={{ flexGrow: 1, marginLeft: { xs: '12px', sm: '16px' } }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontFamily: "'Poppins', sans-serif",
                      textDecoration: 'none',
                      color: muiTheme?.palette?.primary?.main,
                    }}
                  >
                    <MuiLink
                      href={item.link}
                      target="_blank"
                      sx={{
                        textDecoration: 'none',
                        color: muiTheme?.palette?.primary?.main,
                        transition: 'color 0.3s ease',
                        '&:hover': { color: greenLightColor }, // Updated hover color
                      }}
                    >
                      {item.title}
                    </MuiLink>
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "'Poppins', sans-serif",
                      color: muiTheme?.palette?.text?.secondary,
                    }}
                  >
                    {item.text}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: { xs: '20px', sm: '40px' },
          order: { xs: 1, sm: 2 },
          zIndex: 1,
          position: 'relative',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${muiTheme?.palette?.border?.main}`,
            boxShadow: muiTheme?.custom?.shadow?.paper,
            width: { xs: '100%', sm: '90%', md: '75%' },
            maxWidth: '450px',
            animation: message
              ? `${shake} 0.5s ease`
              : `${fadeIn} 0.8s ease-out`,
          }}
        >
          <Typography
            variant="h4"
            align="center"
            fontWeight="bold"
            gutterBottom
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: muiTheme?.palette?.primary?.main,
            }}
          >
            Sign In
          </Typography>
          <Typography
            variant="body1"
            align="center"
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: muiTheme?.palette?.text?.secondary,
              mb: 3,
            }}
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
                  borderRadius: '8px',
                  background: muiTheme?.palette?.background?.listItem,
                  transition: 'all 0.3s ease',
                  '& fieldset': {
                    borderColor: muiTheme?.palette?.border?.main,
                  },
                  '&:hover fieldset': {
                    borderColor: greenLightColor, // Updated hover border color
                  },
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: muiTheme?.custom?.shadow?.listItem,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: greenLightColor, // Updated focused border color
                    boxShadow: `0 0 8px ${greenLightColor}33`, // Updated focused shadow
                  },
                  '&.Mui-focused': {
                    transform: 'translateY(-2px)',
                    boxShadow: muiTheme?.custom?.shadow?.listItem,
                  },
                },
                '& .MuiInputLabel-root': {
                  fontFamily: "'Poppins', sans-serif",
                  color: muiTheme?.palette?.text?.secondary,
                },
                '& .MuiInputBase-input': {
                  fontFamily: "'Poppins', sans-serif",
                  color: muiTheme?.palette?.text?.primary,
                },
              }}
              disabled={loading || googleLoading}
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
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                      sx={{ color: muiTheme?.palette?.text?.secondary }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  background: muiTheme?.palette?.background?.listItem,
                  transition: 'all 0.3s ease',
                  '& fieldset': {
                    borderColor: muiTheme?.palette?.border?.main,
                  },
                  '&:hover fieldset': {
                    borderColor: greenLightColor, // Updated hover border color
                  },
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: muiTheme?.custom?.shadow?.listItem,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: greenLightColor, // Updated focused border color
                    boxShadow: `0 0 8px ${greenLightColor}33`, // Updated focused shadow
                  },
                  '&.Mui-focused': {
                    transform: 'translateY(-2px)',
                    boxShadow: muiTheme?.custom?.shadow?.listItem,
                  },
                },
                '& .MuiInputLabel-root': {
                  fontFamily: "'Poppins', sans-serif",
                  color: muiTheme?.palette?.text?.secondary,
                },
                '& .MuiInputBase-input': {
                  fontFamily: "'Poppins', sans-serif",
                  color: muiTheme?.palette?.text?.primary,
                },
              }}
              disabled={loading || googleLoading}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    sx={{
                      color: muiTheme?.palette?.text?.secondary,
                      '&.Mui-checked': {
                        color: greenLightColor, // Updated checked color
                      },
                    }}
                    disabled={loading || googleLoading}
                  />
                }
                label="Remember Me"
                sx={{
                  '& .MuiTypography-root': {
                    fontFamily: "'Poppins', sans-serif",
                    color: muiTheme?.palette?.text?.secondary,
                  },
                }}
              />
              <MuiLink
                component={Link}
                to="/forgot-password"
                onClick={handleForgotPasswordClick}
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  color: muiTheme?.palette?.primary?.main,
                  '&:hover': { color: greenLightColor }, // Updated hover color
                }}
              >
                Forgot Password?
              </MuiLink>
            </Box>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || googleLoading}
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
                position: 'relative',
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Login'
              )}
            </Button>
          </form>
          <Divider sx={{ my: 2, color: muiTheme?.palette?.text?.secondary, fontFamily: "'Poppins', sans-serif" }}>
            OR
          </Divider>
          <Button
            variant="outlined"
            fullWidth
            disabled={googleLoading || loading}
            sx={{
              mt: 2,
              textTransform: 'none',
              fontSize: '16px',
              color: muiTheme?.palette?.primary?.main,
              borderColor: muiTheme?.palette?.border?.main,
              background: muiTheme?.palette?.background?.listItem,
              borderRadius: '8px',
              py: 1.5,
              transition: 'all 0.3s',
              '&:hover': {
                borderColor: greenLightColor, // Updated hover border color
                color: greenLightColor, // Updated hover text color
                background: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : greenLightHoverBackground, // Updated hover background
              },
              fontFamily: "'Poppins', sans-serif",
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
          <Typography
            variant="body2"
            align="center"
            sx={{
              mt: 3,
              color: muiTheme?.palette?.text?.secondary,
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            Don’t have an account?{' '}
            <MuiLink
              component={Link}
              to="/signup"
              onClick={handleSignupClick}
              sx={{
                fontFamily: "'Poppins', sans-serif",
                color: muiTheme?.palette?.primary?.main,
                fontWeight: 'bold',
                position: 'relative',
                textDecoration: 'none',
                '&:hover': {
                  color: greenLightColor, // Updated hover color
                  '&:after': {
                    animation: `${underline} 0.3s forwards`,
                  },
                },
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  bottom: '-2px',
                  left: 0,
                  width: 0,
                  height: '2px',
                  backgroundColor: greenLightColor, // Updated underline color
                  transition: 'width 0.3s',
                },
                '&:active': {
                  animation: `${bounce} 0.3s`,
                },
              }}
            >
              Sign up
            </MuiLink>
          </Typography>
          {message && (
            <Typography
              variant="body2"
              align="center"
              sx={{
                mt: 2,
                color: '#d32f2f',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {message}
            </Typography>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default Login;