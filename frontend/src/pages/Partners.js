import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Papa from 'papaparse';
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
  IconButton,
  Chip,
  Toolbar,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  keyframes,
  TablePagination,
  TableSortLabel,
  Tooltip,
  Autocomplete,
  Checkbox,
  LinearProgress,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  FileUpload as FileUploadIcon,
  FileDownload as FileDownloadIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import CustomSnackbar from '../components/CustomSnackbar';
import PartnerDetailsModal from '../components/modal/PartnerDetailsModal';
import ActivityLogsModal from '../components/modal/ActivityLogsModal';
import ErrorBoundary from '../components/errorBoundary';

// Animation for page load
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

const PartnerManagement = () => {
  const { isDarkMode, muiTheme } = useTheme();
  const { authState } = useAuth();
  const isAdmin = ['admin', 'superadmin'].includes(authState.userRole);
  const [partners, setPartners] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState(null);
  const [activityLogsModalOpen, setActivityLogsModalOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);
  const [newPartner, setNewPartner] = useState({
    name: '',
    projectName: '',
    status: 'Cold',
    startDate: '',
    endDate: '',
    durationStatus: 'Upcoming',
    durationStatusCustom: '',
    category: '',
    contact: { email: '', phone: '', person: '', role: '' },
  });
  const [selectedPartners, setSelectedPartners] = useState([]);
  const [bulkEditStatus, setBulkEditStatus] = useState('Cold');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [currentImportItem, setCurrentImportItem] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [exportConfirmOpen, setExportConfirmOpen] = useState(false);
  const [isExportSelected, setIsExportSelected] = useState(false);
  const [exportFieldsModalOpen, setExportFieldsModalOpen] = useState(false);
  const [exportFields, setExportFields] = useState([
    'name', 'projectName', 'status', 'startDate', 'endDate', 'durationStatus',
    'durationStatusCustom', 'category', 'contactEmail', 'contactPhone', 'contactPerson', 'contactRole', 'services'
  ]);
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [parsedData, setParsedData] = useState([]);
  const [importSummary, setImportSummary] = useState(null);
  const fileInputRef = useRef(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');

  // Branding colors
  const brandingBlue = '#4285F4';
  const greenLightColor = '#34A853';
  const greenLightHoverBackground = 'rgba(52, 168, 83, 0.1)';
  const hoverGreen = '#2E914A';
  const hoverBackground = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : greenLightHoverBackground;
  const disabledColor = '#666';

  // Available fields for export
  const availableFields = [
    { id: 'name', label: 'Partner Name' },
    { id: 'projectName', label: 'Project Name' },
    { id: 'status', label: 'Status' },
    { id: 'startDate', label: 'Start Date' },
    { id: 'endDate', label: 'End Date' },
    { id: 'durationStatus', label: 'Duration Status' },
    { id: 'durationStatusCustom', label: 'Custom Duration Status' },
    { id: 'category', label: 'Category' },
    { id: 'contactEmail', label: 'Contact Email' },
    { id: 'contactPhone', label: 'Contact Phone' },
    { id: 'contactPerson', label: 'Contact Person' },
    { id: 'contactRole', label: 'Contact Role' },
    { id: 'services', label: 'Services' },
  ];

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const response = await axios.get('/api/partners');
      setPartners(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch partners. Please try again later.');
      console.error('Error fetching partners:', err);
    }
  };

  const uniqueCategories = [...new Set(partners.map(partner => partner.category || ''))].filter(Boolean);

  const handleChangeStatus = async (partnerId, newStatus) => {
    try {
      await axios.put(`/api/partners/${partnerId}/status`, { status: newStatus });
      setSuccess(`Partner status changed to ${newStatus}`);
      fetchPartners();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update partner status. Please try again later.');
      console.error('Error updating partner status:', err);
    }
  };

  const handleViewDetails = (partner) => {
    setSelectedPartner(partner);
    setDetailsModalOpen(true);
  };

  const handleDeletePartner = async () => {
    if (!partnerToDelete) return;
    try {
      await axios.delete(`/api/partners/${partnerToDelete._id}`);
      setSuccess('Partner deleted successfully');
      fetchPartners();
      setDeleteModalOpen(false);
      setPartnerToDelete(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Partner not found. It may have already been deleted.');
      } else if (err.response?.status === 401) {
        setError('You are not authenticated. Please log in.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to delete partners.');
      } else {
        setError(err.response?.data?.message || 'Failed to delete partner. Please try again later.');
      }
      console.error('Error deleting partner:', err);
      setDeleteModalOpen(false);
      setPartnerToDelete(null);
    }
  };

  const handleCreatePartner = async () => {
    const { name, projectName, status, startDate, endDate, durationStatus, durationStatusCustom, category, contact } = newPartner;
    if (!name || !projectName || !startDate || !endDate) {
      setError('Please fill in all required fields (Name, Project Name, Start Date, End Date).');
      return;
    }
    try {
      await axios.post('/api/partners', {
        name,
        projectName,
        status,
        startDate,
        endDate,
        durationStatus,
        durationStatusCustom: durationStatus === 'Custom' ? durationStatusCustom : '',
        category: category || undefined,
        contact,
      });
      setSuccess('Partner created successfully');
      setCreateModalOpen(false);
      setNewPartner({
        name: '',
        projectName: '',
        status: 'Cold',
        startDate: '',
        endDate: '',
        durationStatus: 'Upcoming',
        durationStatusCustom: '',
        category: '',
        contact: { email: '', phone: '', person: '', role: '' },
      });
      fetchPartners();
    } catch (err) {
      if (err.response?.status === 401) {
        setError('You are not authenticated. Please log in.');
      } else {
        setError(err.response?.data?.message || 'Failed to create partner. Please try again later.');
      }
      console.error('Error creating partner:', err);
    }
  };

  const handleOpenExportConfirm = (selected = false) => {
    if (selected && selectedPartners.length === 0) {
      setError('Please select at least one partner to export.');
      return;
    }
    setIsExportSelected(selected);
    setExportFieldsModalOpen(true);
  };

  const toggleExportField = (fieldId) => {
    setExportFields(prev =>
      prev.includes(fieldId) ? prev.filter(id => id !== fieldId) : [...prev, fieldId]
    );
  };

  const handleExportCSV = () => {
    if (exportFields.length === 0) {
      setError('Please select at least one field to export.');
      return;
    }

    try {
      const partnersToExport = isExportSelected ? selectedPartners : filteredPartners;
      const headers = availableFields
        .filter(field => exportFields.includes(field.id))
        .map(field => field.label);

      const rows = partnersToExport.map(partner => {
        const row = {};
        if (exportFields.includes('name')) row['Partner Name'] = partner.name || '';
        if (exportFields.includes('projectName')) row['Project Name'] = partner.projectName || '';
        if (exportFields.includes('status')) row['Status'] = partner.status || '';
        if (exportFields.includes('startDate')) row['Start Date'] = partner.startDate ? new Date(partner.startDate).toLocaleDateString() : '';
        if (exportFields.includes('endDate')) row['End Date'] = partner.endDate ? new Date(partner.endDate).toLocaleDateString() : '';
        if (exportFields.includes('durationStatus')) row['Duration Status'] = partner.durationStatus || '';
        if (exportFields.includes('durationStatusCustom')) row['Custom Duration Status'] = partner.durationStatusCustom || 'N/A';
        if (exportFields.includes('category')) row['Category'] = partner.category || 'N/A';
        if (exportFields.includes('contactEmail')) row['Contact Email'] = partner.contact?.email || 'N/A';
        if (exportFields.includes('contactPhone')) row['Contact Phone'] = partner.contact?.phone || 'N/A';
        if (exportFields.includes('contactPerson')) row['Contact Person'] = partner.contact?.person || 'N/A';
        if (exportFields.includes('contactRole')) row['Contact Role'] = partner.contact?.role || 'N/A';
        if (exportFields.includes('services')) {
          row['Services'] = partner.services
            .map(s => `Name: ${s.name || ''}, Status: ${s.status || 'N/A'}, Cost: ${s.cost ? `$${s.cost}` : 'N/A'}, Term Sheets: ${s.termSheets?.join('; ') || 'N/A'}`)
            .join(' | ');
        }
        return row;
      });

      const csvContent = Papa.unparse({
        fields: headers,
        data: rows,
      }, {
        quotes: true,
        delimiter: ',',
        header: true,
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', isExportSelected ? 'selected_partners.csv' : 'partners.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess(`Successfully exported ${isExportSelected ? 'selected' : 'all'} partners to CSV`);
      setExportConfirmOpen(false);
      setExportFieldsModalOpen(false);
    } catch (err) {
      setError('Failed to export partners to CSV. Please try again.');
      console.error('Error exporting CSV:', err);
    }
  };

  const validateRow = (row) => {
    const errors = [];
    if (!row['Partner Name']) errors.push('Missing Partner Name');
    if (!row['Project Name']) errors.push('Missing Project Name');
    if (!row['Start Date'] || !isValidDate(row['Start Date'])) errors.push('Invalid Start Date');
    if (!row['End Date'] || !isValidDate(row['End Date'])) errors.push('Invalid End Date');
    if (row['Contact Email'] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row['Contact Email'])) errors.push('Invalid Contact Email');
    if (row['Status'] && !['Hot', 'Warm', 'Cold'].includes(row['Status'])) errors.push('Invalid Status');
    if (row['Duration Status'] && !['Upcoming', 'Ongoing', 'Custom'].includes(row['Duration Status'])) errors.push('Invalid Duration Status');
    return errors;
  };

  const isValidDate = (dateStr) => {
    const [month, day, year] = dateStr.split('/');
    const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    return date instanceof Date && !isNaN(date);
  };

  const resetImportState = () => {
    setParsedData([]);
    setImportSummary(null);
    setImportPreviewOpen(false);
    setIsImporting(false);
    setImportProgress(0);
    setCurrentImportItem('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportCSV = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setError('Please select a CSV file to import.');
      return;
    }
    if (file.type !== 'text/csv') {
      setError('Please upload a valid CSV file.');
      return;
    }

    console.log('Uploading CSV file:', file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      Papa.parse(e.target.result, {
        header: true,
        skipEmptyLines: true,
        transformHeader: header => header.trim(),
        complete: (result) => {
          const dataRows = result.data;
          if (!dataRows.length) {
            setError('No data rows parsed from CSV.');
            return;
          }
          const validatedRows = dataRows.map((row, index) => ({
            ...row,
            errors: validateRow(row),
            rowIndex: index + 2,
          }));
          console.log('Parsed CSV data:', validatedRows);
          setParsedData(validatedRows);
          setImportPreviewOpen(true);
        },
        error: (err) => {
          setError(`Failed to parse CSV: ${err.message}`);
          console.error('Error parsing CSV:', err);
        },
      });
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    setIsImporting(true);
    setImportProgress(0);
    setCurrentImportItem('');
    setImportPreviewOpen(false);
    const validRows = parsedData.filter(row => row.errors.length === 0);
    const failedRows = [];

    console.log('Starting import:', { totalValidRows: validRows.length });
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      setImportProgress(Math.round((i + 1) / validRows.length * 100));
      setCurrentImportItem(row['Partner Name'] || `Partner ${i + 1}`);

      try {
        const contact = {
          email: row['Contact Email'] || '',
          phone: row['Contact Phone'] || '',
          person: row['Contact Person'] || '',
          role: row['Contact Role'] || '',
        };
        let parsedServices = [];
        if (row['Services'] && row['Services'].trim()) {
          const serviceItems = row['Services'].replace(/"/g, '').split(' | ').filter(item => item.trim());
          parsedServices = serviceItems.map(item => {
            const parts = item.split(', ').reduce((acc, part) => {
              const [key, value] = part.split(': ');
              if (key && value !== undefined) acc[key.trim()] = value.trim();
              else if (key) acc[key.trim()] = '';
              return acc;
            }, {});
            return {
              name: parts['Name'] || '',
              status: parts['Status'] || 'Active',
              cost: parts['Cost']?.startsWith('$') ? Number(parts['Cost'].slice(1)) : undefined,
              termSheets: parts['Term Sheets'] && parts['Term Sheets'] !== 'N/A' ? parts['Term Sheets'].split('; ') : [],
            };
          });
        }

        const parseDate = (dateStr) => {
          const [month, day, year] = dateStr.split('/');
          return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`).toISOString();
        };

        await axios.post('/api/partners', {
          name: row['Partner Name']?.trim() || '',
          projectName: row['Project Name']?.trim() || '',
          status: row['Status']?.trim() || 'Cold',
          startDate: parseDate(row['Start Date']),
          endDate: parseDate(row['End Date']),
          durationStatus: row['Duration Status']?.trim() || 'Upcoming',
          durationStatusCustom: row['Duration Status'] === 'Custom' ? row['Duration Status Custom']?.trim() || '' : '',
          category: row['Category']?.trim() || undefined,
          contact,
          services: parsedServices,
        }, {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        console.error(`Error importing row ${row.rowIndex}:`, err.message);
        failedRows.push({ row: row.rowIndex, error: err.response?.data?.message || err.message });
      }
    }

    console.log('Import completed:', { successful: validRows.length - failedRows.length, failed: failedRows.length });
    setIsImporting(false);
    setImportSummary({
      total: parsedData.length,
      successful: validRows.length - failedRows.length,
      skipped: parsedData.filter(row => row.errors.length > 0).length,
      failed: failedRows,
    });
    if (failedRows.length > 0 || parsedData.some(row => row.errors.length > 0)) {
      setError(`Imported with issues. Skipped ${parsedData.filter(row => row.errors.length > 0).length} rows with errors. Failed rows: ${failedRows.map(f => `Row ${f.row}: ${f.error}`).join(', ')}`);
    } else {
      setSuccess('Partners imported successfully');
    }
    fetchPartners();
    resetImportState();
  };

  const handleBulkDelete = () => {
    setBulkDeleteModalOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedPartners.length === 0) {
      setError('Please select at least one partner to delete.');
      setBulkDeleteModalOpen(false);
      return;
    }
    try {
      await Promise.all(selectedPartners.map(partner => axios.delete(`/api/partners/${partner._id}`)));
      setSuccess('Selected partners deleted successfully');
      setSelectedPartners([]);
      setBulkDeleteModalOpen(false);
      fetchPartners();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete selected partners. Please try again later.');
      console.error('Error deleting selected partners:', err);
      setBulkDeleteModalOpen(false);
    }
  };

  const handleBulkEdit = async () => {
    if (selectedPartners.length === 0) {
      setError('Please select at least one partner to edit.');
      return;
    }
    try {
      await Promise.all(selectedPartners.map(partner => axios.put(`/api/partners/${partner._id}/status`, { status: bulkEditStatus })));
      setSuccess('Selected partners updated successfully');
      setSelectedPartners([]);
      setBulkEditModalOpen(false);
      fetchPartners();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update selected partners. Please try again later.');
      console.error('Error updating selected partners:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Hot': return 'error';
      case 'Warm': return 'warning';
      case 'Cold': return 'info';
      default: return 'default';
    }
  };

  const getDurationStatusColor = (status) => {
    switch (status) {
      case 'Ongoing': return 'success';
      case 'Upcoming': return 'info';
      default: return 'default';
    }
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const stableSort = (array, comparator) => {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  };

  const getComparator = (order, orderBy) => {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  };

  const descendingComparator = (a, b, orderBy) => {
    if (orderBy === 'startDate') {
      return new Date(b.startDate) - new Date(a.startDate);
    }
    if (orderBy === 'services') {
      return b.services.length - a.services.length;
    }
    if (b[orderBy] < a[orderBy]) return -1;
    if (b[orderBy] > a[orderBy]) return 1;
    return 0;
  };

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = (
      (partner.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (partner.projectName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (partner.status || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (partner.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (partner.contact?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (partner.contact?.person || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesStatus = filterStatus ? partner.status === filterStatus : true;
    const matchesCategory = filterCategory ? (partner.category || '') === filterCategory : true;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const sortedPartners = stableSort(filteredPartners, getComparator(order, orderBy));
  const paginatedPartners = sortedPartners.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenActivityLogs = async () => {
    try {
      const response = await axios.get('/api/partners/activity-logs');
      setActivityLogs(response.data);
      setActivityLogsModalOpen(true);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('You are not authenticated. Please log in.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view activity logs.');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch activity logs. Please try again later.');
      }
      console.error('Error fetching activity logs:', err);
    }
  };

  return (
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
        gap: 4,
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
      <Box sx={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <Toolbar />
        <Box
          sx={{
            background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
            backdropFilter: isDarkMode ? 'blur(10px)' : 'blur(15px)',
            borderRadius: '16px',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
            padding: { xs: '20px', sm: '30px' },
            width: '100%',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography
              variant="h4"
              sx={{
                fontFamily: "'Poppins', sans-serif",
                color: muiTheme.palette.primary.main,
                fontWeight: 'bold',
              }}
            >
              Partner Management
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => { console.log('Create button clicked'); setCreateModalOpen(true); }}
                sx={{
                  backgroundColor: brandingBlue,
                  color: '#fff',
                  borderRadius: '8px',
                  py: 1.5,
                  px: 3,
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: '#3367D6',
                    transform: 'scale(1.05)',
                  },
                  '&:active': { backgroundColor: brandingBlue },
                  '&:disabled': { backgroundColor: disabledColor, color: '#fff' },
                }}
                aria-label="Create new partner"
              >
                Create Partner
              </Button>
              {isAdmin && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<FileUploadIcon />}
                    component="label"
                    sx={{
                      backgroundColor: isDarkMode ? '#fff' : 'transparent',
                      color: isDarkMode ? '#333' : muiTheme.palette.text.primary,
                      border: !isDarkMode ? '1px solid #333' : 'none',
                      borderRadius: '8px',
                      py: 1.5,
                      px: 3,
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: hoverBackground,
                        border: !isDarkMode ? '1px solid #34A853' : '1px solid #34A853',
                        transform: 'scale(1.05)',
                      },
                      '&:active': { border: !isDarkMode ? '1px solid #34A853' : '1px solid #34A853' },
                      '&:disabled': { border: 'none', color: disabledColor },
                    }}
                    aria-label="Import partners from CSV"
                  >
                    Import CSV
                    <input
                      type="file"
                      accept=".csv"
                      hidden
                      ref={fileInputRef}
                      onChange={handleImportCSV}
                    />
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<FileDownloadIcon />}
                    onClick={() => handleOpenExportConfirm(false)}
                    sx={{
                      backgroundColor: isDarkMode ? '#fff' : 'transparent',
                      color: isDarkMode ? '#333' : muiTheme.palette.text.primary,
                      border: !isDarkMode ? '1px solid #333' : 'none',
                      borderRadius: '8px',
                      py: 1.5,
                      px: 3,
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: hoverBackground,
                        border: !isDarkMode ? '1px solid #34A853' : '1px solid #34A853',
                        transform: 'scale(1.05)',
                      },
                      '&:active': { border: !isDarkMode ? '1px solid #34A853' : '1px solid #34A853' },
                      '&:disabled': { border: 'none', color: disabledColor },
                    }}
                    aria-label="Export partners to CSV"
                  >
                    Export as CSV
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<FileDownloadIcon />}
                    onClick={() => handleOpenExportConfirm(true)}
                    disabled={selectedPartners.length === 0}
                    sx={{
                      backgroundColor: isDarkMode ? '#fff' : 'transparent',
                      color: isDarkMode ? '#333' : muiTheme.palette.text.primary,
                      border: !isDarkMode ? '1px solid #333' : 'none',
                      borderRadius: '8px',
                      py: 1.5,
                      px: 3,
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: hoverBackground,
                        border: !isDarkMode ? '1px solid #34A853' : '1px solid #34A853',
                        transform: 'scale(1.05)',
                      },
                      '&:active': { border: !isDarkMode ? '1px solid #34A853' : '1px solid #34A853' },
                      '&:disabled': { border: 'none', color: disabledColor },
                    }}
                    aria-label="Export selected partners to CSV"
                  >
                    Export Selected
                  </Button>
                </>
              )}
              <Tooltip title="Activity Log">
                <IconButton
                  onClick={handleOpenActivityLogs}
                  sx={{
                    backgroundColor: isDarkMode ? '#fff' : 'transparent',
                    color: isDarkMode ? '#333' : muiTheme.palette.text.primary,
                    border: !isDarkMode ? '1px solid #333' : 'none',
                    borderRadius: '8px',
                    p: 1.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: hoverBackground,
                      border: !isDarkMode ? '1px solid #34A853' : '1px solid #34A853',
                      transform: 'scale(1.05)',
                    },
                    '&:active': { border: !isDarkMode ? '1px solid #34A853' : '1px solid #34A853' },
                    '&:disabled': { border: 'none', color: disabledColor },
                  }}
                  aria-label="View activity log"
                >
                  <HistoryIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', flex: '1 1 auto' }}>
              <TextField
                label="Search by Partner or Project Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: muiTheme.palette.text.secondary }} />,
                }}
                sx={{
                  flex: '1 1 300px',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    background: muiTheme.palette.background.listItem,
                    '& fieldset': { borderColor: muiTheme.palette.border.main },
                    '&:hover fieldset': { borderColor: greenLightColor },
                    '&.Mui-focused fieldset': { borderColor: greenLightColor },
                  },
                }}
                aria-label="Search partners"
              />
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel sx={{ color: muiTheme.palette.text.secondary }}>Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Status"
                  sx={{
                    borderRadius: '8px',
                    background: muiTheme.palette.background.listItem,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: muiTheme.palette.border.main },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: greenLightColor },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: greenLightColor },
                  }}
                  aria-label="Filter by status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Hot">Hot</MenuItem>
                  <MenuItem value="Warm">Warm</MenuItem>
                  <MenuItem value="Cold">Cold</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel sx={{ color: muiTheme.palette.text.secondary }}>Category</InputLabel>
                <Select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  label="Category"
                  sx={{
                    borderRadius: '8px',
                    background: muiTheme.palette.background.listItem,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: muiTheme.palette.border.main },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: greenLightColor },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: greenLightColor },
                  }}
                  aria-label="Filter by category"
                >
                  <MenuItem value="">All</MenuItem>
                  {uniqueCategories.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            {selectedPartners.length > 0 && (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ color: muiTheme.palette.text.primary, mr: 2 }}>
                  {selectedPartners.length} partner(s) selected
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleBulkDelete}
                  sx={{
                    backgroundColor: '#D32F2F',
                    color: '#fff',
                    borderRadius: '8px',
                    py: 1,
                    px: 2,
                    fontSize: '0.875rem',
                    transition: 'all 0.3s ease',
                    '&:hover': { backgroundColor: '#B71C1C', transform: 'scale(1.05)' },
                    '&:active': { backgroundColor: '#A00000' },
                    '&:disabled': { backgroundColor: disabledColor, color: '#fff' },
                  }}
                  aria-label="Delete selected partners"
                >
                  Delete Selected
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setBulkEditModalOpen(true)}
                  sx={{
                    backgroundColor: muiTheme.palette.primary.main,
                    color: isDarkMode ? '#000' : '#fff',
                    borderRadius: '8px',
                    py: 1,
                    px: 2,
                    fontSize: '0.875rem',
                    transition: 'all 0.3s ease',
                    '&:hover': { backgroundColor: muiTheme.palette.primary.dark, transform: 'scale(1.05)' },
                    '&:active': { backgroundColor: muiTheme.palette.primary.light },
                    '&:disabled': { backgroundColor: disabledColor, color: '#fff' },
                  }}
                  aria-label="Edit selected partners"
                >
                  Edit Selected
                </Button>
              </Box>
            )}
          </Box>

          <TableContainer component={Paper} sx={{ background: muiTheme.palette.background.listItem }}>
            <Table role="grid" aria-label="Partners table">
              <TableHead>
                <TableRow role="row">
                  <TableCell padding="checkbox" role="columnheader">
                    <Checkbox
                      checked={paginatedPartners.length > 0 && selectedPartners.length === paginatedPartners.length}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedPartners(paginatedPartners);
                        else setSelectedPartners([]);
                      }}
                      sx={{ color: !isDarkMode ? '#333' : '#fff', '&.Mui-checked': { color: hoverGreen } }}
                      aria-label="Select all partners on this page"
                    />
                  </TableCell>
                  <TableCell role="columnheader">No.</TableCell>
                  <TableCell role="columnheader">
                    <TableSortLabel
                      active={orderBy === 'name'}
                      direction={orderBy === 'name' ? order : 'asc'}
                      onClick={() => handleRequestSort('name')}
                      aria-sort={orderBy === 'name' ? order : 'none'}
                    >
                      Partner Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell role="columnheader">
                    <TableSortLabel
                      active={orderBy === 'projectName'}
                      direction={orderBy === 'projectName' ? order : 'asc'}
                      onClick={() => handleRequestSort('projectName')}
                      aria-sort={orderBy === 'projectName' ? order : 'none'}
                    >
                      Project Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell role="columnheader">
                    <TableSortLabel
                      active={orderBy === 'status'}
                      direction={orderBy === 'status' ? order : 'asc'}
                      onClick={() => handleRequestSort('status')}
                      aria-sort={orderBy === 'status' ? order : 'none'}
                    >
                      Status
                    </TableSortLabel>
                  </TableCell>
                  <TableCell role="columnheader">
                    <TableSortLabel
                      active={orderBy === 'startDate'}
                      direction={orderBy === 'startDate' ? order : 'asc'}
                      onClick={() => handleRequestSort('startDate')}
                      aria-sort={orderBy === 'startDate' ? order : 'none'}
                    >
                      Duration
                    </TableSortLabel>
                  </TableCell>
                  <TableCell role="columnheader">
                    <TableSortLabel
                      active={orderBy === 'category'}
                      direction={orderBy === 'category' ? order : 'asc'}
                      onClick={() => handleRequestSort('category')}
                      aria-sort={orderBy === 'category' ? order : 'none'}
                    >
                      Category
                    </TableSortLabel>
                  </TableCell>
                  <TableCell role="columnheader">
                    <TableSortLabel
                      active={orderBy === 'services'}
                      direction={orderBy === 'services' ? order : 'asc'}
                      onClick={() => handleRequestSort('services')}
                      aria-sort={orderBy === 'services' ? order : 'none'}
                    >
                      Services
                    </TableSortLabel>
                  </TableCell>
                  <TableCell role="columnheader">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedPartners.map((partner, index) => (
                  <TableRow
                    key={partner._id}
                    role="row"
                    selected={selectedPartners.some(p => p._id === partner._id)}
                    aria-describedby={`actions-${partner._id}`}
                  >
                    <TableCell padding="checkbox" role="gridcell">
                      <Checkbox
                        checked={selectedPartners.some(p => p._id === partner._id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedPartners([...selectedPartners, partner]);
                          else setSelectedPartners(selectedPartners.filter(p => p._id !== partner._id));
                        }}
                        sx={{ color: !isDarkMode ? '#333' : '#fff', '&.Mui-checked': { color: hoverGreen } }}
                        aria-label={`Select ${partner.name}`}
                      />
                    </TableCell>
                    <TableCell role="gridcell">{(page * rowsPerPage) + index + 1}</TableCell>
                    <TableCell role="gridcell">{partner.name}</TableCell>
                    <TableCell role="gridcell">{partner.projectName}</TableCell>
                    <TableCell role="gridcell">
                      <FormControl sx={{ minWidth: 100 }}>
                        <Select
                          value={partner.status}
                          onChange={(e) => handleChangeStatus(partner._id, e.target.value)}
                          sx={{ height: '32px' }}
                          aria-label={`Change status for ${partner.name}`}
                        >
                          <MenuItem value="Hot">
                            <Chip label="Hot" color="error" size="small" sx={{ color: isDarkMode ? 'white' : undefined }} />
                          </MenuItem>
                          <MenuItem value="Warm">
                            <Chip label="Warm" color="warning" size="small" sx={{ color: isDarkMode ? 'white' : undefined }} />
                          </MenuItem>
                          <MenuItem value="Cold">
                            <Chip label="Cold" color="info" size="small" sx={{ color: isDarkMode ? 'white' : undefined }} />
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell role="gridcell">
                      {new Date(partner.startDate).toLocaleDateString()} - {new Date(partner.endDate).toLocaleDateString()}
                      <Chip
                        label={partner.durationStatus === 'Custom' ? partner.durationStatusCustom : partner.durationStatus}
                        color={getDurationStatusColor(partner.durationStatus)}
                        size="small"
                        sx={{ ml: 1, color: isDarkMode ? 'white' : undefined }}
                      />
                    </TableCell>
                    <TableCell role="gridcell">{partner.category || 'N/A'}</TableCell>
                    <TableCell role="gridcell">{partner.services.length}</TableCell>
                    <TableCell role="gridcell" id={`actions-${partner._id}`}>
                      <IconButton
                        onClick={() => handleViewDetails(partner)}
                        sx={{ color: muiTheme.palette.primary.main }}
                        aria-label={`View details for ${partner.name}`}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          setPartnerToDelete(partner);
                          setDeleteModalOpen(true);
                        }}
                        sx={{ color: 'red' }}
                        aria-label={`Delete ${partner.name}`}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredPartners.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              aria-label="Table pagination"
            />
          </TableContainer>
        </Box>
      </Box>

      {/* Import Progress Dialog */}
      <Dialog
        open={isImporting}
        maxWidth="sm"
        fullWidth
        disableEnforceFocus
        aria-labelledby="import-progress-modal-title"
      >
        <DialogTitle
          id="import-progress-modal-title"
          sx={{
            fontFamily: "'Poppins', sans-serif",
            color: muiTheme.palette.primary.main,
            bgcolor: muiTheme.palette.background.default,
            py: 3,
            px: 4,
            position: 'relative',
            borderBottom: `1px solid ${muiTheme.palette.divider}`,
            fontSize: '1.5rem',
            fontWeight: 600,
          }}
        >
          Importing Partners
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Typography
            variant="h5"
            fontWeight="medium"
            fontFamily="'Poppins', sans-serif"
            color={muiTheme.palette.text.primary}
            mb={2}
          >
            Processing Import
          </Typography>
          <LinearProgress
            variant="determinate"
            value={importProgress}
            sx={{
              mb: 2,
              bgcolor: isDarkMode ? muiTheme.palette.grey[800] : muiTheme.palette.grey[300],
              '& .MuiLinearProgress-bar': { bgcolor: muiTheme.palette.primary.main },
            }}
            aria-label="Import progress"
          />
          <Typography
            variant="body1"
            color={muiTheme.palette.text.secondary}
            fontFamily="'Poppins', sans-serif"
          >
            {importProgress === 0
              ? 'Starting import...'
              : `Inserting ${currentImportItem} (${Math.round(importProgress)}%)`}
          </Typography>
        </DialogContent>
      </Dialog>

      {/* Import Preview Dialog */}
      <Dialog
        open={importPreviewOpen}
        onClose={() => resetImportState()}
        maxWidth="lg"
        fullWidth
        disableEnforceFocus
        aria-labelledby="import-preview-modal-title"
      >
        <DialogTitle
          id="import-preview-modal-title"
          sx={{ fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.primary.main, position: 'relative' }}
        >
          Preview CSV Import
          <IconButton
            onClick={() => resetImportState()}
            sx={{ position: 'absolute', right: 8, top: 8, color: theme => theme.palette.grey[500] }}
            aria-label="Close import preview"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Review the data below. Rows with errors will be skipped.
          </Typography>
          <TableContainer component={Paper}>
            <Table aria-label="Import preview table">
              <TableHead>
                <TableRow>
                  <TableCell>Row</TableCell>
                  <TableCell>Partner Name</TableCell>
                  <TableCell>Project Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Duration Status</TableCell>
                  <TableCell>Errors</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parsedData.map(row => (
                  <TableRow key={row.rowIndex} sx={{ bgcolor: row.errors.length > 0 ? 'error.light' : 'inherit' }}>
                    <TableCell sx={{ color: !isDarkMode && row.errors.length > 0 ? '#fff' : muiTheme.palette.text.primary }}>{row.rowIndex}</TableCell>
                    <TableCell sx={{ color: !isDarkMode && row.errors.length > 0 ? '#fff' : muiTheme.palette.text.primary }}>{row['Partner Name'] || 'N/A'}</TableCell>
                    <TableCell sx={{ color: !isDarkMode && row.errors.length > 0 ? '#fff' : muiTheme.palette.text.primary }}>{row['Project Name'] || 'N/A'}</TableCell>
                    <TableCell sx={{ color: !isDarkMode && row.errors.length > 0 ? '#fff' : muiTheme.palette.text.primary }}>{row['Status'] || 'N/A'}</TableCell>
                    <TableCell sx={{ color: !isDarkMode && row.errors.length > 0 ? '#fff' : muiTheme.palette.text.primary }}>{row['Start Date'] || 'N/A'}</TableCell>
                    <TableCell sx={{ color: !isDarkMode && row.errors.length > 0 ? '#fff' : muiTheme.palette.text.primary }}>{row['End Date'] || 'N/A'}</TableCell>
                    <TableCell sx={{ color: !isDarkMode && row.errors.length > 0 ? '#fff' : muiTheme.palette.text.primary }}>{row['Duration Status'] || 'N/A'}</TableCell>
                    <TableCell sx={{ color: !isDarkMode && row.errors.length > 0 ? '#fff' : muiTheme.palette.text.primary }}>
                      {row.errors.join(', ') || 'None'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => resetImportState()}
            sx={{ fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.text.primary }}
            aria-label="Cancel import"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmImport}
            variant="contained"
            sx={{
              fontFamily: "'Poppins', sans-serif",
              backgroundColor: brandingBlue,
              color: '#fff',
              '&:hover': { backgroundColor: isDarkMode ? '#3367D6' : muiTheme.palette.primary.dark, transform: 'scale(1.05)' },
              transition: 'all 0.3s ease',
            }}
            aria-label="Confirm import"
            disabled={parsedData.every(row => row.errors.length > 0)}
          >
            Import
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Summary Dialog */}
      {importSummary && (
        <Dialog
          open={!!importSummary}
          onClose={() => setImportSummary(null)}
          maxWidth="sm"
          fullWidth
          disableEnforceFocus
          aria-labelledby="import-summary-modal-title"
        >
          <DialogTitle
            id="import-summary-modal-title"
            sx={{ fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.primary.main, position: 'relative' }}
          >
            Import Summary
            <IconButton
              onClick={() => setImportSummary(null)}
              sx={{ position: 'absolute', right: 8, top: 8, color: theme => theme.palette.grey[500] }}
              aria-label="Close import summary"
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2, fontFamily: "'Poppins', sans-serif" }}>
              Total Entries: {importSummary.total}<br />
              Successful Entries: {importSummary.successful}<br />
              Skipped Entries (with Errors): {importSummary.skipped}<br />
              Failed Entries: {importSummary.failed.length}
            </Typography>
            {importSummary.failed.length > 0 && (
              <>
                <Typography variant="subtitle1" sx={{ mb: 1, fontFamily: "'Poppins', sans-serif" }}>
                  Failed Rows:
                </Typography>
                <ul>
                  {importSummary.failed.map(f => (
                    <li key={f.row}>Row {f.row}: {f.error}</li>
                  ))}
                </ul>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setImportSummary(null)}
              sx={{ fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.text.primary }}
              aria-label="Close import summary"
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Export Fields Selection Dialog */}
      <Dialog
        open={exportFieldsModalOpen}
        onClose={() => setExportFieldsModalOpen(false)}
        maxWidth="sm"
        fullWidth
        disableEnforceFocus
        aria-labelledby="export-fields-modal-title"
      >
        <DialogTitle
          id="export-fields-modal-title"
          sx={{ fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.primary.main, position: 'relative' }}
        >
          Select Fields to Export
          <IconButton
            onClick={() => setExportFieldsModalOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: theme => theme.palette.grey[500] }}
            aria-label="Close export fields selection"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {availableFields.map(field => (
            <FormControlLabel
              key={field.id}
              control={
                <Checkbox
                  checked={exportFields.includes(field.id)}
                  onChange={() => toggleExportField(field.id)}
                  sx={{ color: !isDarkMode ? '#333' : '#fff', '&.Mui-checked': { color: hoverGreen } }}
                  aria-label={`Include ${field.label} in export`}
                />
              }
              label={field.label}
              sx={{ display: 'block', mb: 1 }}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setExportFieldsModalOpen(false)}
            sx={{ fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.text.primary }}
            aria-label="Cancel field selection"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setExportFieldsModalOpen(false);
              setExportConfirmOpen(true);
            }}
            variant="contained"
            sx={{
              fontFamily: "'Poppins', sans-serif",
              backgroundColor: brandingBlue,
              color: '#fff',
              '&:hover': { backgroundColor: isDarkMode ? '#3367D6' : muiTheme.palette.primary.dark, transform: 'scale(1.05)' },
              transition: 'all 0.3s ease',
            }}
            aria-label="Confirm field selection"
            disabled={exportFields.length === 0}
          >
            Next
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Confirmation Dialog */}
      <Dialog
        open={exportConfirmOpen}
        onClose={() => setExportConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
        disableEnforceFocus
        aria-labelledby="export-confirm-modal-title"
      >
        <DialogTitle
          id="export-confirm-modal-title"
          sx={{ fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.primary.main, position: 'relative' }}
        >
          Confirm Export
          <IconButton
            onClick={() => setExportConfirmOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: theme => theme.palette.grey[500] }}
            aria-label="Close export confirmation"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.text.primary }}>
            Are you sure you want to export {isExportSelected ? selectedPartners.length : filteredPartners.length} partner(s) to CSV?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setExportConfirmOpen(false)}
            sx={{ fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.text.primary }}
            aria-label="Cancel export"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setExportConfirmOpen(false);
              handleExportCSV();
            }}
            variant="contained"
            sx={{
              fontFamily: "'Poppins', sans-serif",
              backgroundColor: brandingBlue,
              color: '#fff',
              '&:hover': { backgroundColor: isDarkMode ? '#3367D6' : muiTheme.palette.primary.dark, transform: 'scale(1.05)' },
              transition: 'all 0.3s ease',
            }}
            aria-label="Confirm export"
          >
            Export
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Partner Dialog */}
      <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} maxWidth="sm" fullWidth disableEnforceFocus aria-labelledby="create-partner-modal-title">
        <DialogTitle id="create-partner-modal-title" sx={{ fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.primary.main, position: 'relative' }}>
          Create New Partner
          <IconButton
            onClick={() => setCreateModalOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: theme => theme.palette.grey[500] }}
            aria-label="Close create partner dialog"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Partner Name"
            value={newPartner.name}
            onChange={e => setNewPartner({ ...newPartner, name: e.target.value })}
            fullWidth
            margin="normal"
            required
            aria-label="Partner name"
          />
          <TextField
            label="Project Name"
            value={newPartner.projectName}
            onChange={e => setNewPartner({ ...newPartner, projectName: e.target.value })}
            fullWidth
            margin="normal"
            required
            aria-label="Project name"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={newPartner.status}
              onChange={e => setNewPartner({ ...newPartner, status: e.target.value })}
              label="Status"
              aria-label="Partner status"
            >
              <MenuItem value="Hot">Hot</MenuItem>
              <MenuItem value="Warm">Warm</MenuItem>
              <MenuItem value="Cold">Cold</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Start Date"
            type="date"
            value={newPartner.startDate}
            onChange={e => setNewPartner({ ...newPartner, startDate: e.target.value })}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            required
            aria-label="Start date"
          />
          <TextField
            label="End Date"
            type="date"
            value={newPartner.endDate}
            onChange={e => setNewPartner({ ...newPartner, endDate: e.target.value })}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            required
            aria-label="End date"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Duration Status</InputLabel>
            <Select
              value={newPartner.durationStatus}
              onChange={e => setNewPartner({ ...newPartner, durationStatus: e.target.value })}
              label="Duration Status"
              aria-label="Duration status"
            >
              <MenuItem value="Upcoming">Upcoming</MenuItem>
              <MenuItem value="Ongoing">Ongoing</MenuItem>
              <MenuItem value="Custom">Custom</MenuItem>
            </Select>
          </FormControl>
          {newPartner.durationStatus === 'Custom' && (
            <TextField
              label="Custom Duration Status"
              value={newPartner.durationStatusCustom}
              onChange={e => setNewPartner({ ...newPartner, durationStatusCustom: e.target.value })}
              fullWidth
              margin="normal"
              aria-label="Custom duration status"
            />
          )}
          <Autocomplete
            freeSolo
            options={uniqueCategories}
            value={newPartner.category || null}
            onChange={(event, newValue) => setNewPartner({ ...newPartner, category: newValue || '' })}
            onInputChange={(event, newInputValue) => setNewPartner({ ...newPartner, category: newInputValue })}
            renderInput={params => (
              <TextField
                {...params}
                label="Category"
                placeholder="Select or type a category"
                fullWidth
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    background: muiTheme.palette.background.listItem,
                    '& fieldset': { borderColor: muiTheme.palette.border.main },
                    '&:hover fieldset': { borderColor: greenLightColor },
                    '&.Mui-focused fieldset': { borderColor: greenLightColor },
                  },
                }}
                aria-label="Category"
              />
            )}
          />
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            Contact Information (Optional)
          </Typography>
          <TextField
            label="Email"
            value={newPartner.contact.email}
            onChange={e => setNewPartner({ ...newPartner, contact: { ...newPartner.contact, email: e.target.value } })}
            fullWidth
            margin="normal"
            aria-label="Contact email"
          />
          <TextField
            label="Phone"
            value={newPartner.contact.phone}
            onChange={e => setNewPartner({ ...newPartner, contact: { ...newPartner.contact, phone: e.target.value } })}
            fullWidth
            margin="normal"
            aria-label="Contact phone"
          />
          <TextField
            label="Contact Person"
            value={newPartner.contact.person}
            onChange={e => setNewPartner({ ...newPartner, contact: { ...newPartner.contact, person: e.target.value } })}
            fullWidth
            margin="normal"
            aria-label="Contact person"
          />
          <TextField
            label="Contact Role"
            value={newPartner.contact.role}
            onChange={e => setNewPartner({ ...newPartner, contact: { ...newPartner.contact, role: e.target.value } })}
            fullWidth
            margin="normal"
            aria-label="Contact role"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreatePartner} variant="contained" color="primary" aria-label="Create partner">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Edit Dialog */}
      <Dialog open={bulkEditModalOpen} onClose={() => setBulkEditModalOpen(false)} maxWidth="sm" fullWidth disableEnforceFocus aria-labelledby="bulk-edit-modal-title">
        <DialogTitle id="bulk-edit-modal-title" sx={{ fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.primary.main, position: 'relative' }}>
          Edit Selected Partners
          <IconButton
            onClick={() => setBulkEditModalOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: theme => theme.palette.grey[500] }}
            aria-label="Close bulk edit dialog"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={bulkEditStatus}
              onChange={e => setBulkEditStatus(e.target.value)}
              label="Status"
              aria-label="Bulk edit status"
            >
              <MenuItem value="Hot">Hot</MenuItem>
              <MenuItem value="Warm">Warm</MenuItem>
              <MenuItem value="Cold">Cold</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkEditModalOpen(false)} variant="outlined" color="primary" aria-label="Cancel bulk edit">
            Cancel
          </Button>
          <Button onClick={handleBulkEdit} variant="contained" color="primary" aria-label="Apply bulk edit">
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDeleteModalOpen} onClose={() => setBulkDeleteModalOpen(false)} maxWidth="sm" fullWidth disableEnforceFocus aria-labelledby="bulk-delete-modal-title">
        <DialogTitle id="bulk-delete-modal-title" sx={{ fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.error.main, position: 'relative' }}>
          Confirm Deletion
          <IconButton
            onClick={() => setBulkDeleteModalOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: theme => theme.palette.grey[500] }}
            aria-label="Close bulk delete dialog"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.text.primary }}>
            Are you sure you want to delete the selected {selectedPartners.length} partner(s)? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setBulkDeleteModalOpen(false)}
            sx={{ fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.text.primary }}
            aria-label="Cancel bulk delete"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmBulkDelete}
            variant="contained"
            color="error"
            sx={{ fontFamily: "'Poppins', sans-serif", color: '#fff' }}
            aria-label="Confirm bulk delete"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Partner Dialog */}
      <Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} maxWidth="sm" fullWidth disableEnforceFocus aria-labelledby="delete-partner-modal-title">
        <DialogTitle id="delete-partner-modal-title" sx={{ fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.error.main, position: 'relative' }}>
          Confirm Delete
          <IconButton
            onClick={() => setDeleteModalOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: theme => theme.palette.grey[500] }}
            aria-label="Close delete partner dialog"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.text.primary }}>
            Are you sure you want to delete the partner "{partnerToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteModalOpen(false)}
            sx={{ fontFamily: "'Poppins', sans-serif", color: muiTheme.palette.text.primary }}
            aria-label="Cancel delete"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeletePartner}
            sx={{ fontFamily: "'Poppins', sans-serif", color: 'red' }}
            aria-label="Confirm delete"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Partner Details Modal */}
      {selectedPartner && (
        <PartnerDetailsModal
          open={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false);
            fetchPartners();
          }}
          partner={selectedPartner}
          onUpdate={fetchPartners}
        />
      )}

      {/* Activity Logs Modal */}
      <ActivityLogsModal
        open={activityLogsModalOpen}
        onClose={() => setActivityLogsModalOpen(false)}
        logs={activityLogs}
      />

      {/* Snackbar for Feedback */}
      <CustomSnackbar open={!!success || !!error} onClose={() => { setSuccess(''); setError(''); }} severity={success ? 'success' : 'error'} message={success || error} />
    </Box>
  );
}

export default function PartnerManagementWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <PartnerManagement />
    </ErrorBoundary>
  );
}