import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Toolbar,
  Typography,
  useTheme,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Modal,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TextField,
  TableSortLabel,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import Layout from '../components/Layout';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const SuperAdminDashboard = ({ isDarkMode, toggleTheme }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { authState } = useAuth();

  // State for Pending Members
  const [pendingMembers, setPendingMembers] = useState([]);
  const [pendingPage, setPendingPage] = useState(0);
  const [pendingRowsPerPage, setPendingRowsPerPage] = useState(5);
  const [pendingSearch, setPendingSearch] = useState('');
  const [pendingSortField, setPendingSortField] = useState('name');
  const [pendingSortOrder, setPendingSortOrder] = useState('asc');
  const [selectedPending, setSelectedPending] = useState([]);

  // State for Approved Members
  const [approvedMembers, setApprovedMembers] = useState([]);
  const [approvedPage, setApprovedPage] = useState(0);
  const [approvedRowsPerPage, setApprovedRowsPerPage] = useState(5);
  const [approvedSearch, setApprovedSearch] = useState('');
  const [approvedSortField, setApprovedSortField] = useState('name');
  const [approvedSortOrder, setApprovedSortOrder] = useState('asc');
  const [selectedApproved, setSelectedApproved] = useState([]);

  // Other state
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openModal, setOpenModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [tempPermissions, setTempPermissions] = useState({});

  const user = authState.isAuthenticated
    ? {
        role: authState.userRole,
        firstName: authState.firstName,
        lastName: authState.lastName,
        profilePicture: authState.profilePicture,
      }
    : null;

  useEffect(() => {
    if (!authState.isAuthenticated || authState.userRole !== 'superadmin') {
      navigate('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const pendingResponse = await axios.get('http://localhost:5000/auth/pending-users', { withCredentials: true });
        if (!Array.isArray(pendingResponse.data)) {
          throw new Error('Invalid data format from /auth/pending-users');
        }
        const filteredPendingMembers = pendingResponse.data.filter(
          (member) => member && typeof member === 'object' && member._id
        );
        console.log('Pending Members:', filteredPendingMembers); // Debug log
        setPendingMembers(filteredPendingMembers);

        const approvedResponse = await axios.get('http://localhost:5000/auth/members', { withCredentials: true });
        if (!Array.isArray(approvedResponse.data)) {
          throw new Error('Invalid data format from /auth/members');
        }
        const filteredApprovedMembers = approvedResponse.data.filter(
          (member) => member && typeof member === 'object' && member._id
        );
        console.log('Approved Members:', filteredApprovedMembers); // Debug log
        setApprovedMembers(filteredApprovedMembers);
      } catch (error) {
        console.error('Error fetching data:', error.response?.data || error.message);
        setPendingMembers([]);
        setApprovedMembers([]);
        setSnackbar({ open: true, message: 'Failed to fetch data', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authState, navigate]);

  // Sorting Logic
  const sortData = (data, sortField, sortOrder, getValue) => {
    return [...data].sort((a, b) => {
      let valueA = getValue(a);
      let valueB = getValue(b);
      if (sortField === 'createdAt') {
        valueA = new Date(valueA);
        valueB = new Date(valueB);
      }
      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Search and Sort for Pending Members
  const filteredPendingMembers = useMemo(() => {
    let filtered = pendingMembers.filter((member) => {
      const name = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();
      const email = (member.email || '').toLowerCase();
      const searchTerm = pendingSearch.toLowerCase();
      return name.includes(searchTerm) || email.includes(searchTerm);
    });

    const sorted = sortData(filtered, pendingSortField, pendingSortOrder, (member) => {
      if (pendingSortField === 'name') return `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();
      if (pendingSortField === 'email') return (member.email || '').toLowerCase();
      if (pendingSortField === 'createdAt') return member.createdAt || '';
      return '';
    });

    console.log('Filtered Pending Members:', sorted); // Debug log
    return sorted;
  }, [pendingMembers, pendingSearch, pendingSortField, pendingSortOrder]);

  // Search and Sort for Approved Members
  const filteredApprovedMembers = useMemo(() => {
    let filtered = approvedMembers.filter((member) => {
      const name = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();
      const email = (member.email || '').toLowerCase();
      const role = (member.role || '').toLowerCase();
      const searchTerm = approvedSearch.toLowerCase();
      return name.includes(searchTerm) || email.includes(searchTerm) || role.includes(searchTerm);
    });

    const sorted = sortData(filtered, approvedSortField, approvedSortOrder, (member) => {
      if (approvedSortField === 'name') return `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();
      if (approvedSortField === 'email') return (member.email || '').toLowerCase();
      if (approvedSortField === 'role') return (member.role || '').toLowerCase();
      return '';
    });

    console.log('Filtered Approved Members:', sorted); // Debug log
    return sorted;
  }, [approvedMembers, approvedSearch, approvedSortField, approvedSortOrder]);

  // Pagination Handlers
  const handlePendingChangePage = (event, newPage) => setPendingPage(newPage);
  const handlePendingChangeRowsPerPage = (event) => {
    setPendingRowsPerPage(parseInt(event.target.value, 10));
    setPendingPage(0);
  };
  const handleApprovedChangePage = (event, newPage) => setApprovedPage(newPage);
  const handleApprovedChangeRowsPerPage = (event) => {
    setApprovedRowsPerPage(parseInt(event.target.value, 10));
    setApprovedPage(0);
  };

  // Sorting Handlers
  const handlePendingSort = (field) => {
    const isAsc = pendingSortField === field && pendingSortOrder === 'asc';
    setPendingSortOrder(isAsc ? 'desc' : 'asc');
    setPendingSortField(field);
  };
  const handleApprovedSort = (field) => {
    const isAsc = approvedSortField === field && approvedSortOrder === 'asc';
    setApprovedSortOrder(isAsc ? 'desc' : 'asc');
    setApprovedSortField(field);
  };

  // Selection Handlers
  const handleSelectPending = (id) => {
    setSelectedPending((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };
  const handleSelectAllPending = () => {
    if (selectedPending.length === filteredPendingMembers.length) {
      setSelectedPending([]);
    } else {
      setSelectedPending(filteredPendingMembers.map((member) => member._id));
    }
  };
  const handleSelectApproved = (id) => {
    setSelectedApproved((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };
  const handleSelectAllApproved = () => {
    if (selectedApproved.length === filteredApprovedMembers.length) {
      setSelectedApproved([]);
    } else {
      setSelectedApproved(filteredApprovedMembers.map((member) => member._id));
    }
  };

  const handleApproveMember = async (userId) => {
    try {
      const defaultPermissions = {
        dashboard: true,
        members: false,
        partners: false,
        hrManagement: false,
        projects: false,
        itInventory: false,
        quickTools: false,
      };
      const response = await axios.post(
        'http://localhost:5000/auth/approve-user',
        { userId, role: 'viewer', accessPermissions: defaultPermissions },
        { withCredentials: true }
      );
      setPendingMembers((prev) => prev.filter((member) => member._id !== userId));
      const approvedResponse = await axios.get('http://localhost:5000/auth/members', { withCredentials: true });
      const filteredApprovedMembers = approvedResponse.data.filter(
        (member) => member && typeof member === 'object' && member._id
      );
      setApprovedMembers(filteredApprovedMembers);
      setSelectedPending((prev) => prev.filter((id) => id !== userId));
      setSnackbar({ open: true, message: response.data.message, severity: 'success' });
    } catch (error) {
      console.error('Error approving member:', error.response?.data || error.message);
      setSnackbar({ open: true, message: 'Failed to approve member', severity: 'error' });
    }
  };

  const handleBulkApprove = async () => {
    if (selectedPending.length === 0) {
      setSnackbar({ open: true, message: 'No members selected', severity: 'warning' });
      return;
    }
    try {
      const defaultPermissions = {
        dashboard: true,
        members: false,
        partners: false,
        hrManagement: false,
        projects: false,
        itInventory: false,
        quickTools: false,
      };
      await Promise.all(
        selectedPending.map((userId) =>
          axios.post(
            'http://localhost:5000/auth/approve-user',
            { userId, role: 'viewer', accessPermissions: defaultPermissions },
            { withCredentials: true }
          )
        )
      );
      setPendingMembers((prev) => prev.filter((member) => !selectedPending.includes(member._id)));
      const approvedResponse = await axios.get('http://localhost:5000/auth/members', { withCredentials: true });
      const filteredApprovedMembers = approvedResponse.data.filter(
        (member) => member && typeof member === 'object' && member._id
      );
      setApprovedMembers(filteredApprovedMembers);
      setSelectedPending([]);
      setSnackbar({ open: true, message: `${selectedPending.length} members approved`, severity: 'success' });
    } catch (error) {
      console.error('Error bulk approving members:', error.response?.data || error.message);
      setSnackbar({ open: true, message: 'Failed to approve members', severity: 'error' });
    }
  };

  const handleRejectMember = async (userId) => {
    try {
      const response = await axios.post(
        'http://localhost:5000/auth/reject-user',
        { userId },
        { withCredentials: true }
      );
      setPendingMembers((prev) => prev.filter((member) => member._id !== userId));
      setSelectedPending((prev) => prev.filter((id) => id !== userId));
      setSnackbar({ open: true, message: response.data.message, severity: 'success' });
    } catch (error) {
      console.error('Error rejecting member:', error.response?.data || error.message);
      setSnackbar({ open: true, message: 'Failed to reject member', severity: 'error' });
    }
  };

  const handleBulkReject = async () => {
    if (selectedPending.length === 0) {
      setSnackbar({ open: true, message: 'No members selected', severity: 'warning' });
      return;
    }
    try {
      await Promise.all(
        selectedPending.map((userId) =>
          axios.post('http://localhost:5000/auth/reject-user', { userId }, { withCredentials: true })
        )
      );
      setPendingMembers((prev) => prev.filter((member) => !selectedPending.includes(member._id)));
      setSelectedPending([]);
      setSnackbar({ open: true, message: `${selectedPending.length} members rejected`, severity: 'success' });
    } catch (error) {
      console.error('Error bulk rejecting members:', error.response?.data || error.message);
      setSnackbar({ open: true, message: 'Failed to reject members', severity: 'error' });
    }
  };

  const handleAccessChange = (page, checked) => {
    setTempPermissions((prev) => ({ ...prev, [page]: checked }));
  };

  const handleSaveAccess = async () => {
    if (!selectedMember) return;
    try {
      await axios.put(
        'http://localhost:5000/auth/update-access',
        { userId: selectedMember._id, accessPermissions: tempPermissions },
        { withCredentials: true }
      );
      setApprovedMembers((prev) =>
        prev.map((m) =>
          m._id === selectedMember._id ? { ...m, accessPermissions: tempPermissions } : m
        )
      );
      setSnackbar({ open: true, message: 'Access updated successfully', severity: 'success' });
      handleCloseModal();
    } catch (error) {
      console.error('Error updating access:', error.response?.data || error.message);
      setSnackbar({ open: true, message: 'Failed to update access', severity: 'error' });
    }
  };

  const handleBulkAccessChange = async (page, checked) => {
    if (selectedApproved.length === 0) {
      setSnackbar({ open: true, message: 'No members selected', severity: 'warning' });
      return;
    }
    try {
      await Promise.all(
        selectedApproved.map((userId) => {
          const member = approvedMembers.find((m) => m._id === userId);
          const updatedPermissions = { ...member.accessPermissions, [page]: checked };
          return axios.put(
            'http://localhost:5000/auth/update-access',
            { userId, accessPermissions: updatedPermissions },
            { withCredentials: true }
          );
        })
      );
      setApprovedMembers((prev) =>
        prev.map((member) =>
          selectedApproved.includes(member._id)
            ? { ...member, accessPermissions: { ...member.accessPermissions, [page]: checked } }
            : member
        )
      );
      setSnackbar({
        open: true,
        message: `Updated ${page} access for ${selectedApproved.length} members`,
        severity: 'success',
      });
    } catch (error) {
      console.error('Error bulk updating access:', error.response?.data || error.message);
      setSnackbar({ open: true, message: 'Failed to update access', severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const handleOpenModal = (member) => {
    setSelectedMember(member);
    setTempPermissions(member.accessPermissions || {});
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedMember(null);
    setTempPermissions({});
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const availablePages = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'members', label: 'Members' },
    { key: 'partners', label: 'Partners' },
    { key: 'hrManagement', label: 'HR Management' },
    { key: 'projects', label: 'Projects' },
    { key: 'itInventory', label: 'IT Inventory' },
    { key: 'quickTools', label: 'Quick Tools' },
  ];

  return (
    <Layout isDarkMode={isDarkMode} toggleTheme={toggleTheme} user={user}>
      <Box
        sx={{
          minHeight: '100vh',
          background: isDarkMode
            ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
            : 'linear-gradient(135deg, #e0f7fa 0%, #b3e5fc 100%)',
          p: 2,
        }}
      >
        <Toolbar />
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            fontFamily: '"Poppins", sans-serif',
            color: isDarkMode ? '#ffffff' : '#1976d2',
          }}
        >
          Super Admin Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              boxShadow: isDarkMode
                ? '0 8px 32px rgba(0, 0, 0, 0.5)'
                : '0 8px 32px rgba(0, 0, 0, 0.1)',
              flex: '1 1 300px',
              border: isDarkMode
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : '1px solid rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
              },
            }}
          >
            <Typography variant="h6" sx={{ fontFamily: '"Poppins", sans-serif', color: isDarkMode ? '#cccccc' : '#666666' }}>
              Total Members
            </Typography>
            <Typography variant="h4" sx={{ mt: 1, color: theme.palette.primary.main, fontFamily: '"Poppins", sans-serif' }}>
              {approvedMembers.length}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              boxShadow: isDarkMode
                ? '0 8px 32px rgba(0, 0, 0, 0.5)'
                : '0 8px 32px rgba(0, 0, 0, 0.1)',
              flex: '1 1 300px',
              border: isDarkMode
                ? '1px solid rgba(255, 255, 257, 0.1)'
                : '1px solid rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
              },
            }}
          >
            <Typography variant="h6" sx={{ fontFamily: '"Poppins", sans-serif', color: isDarkMode ? '#cccccc' : '#666666' }}>
              Pending Approvals
            </Typography>
            <Typography variant="h4" sx={{ mt: 1, color: theme.palette.primary.main, fontFamily: '"Poppins", sans-serif' }}>
              {pendingMembers.length}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              boxShadow: isDarkMode
                ? '0 8px 32px rgba(0, 0, 0, 0.5)'
                : '0 8px 32px rgba(0, 0, 0, 0.1)',
              flex: '1 1 300px',
              border: isDarkMode
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : '1px solid rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
              },
            }}
          >
            <Typography variant="h6" sx={{ fontFamily: '"Poppins", sans-serif', color: isDarkMode ? '#cccccc' : '#666666' }}>
              Recent Activity
            </Typography>
            <Typography variant="body1" sx={{ mt: 1, fontFamily: '"Poppins", sans-serif', color: isDarkMode ? '#ffffff' : '#333333' }}>
              Last login: 5 minutes ago
            </Typography>
          </Box>
        </Box>
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            mt: 4,
            fontFamily: '"Poppins", sans-serif',
            color: isDarkMode ? '#ffffff' : '#1976d2',
          }}
        >
          Pending Member Approvals
        </Typography>
        {pendingMembers.length > 0 ? (
          <>
            <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                label="Search Pending Members"
                variant="outlined"
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
                sx={{ flex: 1 }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleBulkApprove}
                disabled={selectedPending.length === 0}
                sx={{ fontFamily: '"Poppins", sans-serif', borderRadius: '8px' }}
              >
                Approve Selected ({selectedPending.length})
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleBulkReject}
                disabled={selectedPending.length === 0}
                sx={{ fontFamily: '"Poppins", sans-serif', borderRadius: '8px' }}
              >
                Reject Selected ({selectedPending.length})
              </Button>
            </Box>
            <TableContainer
              component={Paper}
              sx={{
                background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(5px)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: isDarkMode
                  ? '0 8px 32px rgba(0, 0, 0, 0.5)'
                  : '0 8px 32px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Table sx={{ minWidth: 650 }} aria-label="pending members table">
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontFamily: '"Poppins", sans-serif',
                        background: isDarkMode
                          ? 'linear-gradient(90deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%)'
                          : 'linear-gradient(90deg, rgba(224, 247, 250, 0.9) 0%, rgba(179, 229, 252, 0.9) 100%)',
                        color: isDarkMode ? '#ffffff' : '#1976d2',
                        fontWeight: 'bold',
                      }}
                    >
                      <Checkbox
                        checked={selectedPending.length === filteredPendingMembers.length && filteredPendingMembers.length > 0}
                        onChange={handleSelectAllPending}
                        sx={{
                          color: isDarkMode ? '#ffffff' : '#1976d2',
                          '&.Mui-checked': { color: theme.palette.secondary.main },
                        }}
                      />
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: '"Poppins", sans-serif',
                        background: isDarkMode
                          ? 'linear-gradient(90deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%)'
                          : 'linear-gradient(90deg, rgba(224, 247, 250, 0.9) 0%, rgba(179, 229, 252, 0.9) 100%)',
                        color: isDarkMode ? '#ffffff' : '#1976d2',
                        fontWeight: 'bold',
                      }}
                    >
                      <TableSortLabel
                        active={pendingSortField === 'name'}
                        direction={pendingSortOrder}
                        onClick={() => handlePendingSort('name')}
                        sx={{ color: isDarkMode ? '#ffffff' : '#1976d2' }}
                      >
                        Name
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: '"Poppins", sans-serif',
                        background: isDarkMode
                          ? 'linear-gradient(90deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%)'
                          : 'linear-gradient(90deg, rgba(224, 247, 250, 0.9) 0%, rgba(179, 229, 252, 0.9) 100%)',
                        color: isDarkMode ? '#ffffff' : '#1976d2',
                        fontWeight: 'bold',
                      }}
                    >
                      <TableSortLabel
                        active={pendingSortField === 'email'}
                        direction={pendingSortOrder}
                        onClick={() => handlePendingSort('email')}
                        sx={{ color: isDarkMode ? '#ffffff' : '#1976d2' }}
                      >
                        Email
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: '"Poppins", sans-serif',
                        background: isDarkMode
                          ? 'linear-gradient(90deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%)'
                          : 'linear-gradient(90deg, rgba(224, 247, 250, 0.9) 0%, rgba(179, 229, 252, 0.9) 100%)',
                        color: isDarkMode ? '#ffffff' : '#1976d2',
                        fontWeight: 'bold',
                      }}
                    >
                      <TableSortLabel
                        active={pendingSortField === 'createdAt'}
                        direction={pendingSortOrder}
                        onClick={() => handlePendingSort('createdAt')}
                        sx={{ color: isDarkMode ? '#ffffff' : '#1976d2' }}
                      >
                        Created At
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: '"Poppins", sans-serif',
                        background: isDarkMode
                          ? 'linear-gradient(90deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%)'
                          : 'linear-gradient(90deg, rgba(224, 247, 250, 0.9) 0%, rgba(179, 229, 252, 0.9) 100%)',
                        color: isDarkMode ? '#ffffff' : '#1976d2',
                        fontWeight: 'bold',
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPendingMembers
                    .slice(pendingPage * pendingRowsPerPage, pendingPage * pendingRowsPerPage + pendingRowsPerPage)
                    .map((member) => (
                      <TableRow
                        key={member._id}
                        sx={{ '&:hover': { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' } }}
                      >
                        <TableCell sx={{ fontFamily: '"Poppins", sans-serif', color: isDarkMode ? '#ffffff' : '#333333' }}>
                          <Checkbox
                            checked={selectedPending.includes(member._id)}
                            onChange={() => handleSelectPending(member._id)}
                            sx={{
                              color: isDarkMode ? '#ffffff' : '#1976d2',
                              '&.Mui-checked': { color: theme.palette.secondary.main },
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontFamily: '"Poppins", sans-serif', color: isDarkMode ? '#ffffff' : '#333333' }}>
                          {`${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unnamed'}
                        </TableCell>
                        <TableCell sx={{ fontFamily: '"Poppins", sans-serif', color: isDarkMode ? '#ffffff' : '#333333' }}>
                          {member.email || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ fontFamily: '"Poppins", sans-serif', color: isDarkMode ? '#ffffff' : '#333333' }}>
                          {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell sx={{ fontFamily: '"Poppins", sans-serif' }}>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleApproveMember(member._id)}
                            sx={{ mr: 1, fontFamily: '"Poppins", sans-serif', borderRadius: '8px' }}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            onClick={() => handleRejectMember(member._id)}
                            sx={{ fontFamily: '"Poppins", sans-serif', borderRadius: '8px' }}
                          >
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredPendingMembers.length}
              rowsPerPage={pendingRowsPerPage}
              page={pendingPage}
              onPageChange={handlePendingChangePage}
              onRowsPerPageChange={handlePendingChangeRowsPerPage}
            />
          </>
        ) : (
          <Typography sx={{ p: 2, color: theme.palette.text.secondary, fontFamily: '"Poppins", sans-serif' }}>
            No pending approvals
          </Typography>
        )}
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            mt: 4,
            fontFamily: '"Poppins", sans-serif',
            color: isDarkMode ? '#ffffff' : '#1976d2',
          }}
        >
          Manage Member Access
        </Typography>
        {approvedMembers.length > 0 ? (
          <>
            <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                label="Search Approved Members"
                variant="outlined"
                value={approvedSearch}
                onChange={(e) => setApprovedSearch(e.target.value)}
                sx={{ flex: 1, minWidth: 200 }}
              />
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {availablePages.map((page) => (
                  <Box key={page.key} sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          onChange={(e) => handleBulkAccessChange(page.key, e.target.checked)}
                          disabled={selectedApproved.length === 0}
                          sx={{
                            color: isDarkMode ? '#ffffff' : '#1976d2',
                            '&.Mui-checked': { color: theme.palette.secondary.main },
                          }}
                        />
                      }
                      label={`Toggle ${page.label}`}
                      sx={{
                        fontFamily: '"Poppins", sans-serif',
                        color: isDarkMode ? '#ffffff' : '#333333',
                        m: 0,
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
            <TableContainer
              component={Paper}
              sx={{
                background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(5px)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: isDarkMode
                  ? '0 8px 32px rgba(0, 0, 0, 0.5)'
                  : '0 8px 32px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Table sx={{ minWidth: 650 }} aria-label="approved members table">
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontFamily: '"Poppins", sans-serif',
                        background: isDarkMode
                          ? 'linear-gradient(90deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%)'
                          : 'linear-gradient(90deg, rgba(224, 247, 250, 0.9) 0%, rgba(179, 229, 252, 0.9) 100%)',
                        color: isDarkMode ? '#ffffff' : '#1976d2',
                        fontWeight: 'bold',
                      }}
                    >
                      <Checkbox
                        checked={selectedApproved.length === filteredApprovedMembers.length && filteredApprovedMembers.length > 0}
                        onChange={handleSelectAllApproved}
                        sx={{
                          color: isDarkMode ? '#ffffff' : '#1976d2',
                          '&.Mui-checked': { color: theme.palette.secondary.main },
                        }}
                      />
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: '"Poppins", sans-serif',
                        background: isDarkMode
                          ? 'linear-gradient(90deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%)'
                          : 'linear-gradient(90deg, rgba(224, 247, 250, 0.9) 0%, rgba(179, 229, 252, 0.9) 100%)',
                        color: isDarkMode ? '#ffffff' : '#1976d2',
                        fontWeight: 'bold',
                      }}
                    >
                      <TableSortLabel
                        active={approvedSortField === 'name'}
                        direction={approvedSortOrder}
                        onClick={() => handleApprovedSort('name')}
                        sx={{ color: isDarkMode ? '#ffffff' : '#1976d2' }}
                      >
                        Name
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: '"Poppins", sans-serif',
                        background: isDarkMode
                          ? 'linear-gradient(90deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%)'
                          : 'linear-gradient(90deg, rgba(224, 247, 250, 0.9) 0%, rgba(179, 229, 252, 0.9) 100%)',
                        color: isDarkMode ? '#ffffff' : '#1976d2',
                        fontWeight: 'bold',
                      }}
                    >
                      <TableSortLabel
                        active={approvedSortField === 'email'}
                        direction={approvedSortOrder}
                        onClick={() => handleApprovedSort('email')}
                        sx={{ color: isDarkMode ? '#ffffff' : '#1976d2' }}
                      >
                        Email
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: '"Poppins", sans-serif',
                        background: isDarkMode
                          ? 'linear-gradient(90deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%)'
                          : 'linear-gradient(90deg, rgba(224, 247, 250, 0.9) 0%, rgba(179, 229, 252, 0.9) 100%)',
                        color: isDarkMode ? '#ffffff' : '#1976d2',
                        fontWeight: 'bold',
                      }}
                    >
                      <TableSortLabel
                        active={approvedSortField === 'role'}
                        direction={approvedSortOrder}
                        onClick={() => handleApprovedSort('role')}
                        sx={{ color: isDarkMode ? '#ffffff' : '#1976d2' }}
                      >
                        Role
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: '"Poppins", sans-serif',
                        background: isDarkMode
                          ? 'linear-gradient(90deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%)'
                          : 'linear-gradient(90deg, rgba(224, 247, 250, 0.9) 0%, rgba(179, 229, 252, 0.9) 100%)',
                        color: isDarkMode ? '#ffffff' : '#1976d2',
                        fontWeight: 'bold',
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredApprovedMembers
                    .slice(approvedPage * approvedRowsPerPage, approvedPage * approvedRowsPerPage + approvedRowsPerPage)
                    .map((member) => (
                      <TableRow
                        key={member._id}
                        sx={{ '&:hover': { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' } }}
                      >
                        <TableCell sx={{ fontFamily: '"Poppins", sans-serif', color: isDarkMode ? '#ffffff' : '#333333' }}>
                          <Checkbox
                            checked={selectedApproved.includes(member._id)}
                            onChange={() => handleSelectApproved(member._id)}
                            sx={{
                              color: isDarkMode ? '#ffffff' : '#1976d2',
                              '&.Mui-checked': { color: theme.palette.secondary.main },
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontFamily: '"Poppins", sans-serif', color: isDarkMode ? '#ffffff' : '#333333' }}>
                          {`${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unnamed'}
                        </TableCell>
                        <TableCell sx={{ fontFamily: '"Poppins", sans-serif', color: isDarkMode ? '#ffffff' : '#333333' }}>
                          {member.email || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ fontFamily: '"Poppins", sans-serif', color: isDarkMode ? '#ffffff' : '#333333' }}>
                          {member.role || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ fontFamily: '"Poppins", sans-serif' }}>
                          <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => handleOpenModal(member)}
                            sx={{ fontFamily: '"Poppins", sans-serif', borderRadius: '8px' }}
                            disabled={member.role === 'superadmin'}
                          >
                            Edit Access
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredApprovedMembers.length}
              rowsPerPage={approvedRowsPerPage}
              page={approvedPage}
              onPageChange={handleApprovedChangePage}
              onRowsPerPageChange={handleApprovedChangeRowsPerPage}
            />
          </>
        ) : (
          <Typography sx={{ p: 2, color: theme.palette.text.secondary, fontFamily: '"Poppins", sans-serif' }}>
            No approved members
          </Typography>
        )}
        <Modal
          open={openModal}
          onClose={handleCloseModal}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 400,
              p: 4,
              borderRadius: 2,
              background: isDarkMode
                ? 'linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%)'
                : 'linear-gradient(135deg, rgba(224, 247, 250, 0.9) 0%, rgba(179, 229, 252, 0.9) 100%)',
              backdropFilter: 'blur(10px)',
              boxShadow: isDarkMode
                ? '0 8px 32px rgba(0, 0, 0, 0.5)'
                : '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: isDarkMode
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : '1px solid rgba(0, 0, 0, 0.1)',
            }}
          >
            <Typography
              id="modal-modal-title"
              variant="h6"
              sx={{
                mb: 2,
                fontFamily: '"Poppins", sans-serif',
                color: isDarkMode ? '#ffffff' : '#1976d2',
              }}
            >
              Edit Access for {selectedMember?.firstName} {selectedMember?.lastName}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {availablePages.map((page) => (
                <FormControlLabel
                  key={page.key}
                  control={
                    <Checkbox
                      checked={tempPermissions[page.key] || false}
                      onChange={(e) => handleAccessChange(page.key, e.target.checked)}
                      sx={{
                        color: isDarkMode ? '#ffffff' : '#1976d2',
                        '&.Mui-checked': {
                          color: theme.palette.secondary.main,
                        },
                      }}
                    />
                  }
                  label={page.label}
                  sx={{
                    fontFamily: '"Poppins", sans-serif',
                    color: isDarkMode ? '#ffffff' : '#333333',
                  }}
                />
              ))}
            </Box>
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                onClick={handleCloseModal}
                variant="outlined"
                sx={{
                  fontFamily: '"Poppins", sans-serif',
                  color: isDarkMode ? '#ffffff' : '#1976d2',
                  borderColor: isDarkMode ? '#ffffff' : '#1976d2',
                  borderRadius: '8px',
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAccess}
                variant="contained"
                sx={{
                  fontFamily: '"Poppins", sans-serif',
                  background: 'linear-gradient(90deg, #4285F4, #34A853)',
                  color: '#ffffff',
                  borderRadius: '8px',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #34A853, #4285F4)',
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3)',
                  },
                }}
              >
                Save
              </Button>
            </Box>
          </Box>
        </Modal>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{
              width: '100%',
              fontFamily: '"Poppins", sans-serif',
              background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              color: isDarkMode ? '#ffffff' : '#333333',
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
};

export default SuperAdminDashboard;