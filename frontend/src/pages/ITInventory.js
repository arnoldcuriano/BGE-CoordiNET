import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Tooltip,
  Toolbar,
  Autocomplete,
  keyframes,
  TablePagination,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  AssignmentReturn,
  SwapHoriz,
  Assignment,
  Upload as FileUploadIcon,
  Warning,
  CheckCircle,
  Visibility,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import CustomSnackbar from "../components/CustomSnackbar";
import { toast } from "react-toastify";

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

const ITInventory = () => {
  const { isDarkMode, muiTheme } = useTheme();
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    serialNumber: "",
    warrantyEndDate: "",
    supportDetails: "",
  });
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [assignment, setAssignment] = useState({
    item: null,
    user: null,
    acknowledgmentDocument: null,
  });
  const [bulkUploadFile, setBulkUploadFile] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [bulkUploadModalOpen, setBulkUploadModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [reassignUserId, setReassignUserId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const brandingBlue = "#4285F4";
  const greenLightColor = "#34A853";
  const greenLightHoverBackground = "rgba(52, 168, 83, 0.1)";
  const hoverBackground = isDarkMode
    ? "rgba(255, 255, 255, 0.15)"
    : greenLightHoverBackground;
  const disabledColor = "#666";

  const fetchInventory = useCallback(async () => {
    try {
      const [itemsResponse, assignmentsResponse] = await Promise.all([
        axios.get("/api/inventory", { withCredentials: true }),
        axios.get("/api/inventory/assignments", { withCredentials: true }),
      ]);
      console.log("Fetched assignments:", assignmentsResponse.data);
      setItems(itemsResponse.data);
      setAssignments(assignmentsResponse.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to fetch inventory data. Please try again later."
      );
      console.error("Error fetching inventory:", err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get("/auth/users", {
        withCredentials: true,
      });
      setUsers(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to fetch users. Please try again later."
      );
      console.error("Error fetching users:", err);
    }
  }, []);

  useEffect(() => {
    if (!authState.isAuthenticated || authState.loading) return;
    if (!["admin", "superadmin", "it"].includes(authState.userRole)) {
      toast.error("Access denied.");
      navigate("/dashboard");
      return;
    }
    fetchInventory();
    fetchUsers();
  }, [
    authState.isAuthenticated,
    authState.loading,
    authState.userRole,
    navigate,
    fetchInventory,
    fetchUsers,
  ]);

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.category || !newItem.serialNumber) {
      setError(
        "Please fill in all required fields (Name, Category, Serial Number)."
      );
      return;
    }

    try {
      if (editItem) {
        await axios.put(`/api/inventory/${editItem._id}`, newItem, {
          withCredentials: true,
        });
        setSuccess("Item updated successfully");
      } else {
        await axios.post("/api/inventory", newItem, { withCredentials: true });
        setSuccess("Item added successfully");
      }
      setAddModalOpen(false);
      setNewItem({
        name: "",
        category: "",
        serialNumber: "",
        warrantyEndDate: "",
        supportDetails: "",
      });
      setEditItem(null);
      fetchInventory();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Failed to ${
            editItem ? "update" : "add"
          } item. Please try again later.`
      );
      console.error(`Error ${editItem ? "updating" : "adding"} item:`, err);
    }
  };

  const handleEditItem = (item) => {
    setEditItem(item);
    setNewItem({
      name: item.name || "",
      category: item.category || "",
      serialNumber: item.serialNumber || "",
      warrantyEndDate: item.warrantyEndDate
        ? item.warrantyEndDate.split("T")[0]
        : "",
      supportDetails: item.supportDetails || "",
    });
    setAddModalOpen(true);
  };

  const handleViewItem = (item) => {
    setViewItem(item);
    setViewModalOpen(true);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await axios.delete(`/api/inventory/${itemToDelete._id}`, {
        withCredentials: true,
      });
      setSuccess("Item deleted successfully");
      setDeleteModalOpen(false);
      setItemToDelete(null);
      fetchInventory();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete item. Please try again later."
      );
      console.error("Error deleting item:", err);
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkUploadFile) {
      setError("Please select a CSV file to upload");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", bulkUploadFile);

      await axios.post("/api/inventory/bulk-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      setSuccess("Bulk upload successful");
      setBulkUploadModalOpen(false);
      setBulkUploadFile(null);
      fetchInventory();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to upload CSV file. Please try again later."
      );
      console.error("Error during bulk upload:", err);
    }
  };

  const handleAssignItem = async () => {
    if (!assignment.item || !assignment.user) {
      setError("Please select both an item and a user.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("userId", assignment.user._id);
      if (assignment.acknowledgmentDocument) {
        formData.append(
          "acknowledgmentDocument",
          assignment.acknowledgmentDocument
        );
      }

      await axios.post(
        `/api/inventory/${assignment.item._id}/assign`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );
      setSuccess("Item assigned successfully");
      setAssignModalOpen(false);
      setAssignment({ item: null, user: null, acknowledgmentDocument: null });
      fetchInventory();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to assign item. Please try again later."
      );
      console.error("Error assigning item:", err);
    }
  };

  const handleReturnItem = async () => {
    try {
      await axios.post(
        `/api/inventory/${selectedAssignment?.itemId?._id}/return`,
        {},
        { withCredentials: true }
      );
      setSuccess("Item returned successfully");
      setReturnModalOpen(false);
      setSelectedAssignment(null);
      fetchInventory();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to return item. Please try again later."
      );
      console.error("Error returning item:", err);
    }
  };

  const handleReassignItem = async () => {
    if (!reassignUserId) {
      setError("Please select a user to reassign the item to.");
      return;
    }

    try {
      await axios.post(
        `/api/inventory/${selectedAssignment?.itemId?._id}/reassign`,
        {
          assignmentId: selectedAssignment._id,
          newUserId: reassignUserId,
        },
        { withCredentials: true }
      );
      setSuccess("Item reassigned successfully");
      setReassignModalOpen(false);
      setReassignUserId("");
      setSelectedAssignment(null);
      fetchInventory();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to reassign item. Please try again later."
      );
      console.error("Error reassigning item:", err);
    }
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const item = assignment.itemId || {};
    const user = assignment.userId || {};
    const matchesSearch =
      (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.serialNumber || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (user.firstName || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (user.lastName || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus
      ? (item.status || "") === filterStatus
      : true;
    const matchesCategory = filterCategory
      ? (item.category || "") === filterCategory
      : true;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const paginatedAssignments = filteredAssignments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
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
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          width: "100%",
        }}
      >
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
            padding: { xs: 2, sm: 3 },
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
              IT Inventory Management
            </Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditItem(null);
                  setNewItem({
                    name: "",
                    category: "",
                    serialNumber: "",
                    warrantyEndDate: "",
                    supportDetails: "",
                  });
                  setAddModalOpen(true);
                }}
                sx={{
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
                aria-label="Add new item"
              >
                Add Item
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileUploadIcon />}
                onClick={() => setBulkUploadModalOpen(true)}
                sx={{
                  backgroundColor: isDarkMode ? "#fff" : "transparent",
                  color: isDarkMode ? "#333" : muiTheme.palette.text.primary,
                  border: !isDarkMode ? "1px solid #333" : "none",
                  borderRadius: "8px",
                  py: 1.5,
                  px: 3,
                  fontSize: "1rem",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: hoverBackground,
                    borderColor: greenLightColor,
                    transform: "scale(1.05)",
                    color: isDarkMode
                      ? "#fff"
                      : "muiTheme.palette.text.primary",
                  },
                  "&:active": { borderColor: greenLightColor },
                  "&:disabled": {
                    borderColor: disabledColor,
                    color: disabledColor,
                  },
                }}
                aria-label="Bulk upload items"
              >
                Bulk Upload
              </Button>
              <Button
                variant="outlined"
                startIcon={<Assignment />}
                onClick={() => setAssignModalOpen(true)}
                sx={{
                  backgroundColor: isDarkMode ? "#fff" : "transparent",
                  color: isDarkMode ? "#333" : muiTheme.palette.text.primary,
                  border: !isDarkMode ? "1px solid #333" : "none",
                  borderRadius: "8px",

                  py: 1.5,
                  px: 3,
                  fontSize: "1rem",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: hoverBackground,
                    borderColor: greenLightColor,
                    transform: "scale(1.05)",
                    color: isDarkMode
                      ? "#fff"
                      : "muiTheme.palette.text.primary",
                  },
                  "&:active": { borderColor: greenLightColor },
                  "&:disabled": {
                    borderColor: disabledColor,
                    color: disabledColor,
                  },
                }}
                aria-label="Assign item"
              >
                Assign Item
              </Button>
            </Box>
          </Box>

          {/* Search and Filter Section */}
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
              label="Search by Name, Serial, or Member"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon
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
              aria-label="Search inventory"
            />
            <FormControl sx={{ minWidth: { xs: "100%", sm: 150 } }}>
              <InputLabel sx={{ color: muiTheme.palette.text.secondary }}>
                Status
              </InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
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
                <MenuItem value="Assigned">Assigned</MenuItem>
                <MenuItem value="Available">Available</MenuItem>
                <MenuItem value="Under Repair">Under Repair</MenuItem>
                <MenuItem value="Retired">Retired</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: { xs: "100%", sm: 150 } }}>
              <InputLabel sx={{ color: muiTheme.palette.text.secondary }}>
                Category
              </InputLabel>
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                label="Category"
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
                aria-label="Filter by category"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Laptop">Laptop</MenuItem>
                <MenuItem value="Monitor">Monitor</MenuItem>
                <MenuItem value="Peripheral">Peripheral</MenuItem>
                <MenuItem value="PC">PC</MenuItem>
                <MenuItem value="Accessory">Accessory</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Data Table */}
          <TableContainer
            component={Paper}
            sx={{
              background: muiTheme.palette.background.listItem,
              overflowX: "auto",
            }}
          >
            <Table aria-label="Inventory assignments table">
              <TableHead>
                <TableRow>
                  <TableCell>Member</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Item</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Serial Number</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Category</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Status</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Assigned At</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Warranty</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Acknowledgment</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedAssignments.map((assignment) => {
                  const warrantyEndDate = assignment.itemId?.warrantyEndDate;
                  const daysUntilExpiry = warrantyEndDate
                    ? Math.floor(
                        (new Date(warrantyEndDate) - Date.now()) /
                          (24 * 60 * 60 * 1000)
                      )
                    : null;
                  const warrantyStatus = warrantyEndDate
                    ? daysUntilExpiry < 0
                      ? "Expired"
                      : daysUntilExpiry <= 30
                      ? `Expiring in ${daysUntilExpiry} days`
                      : "Active"
                    : "N/A";
                  return (
                    <TableRow key={assignment._id}>
                      <TableCell
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          py: 2,
                        }}
                      >
                        <Avatar
                          src={
                            assignment.userId?.profilePicture ||
                            "/images/default-avatar.png"
                          }
                          alt={`${assignment.userId?.firstName || ""} ${
                            assignment.userId?.lastName || ""
                          }`}
                          sx={{ width: 32, height: 32 }}
                        />
                        {assignment.userId
                          ? `${assignment.userId.firstName || ""} ${
                              assignment.userId.lastName || ""
                            }`
                          : "N/A"}
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        {assignment.itemId?.name || "N/A"}
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        {assignment.itemId?.serialNumber || "N/A"}
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        {assignment.itemId?.category || "N/A"}
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        {assignment.itemId?.status || "N/A"}
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        {assignment.assignedAt
                          ? new Date(assignment.assignedAt).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        {warrantyStatus === "Expired" ? (
                          <Tooltip title="Warranty Expired">
                            <Warning
                              sx={{ color: muiTheme.palette.error.main }}
                            />
                          </Tooltip>
                        ) : warrantyStatus.startsWith("Expiring") ? (
                          <Tooltip title={warrantyStatus}>
                            <Warning
                              sx={{ color: muiTheme.palette.warning.main }}
                            />
                          </Tooltip>
                        ) : warrantyStatus === "Active" ? (
                          <Tooltip title="Warranty Active">
                            <CheckCircle
                              sx={{ color: muiTheme.palette.success.main }}
                            />
                          </Tooltip>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        {assignment.acknowledgmentDocument ? (
                          <IconButton
                            onClick={() => {
                              console.log(
                                "Opening acknowledgment document:",
                                assignment.acknowledgmentDocument
                              );
                              window.open(
                                assignment.acknowledgmentDocument,
                                "_blank"
                              );
                            }}
                            sx={{ color: muiTheme.palette.primary.main }}
                            aria-label="View acknowledgment document"
                          >
                            <Visibility />
                          </IconButton>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Tooltip title="View Item">
                          <IconButton
                            onClick={() => handleViewItem(assignment.itemId)}
                            sx={{ color: muiTheme.palette.primary.main }}
                            aria-label={`View ${assignment.itemId?.name}`}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Item">
                          <IconButton
                            onClick={() => handleEditItem(assignment.itemId)}
                            sx={{ color: muiTheme.palette.primary.main }}
                            aria-label={`Edit ${assignment.itemId?.name}`}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Item">
                          <IconButton
                            onClick={() => {
                              setItemToDelete(assignment.itemId);
                              setDeleteModalOpen(true);
                            }}
                            sx={{ color: muiTheme.palette.error.main }}
                            aria-label={`Delete ${assignment.itemId?.name}`}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Return">
                          <IconButton
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setReturnModalOpen(true);
                            }}
                            disabled={assignment.returnedAt}
                            sx={{ color: muiTheme.palette.primary.main }}
                            aria-label={`Return ${assignment.itemId?.name}`}
                          >
                            <AssignmentReturn />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reassign">
                          <IconButton
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setReassignModalOpen(true);
                            }}
                            disabled={assignment.returnedAt}
                            sx={{ color: muiTheme.palette.primary.main }}
                            aria-label={`Reassign ${assignment.itemId?.name}`}
                          >
                            <SwapHoriz />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredAssignments.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              aria-label="Table pagination"
            />
          </TableContainer>
        </Box>
      </Box>

      {/* Add/Edit Item Modal */}
      <Dialog
        open={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setEditItem(null);
          setNewItem({
            name: "",
            category: "",
            serialNumber: "",
            warrantyEndDate: "",
            supportDetails: "",
          });
        }}
        maxWidth="sm"
        fullWidth
        disableEnforceFocus
        aria-labelledby="add-item-modal-title"
      >
        <DialogTitle
          id="add-item-modal-title"
          sx={{
            fontFamily: "'Poppins', sans-serif",
            color: muiTheme.palette.primary.main,
          }}
        >
          {editItem ? "Edit Inventory Item" : "Add New Inventory Item"}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            fullWidth
            margin="normal"
            required
            aria-label="Item name"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select
              value={newItem.category}
              onChange={(e) =>
                setNewItem({ ...newItem, category: e.target.value })
              }
              label="Category"
              aria-label="Item category"
            >
              <MenuItem value="Laptop">Laptop</MenuItem>
              <MenuItem value="Monitor">Monitor</MenuItem>
              <MenuItem value="Peripheral">Peripheral</MenuItem>
              <MenuItem value="PC">PC</MenuItem>
              <MenuItem value="Accessory">Accessory</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Serial Number"
            value={newItem.serialNumber}
            onChange={(e) =>
              setNewItem({ ...newItem, serialNumber: e.target.value })
            }
            fullWidth
            margin="normal"
            required
            aria-label="Serial number"
          />
          <TextField
            label="Warranty End Date"
            type="date"
            value={newItem.warrantyEndDate}
            onChange={(e) =>
              setNewItem({ ...newItem, warrantyEndDate: e.target.value })
            }
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            aria-label="Warranty end date"
          />
          <TextField
            label="Support Details"
            value={newItem.supportDetails}
            onChange={(e) =>
              setNewItem({ ...newItem, supportDetails: e.target.value })
            }
            fullWidth
            margin="normal"
            multiline
            rows={3}
            aria-label="Support details"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddModalOpen(false);
              setEditItem(null);
              setNewItem({
                name: "",
                category: "",
                serialNumber: "",
                warrantyEndDate: "",
                supportDetails: "",
              });
            }}
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: muiTheme.palette.text.primary,
            }}
            aria-label="Cancel add/edit item"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddItem}
            variant="contained"
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
            aria-label={editItem ? "Update item" : "Add item"}
          >
            {editItem ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Item Modal */}
      <Dialog
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        maxWidth="sm"
        fullWidth
        disableEnforceFocus
        aria-labelledby="view-item-modal-title"
      >
        <DialogTitle
          id="view-item-modal-title"
          sx={{
            fontFamily: "'Poppins', sans-serif",
            color: muiTheme.palette.primary.main,
          }}
        >
          View Inventory Item
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Name:</strong> {viewItem?.name || "N/A"}
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Category:</strong> {viewItem?.category || "N/A"}
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Serial Number:</strong> {viewItem?.serialNumber || "N/A"}
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Warranty End Date:</strong>{" "}
            {viewItem?.warrantyEndDate
              ? new Date(viewItem.warrantyEndDate).toLocaleDateString()
              : "N/A"}
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Support Details:</strong>{" "}
            {viewItem?.supportDetails || "N/A"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setViewModalOpen(false)}
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: muiTheme.palette.text.primary,
            }}
            aria-label="Close view item"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Item Modal */}
      <Dialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        maxWidth="sm"
        fullWidth
        disableEnforceFocus
        aria-labelledby="delete-item-modal-title"
      >
        <DialogTitle
          id="delete-item-modal-title"
          sx={{
            fontFamily: "'Poppins', sans-serif",
            color: muiTheme.palette.error.main,
          }}
        >
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: muiTheme.palette.text.primary,
            }}
          >
            Are you sure you want to delete the item "{itemToDelete?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteModalOpen(false)}
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: muiTheme.palette.text.primary,
            }}
            aria-label="Cancel delete"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteItem}
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: muiTheme.palette.error.main,
            }}
            aria-label="Confirm delete"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Upload Modal */}
      <Dialog
        open={bulkUploadModalOpen}
        onClose={() => setBulkUploadModalOpen(false)}
        maxWidth="sm"
        fullWidth
        disableEnforceFocus
        aria-labelledby="bulk-upload-modal-title"
      >
        <DialogTitle
          id="bulk-upload-modal-title"
          sx={{
            fontFamily: "'Poppins', sans-serif",
            color: muiTheme.palette.primary.main,
          }}
        >
          Bulk Upload Inventory Items
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Upload a CSV file with columns: name, category, serialNumber,
            warrantyEndDate (optional), supportDetails (optional).
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setBulkUploadFile(e.target.files[0])}
              aria-label="Select CSV file"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setBulkUploadModalOpen(false)}
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: muiTheme.palette.text.primary,
            }}
            aria-label="Cancel bulk upload"
          >
            Cancel
          </Button>
          <Button
            onClick={handleBulkUpload}
            variant="contained"
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
            disabled={!bulkUploadFile}
            aria-label="Upload CSV"
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Item Modal */}
      <Dialog
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        maxWidth="sm"
        fullWidth
        disableEnforceFocus
        aria-labelledby="assign-item-modal-title"
      >
        <DialogTitle
          id="assign-item-modal-title"
          sx={{
            fontFamily: "'Poppins', sans-serif",
            color: muiTheme.palette.primary.main,
          }}
        >
          Assign Item to Member
        </DialogTitle>
        <DialogContent>
          <Autocomplete
            options={items.filter((item) => item.status === "Available")}
            getOptionLabel={(option) =>
              `${option.name} (SN: ${option.serialNumber})`
            }
            value={assignment.item}
            onChange={(event, newValue) =>
              setAssignment({ ...assignment, item: newValue })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Item"
                margin="normal"
                fullWidth
                helperText="Search by item name or serial number"
                aria-label="Select item"
              />
            )}
            sx={{ mt: 1 }}
          />
          <Autocomplete
            options={users}
            getOptionLabel={(option) =>
              `${option.firstName} ${option.lastName}`
            }
            value={assignment.user}
            onChange={(event, newValue) =>
              setAssignment({ ...assignment, user: newValue })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select User"
                margin="normal"
                fullWidth
                helperText="Search by user name"
                aria-label="Select user"
              />
            )}
            sx={{ mt: 1 }}
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Acknowledgment Document (Optional)
            </Typography>
            <input
              type="file"
              accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) =>
                setAssignment({
                  ...assignment,
                  acknowledgmentDocument: e.target.files[0],
                })
              }
              aria-label="Upload acknowledgment document"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAssignModalOpen(false)}
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: muiTheme.palette.text.primary,
            }}
            aria-label="Cancel assign item"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssignItem}
            variant="contained"
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
            disabled={!assignment.item || !assignment.user}
            aria-label="Assign item"
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Return Item Modal */}
      <Dialog
        open={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        maxWidth="sm"
        fullWidth
        disableEnforceFocus
        aria-labelledby="return-item-modal-title"
      >
        <DialogTitle
          id="return-item-modal-title"
          sx={{
            fontFamily: "'Poppins', sans-serif",
            color: muiTheme.palette.primary.main,
          }}
        >
          Return Item
        </DialogTitle>
        <DialogContent>
          <Typography
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: muiTheme.palette.text.primary,
            }}
          >
            Are you sure you want to return{" "}
            {selectedAssignment?.itemId?.name || "N/A"} assigned to{" "}
            {selectedAssignment?.userId?.firstName || ""}{" "}
            {selectedAssignment?.userId?.lastName || ""}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setReturnModalOpen(false)}
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: muiTheme.palette.text.primary,
            }}
            aria-label="Cancel return"
          >
            Cancel
          </Button>
          <Button
            onClick={handleReturnItem}
            variant="contained"
            sx={{
              fontFamily: "'Poppins', sans-serif",
              backgroundColor: "#D32F2F",
              color: "#fff",
              "&:hover": {
                backgroundColor: "#B71C1C",
                transform: "scale(1.05)",
              },
              transition: "all 0.3s ease",
            }}
            aria-label="Confirm return"
          >
            Return
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reassign Item Modal */}
      <Dialog
        open={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        maxWidth="sm"
        fullWidth
        disableEnforceFocus
        aria-labelledby="reassign-item-modal-title"
      >
        <DialogTitle
          id="reassign-item-modal-title"
          sx={{
            fontFamily: "'Poppins', sans-serif",
            color: muiTheme.palette.primary.main,
          }}
        >
          Reassign Item
        </DialogTitle>
        <DialogContent>
          <Typography
            sx={{
              mb: 2,
              fontFamily: "'Poppins', sans-serif",
              color: muiTheme.palette.text.primary,
            }}
          >
            Reassign {selectedAssignment?.itemId?.name || "N/A"} from{" "}
            {selectedAssignment?.userId?.firstName || ""}{" "}
            {selectedAssignment?.userId?.lastName || ""} to:
          </Typography>
          <Autocomplete
            options={users}
            getOptionLabel={(option) =>
              `${option.firstName} ${option.lastName}`
            }
            value={users.find((user) => user._id === reassignUserId) || null}
            onChange={(event, newValue) =>
              setReassignUserId(newValue ? newValue._id : "")
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select User"
                fullWidth
                helperText="Search by user name"
                aria-label="Select user to reassign"
              />
            )}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setReassignModalOpen(false)}
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: muiTheme.palette.text.primary,
            }}
            aria-label="Cancel reassign"
          >
            Cancel
          </Button>
          <Button
            onClick={handleReassignItem}
            variant="contained"
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
            disabled={!reassignUserId}
            aria-label="Reassign item"
          >
            Reassign
          </Button>
        </DialogActions>
      </Dialog>

      <CustomSnackbar
        open={!!success}
        onClose={() => setSuccess("")}
        severity="success"
        message={success}
      />
      <CustomSnackbar
        open={!!error}
        onClose={() => setError("")}
        severity="error"
        message={error}
      />
    </Box>
  );
};

export default ITInventory;
