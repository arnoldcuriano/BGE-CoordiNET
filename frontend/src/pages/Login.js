import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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
import { useTheme } from '@mui/material/styles';

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

const Login = ({ isDarkMode, toggleTheme }) => {
  const theme = useTheme();
  const effectiveIsDarkMode = isDarkMode !== undefined ? isDarkMode : false;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authState, setAuthState } = useAuth();

  console.log('Login.js: Rendering Login component');
  console.log('Login.js: authState:', authState);
  console.log('Login.js: searchParams:', searchParams.toString());
  console.log('Login.js: isDarkMode:', effectiveIsDarkMode);

  useEffect(() => {
    console.log('Login.js: useEffect triggered, authState:', authState, 'searchParams:', searchParams.toString());

    const handleAuth = async () => {
      const loginSuccess = searchParams.get('loginSuccess');
      console.log('Login.js: loginSuccess param:', loginSuccess);

      if (authState.isAuthenticated) {
        const redirectPath = authState.userRole === 'viewer' && !authState.isApproved ? '/welcome' : '/dashboard';
        console.log('Login.js: User already authenticated, redirecting to:', redirectPath);
        navigate(redirectPath, { replace: true });
        return;
      }

      if (loginSuccess) {
        console.log('Login.js: Google login redirect detected');
        try {
          setGoogleLoading(true);
          const response = await axios.get('http://localhost:5000/auth/user', { 
            withCredentials: true,
            timeout: 5000
          });
          console.log('Login.js: /auth/user response after Google login:', response.data);
          if (response.data) {
            setAuthState({
              loading: false,
              isAuthenticated: true,
              userRole: response.data.role,
              firstName: response.data.firstName,
              lastName: response.data.lastName,
              profilePicture: response.data.profilePicture,
              isApproved: response.data.isApproved || false,
            });
            const redirectPath = response.data.role === 'viewer' && !response.data.isApproved ? '/welcome' : '/dashboard';
            console.log('Login.js: Authentication successful, redirecting to:', redirectPath);
            navigate(redirectPath, { replace: true });
          } else {
            console.log('Login.js: No user data received after Google login');
            setMessage('Failed to verify Google login');
            navigate('/login', { replace: true });
          }
        } catch (error) {
          console.error('Login.js: Post-auth verification failed:', error.message, error.response?.data);
          setMessage('Failed to verify Google login');
          navigate('/login', { replace: true });
        } finally {
          setGoogleLoading(false);
        }
      }
    };

    if (!authState.loading) {
      handleAuth();
    } else {
      console.log('Login.js: Skipping handleAuth because authState.loading is true');
    }
  }, [authState, navigate, searchParams, setAuthState]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      console.log('Login.js: Local login attempt:', { email, rememberMe });
      await axios.post(
        'http://localhost:5000/auth/login',
        { email, password, rememberMe },
        { withCredentials: true }
      );
      const userResponse = await axios.get('http://localhost:5000/auth/user', { withCredentials: true });
      console.log('Login.js: Local login user response:', userResponse.data);
      if (userResponse.data) {
        setAuthState({
          loading: false,
          isAuthenticated: true,
          userRole: userResponse.data.role,
          firstName: userResponse.data.firstName,
          lastName: userResponse.data.lastName,
          profilePicture: userResponse.data.profilePicture,
          isApproved: userResponse.data.isApproved || false,
        });
        const redirectPath = userResponse.data.role === 'viewer' && !userResponse.data.isApproved ? '/welcome' : '/dashboard';
        console.log('Login.js: Local login successful, redirecting to:', redirectPath);
        navigate(redirectPath, { replace: true });
      }
    } catch (error) {
      console.error('Login.js: Local login error:', error.message, error.response?.data);
      setMessage(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
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
    navigate('/forgot-password');
  };

  const handleSignupClick = () => {
    console.log('Login.js: Navigating to /signup');
    navigate('/signup');
  };

  if (authState.loading) {
    console.log('Login.js: authState.loading is true, showing loading indicator');
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      key={`login-${effectiveIsDarkMode}`} // Force re-render on theme change
      sx={{
        display: 'flex',
        minHeight: '100vh',
        background: theme.palette.background.default,
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
          background: effectiveIsDarkMode
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
          checked={effectiveIsDarkMode}
          onChange={toggleTheme}
          icon={<LightMode sx={{ color: '#ffb300' }} />}
          checkedIcon={<DarkMode sx={{ color: theme.palette.primary.main }} />}
        />
      </Box>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: theme.palette.text.primary,
          padding: { xs: '30px 15px', sm: '40px 20px', md: '60px 40px' },
          textAlign: 'center',
          order: { xs: 2, sm: 1 },
          zIndex: 1,
          position: 'relative',
          background: effectiveIsDarkMode ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
          backdropFilter: effectiveIsDarkMode ? 'none' : 'blur(15px)',
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
              filter: effectiveIsDarkMode ? 'drop-shadow(0 0 10px rgba(255,255,255,0.3))' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
            }}
          />
        </Box>
        <Box
          sx={{
            width: { xs: '90%', sm: '85%', md: '75%' },
            background: effectiveIsDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
            backdropFilter: effectiveIsDarkMode ? 'blur(10px)' : 'blur(15px)',
            borderRadius: '16px',
            border: effectiveIsDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: effectiveIsDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
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
              color: theme.palette.primary.main,
              textShadow: effectiveIsDarkMode ? '0 0 10px rgba(66, 133, 244, 0.5)' : 'none',
            }}
          >
            Welcome Back!
          </Typography>
          <Box sx={{ mt: '30px' }}>
            {[
              {
                icon: <Public sx={{ fontSize: 50, color: theme.palette.primary.main }} />,
                title: 'Visit our Main Website',
                link: 'https://beglobalecommercecorp.com/',
                text: 'Explore more about us and stay updated.',
              },
              {
                icon: <Settings sx={{ fontSize: 50, color: theme.palette.primary.main }} />,
                title: 'Login to GreatDay Account',
                link: 'https://app.greatdayhr.com/',
                text: 'Manage your GreatDay profile and tasks.',
              },
              {
                icon: <ConfirmationNumber sx={{ fontSize: 50, color: theme.palette.primary.main }} />,
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
                  background: theme.palette.background.listItem,
                  borderRadius: '12px',
                  padding: { xs: '16px', sm: '24px' },
                  marginBottom: '16px',
                  transition: 'all 0.3s ease',
                  border: `1px solid ${theme.palette.border.main}`,
                  boxShadow: theme.custom?.shadow?.listItem,
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: theme.custom?.shadow?.paper,
                    background: effectiveIsDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.3)',
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
                    }}
                  >
                    <MuiLink
                      href={item.link}
                      target="_blank"
                      sx={{
                        textDecoration: 'none',
                        color: theme.palette.primary.main,
                        transition: 'color 0.3s ease',
                        '&:hover': { color: theme.palette.secondary.main },
                      }}
                    >
                      {item.title}
                    </MuiLink>
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "'Poppins', sans-serif",
                      color: theme.palette.text.secondary,
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
            background: effectiveIsDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme.palette.border.main}`,
            boxShadow: theme.custom?.shadow?.paper,
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
              color: theme.palette.primary.main,
            }}
          >
            Sign In
          </Typography>
          <Typography
            variant="body1"
            align="center"
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: theme.palette.text.secondary,
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
                  background: theme.palette.background.listItem,
                  transition: 'all 0.3s ease',
                  '& fieldset': {
                    borderColor: theme.palette.border.main,
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.secondary.main,
                  },
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.custom?.shadow?.listItem,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.secondary.main,
                    boxShadow: `0 0 8px ${theme.palette.secondary.main}33`,
                  },
                  '&.Mui-focused': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.custom?.shadow?.listItem,
                  },
                },
                '& .MuiInputLabel-root': {
                  fontFamily: "'Poppins', sans-serif",
                  color: theme.palette.text.secondary,
                },
                '& .MuiInputBase-input': {
                  fontFamily: "'Poppins', sans-serif",
                  color: theme.palette.text.primary,
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
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  background: theme.palette.background.listItem,
                  transition: 'all 0.3s ease',
                  '& fieldset': {
                    borderColor: theme.palette.border.main,
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.secondary.main,
                  },
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.custom?.shadow?.listItem,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.secondary.main,
                    boxShadow: `0 0 8px ${theme.palette.secondary.main}33`,
                  },
                  '&.Mui-focused': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.custom?.shadow?.listItem,
                  },
                },
                '& .MuiInputLabel-root': {
                  fontFamily: "'Poppins', sans-serif",
                  color: theme.palette.text.secondary,
                },
                '& .MuiInputBase-input': {
                  fontFamily: "'Poppins', sans-serif",
                  color: theme.palette.text.primary,
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
                      color: theme.palette.text.secondary,
                      '&.Mui-checked': {
                        color: theme.palette.secondary.main,
                      },
                    }}
                    disabled={loading || googleLoading}
                  />
                }
                label="Remember Me"
                sx={{
                  '& .MuiTypography-root': {
                    fontFamily: "'Poppins', sans-serif",
                    color: theme.palette.text.secondary,
                  },
                }}
              />
              <MuiLink
                component={Link}
                to="/forgot-password"
                onClick={handleForgotPasswordClick}
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  color: theme.palette.primary.main,
                  '&:hover': { color: theme.palette.secondary.main },
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
          <Divider sx={{ my: 2, color: theme.palette.text.secondary, fontFamily: "'Poppins', sans-serif" }}>
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
              color: theme.palette.primary.main,
              borderColor: theme.palette.border.main,
              background: theme.palette.background.listItem,
              borderRadius: '8px',
              py: 1.5,
              transition: 'all 0.3s',
              '&:hover': {
                borderColor: theme.palette.secondary.main,
                color: theme.palette.secondary.main,
                background: effectiveIsDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.3)',
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
              color: theme.palette.text.secondary,
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
                color: theme.palette.primary.main,
                fontWeight: 'bold',
                position: 'relative',
                textDecoration: 'none',
                '&:hover': {
                  color: theme.palette.secondary.main,
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
                  backgroundColor: theme.palette.secondary.main,
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