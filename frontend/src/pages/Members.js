import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Toolbar,
  Button,
  Modal,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save'; // Add for save button
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const Members = ({ isDarkMode, toggleTheme, user, setUser }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  useEffect(() => {
    if (!user || user.role !== 'superadmin') {
      navigate('/dashboard');
      return;
    }

    const fetchMembers = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/auth/members', { withCredentials: true });
        console.log('Members response:', response.data);
        if (!Array.isArray(response.data)) {
          throw new Error('Invalid data format from /auth/members');
        }
        const formattedMembers = response.data.map(u => ({
          _id: u._id || '',
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          email: u.email || '',
          role: u.role || 'viewer',
          selectedRole: u.role || 'viewer',
        }));
        setMembers(formattedMembers);
      } catch (error) {
        console.error('Error fetching members:', error.response?.data || error.message);
        setSnackbar({ open: true, message: 'Failed to fetch members', severity: 'error' });
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [user, navigate]);

  const handleUpdateUser = async () => {
    try {
      const response = await axios.put(
        '/auth/update-user',
        { 
          userId: editUser._id,
          firstName: editUser.firstName,
          lastName: editUser.lastName,
          role: editUser.selectedRole,
          password: editUser.password || undefined
        },
        { withCredentials: true }
      );
      setMembers(prev => prev.map(u => u._id === editUser._id ? { ...u, ...editUser, role: editUser.selectedRole } : u));
      setEditUser(null);
      setSnackbar({ open: true, message: response.data.message, severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update user', severity: 'error' });
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await axios.put(
        '/auth/update-user',
        { userId, role: newRole },
        { withCredentials: true }
      );
      setMembers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole, selectedRole: newRole } : u));
      setSnackbar({ open: true, message: response.data.message, severity: 'success' });
    } catch (error) {
      console.error('Error updating role:', error);
      setSnackbar({ open: true, message: 'Failed to update role', severity: 'error' });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const response = await axios.delete('/auth/delete-user', {
        data: { userId },
        withCredentials: true,
      });
      setMembers(prev => prev.filter(u => u._id !== userId));
      setSnackbar({ open: true, message: response.data.message, severity: 'success' });
    } catch (error) {
      console.error('Error deleting user:', error);
      setSnackbar({ open: true, message: 'Failed to delete user', severity: 'error' });
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await axios.get('/auth/logout', { withCredentials: true });
      localStorage.removeItem('isAuthenticated');
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setLogoutLoading(false);
    }
  };

  const columns = [
    { 
      field: 'name', 
      headerName: 'Name', 
      width: 200, 
      valueGetter: (params) => {
        const row = params?.row;
        console.log('Row data for name:', row); // Debug
        if (!row) return '';
        const fullName = `${row.firstName || ''} ${row.lastName || ''}`.trim();
        return fullName || 'Unnamed';
      }
    },
    { field: 'email', headerName: 'Email', width: 250 },
    {
      field: 'role',
      headerName: 'Role',
      width: 200,
      renderCell: (params) => (
        params?.row ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <select
              value={params.row.selectedRole || 'viewer'}
              onChange={(e) => {
                const newRole = e.target.value;
                setMembers(prev => prev.map(u => u._id === params.row._id ? { ...u, selectedRole: newRole } : u));
              }}
              style={{ padding: '8px', borderRadius: '4px', width: '120px' }}
            >
              <option value="superadmin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<SaveIcon />}
              onClick={() => handleRoleChange(params.row._id, params.row.selectedRole)}
            >
              Save
            </Button>
          </Box>
        ) : null
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        params?.row ? (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => setEditUser({ ...params.row, password: '' })}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={() => handleDeleteUser(params.row._id)}
            >
              Delete
            </Button>
          </Box>
        ) : null
      ),
    },
  ];

  if (loading || !user) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} handleDrawerToggle={handleDrawerToggle} user={user} handleLogout={handleLogout} logoutLoading={logoutLoading} isCollapsed={isCollapsed} />
      <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} user={user} handleLogout={handleLogout} logoutLoading={logoutLoading} />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: isDarkMode ? '#fff' : '#1976d2' }}>Members</Typography>
        <Box sx={{ height: 600, width: '100%', bgcolor: isDarkMode ? '#424242' : '#fff', borderRadius: 2, boxShadow: 3 }}>
          {members.length > 0 ? (
            <DataGrid
              rows={members}
              columns={columns}
              pageSizeOptions={[5, 10, 20]}
              pagination
              components={{ Toolbar: GridToolbar }}
              componentsProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 500 } } }}
              getRowId={(row) => row._id}
              sx={{
                '& .MuiDataGrid-cell': { borderBottom: `1px solid ${isDarkMode ? '#616161' : '#e0e0e0'}`, display: 'flex', alignItems: 'center' },
                '& .MuiDataGrid-columnHeaders': { bgcolor: isDarkMode ? '#616161' : '#f5f5f5', color: isDarkMode ? '#fff' : '#1976d2', fontWeight: 'bold' },
                '& .MuiDataGrid-toolbarContainer': { bgcolor: isDarkMode ? '#424242' : '#fafafa' },
              }}
            />
          ) : (
            <Typography sx={{ p: 2, textAlign: 'center', color: isDarkMode ? '#ccc' : '#555' }}>
              No members found
            </Typography>
          )}
        </Box>
        <Modal open={!!editUser} onClose={() => setEditUser(null)}>
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', bgcolor: 'background.paper', p: 4, borderRadius: 2, width: 400 }}>
            <Typography variant="h6" gutterBottom>Edit User</Typography>
            <TextField
              fullWidth
              label="First Name"
              value={editUser?.firstName || ''}
              onChange={(e) => setEditUser({ ...editUser, firstName: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Last Name"
              value={editUser?.lastName || ''}
              onChange={(e) => setEditUser({ ...editUser, lastName: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="New Password (optional)"
              type="password"
              value={editUser?.password || ''}
              onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
              margin="normal"
            />
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button variant="contained" color="primary" onClick={handleUpdateUser}>Save</Button>
              <Button variant="outlined" onClick={() => setEditUser(null)}>Cancel</Button>
            </Box>
          </Box>
        </Modal>
        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default Members;