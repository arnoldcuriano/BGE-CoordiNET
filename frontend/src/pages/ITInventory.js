import React, { useState, useEffect } from "react";
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
  Divider,
  Avatar,
  Tooltip,
  Toolbar,
  Autocomplete,
  keyframes,
} from "@mui/material";
import {
  Add,
  Search,
  AssignmentReturn,
  SwapHoriz,
  Assignment,
  Upload,
  Warning,
  CheckCircle,
  Visibility,
} from "@mui/icons-material";
import CustomSnackbar from "../components/CustomSnackbar";

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
  const [assignment, setAssignment] = useState({
    item: null,
    user: null,
    acknowledgmentDocument: null,
  });
  const [bulkUploadFile, setBulkUploadFile] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
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

  const greenLightColor = "#34A853";
  const greenLightHoverBackground = "rgba(52, 168, 83, 0.1)";
  const hoverBackground = isDarkMode
    ? "rgba(255, 255, 255, 0.15)"
    : greenLightHoverBackground;

  useEffect(() => {
    if (!authState.isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchInventory();
    fetchUsers();
  }, [authState, navigate]);

  const fetchInventory = async () => {
    try {
      const [itemsResponse, assignmentsResponse] = await Promise.all([
        axios.get("/api/inventory"),
        axios.get("/api/inventory/assignments"),
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
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/users");
      setUsers(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to fetch users. Please try again later."
      );
      console.error("Error fetching users:", err);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.category || !newItem.serialNumber) {
      setError(
        "Please fill in all required fields (Name, Category, Serial Number)."
      );
      return;
    }

    try {
      await axios.post("/api/inventory", newItem);
      setSuccess("Item added successfully");
      setAddModalOpen(false);
      setNewItem({
        name: "",
        category: "",
        serialNumber: "",
        warrantyEndDate: "",
        supportDetails: "",
      });
      fetchInventory();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to add item. Please try again later."
      );
      console.error("Error adding item:", err);
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
        `/api/inventory/${selectedAssignment?.itemId?._id}/return`
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
        }
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

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: muiTheme.custom.gradients.backgroundDefault,
        p: { xs: 2, sm: 3, md: 4 },
        position: "relative",
        overflow: "hidden",
        animation: `${fadeIn} 0.8s ease-out`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
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
            padding: { xs: "20px", sm: "30px" },
            width: "100%",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 4,
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
          </Box>

          {/* Search, Filter, and Buttons Section */}
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
                  <Search
                    sx={{ mr: 1, color: muiTheme.palette.text.secondary }}
                  />
                ),
              }}
              sx={{
                flex: "1 1 300px",
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  background: muiTheme.palette.background.listItem,
                  "& fieldset": { borderColor: muiTheme.palette.border.main },
                  "&:hover fieldset": { borderColor: greenLightColor },
                  "&.Mui-focused fieldset": { borderColor: greenLightColor },
                },
              }}
            />
            <FormControl sx={{ minWidth: 150 }}>
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
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Assigned">Assigned</MenuItem>
                <MenuItem value="Available">Available</MenuItem>
                <MenuItem value="Under Repair">Under Repair</MenuItem>
                <MenuItem value="Retired">Retired</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 150 }}>
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
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => setAddModalOpen(true)}
                sx={{
                  backgroundColor: isDarkMode ? "#ffffff" : "transparent",
                  color: isDarkMode ? "#333333" : muiTheme.palette.text.primary,
                  borderColor: isDarkMode
                    ? "#ffffff"
                    : muiTheme.palette.border.main,
                  borderRadius: "8px",
                  py: 1,
                  px: 3,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: isDarkMode ? "#e0e0e0" : hoverBackground,
                    borderColor: isDarkMode ? "#e0e0e0" : greenLightColor,
                    transform: "scale(1.05)",
                  },
                }}
              >
                Add Item
              </Button>
              <Button
                variant="outlined"
                startIcon={<Upload />}
                onClick={() => setBulkUploadModalOpen(true)}
                sx={{
                  backgroundColor: isDarkMode ? "#ffffff" : "transparent",
                  color: isDarkMode ? "#333333" : muiTheme.palette.text.primary,
                  borderColor: isDarkMode
                    ? "#ffffff"
                    : muiTheme.palette.border.main,
                  borderRadius: "8px",
                  py: 1,
                  px: 3,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: isDarkMode ? "#e0e0e0" : hoverBackground,
                    borderColor: isDarkMode ? "#e0e0e0" : greenLightColor,
                    transform: "scale(1.05)",
                  },
                }}
              >
                Bulk Upload
              </Button>
              <Button
                variant="outlined"
                startIcon={<Assignment />}
                onClick={() => setAssignModalOpen(true)}
                sx={{
                  backgroundColor: isDarkMode ? "#ffffff" : "transparent",
                  color: isDarkMode ? "#333333" : muiTheme.palette.text.primary,
                  borderColor: isDarkMode
                    ? "#ffffff"
                    : muiTheme.palette.border.main,
                  borderRadius: "8px",
                  py: 1,
                  px: 3,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: isDarkMode ? "#e0e0e0" : hoverBackground,
                    borderColor: isDarkMode ? "#e0e0e0" : greenLightColor,
                    transform: "scale(1.05)",
                  },
                }}
              >
                Assign Item
              </Button>
            </Box>
          </Box>

          {/* Data Table */}
          <TableContainer
            component={Paper}
            sx={{ background: muiTheme.palette.background.listItem }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Member</TableCell>
                  <TableCell>Item</TableCell>
                  <TableCell>Serial Number</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned At</TableCell>
                  <TableCell>Warranty</TableCell>
                  <TableCell>Acknowledgment</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAssignments.map((assignment) => {
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
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
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
                      <TableCell>{assignment.itemId?.name || "N/A"}</TableCell>
                      <TableCell>
                        {assignment.itemId?.serialNumber || "N/A"}
                      </TableCell>
                      <TableCell>
                        {assignment.itemId?.category || "N/A"}
                      </TableCell>
                      <TableCell>
                        {assignment.itemId?.status || "N/A"}
                      </TableCell>
                      <TableCell>
                        {assignment.assignedAt
                          ? new Date(assignment.assignedAt).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
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
                      <TableCell>
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
                          >
                            <Visibility />
                          </IconButton>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setReturnModalOpen(true);
                          }}
                          disabled={assignment.returnedAt}
                          sx={{ color: muiTheme.palette.primary.main }}
                        >
                          <AssignmentReturn />
                        </IconButton>
                        <IconButton
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setReassignModalOpen(true);
                          }}
                          disabled={assignment.returnedAt}
                          sx={{ color: muiTheme.palette.primary.main }}
                        >
                          <SwapHoriz />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>

      {/* Add Item Modal */}
      <Dialog
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
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
          Add New Inventory Item
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            fullWidth
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select
              value={newItem.category}
              onChange={(e) =>
                setNewItem({ ...newItem, category: e.target.value })
              }
              label="Category"
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddModalOpen(false)}>Cancel</Button>
          <Button onClick={handleAddItem} variant="contained" color="primary">
            Add
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
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkUploadModalOpen(false)}>Cancel</Button>
          <Button
            onClick={handleBulkUpload}
            variant="contained"
            color="primary"
            disabled={!bulkUploadFile}
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
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignModalOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAssignItem}
            variant="contained"
            color="primary"
            disabled={!assignment.item || !assignment.user}
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
          <Typography>
            Are you sure you want to return{" "}
            {selectedAssignment?.itemId?.name || "N/A"} assigned to{" "}
            {selectedAssignment?.userId?.firstName || ""}{" "}
            {selectedAssignment?.userId?.lastName || ""}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnModalOpen(false)}>Cancel</Button>
          <Button onClick={handleReturnItem} variant="contained" color="error">
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
          <Typography sx={{ mb: 2 }}>
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
              />
            )}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReassignModalOpen(false)}>Cancel</Button>
          <Button
            onClick={handleReassignItem}
            variant="contained"
            color="primary"
            disabled={!reassignUserId}
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
