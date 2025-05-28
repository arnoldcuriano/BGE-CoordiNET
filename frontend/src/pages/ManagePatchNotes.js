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
  Divider,
  keyframes,
} from '@mui/material';
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

const ManagePatchNotes = () => {
  const { isDarkMode, muiTheme } = useTheme();
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [patchNotes, setPatchNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [selectedPatchNote, setSelectedPatchNote] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  const greenLightColor = '#34A853';
  const greenLightHoverBackground = 'rgba(52, 168, 83, 0.1)';
  const hoverBackground = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : greenLightHoverBackground;

  useEffect(() => {
    if (!authState.isAuthenticated || authState.userRole !== 'superadmin') {
      navigate('/no-access');
    } else {
      fetchPatchNotes();
    }
  }, [authState, navigate]);

  const fetchPatchNotes = async () => {
    try {
      const response = await axios.get('/api/patch-notes');
      console.log('ManagePatchNotes: Fetched patch notes:', response.data);
      setPatchNotes(response.data);
    } catch (err) {
      console.error('ManagePatchNotes: Error fetching patch notes:', err);
      setError('Failed to fetch patch notes');
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      const response = await axios.post('/api/patch-notes', { title, content, published: true });
      console.log('ManagePatchNotes: Create response:', response.data);
      setSuccess('Patch note created successfully');
      fetchPatchNotes();
      setLastUpdated(Date.now());
      setTitle('');
      setContent('');
    } catch (err) {
      console.error('ManagePatchNotes: Error creating patch note:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(err.response?.data?.message || 'Failed to create patch note');
    }
  };

  const handleEdit = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      const response = await axios.put(`/api/patch-notes/${selectedPatchNote._id}`, { title, content, published: true });
      console.log('ManagePatchNotes: Edit response:', response.data);
      setSuccess('Patch note updated successfully');
      fetchPatchNotes();
      setLastUpdated(Date.now());
      setSelectedPatchNote(null);
      setTitle('');
      setContent('');
    } catch (err) {
      console.error('ManagePatchNotes: Error updating patch note:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(err.response?.data?.message || 'Failed to update patch note');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await axios.delete(`/api/patch-notes/${selectedPatchNote._id}`);
      console.log('ManagePatchNotes: Delete response:', response.data);
      setSuccess('Patch note deleted successfully');
      fetchPatchNotes();
      setLastUpdated(Date.now());
      setSelectedPatchNote(null);
    } catch (err) {
      console.error('ManagePatchNotes: Error deleting patch note:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(err.response?.data?.message || 'Failed to delete patch note');
    }
  };

  const confirmAction = () => {
    if (modalAction === 'create') {
      handleCreate();
    } else if (modalAction === 'edit') {
      handleEdit();
    } else if (modalAction === 'delete') {
      handleDelete();
    }
    setModalOpen(false);
  };

  return (
    <>
      <Box
        sx={{
          minHeight: '100vh',
          background: muiTheme.custom.gradients.backgroundDefault,
          p: { xs: 2, sm: 3, md: 4 },
          position: 'relative',
          overflow: 'hidden',
          animation: `${fadeIn} 0.8s ease-out`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4, // Space between sections
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
        {/* Existing Patch Notes Container */}
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
            width: '100%',
            maxWidth: '1200px', // Limit width for larger screens
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: muiTheme.palette.primary.main,
              fontWeight: 'bold',
              textAlign: 'center',
              mb: 4,
            }}
          >
            Manage Patch Notes
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: muiTheme.palette.primary.main,
              fontWeight: 'bold',
              textAlign: 'left',
              mb: 2,
            }}
          >
            Existing Patch Notes
          </Typography>
          {patchNotes.length === 0 ? (
            <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.text.secondary }}>
              No patch notes available.
            </Typography>
          ) : (
            patchNotes.map((note, index) => (
              <React.Fragment key={note._id}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    background: index % 2 === 0 ? muiTheme.palette.background.listItem : 'transparent',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: hoverBackground,
                      transform: 'translateY(-2px)',
                      boxShadow: muiTheme.custom.shadows.listItem,
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "'Poppins', sans-serif",
                      color: muiTheme.palette.text.primary,
                      fontSize: { xs: '1rem', sm: '1.1rem' },
                    }}
                  >
                    {note.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      onClick={() => {
                        setSelectedPatchNote(note);
                        setTitle(note.title);
                        setContent(note.content);
                      }}
                      variant="outlined"
                      sx={{
                        borderColor: muiTheme.palette.primary.main,
                        color: muiTheme.palette.primary.main,
                        borderRadius: '8px',
                        py: 0.5,
                        px: 2,
                        transition: 'all 0.3s ease',
                        fontFamily: "'Poppins', sans-serif",
                        '&:hover': {
                          borderColor: greenLightColor,
                          color: greenLightColor,
                          backgroundColor: hoverBackground,
                          transform: 'scale(1.05)',
                        },
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedPatchNote(note);
                        setModalAction('delete');
                        setModalOpen(true);
                      }}
                      variant="contained"
                      sx={{
                        backgroundColor: muiTheme.palette.error.main,
                        color: '#ffffff',
                        borderRadius: '8px',
                        py: 0.5,
                        px: 2,
                        transition: 'all 0.3s ease',
                        fontFamily: "'Poppins', sans-serif",
                        '&:hover': {
                          backgroundColor: muiTheme.palette.error.dark,
                          transform: 'scale(1.05)',
                          boxShadow: muiTheme.custom.shadows.buttonHover,
                        },
                      }}
                    >
                      Delete
                    </Button>
                  </Box>
                </Box>
                {index < patchNotes.length - 1 && (
                  <Divider
                    sx={{
                      my: 1,
                      borderColor: muiTheme.palette.border.main,
                      opacity: 0.5,
                    }}
                  />
                )}
              </React.Fragment>
            ))
          )}
        </Box>

        {/* Create New Patchnote Container */}
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
            width: '100%',
            maxWidth: '1200px', // Limit width for larger screens
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: muiTheme.palette.primary.main,
              fontWeight: 'bold',
              textAlign: 'left',
              mb: 2,
            }}
          >
            {selectedPatchNote ? 'Edit Patch Note' : 'Create New Patch Note'}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 2,
            }}
          >
            <TextField
              margin="normal"
              required
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              InputLabelProps={{
                style: { fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.text.secondary },
              }}
              InputProps={{
                style: { fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.text.primary },
              }}
              sx={{
                maxWidth: '600px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  background: muiTheme.palette.background.listItem,
                  transition: 'all 0.3s ease',
                  '& fieldset': { borderColor: muiTheme.palette.border.main },
                  '&:hover fieldset': { borderColor: greenLightColor },
                  '&.Mui-focused fieldset': { borderColor: greenLightColor },
                },
              }}
            />
            <TextField
              margin="normal"
              required
              label="Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              fullWidth
              multiline
              rows={12}
              variant="outlined"
              InputLabelProps={{
                style: { fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.text.secondary },
              }}
              InputProps={{
                style: {
                  fontFamily: 'monospace',
                  color: muiTheme.palette.text.primary,
                  backgroundColor: muiTheme.palette.background.paper,
                  padding: '15px',
                },
              }}
              sx={{
                maxWidth: '600px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  transition: 'all 0.3s ease',
                  '& fieldset': { borderColor: muiTheme.palette.border.main },
                  '&:hover fieldset': { borderColor: greenLightColor },
                  '&.Mui-focused fieldset': { borderColor: greenLightColor },
                },
              }}
            />
            <Typography
              variant="body2"
              sx={{
                fontFamily: "'Poppins', sans-serif",
                color: muiTheme.palette.text.secondary,
                textAlign: 'left',
                maxWidth: '600px',
                mt: -1,
                mb: 1,
              }}
            >
              Use HTML tags like &lt;h1&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, etc., to format your content.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                onClick={() => {
                  setModalAction(selectedPatchNote ? 'edit' : 'create');
                  setModalOpen(true);
                }}
                variant="outlined"
                sx={{
                  borderColor: muiTheme.palette.primary.main,
                  color: muiTheme.palette.primary.main,
                  borderRadius: '8px',
                  py: 1.5,
                  px: 3,
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
                {selectedPatchNote ? 'Update' : 'Create'}
              </Button>
              {selectedPatchNote && (
                <Button
                  onClick={() => {
                    setSelectedPatchNote(null);
                    setTitle('');
                    setContent('');
                  }}
                  sx={{
                    color: muiTheme.palette.text.secondary,
                    borderRadius: '8px',
                    py: 1.5,
                    px: 3,
                    transition: 'all 0.3s ease',
                    fontFamily: "'Poppins', sans-serif",
                    '&:hover': {
                      color: muiTheme.palette.text.primary,
                      backgroundColor: hoverBackground,
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  Cancel Edit
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogTitle sx={{ fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.primary.main }}>
          Confirm {modalAction === 'create' ? 'Creation' : modalAction === 'edit' ? 'Update' : 'Deletion'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.text.primary }}>
            Are you sure you want to {modalAction === 'create' ? 'create this patch note' : modalAction === 'edit' ? 'update this patch note' : 'delete this patch note'}?
            {modalAction === 'delete' && ' This action cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setModalOpen(false)}
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: muiTheme.palette.text.primary,
              '&:hover': { color: greenLightColor, backgroundColor: hoverBackground },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmAction}
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: modalAction === 'delete' ? muiTheme.palette.error.main : muiTheme.palette.primary.main,
              '&:hover': {
                color: modalAction === 'delete' ? muiTheme.palette.error.dark : greenLightColor,
                backgroundColor: hoverBackground,
              },
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <CustomSnackbar open={!!success} onClose={() => setSuccess('')} severity="success" message={success} />
      <CustomSnackbar open={!!error} onClose={() => setError('')} severity="error" message={error} />
    </>
  );
};

export default ManagePatchNotes;