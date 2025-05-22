import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  IconButton,
  InputAdornment,
  Divider,
  keyframes,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Layout from '../components/Layout';
import CustomSnackbar from '../components/CustomSnackbar';

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

const AccountSettings = () => {
  const { isDarkMode, muiTheme } = useTheme();
  const { authState, fetchUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const greenLightColor = '#34A853';
  const greenLightHoverBackground = 'rgba(52, 168, 83, 0.1)';
  const hoverBackground = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : greenLightHoverBackground;

  useEffect(() => {
    if (authState.loading) {
      return;
    }
    if (!authState.isAuthenticated) {
      navigate('/login');
    } else if (authState.user) {
      setEmail(authState.user.email || '');
    }
  }, [authState, navigate]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate that new password and confirm new password match
    if (newPassword !== confirmNewPassword) {
      setError('New password and confirm new password do not match');
      return;
    }

    setModalAction('password');
    setModalOpen(true);
  };

  const handleDeleteAccount = () => {
    setModalAction('delete');
    setModalOpen(true);
  };

  const confirmAction = async () => {
    setError('');
    setSuccess('');
    try {
      if (modalAction === 'password') {
        await axios.post(
          '/auth/update-password',
          { currentPassword, newPassword },
          { withCredentials: true }
        );
        setSuccess('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else if (modalAction === 'delete') {
        await axios.post('/auth/delete-account', {}, { withCredentials: true });
        setSuccess('Account deleted successfully');
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${modalAction === 'password' ? 'update password' : 'delete account'}`);
    } finally {
      setModalOpen(false);
    }
  };

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

  if (!authState.isAuthenticated) {
    return null;
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
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: '600px',
            margin: 'auto',
          }}
        >
          <Typography
            component="h1"
            variant="h5"
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: muiTheme.palette.primary.main,
              fontWeight: 'bold',
              textAlign: 'center',
              mb: 3,
            }}
          >
            Account Settings
          </Typography>

          {/* Temporarily commented out the Change Email section */}
          {/*
          <Box
            sx={{
              width: '100%',
              p: 2,
              borderRadius: '8px',
              border: `1px solid ${muiTheme.palette.border.main}`,
              mb: 3,
            }}
          >
            <Box component="form" onSubmit={handleEmailChange} sx={{ width: '100%' }}>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  color: muiTheme.palette.primary.main,
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
              >
                Change Email
              </Typography>
              <TextField
                margin="normal"
                required
                id="email"
                label="New Email Address"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputLabelProps={{
                  style: {
                    fontFamily: "'Poppins', sans-serif",
                    color: muiTheme.palette.text.secondary,
                  },
                }}
                InputProps={{
                  style: {
                    fontFamily: "'Poppins', sans-serif",
                    color: muiTheme.palette.text.primary,
                  },
                }}
                sx={{
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    background: muiTheme.palette.background.listItem,
                    transition: 'all 0.3s ease',
                    '& fieldset': { borderColor: muiTheme.palette.border.main },
                    '&:hover fieldset': { borderColor: greenLightColor },
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: muiTheme.custom?.shadow?.listItem },
                    '&.Mui-focused fieldset': { borderColor: greenLightColor, boxShadow: `0 0 8px ${greenLightColor}33` },
                    '&.Mui-focused': { transform: 'translateY(-2px)', boxShadow: muiTheme.custom?.shadow?.listItem },
                  },
                }}
              />
              <Button
                type="submit"
                variant="outlined"
                sx={{
                  mt: 2,
                  mb: 1,
                  borderColor: muiTheme.palette.primary.main,
                  color: muiTheme.palette.primary.main,
                  borderRadius: '8px',
                  py: 1.5,
                  transition: 'all 0.3s ease',
                  fontFamily: "'Poppins', sans-serif",
                  '&:hover': {
                    borderColor: greenLightColor,
                    backgroundColor: hoverBackground,
                    color: greenLightColor,
                    transform: 'scale(1.05)',
                  },
                }}
              >
                Update Email
              </Button>
            </Box>
          </Box>

          <Divider sx={{ width: '100%', my: 2, borderColor: muiTheme.palette.border.main }} />
          */}

          {/* Change Password Section */}
          <Box
            sx={{
              width: '100%',
              p: 2,
              borderRadius: '8px',
              border: `1px solid ${muiTheme.palette.border.main}`,
              mb: 3,
            }}
          >
            <Box component="form" onSubmit={handlePasswordChange} sx={{ width: '100%' }}>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  color: muiTheme.palette.primary.main,
                  fontWeight: 'bold',
                  textAlign: 'left',
                }}
              >
                Change Password
              </Typography>
              <TextField
                margin="normal"
                required
                name="currentPassword"
                label="Current Password"
                type={showCurrentPassword ? 'text' : 'password'}
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                InputLabelProps={{
                  style: {
                    fontFamily: "'Poppins', sans-serif",
                    color: muiTheme.palette.text.secondary,
                  },
                }}
                InputProps={{
                  style: {
                    fontFamily: "'Poppins', sans-serif",
                    color: muiTheme.palette.text.primary,
                  },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        edge="end"
                        sx={{ color: muiTheme.palette.text.primary }}
                      >
                        {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    background: muiTheme.palette.background.listItem,
                    transition: 'all 0.3s ease',
                    '& fieldset': { borderColor: muiTheme.palette.border.main },
                    '&:hover fieldset': { borderColor: greenLightColor },
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: muiTheme.custom?.shadow?.listItem },
                    '&.Mui-focused fieldset': { borderColor: greenLightColor, boxShadow: `0 0 8px ${greenLightColor}33` },
                    '&.Mui-focused': { transform: 'translateY(-2px)', boxShadow: muiTheme.custom?.shadow?.listItem },
                  },
                }}
              />
              <TextField
                margin="normal"
                required
                name="newPassword"
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                InputLabelProps={{
                  style: {
                    fontFamily: "'Poppins', sans-serif",
                    color: muiTheme.palette.text.secondary,
                  },
                }}
                InputProps={{
                  style: {
                    fontFamily: "'Poppins', sans-serif",
                    color: muiTheme.palette.text.primary,
                  },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                        sx={{ color: muiTheme.palette.text.primary }}
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    background: muiTheme.palette.background.listItem,
                    transition: 'all 0.3s ease',
                    '& fieldset': { borderColor: muiTheme.palette.border.main },
                    '&:hover fieldset': { borderColor: greenLightColor },
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: muiTheme.custom?.shadow?.listItem },
                    '&.Mui-focused fieldset': { borderColor: greenLightColor, boxShadow: `0 0 8px ${greenLightColor}33` },
                    '&.Mui-focused': { transform: 'translateY(-2px)', boxShadow: muiTheme.custom?.shadow?.listItem },
                  },
                }}
              />
              <TextField
                margin="normal"
                required
                name="confirmNewPassword"
                label="Confirm New Password"
                type={showConfirmNewPassword ? 'text' : 'password'}
                id="confirmNewPassword"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                InputLabelProps={{
                  style: {
                    fontFamily: "'Poppins', sans-serif",
                    color: muiTheme.palette.text.secondary,
                  },
                }}
                InputProps={{
                  style: {
                    fontFamily: "'Poppins', sans-serif",
                    color: muiTheme.palette.text.primary,
                  },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        edge="end"
                        sx={{ color: muiTheme.palette.text.primary }}
                      >
                        {showConfirmNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    background: muiTheme.palette.background.listItem,
                    transition: 'all 0.3s ease',
                    '& fieldset': { borderColor: muiTheme.palette.border.main },
                    '&:hover fieldset': { borderColor: greenLightColor },
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: muiTheme.custom?.shadow?.listItem },
                    '&.Mui-focused fieldset': { borderColor: greenLightColor, boxShadow: `0 0 8px ${greenLightColor}33` },
                    '&.Mui-focused': { transform: 'translateY(-2px)', boxShadow: muiTheme.custom?.shadow?.listItem },
                  },
                }}
              />
              <Button
                type="submit"
                variant="outlined"
                sx={{
                  mt: 2,
                  mb: 1,
                  borderColor: muiTheme.palette.primary.main,
                  color: muiTheme.palette.primary.main,
                  borderRadius: '8px',
                  py: 1.5,
                  transition: 'all 0.3s ease',
                  fontFamily: "'Poppins', sans-serif",
                  '&:hover': {
                    borderColor: greenLightColor,
                    backgroundColor: hoverBackground,
                    color: greenLightColor,
                    transform: 'scale(1.05)',
                  },
                }}
              >
                Update Password
              </Button>
            </Box>
          </Box>

          {/* Divider */}
          <Divider sx={{ width: '100%', my: 2, borderColor: muiTheme.palette.border.main }} />

          {/* Delete Account Section */}
          <Box
            sx={{
              width: '100%',
              p: 2,
              borderRadius: '8px',
              border: `1px solid ${muiTheme.palette.border.main}`,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontFamily: "'Poppins', sans-serif",
                color: muiTheme.palette.primary.main,
                fontWeight: 'bold',
                textAlign: 'left',
              }}
            >
              Delete Account
            </Typography>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteAccount}
              sx={{
                mt: 2,
                borderRadius: '8px',
                py: 1.5,
                fontFamily: "'Poppins', sans-serif",
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  backgroundColor: muiTheme.palette.error.dark,
                  boxShadow: muiTheme.custom.shadows.buttonHover,
                },
              }}
            >
              Delete Account
            </Button>
          </Box>
        </Box>
      </Box>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogTitle sx={{ fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.primary.main }}>
          Confirm {modalAction === 'password' ? 'Password Update' : 'Account Deletion'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.text.primary }}>
            Are you sure you want to {modalAction === 'password' ? 'update your password' : 'delete your account'}? {modalAction === 'delete' && 'This action cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setModalOpen(false)}
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: muiTheme.palette.text.primary,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
                backgroundColor: hoverBackground,
                color: greenLightColor,
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmAction}
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: modalAction === 'delete' ? muiTheme.palette.error.main : muiTheme.palette.primary.main,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
                backgroundColor: hoverBackground,
                color: modalAction === 'delete' ? muiTheme.palette.error.dark : greenLightColor,
              },
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <CustomSnackbar
        open={!!success}
        onClose={() => setSuccess('')}
        severity="success"
        message={success}
        sx={{ fontFamily: "'Poppins', sans-serif", width: '100%' }}
      />
      <CustomSnackbar
        open={!!error}
        onClose={() => setError('')}
        severity="error"
        message={error}
        sx={{ fontFamily: "'Poppins', sans-serif", width: '100%' }}
      />
    </Layout>
  );
};

export default AccountSettings;