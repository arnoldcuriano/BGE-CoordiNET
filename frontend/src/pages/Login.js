import React, { useState } from 'react';
import { Typography, TextField, Button, Link as MuiLink, Box, Divider } from '@mui/material';
import { Link } from 'react-router-dom';
import { Public, Settings, ConfirmationNumber } from '@mui/icons-material';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login:', { email, password });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        background: 'linear-gradient(to right, #34A853, #4285F4)', 
        flexDirection: { xs: 'column', md: 'row' },
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
          padding: { xs: '40px 20px', md: '60px 40px' },
          textAlign: 'center',
          order: { xs: 2, md: 1 }, 
          
        }}
      >
        
        
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Welcome Back!
        </Typography>

        <Box sx={{ width: { xs: '90%', md: '75%' }, marginTop: '30px' }}>
          {[{
            icon: <Public sx={{ fontSize: 50, color: '#ffff' }} />,
            title: 'Visit our Main Website',
            link: 'https://beglobalecommercecorp.com/',
            text: 'Explore more about us and stay updated.'
          }, {
            icon: <Settings sx={{ fontSize: 50, color: '#ffff' }} />,
            title: 'Login to GreatDay Account',
            link: 'https://app.greatdayhr.com/',
            text: 'Manage your GreatDay profile and tasks.'
          }, {
            icon: <ConfirmationNumber sx={{ fontSize: 50, color: '#ffff' }} />,
            title: 'Need Support?',
            link: 'mailto:arnoldcuriano84@gmail.com',
            text: 'Contact our support team for assistance.'
          }].map((item, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '20px',
                transition: '0.3s',
                '&:hover': { boxShadow: '0 4px 15px rgba(0,0,0,0.3)', transform: 'translateY(-5px)' }
              }}
            >
              {item.icon}
              <Box sx={{ flexGrow: 1, marginLeft: '16px' }}>
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
          backgroundColor: 'white',
          padding: { xs: '40px 20px', md: '60px 40px' },
          order: { xs: 1, md: 2 },
          position: 'relative'
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
            zIndex: 10,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
          }}
        />

        <Box
          sx={{
            backgroundColor: 'white',
            padding: { xs: '30px', md: '40px' },
            borderRadius: '12px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
            width: { xs: '95%', md: '75%' },
            zIndex: 1
          }}
        >
          <Typography variant="h4" align="center" fontWeight="bold" gutterBottom>
            Sign In
          </Typography>
          <Typography variant="body1" align="center" gutterBottom>
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
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <MuiLink
              component={Link}
              to="/forgot-password"
              sx={{ display: 'block', textAlign: 'center', marginBottom: '20px', color: 'primary.main' }}
            >
              Forgot Password?
            </MuiLink>
            <Button type="submit" variant="contained" color="primary" fullWidth>
              Login
            </Button>
          </form>

          <Divider sx={{ my: '20px' }}>OR</Divider>

          <Button
            variant="outlined"
            fullWidth
            sx={{ mt: 2, textTransform: 'none', fontSize: '16px' }}
            startIcon={<img src="/images/icons8-google-48.png" alt="Google" style={{ width: '20px', height: '20px' }} />}
            onClick={() => window.location.href = 'http://localhost:5000/auth/google'} // Redirect to backend Google OAuth endpoint
            >
          Sign in with Google
          </Button>

          <Typography variant="body2" align="center" sx={{ mt: 3 }}>
            Don’t have an account?{' '}
            <MuiLink component={Link} to="/signup" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              Sign up
            </MuiLink>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
