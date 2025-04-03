import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Toolbar,
  Snackbar,
  Alert,
  Button,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import axios from 'axios';

const SuperAdminDashboard = ({ isDarkMode, toggleTheme, user, setUser }) => {
  const [pendingUsers, setPendingUsers] = useState([]); // Start as empty array
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const navigate = useNavigate();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  useEffect(() => {
    if (!user || user.role !== 'superadmin') {
      navigate('/dashboard');
      return;
    }

    const fetchPendingUsers = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/auth/pending-users', { withCredentials: true });
        console.log('Pending users response:', response.data);

        if (!Array.isArray(response.data)) {
          console.error('Response data is not an array:', response.data);
          throw new Error('Invalid data format from server');
        }

        const formattedUsers = response.data.map((user) => ({
          _id: user._id?.toString() || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          createdAt: user.createdAt || '',
          selectedRole: user.selectedRole || 'viewer',
        }));
        console.log('Formatted users:', formattedUsers);
        setPendingUsers(formattedUsers);
      } catch (error) {
        console.error('Error fetching pending users:', error.response?.data || error.message);
        setSnackbar({
          open: true,
          message: 'Failed to fetch pending users',
          severity: 'error',
        });
        setPendingUsers([]); // Ensure it’s an array even on error
      } finally {
        setLoading(false);
      }
    };

    fetchPendingUsers();
  }, [user, navigate]);

  useEffect(() => {
    console.log('pendingUsers state updated:', pendingUsers);
  }, [pendingUsers]);

  const handleApproveUser = async (userId, role) => {
    console.log('Approving user:', userId, 'with role:', role); // Debug
    try {
      setProcessingId(userId);
      const response = await axios.post(
        '/auth/approve-user',
        { userId, role },
        { withCredentials: true }
      );
      console.log('Approve response:', response.data); // Debug
      setPendingUsers((prev) => prev.filter((u) => u._id !== userId));
      setSnackbar({ open: true, message: response.data.message, severity: 'success' });
    } catch (error) {
      console.error('Error approving user:', error.response?.data || error.message);
      setSnackbar({ open: true, message: 'Failed to approve user', severity: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeclineUser = async (userId) => {
    console.log('Declining user:', userId); // Debug
    try {
      setProcessingId(userId);
      const response = await axios.post(
        '/auth/reject-user',
        { userId },
        { withCredentials: true }
      );
      console.log('Decline response:', response.data); // Debug
      setPendingUsers((prev) => prev.filter((u) => u._id !== userId));
      setSnackbar({ open: true, message: response.data.message, severity: 'success' });
    } catch (error) {
      console.error('Error declining user:', error.response?.data || error.message);
      setSnackbar({ open: true, message: 'Failed to decline user', severity: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      const response = await axios.get('/auth/logout', { withCredentials: true });
      console.log('Logout response:', response.data);
      localStorage.removeItem('isAuthenticated');
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error.response?.data || error.message);
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleCloseSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const columns = [
    {
      field: 'name',
      headerName: 'Name',
      width: 200,
      valueGetter: (params) => {
        if (!params || !params.row) return '';
        return `${params.row.firstName || ''} ${params.row.lastName || ''}`.trim();
      },
    },
    { field: 'email', headerName: 'Email', width: 250 },
    {
      field: 'role',
      headerName: 'Assign Role',
      width: 150,
      renderCell: (params) => (
        <select
          value={params.row.selectedRole || 'viewer'}
          onChange={(e) => {
            const updatedUsers = pendingUsers.map((u) =>
              u._id === params.row._id ? { ...u, selectedRole: e.target.value } : u
            );
            setPendingUsers(updatedUsers);
          }}
          disabled={processingId === params.row._id}
          style={{ padding: '8px', borderRadius: '4px', width: '100%' }}
        >
          <option value="admin">Admin</option>
          <option value="viewer">Viewer</option>
        </select>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 220,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={processingId === params.row._id ? <CircularProgress size={20} /> : <CheckCircleIcon />}
            onClick={() => handleApproveUser(params.row._id, params.row.selectedRole || 'viewer')}
            disabled={processingId === params.row._id}
          >
            Approve
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            startIcon={processingId === params.row._id ? <CircularProgress size={20} /> : <CancelIcon />}
            onClick={() => handleDeclineUser(params.row._id)}
            disabled={processingId === params.row._id}
          >
            Decline
          </Button>
        </Box>
      ),
    },
  ];

  if (loading || !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        handleDrawerToggle={handleDrawerToggle}
        user={user}
        handleLogout={handleLogout}
        logoutLoading={logoutLoading}
        isCollapsed={isCollapsed}
      />
      <Sidebar
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
        user={user}
        handleLogout={handleLogout}
        logoutLoading={logoutLoading}
      />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: isDarkMode ? '#fff' : '#1976d2' }}>
          Super Admin Dashboard
        </Typography>
        <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#ccc' : '#555' }}>
          Pending Users
        </Typography>
        <Box sx={{ height: 600, width: '100%', bgcolor: isDarkMode ? '#424242' : '#fff', borderRadius: 2, boxShadow: 3 }}>
          {pendingUsers.length > 0 ? (
            <DataGrid
              rows={pendingUsers}
              columns={columns}
              pageSizeOptions={[5, 10, 20]}
              pagination
              components={{ Toolbar: GridToolbar }}
              componentsProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 500 },
                },
              }}
              getRowId={(row) => row._id}
              sx={{
                '& .MuiDataGrid-root': { border: 'none' },
                '& .MuiDataGrid-cell': {
                  borderBottom: `1px solid ${isDarkMode ? '#616161' : '#e0e0e0'}`,
                  display: 'flex',
                  alignItems: 'center', // Vertically center content
                },
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: isDarkMode ? '#616161' : '#f5f5f5',
                  color: isDarkMode ? '#fff' : '#1976d2',
                  fontWeight: 'bold',
                },
                '& .MuiDataGrid-toolbarContainer': {
                  bgcolor: isDarkMode ? '#424242' : '#fafafa',
                  borderBottom: `1px solid ${isDarkMode ? '#616161' : '#e0e0e0'}`,
                },
              }}
            />
          ) : (
            <Typography sx={{ p: 2, textAlign: 'center', color: isDarkMode ? '#ccc' : '#555' }}>
              No pending users
            </Typography>
          )}
        </Box>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default SuperAdminDashboard;