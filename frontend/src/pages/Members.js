// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   Box,
//   Toolbar,
//   Typography,
//   Button,
//   Modal,
//   TextField,
//   Snackbar,
//   Alert,
//   CircularProgress,
//   useTheme,
// } from '@mui/material';
// import { DataGrid, GridToolbar } from '@mui/x-data-grid';
// import DeleteIcon from '@mui/icons-material/Delete';
// import SaveIcon from '@mui/icons-material/Save';
// import axios from 'axios';
// import Layout from '../components/Layout';
// import { useAuth } from '../context/AuthContext';

// const Members = ({
//   isDarkMode,
//   toggleTheme,
//   isCollapsed,
//   toggleCollapse,
//   handleLogout,
//   logoutLoading,
// }) => {
//   const theme = useTheme();
//   const { authState } = useAuth();
//   const user = authState.isAuthenticated ? {
//     role: authState.userRole,
//     firstName: authState.firstName,
//     lastName: authState.lastName,
//     profilePicture: authState.profilePicture,
//   } : null;
//   const [members, setMembers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [editUser, setEditUser] = useState(null);
//   const [deleteUserId, setDeleteUserId] = useState(null);
//   const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (!authState.isAuthenticated || authState.userRole !== 'superadmin') {
//       navigate('/welcome');
//       return;
//     }

//     const fetchMembers = async () => {
//       try {
//         setLoading(true);
//         const response = await axios.get('http://localhost:5000/auth/members', { withCredentials: true });
//         console.log('Members response:', response.data);
//         if (!Array.isArray(response.data)) {
//           throw new Error('Invalid data format from /auth/members');
//         }
//         const formattedMembers = response.data.map((u) => ({
//           _id: u._id || '',
//           firstName: u.firstName || '',
//           lastName: u.lastName || '',
//           email: u.email || '',
//           role: u.role || 'viewer',
//           selectedRole: u.role || 'viewer',
//         }));
//         console.log('Formatted members:', formattedMembers);
//         setMembers(formattedMembers);
//       } catch (error) {
//         console.error('Error fetching members:', error.response?.data || error.message);
//         setSnackbar({ open: true, message: 'Failed to fetch members', severity: 'error' });
//         setMembers([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchMembers();
//   }, [authState, navigate]);

//   const handleUpdateUser = async () => {
//     try {
//       const response = await axios.put(
//         'http://localhost:5000/auth/update-user',
//         {
//           userId: editUser._id,
//           firstName: editUser.firstName,
//           lastName: editUser.lastName,
//           role: editUser.selectedRole,
//           password: editUser.password || undefined,
//         },
//         { withCredentials: true }
//       );
//       setMembers((prev) =>
//         prev.map((u) => (u._id === editUser._id ? { ...u, ...editUser, role: editUser.selectedRole } : u))
//       );
//       setEditUser(null);
//       setSnackbar({ open: true, message: response.data.message, severity: 'success' });
//     } catch (error) {
//       console.error('Error updating user:', error.response?.data || error.message);
//       setSnackbar({ open: true, message: 'Failed to update user', severity: 'error' });
//     }
//   };

//   const handleRoleChange = async (userId, newRole) => {
//     try {
//       const response = await axios.put(
//         'http://localhost:5000/auth/update-user',
//         { userId, role: newRole },
//         { withCredentials: true }
//       );
//       setMembers((prev) =>
//         prev.map((u) => (u._id === userId ? { ...u, role: newRole, selectedRole: newRole } : u))
//       );
//       setSnackbar({ open: true, message: response.data.message, severity: 'success' });
//     } catch (error) {
//       console.error('Error updating role:', error.response?.data || error.message);
//       setSnackbar({ open: true, message: 'Failed to update role', severity: 'error' });
//     }
//   };

//   const handleDeleteUser = async () => {
//     if (!deleteUserId) return;
//     try {
//       const response = await axios.delete('http://localhost:5000/auth/delete-user', {
//         data: { userId: deleteUserId },
//         withCredentials: true,
//       });
//       setMembers((prev) => prev.filter((u) => u._id !== deleteUserId));
//       setSnackbar({ open: true, message: response.data.message, severity: 'success' });
//     } catch (error) {
//       console.error('Error deleting user:', error.response?.data || error.message);
//       setSnackbar({ open: true, message: 'Failed to delete user', severity: 'error' });
//     } finally {
//       setDeleteUserId(null);
//     }
//   };

//   const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

//   const columns = [
//     {
//       field: 'name',
//       headerName: 'Name',
//       width: 200,
//       renderCell: (params) => {
//         const row = params?.row;
//         console.log('Row data for name:', row);
//         if (!row) return 'N/A';
//         const fullName = `${row.firstName || ''} ${row.lastName || ''}`.trim();
//         return fullName || 'Unnamed';
//       },
//     },
//     { field: 'email', headerName: 'Email', width: 250 },
//     {
//       field: 'role',
//       headerName: 'Role',
//       width: 200,
//       renderCell: (params) =>
//         params?.row ? (
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//             <select
//               value={params.row.selectedRole || 'viewer'}
//               onChange={(e) => {
//                 const newRole = e.target.value;
//                 setMembers((prev) =>
//                   prev.map((u) => (u._id === params.row._id ? { ...u, selectedRole: newRole } : u))
//                 );
//               }}
//               style={{ padding: '8px', borderRadius: '4px', width: '120px' }}
//             >
//               <option value="superadmin">Super Admin</option>
//               <option value="admin">Admin</option>
//               <option value="viewer">Viewer</option>
//             </select>
//             <Button
//               variant="contained"
//               color="primary"
//               size="small"
//               startIcon={<SaveIcon />}
//               onClick={() => handleRoleChange(params.row._id, params.row.selectedRole)}
//             >
//               Save
//             </Button>
//           </Box>
//         ) : null,
//     },
//     {
//       field: 'actions',
//       headerName: 'Actions',
//       width: 200,
//       renderCell: (params) =>
//         params?.row ? (
//           <Box sx={{ display: 'flex', gap: 1 }}>
//             <Button
//               variant="contained"
//               color="primary"
//               size="small"
//               onClick={() => setEditUser({ ...params.row, password: '' })}
//             >
//               Edit
//             </Button>
//             <Button
//               variant="contained"
//               color="error"
//               size="small"
//               startIcon={<DeleteIcon />}
//               onClick={() => setDeleteUserId(params.row._id)}
//             >
//               Delete
//             </Button>
//           </Box>
//         ) : null,
//     },
//   ];

//   if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;

//   return (
//     <Layout
//       isDarkMode={isDarkMode}
//       toggleTheme={toggleTheme}
//       user={user}
//       handleLogout={handleLogout}
//       logoutLoading={logoutLoading}
//       isCollapsed={isCollapsed}
//       toggleCollapse={toggleCollapse}
//     >
//       <Toolbar />
//       <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
//         Members
//       </Typography>
//       <Box sx={{ height: 600, width: '100%', bgcolor: theme.palette.background.paper, borderRadius: 2, boxShadow: 3 }}>
//         {members.length > 0 ? (
//           <DataGrid
//             rows={members}
//             columns={columns}
//             pageSizeOptions={[5, 10, 20]}
//             pagination
//             slots={{ toolbar: GridToolbar }}
//             slotProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 500 } } }}
//             getRowId={(row) => row._id}
//             sx={{
//               '& .MuiDataGrid-root': { border: 'none' },
//               '& .MuiDataGrid-cell': { borderBottom: `1px solid ${theme.palette.border.main}`, display: 'flex', alignItems: 'center' },
//               '& .MuiDataGrid-columnHeaders': { bgcolor: theme.palette.background.listItem, color: theme.palette.primary.main, fontWeight: 'bold' },
//               '& .MuiDataGrid-toolbarContainer': { bgcolor: theme.palette.background.listItem, borderBottom: `1px solid ${theme.palette.border.main}` },
//             }}
//           />
//         ) : (
//           <Typography sx={{ p: 2, textAlign: 'center', color: theme.palette.text.secondary }}>
//             No members found
//           </Typography>
//         )}
//       </Box>
//       <Modal open={!!editUser} onClose={() => setEditUser(null)}>
//         <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', bgcolor: theme.palette.background.paper, p: 4, borderRadius: 2, width: 400, boxShadow: 24 }}>
//           <Typography variant="h6" gutterBottom>Edit User</Typography>
//           <TextField
//             fullWidth
//             label="First Name"
//             value={editUser?.firstName || ''}
//             onChange={(e) => setEditUser({ ...editUser, firstName: e.target.value })}
//             margin="normal"
//           />
//           <TextField
//             fullWidth
//             label="Last Name"
//             value={editUser?.lastName || ''}
//             onChange={(e) => setEditUser({ ...editUser, lastName: e.target.value })}
//             margin="normal"
//           />
//           <TextField
//             fullWidth
//             label="New Password (optional)"
//             type="password"
//             value={editUser?.password || ''}
//             onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
//             margin="normal"
//           />
//           <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
//             <Button variant="contained" color="primary" onClick={handleUpdateUser}>Save</Button>
//             <Button variant="outlined" onClick={() => setEditUser(null)}>Cancel</Button>
//           </Box>
//         </Box>
//       </Modal>
//       <Modal open={!!deleteUserId} onClose={() => setDeleteUserId(null)}>
//         <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', bgcolor: theme.palette.background.paper, p: 4, borderRadius: 2, width: 400, boxShadow: 24 }}>
//           <Typography variant="h6" gutterBottom>Confirm Deletion</Typography>
//           <Typography variant="body1" sx={{ mb: 2 }}>
//             Are you sure you want to delete this user? This action cannot be undone.
//           </Typography>
//           <Box sx={{ display: 'flex', gap: 2 }}>
//             <Button variant="contained" color="error" onClick={handleDeleteUser}>Delete</Button>
//             <Button variant="outlined" onClick={() => setDeleteUserId(null)}>Cancel</Button>
//           </Box>
//         </Box>
//       </Modal>
//       <Snackbar
//         open={snackbar.open}
//         autoHideDuration={6000}
//         onClose={handleCloseSnackbar}
//         anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
//       >
//         <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
//           {snackbar.message}
//         </Alert>
//       </Snackbar>
//     </Layout>
//   );
// };

// export default Members;

import React from 'react';
import { Typography, Box } from '@mui/material';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const Members = ({ isDarkMode, toggleTheme }) => {
  const { authState } = useAuth();
  const user = authState.isAuthenticated
    ? {
        role: authState.userRole,
        firstName: authState.firstName,
        lastName: authState.lastName,
        profilePicture: authState.profilePicture,
      }
    : null;

  return (
    <Layout isDarkMode={isDarkMode} toggleTheme={toggleTheme} user={user}>
      <Box sx={{ mt: 8, p: 2 }}>
        <Typography variant="h4">Members</Typography>
        <Typography>Coming soon...</Typography>
      </Box>
    </Layout>
  );
};

export default Members;