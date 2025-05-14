import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Toolbar,
  Typography,
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
  Select,
  MenuItem,
  Tooltip,
  Fade,
  keyframes,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import Layout from '../components/Layout';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'

// Define animations (same as Login.js)
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

const SuperAdminDashboard = () => {
  const { isDarkMode, muiTheme } = useTheme();
  const navigate = useNavigate();
  const { authState } = useAuth();

  const [pendingMembers, setPendingMembers] = useState([]);
  const [pendingPage, setPendingPage] = useState(0);
  const [pendingRowsPerPage, setPendingRowsPerPage] = useState(5);
  const [pendingSearch, setPendingSearch] = useState('');
  const [pendingSortField, setPendingSortField] = useState('name');
  const [pendingSortOrder, setPendingSortOrder] = useState('asc');
  const [selectedPending, setSelectedPending] = useState([]);

  const [approvedMembers, setApprovedMembers] = useState([]);
  const [approvedPage, setApprovedPage] = useState(0);
  const [approvedRowsPerPage, setApprovedRowsPerPage] = useState(5);
  const [approvedSearch, setApprovedSearch] = useState('');
  const [approvedSortField, setApprovedSortField] = useState('name');
  const [approvedSortOrder, setApprovedSortOrder] = useState('asc');
  const [selectedApproved, setSelectedApproved] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({}); // Per-action loading state
  const [bulkLoading, setBulkLoading] = useState(false); // For bulk actions
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openModal, setOpenModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [tempPermissions, setTempPermissions] = useState({});
  const [selectedRole, setSelectedRole] = useState('viewer');

  // Modal states for confirmations
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ open: false, userId: null, userName: '' });
  const [approveConfirmModal, setApproveConfirmModal] = useState({ open: false, userId: null, userName: '', role: '' });

  const user = authState.isAuthenticated
    ? {
        role: authState.userRole,
        firstName: authState.firstName,
        lastName: authState.lastName,
        profilePicture: authState.profilePicture,
      }
    : null;

  // Log theme changes for debugging
  console.log('SuperAdminDashboard: isDarkMode:', isDarkMode);
  console.log('SuperAdminDashboard: muiTheme text.primary:', muiTheme.palette.text.primary);
  console.log('SuperAdminDashboard: muiTheme text.secondary:', muiTheme.palette.text.secondary);

  useEffect(() => {
    if (!authState.isAuthenticated || authState.userRole !== 'superadmin') {
      navigate('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [pendingResponse, approvedResponse] = await Promise.all([
          axios.get('http://localhost:5000/auth/pending-users', { withCredentials: true }),
          axios.get('http://localhost:5000/auth/members', { withCredentials: true }),
        ]);

        if (!Array.isArray(pendingResponse.data)) {
          throw new Error('Invalid data format from /auth/pending-users');
        }
        const filteredPendingMembers = pendingResponse.data.filter(
          (member) => member && typeof member === 'object' && member._id
        );
        setPendingMembers(filteredPendingMembers);

        if (!Array.isArray(approvedResponse.data)) {
          throw new Error('Invalid data format from /auth/members');
        }
        const filteredApprovedMembers = approvedResponse.data.filter(
          (member) => member && typeof member === 'object' && member._id
        );
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

  // Sorting and filtering logic
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

  const filteredPendingMembers = useMemo(() => {
    let filtered = pendingMembers.filter((member) => {
      const name = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();
      const email = (member.email || '').toLowerCase();
      const searchTerm = pendingSearch.toLowerCase();
      return name.includes(searchTerm) || email.includes(searchTerm);
    });

    return sortData(filtered, pendingSortField, pendingSortOrder, (member) => {
      if (pendingSortField === 'name') return `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();
      if (pendingSortField === 'email') return (member.email || '').toLowerCase();
      if (pendingSortField === 'createdAt') return member.createdAt || '';
      return '';
    });
  }, [pendingMembers, pendingSearch, pendingSortField, pendingSortOrder]);

  const filteredApprovedMembers = useMemo(() => {
    let filtered = approvedMembers.filter((member) => {
      const name = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();
      const email = (member.email || '').toLowerCase();
      const role = (member.role || '').toLowerCase();
      const searchTerm = approvedSearch.toLowerCase();
      return name.includes(searchTerm) || email.includes(searchTerm) || role.includes(searchTerm);
    });

    return sortData(filtered, approvedSortField, approvedSortOrder, (member) => {
      if (approvedSortField === 'name') return `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();
      if (approvedSortField === 'email') return (member.email || '').toLowerCase();
      if (approvedSortField === 'role') return (member.role || '').toLowerCase();
      return '';
    });
  }, [approvedMembers, approvedSearch, approvedSortField, approvedSortOrder]);

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
      setActionLoading((prev) => ({ ...prev, [userId]: true }));
      const roleDefaults = {
        viewer: { help: true, patchNotes: true, settings: true, dashboard: true },
        admin: { help: true, patchNotes: true, settings: true, dashboard: true, members: true, 'pending-users': true },
        superadmin: {
          help: true,
          patchNotes: true,
          settings: true,
          dashboard: true,
          member: true,
          partners: true,
          hrManagement: true,
          projects: true,
          itInventory: true,
          quickTools: true,
          superadminDashboard: true,
          analytics: true,
          financeManagement: true,
        },
      };

      const memberToApprove = pendingMembers.find((m) => m._id === userId);
      if (!memberToApprove) throw new Error('Member not found');

      setPendingMembers((prev) => prev.filter((m) => m._id !== userId));
      setSelectedPending((prev) => prev.filter((id) => id !== userId));
      setApprovedMembers((prev) => [
        ...prev,
        { ...memberToApprove, role: selectedRole, accessPermissions: roleDefaults[selectedRole] },
      ]);

      await axios.post(
        'http://localhost:5000/auth/approve-user',
        { userId, role: selectedRole, accessPermissions: roleDefaults[selectedRole] },
        { withCredentials: true }
      );

      setSnackbar({
        open: true,
        message: `User approved as ${selectedRole}. Customize permissions if needed.`,
        severity: 'success',
      });
    } catch (error) {
      console.error('Error approving member:', error.response?.data || error.message);
      setSnackbar({ open: true, message: 'Failed to approve member', severity: 'error' });
      const fetchApproved = await axios.get('http://localhost:5000/auth/members', { withCredentials: true });
      const fetchPending = await axios.get('http://localhost:5000/auth/pending-users', { withCredentials: true });
      setApprovedMembers(fetchApproved.data.filter((m) => m && typeof m === 'object' && m._id));
      setPendingMembers(fetchPending.data.filter((m) => m && typeof m === 'object' && m._id));
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
      setApproveConfirmModal({ open: false, userId: null, userName: '', role: '' });
    }
  };

  const handleBulkApprove = async () => {
    if (selectedPending.length === 0) {
      setSnackbar({ open: true, message: 'No members selected', severity: 'warning' });
      return;
    }
    try {
      setBulkLoading(true);
      const roleDefaults = {
        viewer: { help: true, patchNotes: true, settings: true, dashboard: true },
        admin: { help: true, patchNotes: true, settings: true, dashboard: true, members: true, 'pending-users': true },
        superadmin: {
          help: true,
          patchNotes: true,
          settings: true,
          dashboard: true,
          member: true,
          partners: true,
          hrManagement: true,
          projects: true,
          itInventory: true,
          quickTools: true,
          superadminDashboard: true,
          analytics: true,
          financeManagement: true,
        },
      };

      const membersToApprove = pendingMembers.filter((m) => selectedPending.includes(m._id));
      setPendingMembers((prev) => prev.filter((m) => !selectedPending.includes(m._id)));
      setApprovedMembers((prev) => [
        ...prev,
        ...membersToApprove.map((m) => ({
          ...m,
          role: selectedRole,
          accessPermissions: roleDefaults[selectedRole],
        })),
      ]);
      setSelectedPending([]);

      await Promise.all(
        selectedPending.map((userId) =>
          axios.post(
            'http://localhost:5000/auth/approve-user',
            { userId, role: selectedRole, accessPermissions: roleDefaults[selectedRole] },
            { withCredentials: true }
          )
        )
      );

      setSnackbar({
        open: true,
        message: `${selectedPending.length} members approved as ${selectedRole}`,
        severity: 'success',
      });
    } catch (error) {
      console.error('Error bulk approving members:', error.response?.data || error.message);
      setSnackbar({ open: true, message: 'Failed to approve members', severity: 'error' });
      const fetchApproved = await axios.get('http://localhost:5000/auth/members', { withCredentials: true });
      const fetchPending = await axios.get('http://localhost:5000/auth/pending-users', { withCredentials: true });
      setApprovedMembers(fetchApproved.data.filter((m) => m && typeof m === 'object' && m._id));
      setPendingMembers(fetchPending.data.filter((m) => m && typeof m === 'object' && m._id));
    } finally {
      setBulkLoading(false);
    }
  };

  const handleRejectMember = async (userId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [userId]: true }));
      setPendingMembers((prev) => prev.filter((member) => member._id !== userId));
      setSelectedPending((prev) => prev.filter((id) => id !== userId));
      const response = await axios.post(
        'http://localhost:5000/auth/reject-user',
        { userId },
        { withCredentials: true }
      );
      setSnackbar({ open: true, message: response.data.message, severity: 'success' });
    } catch (error) {
      console.error('Error rejecting member:', error.response?.data || error.message);
      setSnackbar({ open: true, message: 'Failed to reject member', severity: 'error' });
      const fetchPending = await axios.get('http://localhost:5000/auth/pending-users', { withCredentials: true });
      setPendingMembers(fetchPending.data.filter((m) => m && typeof m === 'object' && m._id));
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleBulkReject = async () => {
    if (selectedPending.length === 0) {
      setSnackbar({ open: true, message: 'No members selected', severity: 'warning' });
      return;
    }
    try {
      setBulkLoading(true);
      setPendingMembers((prev) => prev.filter((member) => !selectedPending.includes(member._id)));
      setSelectedPending([]);
      await Promise.all(
        selectedPending.map((userId) =>
          axios.post('http://localhost:5000/auth/reject-user', { userId }, { withCredentials: true })
        )
      );
      setSnackbar({ open: true, message: `${selectedPending.length} members rejected`, severity: 'success' });
    } catch (error) {
      console.error('Error bulk rejecting members:', error.response?.data || error.message);
      setSnackbar({ open: true, message: 'Failed to reject members', severity: 'error' });
      const fetchPending = await axios.get('http://localhost:5000/auth/pending-users', { withCredentials: true });
      setPendingMembers(fetchPending.data.filter((m) => m && typeof m === 'object' && m._id));
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDeleteMember = async (userId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [userId]: true }));
      const memberToDelete = approvedMembers.find((m) => m._id === userId);
      if (!memberToDelete) throw new Error('Member not found');

      const currentUserRole = authState.userRole;
      const targetUserRole = memberToDelete.role;

      if (currentUserRole === 'admin' && targetUserRole === 'superadmin') {
        setSnackbar({
          open: true,
          message: 'Admins cannot delete superadmin members',
          severity: 'warning',
        });
        return;
      }

      setApprovedMembers((prev) => prev.filter((m) => m._id !== userId));
      setSelectedApproved((prev) => prev.filter((id) => id !== userId));

      await axios.delete(`http://localhost:5000/auth/delete-user/${userId}`, { withCredentials: true });

      setSnackbar({
        open: true,
        message: 'Member deleted successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error deleting member:', error.response?.data || error.message);
      setSnackbar({ open: true, message: 'Failed to delete member', severity: 'error' });
      const fetchApproved = await axios.get('http://localhost:5000/auth/members', { withCredentials: true });
      setApprovedMembers(fetchApproved.data.filter((m) => m && typeof m === 'object' && m._id));
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
      setDeleteConfirmModal({ open: false, userId: null, userName: '' });
    }
  };

  const handleAccessChange = (page, checked) => {
    setTempPermissions((prev) => ({ ...prev, [page]: checked }));
  };

  const handleSaveAccess = async () => {
    if (!selectedMember) return;
    if (selectedMember.role === 'superadmin') {
      setSnackbar({ open: true, message: 'Cannot change access for superadmin members', severity: 'warning' });
      return;
    }
    try {
      setActionLoading((prev) => ({ ...prev, [selectedMember._id]: true }));
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
      setSnackbar({ open: true, message: 'Access updated successfully. User may need to log out and back in.', severity: 'success' });
      handleCloseModal();
    } catch (error) {
      console.error('Error updating access:', error.response?.data || error.message);
      setSnackbar({ open: true, message: 'Failed to update access', severity: 'error' });
    } finally {
      setActionLoading((prev) => ({ ...prev, [selectedMember._id]: false }));
    }
  };

  const hasSuperadminSelected = selectedApproved.some((id) => {
    const member = approvedMembers.find((m) => m._id === id);
    return member && member.role === 'superadmin';
  });

  const handleBulkAccessChange = async (page, checked) => {
    if (selectedApproved.length === 0) {
      setSnackbar({ open: true, message: 'No members selected', severity: 'warning' });
      return;
    }
    if (hasSuperadminSelected) {
      setSnackbar({ open: true, message: 'Cannot change access for superadmin members', severity: 'warning' });
      return;
    }
    try {
      setBulkLoading(true);
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
        message: `Updated ${page} access for ${selectedApproved.length} members. Users may need to log out and back in.`,
        severity: 'success',
      });
    } catch (error) {
      console.error('Error bulk updating access:', error.response?.data || error.message);
      setSnackbar({ open: true, message: 'Failed to update access', severity: 'error' });
    } finally {
      setBulkLoading(false);
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

  const handleOpenDeleteConfirm = (userId, userName) => {
    setDeleteConfirmModal({ open: true, userId, userName });
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmModal({ open: false, userId: null, userName: '' });
  };

  const handleOpenApproveConfirm = (userId, userName, role) => {
    setApproveConfirmModal({ open: true, userId, userName, role });
  };

  const handleCloseApproveConfirm = () => {
    setApproveConfirmModal({ open: false, userId: null, userName: '', role: '' });
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
    <Layout user={user}>
      <Box
        key={isDarkMode ? 'dark' : 'light'} // Force re-render on theme change
        sx={{
          minHeight: '100vh',
          background: muiTheme.custom.gradients.backgroundDefault,
          p: { xs: 2, sm: 3, md: 4 },
          position: 'relative',
          overflow: 'hidden',
          animation: `${fadeIn} 0.8s ease-out`,
        }}
      >
        {/* Subtle Gradient Overlay */}
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
        {/* Main Content */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Toolbar />
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              fontFamily: muiTheme.typography.fontFamily,
              color: muiTheme.palette.primary.main,
            }}
          >
            Super Admin Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                boxShadow: muiTheme.custom.shadows.paper,
                border: `1px solid ${muiTheme.palette.border.main}`,
                flex: '1 1 300px',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontFamily: muiTheme.typography.fontFamily,
                  color: muiTheme.palette.text.secondary,
                }}
              >
                Total Members
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  mt: 1,
                  color: muiTheme.palette.primary.main,
                  fontFamily: muiTheme.typography.fontFamily,
                }}
              >
                {approvedMembers.length}
              </Typography>
            </Box>
            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                boxShadow: muiTheme.custom.shadows.paper,
                border: `1px solid ${muiTheme.palette.border.main}`,
                flex: '1 1 300px',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontFamily: muiTheme.typography.fontFamily,
                  color: muiTheme.palette.text.secondary,
                }}
              >
                Pending Approvals
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  mt: 1,
                  color: muiTheme.palette.primary.main,
                  fontFamily: muiTheme.typography.fontFamily,
                }}
              >
                {pendingMembers.length}
              </Typography>
            </Box>
            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                boxShadow: muiTheme.custom.shadows.paper,
                border: `1px solid ${muiTheme.palette.border.main}`,
                flex: '1 1 300px',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontFamily: muiTheme.typography.fontFamily,
                  color: muiTheme.palette.text.secondary,
                }}
              >
                Recent Activity
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  mt: 1,
                  fontFamily: muiTheme.typography.fontFamily,
                  color: muiTheme.palette.text.primary,
                }}
              >
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
              fontFamily: muiTheme.typography.fontFamily,
              color: muiTheme.palette.primary.main,
            }}
          >
            Pending Member Approvals
          </Typography>
          {pendingMembers.length > 0 ? (
            <>
              <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                  label="Search Pending Members"
                  variant="outlined"
                  value={pendingSearch}
                  onChange={(e) => setPendingSearch(e.target.value)}
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      background: muiTheme.palette.background.listItem,
                      transition: 'all 0.3s ease',
                      '& fieldset': {
                        borderColor: muiTheme.palette.border.main,
                      },
                      '&:hover fieldset': {
                        borderColor: muiTheme.palette.secondary.main,
                      },
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: muiTheme.custom?.shadow?.listItem,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: muiTheme.palette.secondary.main,
                        boxShadow: `0 0 8px ${muiTheme.palette.secondary.main}33`,
                      },
                      '&.Mui-focused': {
                        transform: 'translateY(-2px)',
                        boxShadow: muiTheme.custom?.shadow?.listItem,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      fontFamily: muiTheme.typography.fontFamily,
                      color: muiTheme.palette.text.secondary,
                    },
                    '& .MuiInputBase-input': {
                      fontFamily: muiTheme.typography.fontFamily,
                      color: muiTheme.palette.text.primary,
                    },
                  }}
                />
                <Tooltip title="Approve selected members">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleBulkApprove}
                    disabled={selectedPending.length === 0 || bulkLoading}
                    sx={{
                      fontFamily: muiTheme.typography.fontFamily,
                      borderRadius: '8px',
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
                    {bulkLoading ? <CircularProgress size={24} color="inherit" /> : `Approve Selected (${selectedPending.length})`}
                  </Button>
                </Tooltip>
                <Tooltip title="Reject selected members">
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleBulkReject}
                    disabled={selectedPending.length === 0 || bulkLoading}
                    sx={{
                      fontFamily: muiTheme.typography.fontFamily,
                      borderRadius: '8px',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        backgroundColor: muiTheme.palette.error.dark,
                        boxShadow: muiTheme.custom.shadows.buttonHover,
                      },
                    }}
                  >
                    {bulkLoading ? <CircularProgress size={24} color="inherit" /> : `Reject Selected (${selectedPending.length})`}
                  </Button>
                </Tooltip>
              </Box>
              <Box sx={{ position: 'relative' }}>
                {bulkLoading && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      zIndex: 1,
                      borderRadius: '12px',
                    }}
                  >
                    <CircularProgress />
                  </Box>
                )}
                <TableContainer
                  component={Paper}
                  sx={{
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${muiTheme.palette.border.main}`,
                    borderRadius: '12px',
                    boxShadow: muiTheme.custom.shadows.paper,
                  }}
                >
                  <Table sx={{ minWidth: 650 }} aria-label="pending members table">
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            fontFamily: muiTheme.typography.fontFamily,
                            background: muiTheme.custom.gradients.listItem,
                            color: muiTheme.palette.primary.main,
                            fontWeight: 'bold',
                          }}
                        >
                          <Checkbox
                            checked={selectedPending.length === filteredPendingMembers.length && filteredPendingMembers.length > 0}
                            onChange={handleSelectAllPending}
                            sx={{
                              color: muiTheme.palette.text.primary,
                              '&.Mui-checked': { color: muiTheme.palette.secondary.main },
                            }}
                          />
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: muiTheme.typography.fontFamily,
                            background: muiTheme.custom.gradients.listItem,
                            color: muiTheme.palette.primary.main,
                            fontWeight: 'bold',
                          }}
                        >
                          <TableSortLabel
                            active={pendingSortField === 'name'}
                            direction={pendingSortOrder}
                            onClick={() => handlePendingSort('name')}
                            sx={{ color: muiTheme.palette.primary.main }}
                          >
                            Name
                          </TableSortLabel>
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: muiTheme.typography.fontFamily,
                            background: muiTheme.custom.gradients.listItem,
                            color: muiTheme.palette.primary.main,
                            fontWeight: 'bold',
                          }}
                        >
                          <TableSortLabel
                            active={pendingSortField === 'email'}
                            direction={pendingSortOrder}
                            onClick={() => handlePendingSort('email')}
                            sx={{ color: muiTheme.palette.primary.main }}
                          >
                            Email
                          </TableSortLabel>
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: muiTheme.typography.fontFamily,
                            background: muiTheme.custom.gradients.listItem,
                            color: muiTheme.palette.primary.main,
                            fontWeight: 'bold',
                          }}
                        >
                          <TableSortLabel
                            active={pendingSortField === 'createdAt'}
                            direction={pendingSortOrder}
                            onClick={() => handlePendingSort('createdAt')}
                            sx={{ color: muiTheme.palette.primary.main }}
                          >
                            Created At
                          </TableSortLabel>
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: muiTheme.typography.fontFamily,
                            background: muiTheme.custom.gradients.listItem,
                            color: muiTheme.palette.primary.main,
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
                        .map((member, index) => (
                          <TableRow
                            key={member._id}
                            sx={{
                              '&:hover': { backgroundColor: muiTheme.custom.gradients.listItemHover },
                              backgroundColor: index % 2 === 0 ? 'transparent' : isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                            }}
                          >
                            <TableCell sx={{ fontFamily: muiTheme.typography.fontFamily, color: muiTheme.palette.text.primary, py: 1.5 }}>
                              <Checkbox
                                checked={selectedPending.includes(member._id)}
                                onChange={() => handleSelectPending(member._id)}
                                sx={{
                                  color: muiTheme.palette.text.primary,
                                  '&.Mui-checked': { color: muiTheme.palette.secondary.main },
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontFamily: muiTheme.typography.fontFamily, color: muiTheme.palette.text.primary, py: 1.5 }}>
                              {`${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unnamed'}
                            </TableCell>
                            <TableCell sx={{ fontFamily: muiTheme.typography.fontFamily, color: muiTheme.palette.text.primary, py: 1.5 }}>
                              {member.email || 'N/A'}
                            </TableCell>
                            <TableCell sx={{ fontFamily: muiTheme.typography.fontFamily, color: muiTheme.palette.text.primary, py: 1.5 }}>
                              {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell sx={{ fontFamily: muiTheme.typography.fontFamily, py: 1.5 }}>
                              <Select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                size="small"
                                sx={{
                                  mr: 1,
                                  color: muiTheme.palette.text.primary,
                                  background: muiTheme.palette.background.listItem,
                                  border: `1px solid ${muiTheme.palette.border.main}`,
                                  borderRadius: '8px',
                                  fontFamily: muiTheme.typography.fontFamily,
                                  '&:hover': {
                                    background: muiTheme.custom.gradients.listItemHover,
                                    borderColor: muiTheme.palette.secondary.main,
                                  },
                                  '& .MuiSelect-icon': {
                                    color: muiTheme.palette.text.primary,
                                  },
                                }}
                              >
                                <MenuItem value="viewer">Viewer</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                                <MenuItem value="superadmin">Superadmin</MenuItem>
                              </Select>
                              <Tooltip title="Approve this user">
                                <Button
                                  variant="contained"
                                  color="primary"
                                  startIcon={<CheckCircleIcon />}
                                  onClick={() =>
                                    handleOpenApproveConfirm(
                                      member._id,
                                      `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unnamed',
                                      selectedRole
                                    )
                                  }
                                  disabled={actionLoading[member._id] || bulkLoading}
                                  sx={{
                                    mr: 1,
                                    fontFamily: muiTheme.typography.fontFamily,
                                    borderRadius: '8px',
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
                                  {actionLoading[member._id] ? <CircularProgress size={24} color="inherit" /> : 'Approve'}
                                </Button>
                              </Tooltip>
                              <Tooltip title="Reject this user">
                                <Button
                                  variant="contained"
                                  color="error"
                                  startIcon={<CancelIcon />}
                                  onClick={() => handleRejectMember(member._id)}
                                  disabled={actionLoading[member._id] || bulkLoading}
                                  sx={{
                                    fontFamily: muiTheme.typography.fontFamily,
                                    borderRadius: '8px',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                      transform: 'scale(1.05)',
                                      backgroundColor: muiTheme.palette.error.dark,
                                      boxShadow: muiTheme.custom.shadows.buttonHover,
                                    },
                                  }}
                                >
                                  {actionLoading[member._id] ? <CircularProgress size={24} color="inherit" /> : 'Reject'}
                                </Button>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredPendingMembers.length}
                rowsPerPage={pendingRowsPerPage}
                page={pendingPage}
                onPageChange={handlePendingChangePage}
                onRowsPerPageChange={handlePendingChangeRowsPerPage}
                sx={{
                  color: muiTheme.palette.text.primary,
                  '& .MuiIconButton-root': {
                    color: muiTheme.palette.text.primary,
                  },
                  '& .MuiSelect-icon': {
                    color: muiTheme.palette.text.primary,
                  },
                }}
              />
            </>
          ) : (
            <Typography sx={{ p: 2, color: muiTheme.palette.text.secondary, fontFamily: muiTheme.typography.fontFamily }}>
              No pending approvals
            </Typography>
          )}
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              mt: 4,
              fontFamily: muiTheme.typography.fontFamily,
              color: muiTheme.palette.primary.main,
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
                  sx={{
                    flex: 1,
                    minWidth: 200,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      background: muiTheme.palette.background.listItem,
                      transition: 'all 0.3s ease',
                      '& fieldset': {
                        borderColor: muiTheme.palette.border.main,
                      },
                      '&:hover fieldset': {
                        borderColor: muiTheme.palette.secondary.main,
                      },
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: muiTheme.custom?.shadow?.listItem,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: muiTheme.palette.secondary.main,
                        boxShadow: `0 0 8px ${muiTheme.palette.secondary.main}33`,
                      },
                      '&.Mui-focused': {
                        transform: 'translateY(-2px)',
                        boxShadow: muiTheme.custom?.shadow?.listItem,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      fontFamily: muiTheme.typography.fontFamily,
                      color: muiTheme.palette.text.secondary,
                    },
                    '& .MuiInputBase-input': {
                      fontFamily: muiTheme.typography.fontFamily,
                      color: muiTheme.palette.text.primary,
                    },
                  }}
                />
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {availablePages.map((page) => (
                    <Box key={page.key} sx={{ display: 'flex', alignItems: 'center' }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            onChange={(e) => handleBulkAccessChange(page.key, e.target.checked)}
                            disabled={selectedApproved.length === 0 || hasSuperadminSelected || bulkLoading}
                            sx={{
                              color: muiTheme.palette.text.primary,
                              '&.Mui-checked': { color: muiTheme.palette.secondary.main },
                            }}
                          />
                        }
                        label={`Toggle ${page.label}`}
                        sx={{
                          fontFamily: muiTheme.typography.fontFamily,
                          color: muiTheme.palette.text.primary,
                          m: 0,
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box sx={{ position: 'relative' }}>
                {bulkLoading && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      zIndex: 1,
                      borderRadius: '12px',
                    }}
                  >
                    <CircularProgress />
                  </Box>
                )}
                <TableContainer
                  component={Paper}
                  sx={{
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${muiTheme.palette.border.main}`,
                    borderRadius: '12px',
                    boxShadow: muiTheme.custom.shadows.paper,
                  }}
                >
                  <Table sx={{ minWidth: 650 }} aria-label="approved members table">
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            fontFamily: muiTheme.typography.fontFamily,
                            background: muiTheme.custom.gradients.listItem,
                            color: muiTheme.palette.primary.main,
                            fontWeight: 'bold',
                          }}
                        >
                          <Checkbox
                            checked={selectedApproved.length === filteredApprovedMembers.length && filteredApprovedMembers.length > 0}
                            onChange={handleSelectAllApproved}
                            sx={{
                              color: muiTheme.palette.text.primary,
                              '&.Mui-checked': { color: muiTheme.palette.secondary.main },
                            }}
                          />
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: muiTheme.typography.fontFamily,
                            background: muiTheme.custom.gradients.listItem,
                            color: muiTheme.palette.primary.main,
                            fontWeight: 'bold',
                          }}
                        >
                          <TableSortLabel
                            active={approvedSortField === 'name'}
                            direction={approvedSortOrder}
                            onClick={() => handleApprovedSort('name')}
                            sx={{ color: muiTheme.palette.primary.main }}
                          >
                            Name
                          </TableSortLabel>
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: muiTheme.typography.fontFamily,
                            background: muiTheme.custom.gradients.listItem,
                            color: muiTheme.palette.primary.main,
                            fontWeight: 'bold',
                          }}
                        >
                          <TableSortLabel
                            active={approvedSortField === 'email'}
                            direction={approvedSortOrder}
                            onClick={() => handleApprovedSort('email')}
                            sx={{ color: muiTheme.palette.primary.main }}
                          >
                            Email
                          </TableSortLabel>
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: muiTheme.typography.fontFamily,
                            background: muiTheme.custom.gradients.listItem,
                            color: muiTheme.palette.primary.main,
                            fontWeight: 'bold',
                          }}
                        >
                          <TableSortLabel
                            active={approvedSortField === 'role'}
                            direction={approvedSortOrder}
                            onClick={() => handleApprovedSort('role')}
                            sx={{ color: muiTheme.palette.primary.main }}
                          >
                            Role
                          </TableSortLabel>
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: muiTheme.typography.fontFamily,
                            background: muiTheme.custom.gradients.listItem,
                            color: muiTheme.palette.primary.main,
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
                        .map((member, index) => (
                          <TableRow
                            key={member._id}
                            sx={{
                              '&:hover': { backgroundColor: muiTheme.custom.gradients.listItemHover },
                              backgroundColor: index % 2 === 0 ? 'transparent' : isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                            }}
                          >
                            <TableCell sx={{ fontFamily: muiTheme.typography.fontFamily, color: muiTheme.palette.text.primary, py: 1.5 }}>
                              <Checkbox
                                checked={selectedApproved.includes(member._id)}
                                onChange={() => handleSelectApproved(member._id)}
                                sx={{
                                  color: muiTheme.palette.text.primary,
                                  '&.Mui-checked': { color: muiTheme.palette.secondary.main },
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontFamily: muiTheme.typography.fontFamily, color: muiTheme.palette.text.primary, py: 1.5 }}>
                              {`${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unnamed'}
                            </TableCell>
                            <TableCell sx={{ fontFamily: muiTheme.typography.fontFamily, color: muiTheme.palette.text.primary, py: 1.5 }}>
                              {member.email || 'N/A'}
                            </TableCell>
                            <TableCell sx={{ fontFamily: muiTheme.typography.fontFamily, color: muiTheme.palette.text.primary, py: 1.5 }}>
                              {member.role || 'N/A'}
                            </TableCell>
                            <TableCell sx={{ fontFamily: muiTheme.typography.fontFamily, py: 1.5 }}>
                              <Tooltip title="Edit user access">
                                <Button
                                  variant="outlined"
                                  startIcon={<EditIcon />}
                                  onClick={() => handleOpenModal(member)}
                                  sx={{
                                    fontFamily: muiTheme.typography.fontFamily,
                                    borderRadius: '8px',
                                    mr: 1,
                                    transition: 'all 0.3s ease',
                                    color: muiTheme.palette.text.primary,
                                    borderColor: muiTheme.palette.border.main,
                                    '&:hover': {
                                      transform: 'scale(1.05)',
                                      borderColor: muiTheme.palette.primary.main,
                                      backgroundColor: muiTheme.custom.gradients.listItemHover,
                                    },
                                  }}
                                  disabled={member.role === 'superadmin' || actionLoading[member._id] || bulkLoading}
                                >
                                  Edit Access
                                </Button>
                              </Tooltip>
                              <Tooltip title="Delete this user">
                                <Button
                                  variant="contained"
                                  color="error"
                                  startIcon={<DeleteIcon />}
                                  onClick={() =>
                                    handleOpenDeleteConfirm(
                                      member._id,
                                      `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unnamed'
                                    )
                                  }
                                  sx={{
                                    fontFamily: muiTheme.typography.fontFamily,
                                    borderRadius: '8px',
                                    transition: 'all 0.3s ease',
                                    color: isDarkMode ? muiTheme.palette.text.primary : '#ffffff',
                                    '&:hover': {
                                      transform: 'scale(1.05)',
                                      backgroundColor: muiTheme.palette.error.dark,
                                      boxShadow: muiTheme.custom.shadows.buttonHover,
                                    },
                                  }}
                                  disabled={actionLoading[member._id] || bulkLoading}
                                >
                                  {actionLoading[member._id] ? <CircularProgress size={24} color="inherit" /> : 'Delete'}
                                </Button>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredApprovedMembers.length}
                rowsPerPage={approvedRowsPerPage}
                page={approvedPage}
                onPageChange={handleApprovedChangePage}
                onRowsPerPageChange={handleApprovedChangeRowsPerPage}
                sx={{
                  color: muiTheme.palette.text.primary,
                  '& .MuiIconButton-root': {
                    color: muiTheme.palette.text.primary,
                  },
                  '& .MuiSelect-icon': {
                    color: muiTheme.palette.text.primary,
                  },
                }}
              />
            </>
          ) : (
            <Typography sx={{ p: 2, color: muiTheme.palette.text.secondary, fontFamily: muiTheme.typography.fontFamily }}>
              No approved members
            </Typography>
          )}
          <Modal
            open={openModal}
            onClose={handleCloseModal}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <Fade in={openModal}>
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 400,
                  p: 4,
                  borderRadius: 2,
                  background: isDarkMode ? 'rgba(30, 30, 50, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  boxShadow: muiTheme.custom.shadows.paper,
                  border: `1px solid ${muiTheme.palette.border.main}`,
                }}
              >
                <Typography
                  id="modal-modal-title"
                  variant="h6"
                  sx={{
                    mb: 2,
                    fontFamily: muiTheme.typography.fontFamily,
                    color: muiTheme.palette.primary.main,
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
                            color: muiTheme.palette.text.primary,
                            '&.Mui-checked': {
                              color: muiTheme.palette.secondary.main,
                            },
                          }}
                        />
                      }
                      label={page.label}
                      sx={{
                        fontFamily: muiTheme.typography.fontFamily,
                        color: muiTheme.palette.text.primary,
                      }}
                    />
                  ))}
                </Box>
                <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    onClick={handleCloseModal}
                    variant="outlined"
                    sx={{
                      fontFamily: muiTheme.typography.fontFamily,
                      color: muiTheme.palette.text.primary,
                      borderColor: muiTheme.palette.border.main,
                      borderRadius: '8px',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        borderColor: muiTheme.palette.primary.main,
                        backgroundColor: muiTheme.custom.gradients.listItemHover,
                      },
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveAccess}
                    variant="contained"
                    sx={{
                      fontFamily: muiTheme.typography.fontFamily,
                      background: 'linear-gradient(90deg, #4285F4, #34A853)',
                      color: '#ffffff',
                      borderRadius: '8px',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        background: 'linear-gradient(90deg, #34A853, #4285F4)',
                        boxShadow: muiTheme.custom.shadows.buttonHover,
                      },
                    }}
                  >
                    Save
                  </Button>
                </Box>
              </Box>
            </Fade>
          </Modal>
          <Modal
            open={deleteConfirmModal.open}
            onClose={handleCloseDeleteConfirm}
            aria-labelledby="delete-confirm-modal-title"
          >
            <Fade in={deleteConfirmModal.open}>
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 400,
                  p: 4,
                  borderRadius: 2,
                  background: isDarkMode ? 'rgba(30, 30, 50, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  boxShadow: muiTheme.custom.shadows.paper,
                  border: `1px solid ${muiTheme.palette.border.main}`,
                }}
              >
                <Typography
                  id="delete-confirm-modal-title"
                  variant="h6"
                  sx={{
                    mb: 2,
                    fontFamily: muiTheme.typography.fontFamily,
                    color: muiTheme.palette.primary.main,
                  }}
                >
                  Confirm Deletion
                </Typography>
                <Typography
                  sx={{
                    mb: 3,
                    fontFamily: muiTheme.typography.fontFamily,
                    color: muiTheme.palette.text.primary,
                  }}
                >
                  Are you sure you want to delete {deleteConfirmModal.userName}? This action cannot be undone.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    onClick={handleCloseDeleteConfirm}
                    variant="outlined"
                    sx={{
                      fontFamily: muiTheme.typography.fontFamily,
                      color: muiTheme.palette.text.primary,
                      borderColor: muiTheme.palette.border.main,
                      borderRadius: '8px',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        borderColor: muiTheme.palette.primary.main,
                        backgroundColor: muiTheme.custom.gradients.listItemHover,
                      },
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleDeleteMember(deleteConfirmModal.userId)}
                    variant="contained"
                    color="error"
                    sx={{
                      fontFamily: muiTheme.typography.fontFamily,
                      borderRadius: '8px',
                      transition: 'all 0.3s ease',
                      color: isDarkMode ? muiTheme.palette.text.primary : '#ffffff',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        backgroundColor: muiTheme.palette.error.dark,
                        boxShadow: muiTheme.custom.shadows.buttonHover,
                      },
                    }}
                  >
                    Delete
                  </Button>
                </Box>
              </Box>
            </Fade>
          </Modal>
          <Modal
            open={approveConfirmModal.open}
            onClose={handleCloseApproveConfirm}
            aria-labelledby="approve-confirm-modal-title"
          >
            <Fade in={approveConfirmModal.open}>
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 400,
                  p: 4,
                  borderRadius: 2,
                  background: isDarkMode ? 'rgba(30, 30, 50, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  boxShadow: muiTheme.custom.shadows.paper,
                  border: `1px solid ${muiTheme.palette.border.main}`,
                }}
              >
                <Typography
                  id="approve-confirm-modal-title"
                  variant="h6"
                  sx={{
                    mb: 2,
                    fontFamily: muiTheme.typography.fontFamily,
                    color: muiTheme.palette.primary.main,
                  }}
                >
                  Confirm Approval
                </Typography>
                <Typography
                  sx={{
                    mb: 3,
                    fontFamily: muiTheme.typography.fontFamily,
                    color: muiTheme.palette.text.primary,
                  }}
                >
                  Are you sure you want to approve {approveConfirmModal.userName} as a {approveConfirmModal.role}?
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    onClick={handleCloseApproveConfirm}
                    variant="outlined"
                    sx={{
                      fontFamily: muiTheme.typography.fontFamily,
                      color: muiTheme.palette.text.primary,
                      borderColor: muiTheme.palette.border.main,
                      borderRadius: '8px',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        borderColor: muiTheme.palette.primary.main,
                        backgroundColor: muiTheme.custom.gradients.listItemHover,
                      },
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleApproveMember(approveConfirmModal.userId)}
                    variant="contained"
                    color="primary"
                    sx={{
                      fontFamily: muiTheme.typography.fontFamily,
                      background: 'linear-gradient(90deg, #4285F4, #34A853)',
                      color: '#ffffff',
                      borderRadius: '8px',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        background: 'linear-gradient(90deg, #34A853, #4285F4)',
                        boxShadow: muiTheme.custom.shadows.buttonHover,
                      },
                    }}
                  >
                    Approve
                  </Button>
                </Box>
              </Box>
            </Fade>
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
                fontFamily: muiTheme.typography.fontFamily,
                background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                color: muiTheme.palette.text.primary,
              }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </Box>
    </Layout>
  );
};

export default SuperAdminDashboard;