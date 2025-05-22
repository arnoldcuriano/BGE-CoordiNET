import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api';
import {
  Typography,
  TextField,
  Button,
  Avatar,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  keyframes,
} from '@mui/material';
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

const ProfileSettings = () => {
  const { authState, updateUser } = useAuth();
  const { muiTheme, isDarkMode } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(authState.firstName || '');
  const [lastName, setLastName] = useState(authState.lastName || '');
  const [email, setEmail] = useState(authState.email || '');
  const [profilePicture, setProfilePicture] = useState(authState.profilePicture || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [originalFirstName, setOriginalFirstName] = useState('');
  const [originalLastName, setOriginalLastName] = useState('');

  const greenLightColor = '#34A853';
  const greenLightHoverBackground = 'rgba(52, 168, 83, 0.1)';
  const hoverBackground = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : greenLightHoverBackground;

  useEffect(() => {
    if (!authState.isAuthenticated) {
      setError('Failed to load user data. Please log in again.');
    }
  }, [authState]);

  const handleEditToggle = () => {
    if (isEditing) {
      setModalAction('cancel');
      setModalOpen(true);
    } else {
      setOriginalFirstName(firstName);
      setOriginalLastName(lastName);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    setModalAction('save');
    setModalOpen(true);
  };

  const confirmAction = async () => {
    if (modalAction === 'save') {
      setLoading(true);
      setSuccess(null);
      setError(null);
      try {
        const response = await api.post('/api/update-profile', { firstName, lastName });
        await updateUser({ firstName, lastName });
        setSuccess(response.data.message || 'Profile updated successfully');
        setIsEditing(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to update user details');
      } finally {
        setLoading(false);
      }
    } else if (modalAction === 'cancel') {
      setFirstName(originalFirstName);
      setLastName(originalLastName);
      setIsEditing(false);
    }
    setModalOpen(false);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setLoading(true);
      setSuccess(null);
      setError(null);
      const formData = new FormData();
      formData.append('profilePicture', file);
      try {
        const response = await api.post('/api/upload-profile-picture', formData);
        const newProfilePictureUrl = response.data.profilePicture || authState.profilePicture;
        setProfilePicture(newProfilePictureUrl);
        await updateUser({ profilePicture: newProfilePictureUrl });
        setSuccess(response.data.message || 'Profile picture updated successfully');
      } catch (err) {
        console.error('Error uploading profile picture:', err);
        setError(err.response?.data?.message || 'Failed to upload profile picture');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRemovePicture = async () => {
    setLoading(true);
    setSuccess(null);
    setError(null);
    try {
      await api.post('/api/remove-profile-picture');
      setProfilePicture('');
      await updateUser({ profilePicture: '' });
      setSuccess('Profile picture removed successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove profile picture');
    } finally {
      setLoading(false);
    }
  };

  if (authState.loading) return <CircularProgress />;
  if (!authState.isAuthenticated) return <Typography>Please log in to view your profile settings.</Typography>;

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
            alignItems: 'flex-start',
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
              textAlign: 'left',
            }}
          >
            Profile Settings
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar
              src={profilePicture}
              alt="Profile Picture"
              sx={{ width: 100, height: 100, mr: 2 }}
            >
              {!profilePicture && 'N/A'}
            </Avatar>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="upload-profile-picture"
              type="file"
              onChange={handleFileUpload}
            />
            <label htmlFor="upload-profile-picture">
              <Button
                variant="outlined"
                component="span"
                sx={{
                  color: 'inherit',
                  borderColor: 'inherit',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: greenLightColor,
                    backgroundColor: hoverBackground,
                    color: greenLightColor,
                    transform: 'scale(1.05)',
                  },
                }}
              >
                Upload Picture
              </Button>
            </label>
            {profilePicture && (
              <Button
                variant="contained"
                onClick={handleRemovePicture}
                sx={{
                  ml: 2,
                  backgroundColor: 'rgb(244, 67, 54)',
                  color: 'white',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgb(211, 47, 47)',
                    transform: 'scale(1.05)',
                  },
                }}
              >
                Remove Picture
              </Button>
            )}
          </Box>
          {isEditing ? (
            <Box sx={{ width: '100%' }}>
              <TextField
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                fullWidth
                margin="normal"
                variant="outlined"
                sx={{
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
                  '& .MuiInputLabel-root': { fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.text.secondary },
                  '& .MuiInputBase-input': { fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.text.primary },
                }}
              />
              <TextField
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                fullWidth
                margin="normal"
                variant="outlined"
                sx={{
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
                  '& .MuiInputLabel-root': { fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.text.secondary },
                  '& .MuiInputBase-input': { fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.text.primary },
                }}
              />
              <TextField
                label="Email"
                value={email}
                fullWidth
                margin="normal"
                variant="outlined"
                disabled
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    background: muiTheme.palette.background.listItem,
                    transition: 'all 0.3s ease',
                    '& fieldset': { borderColor: muiTheme.palette.border.main },
                  },
                  '& .MuiInputLabel-root': { fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.text.secondary },
                  '& .MuiInputBase-input': { fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.text.primary },
                }}
              />
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  disabled={loading}
                  sx={{
                    transition: 'all 0.3s ease',
                    background: 'linear-gradient(90deg, #4285F4, #34A853)',
                    color: '#ffffff',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      background: 'linear-gradient(90deg, #34A853, #4285F4)',
                      boxShadow: muiTheme.custom.shadows.buttonHover,
                    },
                    '&:disabled': {
                      background: 'linear-gradient(90deg, #4285F4, #34A853)',
                      opacity: 0.6,
                    },
                  }}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleEditToggle}
                  disabled={loading}
                  sx={{
                    ml: 2,
                    transition: 'all 0.3s ease',
                    color: muiTheme.palette.text.primary,
                    borderColor: muiTheme.palette.border.main,
                    '&:hover': {
                      transform: 'scale(1.05)',
                      borderColor: greenLightColor,
                      backgroundColor: hoverBackground,
                      color: greenLightColor,
                    },
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ width: '100%' }}>
              <Typography variant="body1" sx={{ mb: 1, fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.text.primary }}>
                First Name: {authState.firstName || 'Not Set'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1, fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.text.primary }}>
                Last Name: {authState.lastName || 'Not Set'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1, fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.text.primary }}>
                Email: {authState.email || 'Not Set'}
              </Typography>
              <Button
                variant="outlined"
                onClick={handleEditToggle}
                sx={{
                  mt: 2,
                  transition: 'all 0.3s ease',
                  color: muiTheme.palette.text.primary,
                  borderColor: muiTheme.palette.border.main,
                  '&:hover': {
                    transform: 'scale(1.05)',
                    borderColor: greenLightColor,
                    backgroundColor: hoverBackground,
                    color: greenLightColor,
                  },
                }}
              >
                Edit
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogTitle sx={{ fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.primary.main }}>
          Confirm {modalAction === 'save' ? 'Save' : 'Cancel'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.text.primary }}>
            Are you sure you want to {modalAction === 'save' ? 'save changes' : 'discard changes'}?
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
            No
          </Button>
          <Button
            onClick={confirmAction}
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: muiTheme.palette.primary.main,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
                backgroundColor: hoverBackground,
                color: greenLightColor,
              },
            }}
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      <CustomSnackbar
        open={!!success}
        onClose={() => setSuccess(null)}
        severity="success"
        message={success}
        sx={{ fontFamily: "'Poppins', sans-serif", width: '100%' }}
      />
      <CustomSnackbar
        open={!!error}
        onClose={() => setError(null)}
        severity="error"
        message={error}
        sx={{ fontFamily: "'Poppins', sans-serif", width: '100%' }}
      />
    </Layout>
  );
};

export default ProfileSettings;