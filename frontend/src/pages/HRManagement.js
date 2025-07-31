// BGE-CoordiNET\frontend\src\pages\HRManagement.js
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  Chip,
  Modal,
  IconButton,
  CircularProgress,
  FormControl,
  InputLabel,
  FormHelperText,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Toolbar,
  Avatar,
  DialogTitle,
  TablePagination,
  Checkbox,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import {
  Add,
  Search,
  Edit,
  Delete,
  History,
  Close,
  FileUpload,
  FileDownload,
} from "@mui/icons-material";
import { keyframes } from "@emotion/react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import usePermission from "../hooks/usePermission";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import ErrorBoundary from "../components/ErrorBoundary";

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Debounce utility
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

const HRManagement = () => {
  const { isDarkMode, muiTheme } = useTheme();
  const isProcessingRef = useRef(false);
  const { authState, refreshAuth } = useAuth();
  const navigate = useNavigate();
  const hasHRManagementPermission = usePermission("hrManagement");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    employeeId: "",
    department: "Other",
    position: "",
    status: "Active",
    birthdate: "",
    gender: "",
    civilStatus: "",
    governmentIds: { sss: "", philHealth: "", tin: "", pagIbig: "" },
    hireDate: "",
    role: "employee",
    profilePicture: null,
  });
  const [errors, setErrors] = useState({});
  const [filters, setFilters] = useState({
    department: "",
    status: "",
    role: "",
    search: "",
  });
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [selectedRows, setSelectedRows] = useState([]);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importRows, setImportRows] = useState([]);
  const [selectedImportRows, setSelectedImportRows] = useState([]);
  const [importPreviewLoading, setImportPreviewLoading] = useState(false);
  const [importError, setImportError] = useState(null);
  const brandingBlue = "#4285F4";
  const greenLightColor = "#34A853";
  const greenLightHoverBackground = "rgba(52, 168, 83, 0.1)";
  const hoverBackground = isDarkMode
    ? "rgba(255, 255, 255, 0.15)"
    : greenLightHoverBackground;
  const disabledColor = "#666";

  // Cleanup on unmount
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Debounced fetch members
  const debouncedFetchMembers = useCallback(
    debounce(async () => {
      if (!mounted.current) return;
      setLoading(true);
      try {
        const params = new URLSearchParams({
          ...(filters.department && { department: filters.department }),
          ...(filters.status && { status: filters.status }),
          ...(filters.role && { role: filters.role }),
          ...(filters.search && { search: filters.search }),
          page: page + 1,
          limit: rowsPerPage,
        }).toString();
        const response = await axios.get(`/auth/hr-members?${params}`, {
          withCredentials: true,
        });
        if (mounted.current) {
          setMembers(response.data.members || []);
          setTotalRows(response.data.total || 0);
        }
      } catch (error) {
        if (mounted.current && error.response?.status === 401) {
          refreshAuth();
        }
        if (mounted.current) {
          toast.error(
            error.response?.data?.message ||
              "Failed to fetch members. Please try again."
          );
        }
      } finally {
        if (mounted.current) setLoading(false);
      }
    }, 500),
    [filters, page, rowsPerPage, refreshAuth]
  );

  // Fetch members when authState is ready and permissions are verified
  useEffect(() => {
    if (!authState.isAuthenticated || authState.loading || !mounted.current)
      return;
    if (!["hr", "admin", "superadmin"].includes(authState.userRole)) {
      toast.error("Access denied: Insufficient role.");
      navigate("/dashboard");
      return;
    }
    if (!hasHRManagementPermission) {
      toast.error("Access denied: Missing HR management permission.");
      navigate("/no-access");
      return;
    }
    debouncedFetchMembers();
  }, [
    authState,
    authState.isAuthenticated,
    authState.loading,
    authState.userRole,
    hasHRManagementPermission,
    navigate,
    debouncedFetchMembers,
  ]);

  // Simplified MessageEvent handler
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin === "https://localhost:8443" && event.data?.refresh) {
        debouncedFetchMembers();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [debouncedFetchMembers]);

  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else {
      const domain = formData.email.split("@")[1];
      const allowedDomains = ["bgecorp.com", "beglobalecommercecorp.com"];
      if (!allowedDomains.includes(domain)) {
        newErrors.email =
          "Email must be from bgecorp.com or beglobalecommercecorp.com";
      }
    }
    if (!formData.employeeId.trim())
      newErrors.employeeId = "Employee ID is required";
    if (
      formData.governmentIds.sss &&
      !/^\d{2}-\d{7}-\d$/.test(formData.governmentIds.sss)
    ) {
      newErrors.sss = "SSS number must be in format XX-XXXXXXX-X";
    }
    if (
      formData.governmentIds.philHealth &&
      !/^\d{2}-\d{9}-\d$/.test(formData.governmentIds.philHealth)
    ) {
      newErrors.philHealth =
        "PhilHealth number must be in format XX-XXXXXXXXX-X";
    }
    if (
      formData.governmentIds.tin &&
      !/^\d{3}-\d{3}-\d{3}-\d{3}$/.test(formData.governmentIds.tin)
    ) {
      newErrors.tin = "TIN must be in format XXX-XXX-XXX-XXX";
    }
    if (
      formData.governmentIds.pagIbig &&
      !/^\d{4}-\d{4}-\d{4}$/.test(formData.governmentIds.pagIbig)
    ) {
      newErrors.pagIbig = "Pag-IBIG number must be in format XXXX-XXXX-XXXX";
    }
    if (
      formData.contactNumber &&
      !/^\+?\d{10,12}$/.test(formData.contactNumber)
    ) {
      newErrors.contactNumber = "Contact number must be 10-12 digits";
    }
    if (formData.birthdate && new Date(formData.birthdate) > new Date()) {
      newErrors.birthdate = "Birthdate cannot be in the future";
    }
    if (formData.hireDate && new Date(formData.hireDate) > new Date()) {
      newErrors.hireDate = "Hire date cannot be in the future";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profilePicture") {
      setFormData((prev) => ({ ...prev, profilePicture: files[0] }));
    } else if (name.startsWith("governmentIds.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        governmentIds: { ...prev.governmentIds, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || modalLoading) return;
    setModalLoading(true);
    try {
      const formDataToSend = new FormData();
      const fields = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        contactNumber: formData.contactNumber || "",
        employeeId: formData.employeeId,
        department: formData.department,
        position: formData.position || "",
        status: formData.status,
        birthdate: formData.birthdate || "",
        gender: formData.gender || "",
        civilStatus: formData.civilStatus || "",
        governmentIds: JSON.stringify(formData.governmentIds),
        hireDate: formData.hireDate || "",
        role: formData.role,
        profilePicture: formData.profilePicture,
      };
      Object.entries(fields).forEach(([key, value]) => {
        if (key === "profilePicture" && value) {
          formDataToSend.append(key, value);
        } else {
          formDataToSend.append(key, value);
        }
      });
      if (editMember) {
        await axios.put(`/auth/edit-member/${editMember._id}`, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });
        toast.success("Member updated successfully");
      } else {
        await axios.post("/auth/add-member", formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });
        toast.success("Member added successfully");
      }
      debouncedFetchMembers();
      setModalOpen(false);
      resetForm();
    } catch (error) {
      if (error.response?.status === 401) {
        refreshAuth();
      }
      const errorMessage =
        error.response?.data?.message || "Failed to save member.";
      setErrors((prev) => ({ ...prev, form: errorMessage }));
      toast.error(errorMessage);
    } finally {
      setModalLoading(false);
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        ...(filters.department && { department: filters.department }),
        ...(filters.status && { status: filters.status }),
        ...(filters.role && { role: filters.role }),
        ...(filters.search && { search: filters.search }),
      }).toString();
      const response = await axios.get(`/auth/export-members?${params}`, {
        withCredentials: true,
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "members.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Members exported successfully");
    } catch (error) {
      if (error.response?.status === 401) {
        refreshAuth();
      }
      toast.error(error.response?.data?.message || "Failed to export members.");
    }
  };

  // Handle parse CSV
  const handleParseCSV = useCallback(async () => {
    // Skip if already processing or no file
    if (isProcessingRef.current || !importFile) return;

    // Set processing flag and loading state
    isProcessingRef.current = true;
    setImportPreviewLoading(true);
    setImportError(null);

    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const response = await axios.post("/auth/parse-csv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      if (response.data.rows && response.data.rows.length > 0) {
        setImportRows(response.data.rows || []);
        setSelectedImportRows(
          Array.from({ length: response.data.rows.length }, (_, i) => i)
        );
      }
    } catch (error) {
      if (error.response?.status === 401) {
        refreshAuth();
      }
      setImportError(error.response?.data?.message || "Failed to parse CSV.");
      toast.error(error.response?.data?.message || "Failed to parse CSV.");
    } finally {
      setImportPreviewLoading(false);
      isProcessingRef.current = false; // Reset processing flag
    }
  }, [importFile, refreshAuth]); // Removed importPreviewLoading dependency

  // Handle file import with cleanup
  useEffect(() => {
    if (importFile) {
      handleParseCSV();
    }

    // Cleanup function to reset processing state
    return () => {
      isProcessingRef.current = false;
    };
  }, [importFile, handleParseCSV]);

  // Keep the rest of your handleImportSelected function as-is
  const handleImportSelected = async () => {
    if (selectedImportRows.length === 0 || modalLoading) return;
    setModalLoading(true);
    setImportError(null);
    try {
      const selectedData = selectedImportRows.map((index) => importRows[index]);
      const response = await axios.post(
        "/auth/import-selected",
        { rows: selectedData },
        { withCredentials: true }
      );
      toast.success(response.data.message);
      debouncedFetchMembers();
      setImportModalOpen(false);
      setImportFile(null);
      setImportRows([]);
      setSelectedImportRows([]);
    } catch (error) {
      if (error.response?.status === 401) {
        refreshAuth();
      }
      setImportError(
        error.response?.data?.message || "Failed to import members."
      );
      toast.error(error.response?.data?.message || "Failed to import members.");
    } finally {
      setModalLoading(false);
    }
  };

  // Handle select all import rows
  const handleSelectAllImport = (event) => {
    if (event.target.checked) {
      setSelectedImportRows(importRows.map((_, index) => index));
    } else {
      setSelectedImportRows([]);
    }
  };

  // Handle select import row
  const handleSelectImportRow = (index) => {
    setSelectedImportRows((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      contactNumber: "",
      employeeId: "",
      department: "Other",
      position: "",
      status: "Active",
      birthdate: "",
      gender: "",
      civilStatus: "",
      governmentIds: { sss: "", philHealth: "", tin: "", pagIbig: "" },
      hireDate: "",
      role: "employee",
      profilePicture: null,
    });
    setEditMember(null);
    setErrors({});
  };

  // Handle edit
  const handleEdit = (member) => {
    setEditMember(member);
    setFormData({
      firstName: member.firstName || "",
      lastName: member.lastName || "",
      email: member.email || "",
      contactNumber: member.contactNumber || "",
      employeeId: member.employeeId || "",
      department: member.department || "Other",
      position: member.position || "",
      status: member.status || "Active",
      birthdate: member.birthdate ? member.birthdate.split("T")[0] : "",
      gender: member.gender || "",
      civilStatus: member.civilStatus || "",
      governmentIds: member.governmentIds || {
        sss: "",
        philHealth: "",
        tin: "",
        pagIbig: "",
      },
      hireDate: member.hireDate
        ? new Date(member.hireDate).toISOString().split("T")[0]
        : "",
      role: member.role || "employee",
      profilePicture: null,
    });
    setModalOpen(true);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this member?")) return;
    try {
      await axios.delete(`/auth/delete-user/${id}`, { withCredentials: true });
      toast.success("Member deleted successfully");
      setSelectedRows((prev) => prev.filter((rowId) => rowId !== id));
      debouncedFetchMembers();
    } catch (error) {
      if (error.response?.status === 401) {
        refreshAuth();
      }
      toast.error(error.response?.data?.message || "Failed to delete member.");
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedRows.length} members?`
      )
    )
      return;
    try {
      await Promise.all(
        selectedRows.map((id) =>
          axios.delete(`/auth/delete-user/${id}`, { withCredentials: true })
        )
      );
      toast.success(`${selectedRows.length} members deleted successfully`);
      setSelectedRows([]);
      debouncedFetchMembers();
    } catch (error) {
      if (error.response?.status === 401) {
        refreshAuth();
      }
      toast.error(error.response?.data?.message || "Failed to delete members.");
    }
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = async (status) => {
    try {
      await Promise.all(
        selectedRows.map((id) =>
          axios.put(
            `/auth/edit-member/${id}`,
            { status },
            { withCredentials: true }
          )
        )
      );
      toast.success(
        `Status updated to ${status} for ${selectedRows.length} members`
      );
      setSelectedRows([]);
      debouncedFetchMembers();
    } catch (error) {
      if (error.response?.status === 401) {
        refreshAuth();
      }
      toast.error(error.response?.data?.message || "Failed to update status.");
    }
  };

  // Handle checkbox selection
  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  // Handle select all
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(members.map((member) => member._id));
    } else {
      setSelectedRows([]);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(0);
  };

  // Handle pagination changes
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Fetch logs for a member
  const fetchLogs = async (memberId) => {
    setLogsModalOpen(true);
    setLogsLoading(true);
    setLogsError(null);
    setSelectedLogs([]);
    try {
      const response = await axios.get(`/auth/member-logs/${memberId}`, {
        withCredentials: true,
      });
      const logs = Array.isArray(response.data)
        ? response.data
        : response.data.logs || [];
      setSelectedLogs(logs);
    } catch (error) {
      if (error.response?.status === 401) {
        refreshAuth();
      }
      setLogsError(
        error.response?.data?.message || "Failed to fetch member logs."
      );
      toast.error(error.response?.data?.message || "Failed to fetch logs.");
    } finally {
      setLogsLoading(false);
    }
  };

  // Format log changes for display
  const formatLogChanges = (changes) => {
    return Object.entries(changes).map(([key, value]) => ({
      field: key,
      oldValue: value.old !== undefined ? String(value.old) : "N/A",
      newValue: value.new !== undefined ? String(value.new) : "N/A",
    }));
  };

  // Drag-and-drop handler
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (
        acceptedFiles.length > 0 &&
        acceptedFiles[0].name !== importFile?.name
      ) {
        setImportFile(acceptedFiles[0]);
        setImportRows([]);
        setSelectedImportRows([]);
        setImportError(null);
      }
    },
    [importFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
  });

  return (
    <ErrorBoundary>
      <Box
        sx={{
          minHeight: "100vh",
          background: muiTheme.custom.gradients.backgroundDefault,
          p: { xs: 2, sm: 3, md: 4 },
          position: "relative",
          overflow: "hidden",
          animation: `${fadeIn} 0.8s ease-out`,
          width: "100%",
          ml: 0,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: isDarkMode
              ? "radial-gradient(circle at 30% 30%, rgba(66, 133, 244, 0.2) 0%, transparent 70%)"
              : "radial-gradient(circle at 30% 30%, rgba(52, 168, 83, 0.2) 0%, transparent 70%)",
            zIndex: 0,
          }}
        />
        <Box sx={{ position: "relative", zIndex: 1, width: "100%" }}>
          <Toolbar />
          <Box
            sx={{
              background: isDarkMode
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(255, 255, 255, 0.1)",
              backdropFilter: isDarkMode ? "blur(10px)" : "blur(15px)",
              borderRadius: "16px",
              border: isDarkMode
                ? "1px solid rgba(255, 255, 255, 0.2)"
                : "1px solid rgba(0, 0, 0, 0.1)",
              boxShadow: isDarkMode
                ? "0 4px 12px rgba(0, 0, 0, 0.3)"
                : "0 4px 12px rgba(0, 0, 0, 0.1)",
              p: { xs: 2, sm: 3 },
              width: "100%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  color: muiTheme.palette.primary.main,
                  fontWeight: "bold",
                }}
              >
                HR Management
              </Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => {
                    setEditMember(null);
                    setFormData({
                      firstName: "",
                      lastName: "",
                      email: "",
                      contactNumber: "",
                      employeeId: "",
                      department: "Other",
                      position: "",
                      status: "Active",
                      birthdate: "",
                      gender: "",
                      civilStatus: "",
                      governmentIds: {
                        sss: "",
                        philHealth: "",
                        tin: "",
                        pagIbig: "",
                      },
                      hireDate: "",
                      role: "employee",
                      profilePicture: null,
                    });
                    setModalOpen(true);
                  }}
                  disabled={loading}
                  sx={{
                    fontFamily: "'Poppins', sans-serif",
                    backgroundColor: brandingBlue,
                    color: "#fff",
                    borderRadius: "8px",
                    py: 1.5,
                    px: 3,
                    fontSize: "1rem",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: "#3367D6",
                      transform: "scale(1.05)",
                    },
                    "&:active": { backgroundColor: brandingBlue },
                    "&:disabled": {
                      backgroundColor: disabledColor,
                      color: "#fff",
                    },
                  }}
                  aria-label="Add new member"
                >
                  Add Member
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FileDownload />}
                  onClick={handleExport}
                  disabled={loading}
                  sx={{
                    fontFamily: "'Poppins', sans-serif",
                    color: muiTheme.palette.text.primary,
                    borderColor: muiTheme.palette.text.primary,
                    backgroundColor: "transparent",
                    borderRadius: "8px",
                    py: 1.5,
                    px: 3,
                    fontSize: "1rem",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: hoverBackground,
                      transform: "scale(1.05)",
                    },
                    "&:disabled": {
                      borderColor: disabledColor,
                      color: disabledColor,
                    },
                  }}
                  aria-label="Export members"
                >
                  Export
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FileUpload />}
                  onClick={() => setImportModalOpen(true)}
                  disabled={
                    loading ||
                    !["hr", "superadmin"].includes(authState.userRole)
                  }
                  sx={{
                    fontFamily: "'Poppins', sans-serif",
                    color: muiTheme.palette.text.primary,
                    borderColor: muiTheme.palette.text.primary,
                    backgroundColor: "transparent",
                    borderRadius: "8px",
                    py: 1.5,
                    px: 3,
                    fontSize: "1rem",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: hoverBackground,
                      transform: "scale(1.05)",
                    },
                    "&:disabled": {
                      borderColor: disabledColor,
                      color: disabledColor,
                    },
                  }}
                  aria-label="Import members"
                >
                  Import
                </Button>
              </Box>
            </Box>

            {/* Bulk Actions Toolbar */}
            {selectedRows.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  mb: 2,
                  p: 2,
                  backgroundColor: isDarkMode
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.05)",
                  borderRadius: "8px",
                }}
              >
                <Typography
                  id="selected-members-label"
                  variant="body1"
                  sx={{ alignSelf: "center" }}
                >
                  {selectedRows.length} selected
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleBulkDelete}
                  aria-label="Delete selected members"
                  aria-describedby="selected-members-label"
                >
                  Delete
                </Button>
                <Button
                  variant="outlined"
                  color="success"
                  onClick={() => handleBulkStatusUpdate("Active")}
                  aria-label="Set selected members to Active"
                  aria-describedby="selected-members-label"
                >
                  Set Active
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => handleBulkStatusUpdate("Resigned")}
                  aria-label="Set selected members to Resigned"
                  aria-describedby="selected-members-label"
                >
                  Set Resigned
                </Button>
              </Box>
            )}

            {/* Filters */}
            <Box
              sx={{
                display: "flex",
                gap: 2,
                mb: 3,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <TextField
                label="Search by Name, Email, or ID"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                InputProps={{
                  startAdornment: (
                    <Search
                      sx={{ mr: 1, color: muiTheme.palette.text.secondary }}
                    />
                  ),
                }}
                sx={{
                  flex: { xs: "1 1 100%", sm: "1 1 300px" },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    background: muiTheme.palette.background.listItem,
                    "& fieldset": { borderColor: muiTheme.palette.border.main },
                    "&:hover fieldset": { borderColor: greenLightColor },
                    "&.Mui-focused fieldset": { borderColor: greenLightColor },
                  },
                }}
                aria-label="Search members"
              />
              <FormControl sx={{ minWidth: { xs: "100%", sm: 150 } }}>
                <InputLabel sx={{ color: muiTheme.palette.text.secondary }}>
                  Department
                </InputLabel>
                <Select
                  name="department"
                  value={filters.department}
                  onChange={handleFilterChange}
                  label="Department"
                  sx={{
                    borderRadius: "8px",
                    background: muiTheme.palette.background.listItem,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: muiTheme.palette.border.main,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: greenLightColor,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: greenLightColor,
                    },
                  }}
                  aria-label="Filter by department"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="HR">HR</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Audit">Audit</MenuItem>
                  <MenuItem value="Finance">Finance</MenuItem>
                  <MenuItem value="Digital Marketing">
                    Digital Marketing
                  </MenuItem>
                  <MenuItem value="Culture">Culture</MenuItem>
                  <MenuItem value="Fulfillment">Fulfillment</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: { xs: "100%", sm: 150 } }}>
                <InputLabel sx={{ color: muiTheme.palette.text.secondary }}>
                  Status
                </InputLabel>
                <Select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  label="Status"
                  sx={{
                    borderRadius: "8px",
                    background: muiTheme.palette.background.listItem,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: muiTheme.palette.border.main,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: greenLightColor,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: greenLightColor,
                    },
                  }}
                  aria-label="Filter by status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Resigned">Resigned</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: { xs: "100%", sm: 150 } }}>
                <InputLabel sx={{ color: muiTheme.palette.text.secondary }}>
                  Role
                </InputLabel>
                <Select
                  name="role"
                  value={filters.role}
                  onChange={handleFilterChange}
                  label="Role"
                  sx={{
                    borderRadius: "8px",
                    background: muiTheme.palette.background.listItem,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: muiTheme.palette.border.main,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: greenLightColor,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: greenLightColor,
                    },
                  }}
                  aria-label="Filter by role"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="superadmin">Superadmin</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="hr">HR</MenuItem>
                  <MenuItem value="employee">Employee</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Members Table */}
            <TableContainer
              component={Paper}
              sx={{
                background: muiTheme.palette.background.listItem,
                overflowX: "auto",
              }}
            >
              <Table aria-label="Members table">
                <TableHead>
                  <TableRow
                    sx={{
                      borderBottom: "2px solid",
                      borderColor: muiTheme.palette.divider,
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={
                          selectedRows.length === members.length &&
                          members.length > 0
                        }
                        onChange={handleSelectAll}
                        sx={{
                          color: isDarkMode ? "#fff" : "#333",
                          "&.Mui-checked": {
                            color: greenLightColor,
                          },
                        }}
                        aria-label="Select all members"
                      />
                    </TableCell>
                    <TableCell>Member</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Employee ID</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Position</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Hire Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        <CircularProgress aria-label="Loading members" />
                      </TableCell>
                    </TableRow>
                  ) : members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        No members found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((member) => (
                      <TableRow
                        key={member._id}
                        sx={{
                          minHeight: 56,
                          borderBottom: "1px solid",
                          borderColor: muiTheme.palette.divider,
                          "&:last-child": { borderBottom: "none" },
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedRows.includes(member._id)}
                            onChange={() => handleSelectRow(member._id)}
                            sx={{
                              color: isDarkMode ? "#fff" : "#333",
                              "&.Mui-checked": {
                                color: greenLightColor,
                              },
                            }}
                            aria-label={`Select ${member.firstName} ${member.lastName}`}
                          />
                        </TableCell>
                        <TableCell
                          sx={{
                            py: 2,
                            px: 2,
                            verticalAlign: "middle",
                            cursor: "pointer",
                            "&:hover": {
                              backgroundColor: hoverBackground,
                            },
                          }}
                          onClick={() =>
                            navigate(`/hr-management/${member._id}`)
                          }
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Avatar
                              src={
                                member.profilePicture ||
                                "/images/default-avatar.png"
                              }
                              alt={`${member.firstName} ${member.lastName}`}
                              sx={{ width: 32, height: 32 }}
                            />
                            <Typography variant="body2">
                              {`${member.firstName} ${member.lastName}`}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell
                          sx={{ py: 2, px: 2, verticalAlign: "middle" }}
                        >
                          {member.email}
                        </TableCell>
                        <TableCell
                          sx={{ py: 2, px: 2, verticalAlign: "middle" }}
                        >
                          {member.employeeId}
                        </TableCell>
                        <TableCell
                          sx={{ py: 2, px: 2, verticalAlign: "middle" }}
                        >
                          {member.department}
                        </TableCell>
                        <TableCell
                          sx={{ py: 2, px: 2, verticalAlign: "middle" }}
                        >
                          {member.position}
                        </TableCell>
                        <TableCell
                          sx={{ py: 2, px: 2, verticalAlign: "middle" }}
                        >
                          <Chip
                            label={member.status}
                            color={
                              member.status === "Active" ? "success" : "default"
                            }
                            size="small"
                            sx={{
                              color: "#fff",
                              "& .MuiChip-label": { color: "#fff" },
                            }}
                          />
                        </TableCell>
                        <TableCell
                          sx={{ py: 2, px: 2, verticalAlign: "middle" }}
                        >
                          {member.role}
                        </TableCell>
                        <TableCell
                          sx={{ py: 2, px: 2, verticalAlign: "middle" }}
                        >
                          {member.hireDate
                            ? new Date(member.hireDate).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell
                          sx={{ py: 2, px: 2, verticalAlign: "middle" }}
                        >
                          <Tooltip title="Edit">
                            <IconButton
                              onClick={() => handleEdit(member)}
                              aria-label={`Edit ${member.firstName} ${member.lastName}`}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              onClick={() => handleDelete(member._id)}
                              aria-label={`Delete ${member.firstName} ${member.lastName}`}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Logs">
                            <IconButton
                              onClick={() => fetchLogs(member._id)}
                              aria-label={`View logs for ${member.firstName} ${member.lastName}`}
                            >
                              <History />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={totalRows}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              aria-label="Table pagination"
            />
          </Box>
        </Box>
      </Box>

      {/* Add/Edit Member Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          if (!modalLoading) {
            setModalOpen(false);
            resetForm();
          }
        }}
        disableEnforceFocus
        aria-labelledby="add-edit-member-modal-title"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 600 },
            bgcolor: muiTheme.palette.background.paper,
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          <DialogTitle
            id="add-edit-member-modal-title"
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: muiTheme.palette.primary.main,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {editMember ? "Edit Member" : "Add Member"}
            <IconButton
              onClick={() => {
                if (!modalLoading) {
                  setModalOpen(false);
                  resetForm();
                }
              }}
              disabled={modalLoading}
              aria-label="Close add/edit member modal"
              sx={{ color: muiTheme.palette.text.primary }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            {errors.form && (
              <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                {errors.form}
              </Typography>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  aria-label="First name"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  aria-label="Last name"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={!!errors.email}
                  helperText={errors.email}
                  placeholder="example@bgecorp.com"
                  aria-label="Email"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Contact Number"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  fullWidth
                  error={!!errors.contactNumber}
                  helperText={errors.contactNumber}
                  placeholder="+639123456789"
                  aria-label="Contact number"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Employee ID"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={!!errors.employeeId}
                  helperText={errors.employeeId}
                  placeholder="EMP001"
                  aria-label="Employee ID"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    label="Department"
                    aria-label="Department"
                  >
                    <MenuItem value="HR">HR</MenuItem>
                    <MenuItem value="Admin">Admin</MenuItem>
                    <MenuItem value="Audit">Audit</MenuItem>
                    <MenuItem value="Finance">Finance</MenuItem>
                    <MenuItem value="Digital Marketing">
                      Digital Marketing
                    </MenuItem>
                    <MenuItem value="Culture">Culture</MenuItem>
                    <MenuItem value="Fulfillment">Fulfillment</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  fullWidth
                  aria-label="Position"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    label="Status"
                    aria-label="Status"
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Resigned">Resigned</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Birthdate"
                  name="birthdate"
                  type="date"
                  value={formData.birthdate || ""}
                  onChange={handleChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.birthdate}
                  helperText={errors.birthdate}
                  aria-label="Birthdate"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    label="Gender"
                    aria-label="Gender"
                  >
                    <MenuItem value="">Select</MenuItem>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Civil Status</InputLabel>
                  <Select
                    name="civilStatus"
                    value={formData.civilStatus}
                    onChange={handleChange}
                    label="Civil Status"
                    aria-label="Civil status"
                  >
                    <MenuItem value="">Select</MenuItem>
                    <MenuItem value="Single">Single</MenuItem>
                    <MenuItem value="Married">Married</MenuItem>
                    <MenuItem value="Divorced">Divorced</MenuItem>
                    <MenuItem value="Widowed">Widowed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="SSS Number"
                  name="governmentIds.sss"
                  value={formData.governmentIds.sss}
                  onChange={handleChange}
                  fullWidth
                  error={!!errors.sss}
                  helperText={errors.sss}
                  placeholder="XX-XXXXXXX-X"
                  aria-label="SSS number"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="PhilHealth Number"
                  name="governmentIds.philHealth"
                  value={formData.governmentIds.philHealth}
                  onChange={handleChange}
                  fullWidth
                  error={!!errors.philHealth}
                  helperText={errors.philHealth}
                  placeholder="XX-XXXXXXXXX-X"
                  aria-label="PhilHealth number"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="TIN"
                  name="governmentIds.tin"
                  value={formData.governmentIds.tin}
                  onChange={handleChange}
                  fullWidth
                  error={!!errors.tin}
                  helperText={errors.tin}
                  placeholder="XXX-XXX-XXX-XXX"
                  aria-label="TIN"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Pag-IBIG Number"
                  name="governmentIds.pagIbig"
                  value={formData.governmentIds.pagIbig}
                  onChange={handleChange}
                  fullWidth
                  error={!!errors.pagIbig}
                  helperText={errors.pagIbig}
                  placeholder="XXXX-XXXX-XXXX"
                  aria-label="Pag-IBIG number"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Hire Date"
                  name="hireDate"
                  type="date"
                  value={formData.hireDate || ""}
                  onChange={handleChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.hireDate}
                  helperText={errors.hireDate}
                  aria-label="Hire date"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    label="Role"
                    aria-label="Role"
                  >
                    <MenuItem value="superadmin">Superadmin</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="hr">HR</MenuItem>
                    <MenuItem value="employee">Employee</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2">
                  Profile Picture (Optional)
                </Typography>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  name="profilePicture"
                  onChange={handleChange}
                  aria-label="Upload profile picture"
                />
              </Grid>
            </Grid>
            <Box
              sx={{
                mt: 2,
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
              }}
            >
              <Button
                onClick={() => {
                  if (!modalLoading) {
                    setModalOpen(false);
                    resetForm();
                  }
                }}
                disabled={modalLoading}
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  color: muiTheme.palette.text.primary,
                }}
                aria-label="Cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={modalLoading}
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  backgroundColor: brandingBlue,
                  color: "#fff",
                  "&:hover": {
                    backgroundColor: "#3367D6",
                    transform: "scale(1.05)",
                  },
                  transition: "all 0.3s ease",
                }}
                aria-label={editMember ? "Update member" : "Add member"}
              >
                {modalLoading ? (
                  <CircularProgress size={24} />
                ) : editMember ? (
                  "Update"
                ) : (
                  "Add"
                )}
              </Button>
            </Box>
          </form>
        </Box>
      </Modal>

      {/* Import Members Modal */}
      <Modal
        open={importModalOpen}
        onClose={() => {
          if (!modalLoading && !importPreviewLoading) {
            setImportModalOpen(false);
            setImportFile(null);
            setImportRows([]);
            setSelectedImportRows([]);
          }
        }}
        disableEnforceFocus
        aria-labelledby="import-members-modal-title"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 800 },
            bgcolor: muiTheme.palette.background.paper,
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          <DialogTitle
            id="import-members-modal-title"
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: muiTheme.palette.primary.main,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "1.5rem",
              fontWeight: 600,
              pb: 3,
            }}
          >
            Import Members
            <IconButton
              onClick={() => {
                if (!modalLoading && !importPreviewLoading) {
                  setImportModalOpen(false);
                  setImportFile(null);
                  setImportRows([]);
                  setSelectedImportRows([]);
                }
              }}
              disabled={modalLoading || importPreviewLoading}
              aria-label="Close import members modal"
              sx={{ color: muiTheme.palette.text.primary }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <Box
            {...getRootProps()}
            sx={{
              border: `2px dashed ${muiTheme.palette.divider}`,
              borderRadius: "12px",
              p: 4,
              textAlign: "center",
              backgroundColor: isDragActive
                ? hoverBackground
                : muiTheme.palette.background.default,
              transition: "background-color 0.3s ease",
              "&:hover": {
                backgroundColor: hoverBackground,
              },
              mb: 3,
              minHeight: 150,
            }}
          >
            <input {...getInputProps()} />
            <FileUpload
              sx={{
                fontSize: 40,
                color: muiTheme.palette.text.secondary,
                mb: 2,
              }}
            />
            {importFile ? (
              <Typography variant="body1" sx={{ fontSize: "1.1rem" }}>
                File selected: <strong>{importFile.name}</strong>
              </Typography>
            ) : isDragActive ? (
              <Typography variant="body1" sx={{ fontSize: "1.1rem" }}>
                Drop the CSV file here
              </Typography>
            ) : (
              <Typography variant="body1" sx={{ fontSize: "1.1rem" }}>
                Drag and drop a CSV file here, or click to select
              </Typography>
            )}
          </Box>
          <Typography
            variant="body1"
            sx={{ mb: 3, fontSize: "1rem", lineHeight: 1.6 }}
          >
            Upload a CSV file with columns: firstName, lastName, email,
            employeeId, department, position, status, role, hireDate,
            contactNumber, birthdate, gender, civilStatus, governmentIds.sss,
            governmentIds.philHealth, governmentIds.tin, governmentIds.pagIbig
          </Typography>
          {importError && (
            <Typography color="error" sx={{ mb: 2 }}>
              {importError}
            </Typography>
          )}
          {importPreviewLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
              <CircularProgress />
            </Box>
          ) : importRows.length > 0 ? (
            <>
              <TableContainer
                component={Paper}
                sx={{ maxHeight: 300, overflowY: "auto", mb: 3 }}
              >
                <Table stickyHeader aria-label="Import preview table">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={
                            selectedImportRows.length === importRows.length &&
                            importRows.length > 0
                          }
                          onChange={handleSelectAllImport}
                          aria-label="Select all import rows"
                        />
                      </TableCell>
                      <TableCell>First Name</TableCell>
                      <TableCell>Last Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Employee ID</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {importRows.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedImportRows.includes(index)}
                            onChange={() => handleSelectImportRow(index)}
                            aria-label={`Select row ${index + 1}`}
                          />
                        </TableCell>
                        <TableCell>{row.firstName}</TableCell>
                        <TableCell>{row.lastName}</TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>{row.employeeId}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Selected {selectedImportRows.length} out of {importRows.length}{" "}
                rows
              </Typography>
            </>
          ) : null}
          <Box
            sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}
          >
            <Button
              onClick={() => {
                if (!modalLoading && !importPreviewLoading) {
                  setImportModalOpen(false);
                  setImportFile(null);
                  setImportRows([]);
                  setSelectedImportRows([]);
                }
              }}
              disabled={modalLoading || importPreviewLoading}
              sx={{
                fontFamily: "'Poppins', sans-serif",
                color: muiTheme.palette.text.primary,
                fontSize: "1rem",
              }}
              aria-label="Cancel"
            >
              Cancel
            </Button>
            <Button
              variant="outlined"
              disabled={
                modalLoading ||
                selectedImportRows.length === 0 ||
                importPreviewLoading
              }
              onClick={handleImportSelected}
              sx={{
                fontFamily: "'Poppins', sans-serif",
                color: muiTheme.palette.text.primary,
                borderColor: muiTheme.palette.text.primary,
                backgroundColor: "transparent",
                fontSize: "1rem",
                "&:hover": {
                  backgroundColor: hoverBackground,
                  transform: "scale(1.05)",
                },
                transition: "all 0.3s ease",
                "&:disabled": {
                  borderColor: disabledColor,
                  color: disabledColor,
                },
              }}
              aria-label="Import selected members"
            >
              {modalLoading ? (
                <CircularProgress size={24} />
              ) : (
                "Import Selected"
              )}
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Logs Modal */}
      <Modal
        open={logsModalOpen}
        onClose={() => {
          setLogsModalOpen(false);
          setLogsError(null);
          setSelectedLogs([]);
        }}
        disableEnforceFocus
        aria-labelledby="logs-modal-title"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 800 },
            bgcolor: muiTheme.palette.background.paper,
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          <DialogTitle
            id="logs-modal-title"
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: muiTheme.palette.primary.main,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              pb: 2,
            }}
          >
            Member Activity Logs
            <IconButton
              onClick={() => {
                setLogsModalOpen(false);
                setLogsError(null);
                setSelectedLogs([]);
              }}
              aria-label="Close logs modal"
              sx={{ color: muiTheme.palette.text.primary }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          {logsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
              <CircularProgress aria-label="Loading logs" />
            </Box>
          ) : logsError ? (
            <Typography color="error" variant="body2">
              {logsError}
            </Typography>
          ) : selectedLogs.length === 0 ? (
            <Typography variant="body2">No logs available.</Typography>
          ) : (
            <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
              <Table aria-label="Member activity logs table">
                <TableHead>
                  <TableRow
                    sx={{
                      borderBottom: "2px solid",
                      borderColor: muiTheme.palette.divider,
                    }}
                  >
                    <TableCell>Action</TableCell>
                    <TableCell>Performed By</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedLogs.map((log) => (
                    <TableRow
                      key={log._id}
                      sx={{
                        minHeight: 56,
                        borderBottom: "1px solid",
                        borderColor: muiTheme.palette.divider,
                        "&:last-child": { borderBottom: "none" },
                      }}
                    >
                      <TableCell sx={{ py: 2, px: 2, verticalAlign: "middle" }}>
                        {log.action}
                      </TableCell>
                      <TableCell sx={{ py: 2, px: 2, verticalAlign: "middle" }}>
                        {log.modifiedBy
                          ? `${log.modifiedBy.firstName} ${log.modifiedBy.lastName}`
                          : "N/A"}
                      </TableCell>
                      <TableCell sx={{ py: 2, px: 2, verticalAlign: "middle" }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ py: 2, px: 2, verticalAlign: "middle" }}>
                        <List dense>
                          {formatLogChanges(log.changes).map(
                            (change, index) => (
                              <ListItem key={index}>
                                <ListItemText
                                  primary={
                                    change.field.charAt(0).toUpperCase() +
                                    change.field.slice(1)
                                  }
                                  secondary={`From "${change.oldValue}" to "${change.newValue}"`}
                                />
                              </ListItem>
                            )
                          )}
                        </List>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Modal>
    </ErrorBoundary>
  );
};

export default HRManagement;
