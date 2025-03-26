import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Toolbar,
} from '@mui/material';
import Navbar from '../components/Navbar';  // ✅ Import Navbar
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SuperAdminDashboard = ({ isDarkMode, toggleTheme }) => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Fetch user data and pending users
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await axios.get('http://localhost:5000/auth/user', {
          withCredentials: true,
        });
        setUser(userResponse.data);

        const pendingResponse = await axios.get('http://localhost:5000/auth/pending-users', {
          withCredentials: true,
        });
        setPendingUsers(pendingResponse.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApproveUser = async (userId, role) => {
    try {
      const response = await axios.post(
        'http://localhost:5000/auth/approve-user',
        { userId, role },
        { withCredentials: true }
      );
      alert(response.data.message);
      setPendingUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId));
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Failed to approve user');
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await axios.get('http://localhost:5000/auth/logout', { withCredentials: true });
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setLogoutLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      {/* ✅ Navbar Component */}
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

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar /> 
        <Typography variant="h4" gutterBottom>
          Super Admin Dashboard
        </Typography>
        <Typography variant="h6" gutterBottom>
          Pending Users
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingUsers.length > 0 ? (
                pendingUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.firstName} {user.lastName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>
                      <Select
                        defaultValue="viewer"
                        onChange={(e) => handleApproveUser(user._id, e.target.value)}
                        size="small"
                      >
                        <MenuItem value="admin">Admin</MenuItem>
                        <MenuItem value="viewer">Viewer</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleApproveUser(user._id, 'viewer')}
                        size="small"
                      >
                        Approve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No pending users
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default SuperAdminDashboard;
