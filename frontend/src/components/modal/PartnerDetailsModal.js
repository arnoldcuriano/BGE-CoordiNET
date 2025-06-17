import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Chip,
  Divider,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Close,
  Visibility,
  Save,
} from "@mui/icons-material";
import { useTheme } from "../../context/ThemeContext";
import ServiceModal from "./ServiceModal";
import MilestoneModal from "./MilestoneModal";
import CustomSnackbar from "../CustomSnackbar";
import axios from "axios";
import sanitizeHtml from "sanitize-html";

// System blue color for light mode headers
const systemBlue = "#4285F4";

const PartnerDetailsModal = ({
  open,
  onClose,
  partner: initialPartner,
  onUpdate,
}) => {
  const { isDarkMode, muiTheme } = useTheme();
  const [partner, setPartner] = useState(initialPartner);
  const [activityLogs, setActivityLogs] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    projectName: "",
    status: "",
    startDate: "",
    endDate: "",
    durationStatus: "",
    durationStatusCustom: "",
    category: "",
    contact: { email: "", phone: "", person: "", role: "" },
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  useEffect(() => {
    setPartner(initialPartner);
    if (initialPartner) {
      setEditForm({
        name: initialPartner.name || "",
        projectName: initialPartner.projectName || "",
        status: initialPartner.status || "Cold",
        startDate: initialPartner.startDate
          ? new Date(initialPartner.startDate).toISOString().split("T")[0]
          : "",
        endDate: initialPartner.endDate
          ? new Date(initialPartner.endDate).toISOString().split("T")[0]
          : "",
        durationStatus: initialPartner.durationStatus || "Upcoming",
        durationStatusCustom: initialPartner.durationStatusCustom || "",
        category: initialPartner.category || "",
        contact: {
          email: initialPartner.contact?.email || "",
          phone: initialPartner.contact?.phone || "",
          person: initialPartner.contact?.person || "",
          role: initialPartner.contact?.role || "",
        },
      });
      if (initialPartner._id) {
        fetchActivityLogs(initialPartner._id);
      }
    }
  }, [initialPartner]);

  const fetchPartnerData = useCallback(async () => {
    try {
      const response = await axios.get(`/api/partners/${partner._id}`);
      console.log("Fetched partner data:", response.data); // Debug log
      setPartner(response.data);
      setEditForm({
        name: response.data.name || "",
        projectName: response.data.projectName || "",
        status: response.data.status || "Cold",
        startDate: response.data.startDate
          ? new Date(response.data.startDate).toISOString().split("T")[0]
          : "",
        endDate: response.data.endDate
          ? new Date(response.data.endDate).toISOString().split("T")[0]
          : "",
        durationStatus: response.data.durationStatus || "Upcoming",
        durationStatusCustom: response.data.durationStatusCustom || "",
        category: response.data.category || "",
        contact: {
          email: response.data.contact?.email || "",
          phone: response.data.contact?.phone || "",
          person: response.data.contact?.person || "",
          role: response.data.contact?.role || "",
        },
      });
      await fetchActivityLogs(response.data._id);
      onUpdate();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch updated partner data.";
      setError(errorMessage);
      console.error("Error fetching partner data:", err);
    }
  }, [partner?._id, onUpdate]);

  const fetchActivityLogs = async (partnerId) => {
    try {
      const response = await axios.get(
        `/api/partners/${partnerId}/activity-logs`
      );
      setActivityLogs(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch activity logs.");
      console.error("Error fetching activity logs:", err);
      setActivityLogs([]);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleEditChange = (field, value) => {
    if (field.startsWith("contact.")) {
      const contactField = field.split(".")[1];
      setEditForm((prev) => ({
        ...prev,
        contact: { ...prev.contact, [contactField]: value },
      }));
    } else {
      setEditForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = useCallback(async () => {
    try {
      const payload = {
        ...editForm,
        overrideStatus: true,
      };
      console.log("Saving partner with payload:", payload);
      const response = await axios.put(`/api/partners/${partner._id}`, payload);
      console.log("Save response:", response.data); // Debug log
      if (response.data.status !== editForm.status) {
        console.warn(
          "Status mismatch: Expected",
          editForm.status,
          "Received",
          response.data.status
        );
        setError("Status update inconsistency detected. Please try again.");
        return;
      }
      setPartner(response.data);
      setIsEditing(false);
      setSuccess("Partner details updated successfully");
      await fetchPartnerData();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to update partner details.";
      setError(errorMessage);
      console.error("Error updating partner:", err);
    }
  }, [editForm, partner?._id, fetchPartnerData]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Hot":
        return "error";
      case "Warm":
        return "warning";
      case "Cold":
        return "info";
      default:
        return "default";
    }
  };

  const getDurationStatusColor = (status) => {
    switch (status) {
      case "Ongoing":
        return "success";
      case "Upcoming":
        return "info";
      default:
        return "default";
    }
  };

  const handleAddService = () => {
    setSelectedService(null);
    setServiceModalOpen(true);
  };

  const handleEditService = (service) => {
    setSelectedService(service);
    setServiceModalOpen(true);
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm("Are you sure you want to delete this service?"))
      return;

    try {
      await axios.delete(`/api/partners/${partner._id}/services/${serviceId}`);
      setSuccess("Service deleted successfully");
      await fetchPartnerData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete service.");
      console.error("Error deleting service:", err);
    }
  };

  const handleDeleteTermSheet = async (serviceId, termSheetUrl) => {
    if (!window.confirm("Are you sure you want to delete this term sheet?"))
      return;

    try {
      await axios.delete(
        `/api/partners/${partner._id}/services/${serviceId}/term-sheet`,
        {
          data: { termSheetUrl },
        }
      );
      setSuccess("Term sheet deleted successfully");
      await fetchPartnerData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete term sheet.");
      console.error("Error deleting term sheet:", err);
    }
  };

  const handleAddMilestone = () => {
    setSelectedMilestone(null);
    setMilestoneModalOpen(true);
  };

  const handleEditMilestone = (milestone) => {
    setSelectedMilestone(milestone);
    setMilestoneModalOpen(true);
  };

  const handleDeleteMilestone = async (milestoneId) => {
    if (!window.confirm("Are you sure you want to delete this milestone?"))
      return;

    try {
      await axios.delete(
        `/api/partners/${partner._id}/milestones/${milestoneId}`
      );
      setSuccess("Milestone deleted successfully");
      await fetchPartnerData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete milestone.");
      console.error("Error deleting milestone:", err);
    }
  };

  const formatChangeDetails = (changes) => {
    if (!changes || typeof changes !== "object")
      return "No change details available";
    return Object.entries(changes).map(([field, { before, after }]) => (
      <Box key={field} sx={{ mb: 1 }}>
        <Typography
          variant="body2"
          component="span"
          sx={{ fontWeight: "bold", color: muiTheme.palette.text.primary }}
        >
          {field
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase())}
          :
        </Typography>
        <Typography
          variant="body2"
          component="span"
          sx={{ ml: 1, color: muiTheme.palette.text.secondary }}
        >
          Before: {sanitizeHtml(before.toString())} → After:{" "}
          {sanitizeHtml(after.toString())}
        </Typography>
      </Box>
    ));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableEnforceFocus
      aria-labelledby="partner-details-modal-title"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: "16px",
          backgroundColor: muiTheme.palette.background.paper,
          boxShadow: muiTheme.shadows[24],
        },
      }}
    >
      <DialogTitle
        id="partner-details-modal-title"
        sx={{
          fontFamily: "'Poppins', sans-serif",
          color: muiTheme.palette.text.primary,
          bgcolor: muiTheme.palette.background.default,
          py: 3,
          px: 4,
          position: "relative",
          borderBottom: `1px solid ${muiTheme.palette.divider}`,
          fontSize: "1.25rem",
          fontWeight: 600,
        }}
      >
        Partner Details: {partner?.name || "Loading..."}
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 16,
            top: 16,
            color: muiTheme.palette.text.secondary,
            "&:hover": { bgcolor: muiTheme.palette.action.hover },
          }}
          aria-label="close"
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 3, sm: 4 } }}>
        {partner ? (
          <>
            <Card
              sx={{
                mt: 2,
                mb: 4,
                borderRadius: "12px",
                boxShadow: muiTheme.shadows[4],
                bgcolor: muiTheme.palette.background.default,
              }}
            >
              <CardContent sx={{ p: 4 }}>
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
                    fontWeight="bold"
                    fontFamily="'Poppins', sans-serif"
                    color={
                      !isDarkMode ? systemBlue : muiTheme.palette.primary.main
                    }
                    sx={{ fontSize: "1.5rem" }}
                  >
                    Partner Information
                  </Typography>
                  {!isEditing && (
                    <Button
                      startIcon={<Edit />}
                      onClick={handleEditToggle}
                      variant="outlined"
                      sx={{
                        borderRadius: "8px",
                        textTransform: "none",
                        borderColor: muiTheme.palette.primary.main,
                        color: muiTheme.palette.primary.main,
                        "&:hover": { bgcolor: muiTheme.palette.action.hover },
                      }}
                      aria-label="Edit partner details"
                    >
                      Edit
                    </Button>
                  )}
                </Box>
                {isEditing ? (
                  <Grid container spacing={4}>
                    <Grid item xs={12}>
                      <Typography
                        variant="h5"
                        fontWeight="medium"
                        fontFamily="'Poppins', sans-serif"
                        color={
                          !isDarkMode
                            ? systemBlue
                            : muiTheme.palette.primary.main
                        }
                        sx={{ fontSize: "1.25rem", mb: 3 }}
                      >
                        Partnership Details
                      </Typography>
                      <Grid container spacing={4}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Name"
                            value={editForm.name}
                            onChange={(e) =>
                              handleEditChange("name", e.target.value)
                            }
                            fullWidth
                            required
                            aria-label="Edit partner name"
                            InputLabelProps={{
                              style: { color: muiTheme.palette.text.secondary },
                            }}
                            InputProps={{
                              style: { color: muiTheme.palette.text.primary },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Project Name"
                            value={editForm.projectName}
                            onChange={(e) =>
                              handleEditChange("projectName", e.target.value)
                            }
                            fullWidth
                            required
                            aria-label="Edit project name"
                            InputLabelProps={{
                              style: { color: muiTheme.palette.text.secondary },
                            }}
                            InputProps={{
                              style: { color: muiTheme.palette.text.primary },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Category"
                            value={editForm.category}
                            onChange={(e) =>
                              handleEditChange("category", e.target.value)
                            }
                            fullWidth
                            aria-label="Edit category"
                            InputLabelProps={{
                              style: { color: muiTheme.palette.text.secondary },
                            }}
                            InputProps={{
                              style: { color: muiTheme.palette.text.primary },
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography
                        variant="h5"
                        fontWeight="medium"
                        fontFamily="'Poppins', sans-serif"
                        color={
                          !isDarkMode
                            ? systemBlue
                            : muiTheme.palette.primary.main
                        }
                        sx={{ fontSize: "1.25rem", mb: 3 }}
                      >
                        Status
                      </Typography>
                      <Grid container spacing={4}>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel
                              sx={{ color: muiTheme.palette.text.secondary }}
                            >
                              Status
                            </InputLabel>
                            <Select
                              value={editForm.status}
                              onChange={(e) =>
                                handleEditChange("status", e.target.value)
                              }
                              label="Status"
                              aria-label="Edit partner status"
                              sx={{ color: muiTheme.palette.text.primary }}
                            >
                              <MenuItem value="Hot">Hot</MenuItem>
                              <MenuItem value="Warm">Warm</MenuItem>
                              <MenuItem value="Cold">Cold</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Start Date"
                            type="date"
                            value={editForm.startDate}
                            onChange={(e) =>
                              handleEditChange("startDate", e.target.value)
                            }
                            fullWidth
                            required
                            InputLabelProps={{
                              shrink: true,
                              style: { color: muiTheme.palette.text.secondary },
                            }}
                            aria-label="Edit start date"
                            InputProps={{
                              style: { color: muiTheme.palette.text.primary },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="End Date"
                            type="date"
                            value={editForm.endDate}
                            onChange={(e) =>
                              handleEditChange("endDate", e.target.value)
                            }
                            fullWidth
                            required
                            InputLabelProps={{
                              shrink: true,
                              style: { color: muiTheme.palette.text.secondary },
                            }}
                            aria-label="Edit end date"
                            InputProps={{
                              style: { color: muiTheme.palette.text.primary },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel
                              sx={{ color: muiTheme.palette.text.secondary }}
                            >
                              Duration Status
                            </InputLabel>
                            <Select
                              value={editForm.durationStatus}
                              onChange={(e) =>
                                handleEditChange(
                                  "durationStatus",
                                  e.target.value
                                )
                              }
                              label="Duration Status"
                              aria-label="Edit duration status"
                              sx={{ color: muiTheme.palette.text.primary }}
                            >
                              <MenuItem value="Upcoming">Upcoming</MenuItem>
                              <MenuItem value="Ongoing">Ongoing</MenuItem>
                              <MenuItem value="Custom">Custom</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        {editForm.durationStatus === "Custom" && (
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label="Custom Duration Status"
                              value={editForm.durationStatusCustom}
                              onChange={(e) =>
                                handleEditChange(
                                  "durationStatusCustom",
                                  e.target.value
                                )
                              }
                              fullWidth
                              aria-label="Edit custom duration status"
                              InputLabelProps={{
                                style: {
                                  color: muiTheme.palette.text.secondary,
                                },
                              }}
                              InputProps={{
                                style: { color: muiTheme.palette.text.primary },
                              }}
                            />
                          </Grid>
                        )}
                      </Grid>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography
                        variant="h5"
                        fontWeight="medium"
                        fontFamily="'Poppins', sans-serif"
                        color={
                          !isDarkMode
                            ? systemBlue
                            : muiTheme.palette.primary.main
                        }
                        sx={{ fontSize: "1.25rem", mb: 3, mt: 4 }}
                      >
                        Contact Information
                      </Typography>
                      <Grid container spacing={4}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Email"
                            value={editForm.contact.email}
                            onChange={(e) =>
                              handleEditChange("contact.email", e.target.value)
                            }
                            fullWidth
                            aria-label="Edit contact email"
                            InputLabelProps={{
                              style: { color: muiTheme.palette.text.secondary },
                            }}
                            InputProps={{
                              style: { color: muiTheme.palette.text.primary },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Phone"
                            value={editForm.contact.phone}
                            onChange={(e) =>
                              handleEditChange("contact.phone", e.target.value)
                            }
                            fullWidth
                            aria-label="Edit contact phone"
                            InputLabelProps={{
                              style: { color: muiTheme.palette.text.secondary },
                            }}
                            InputProps={{
                              style: { color: muiTheme.palette.text.primary },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Contact Person"
                            value={editForm.contact.person}
                            onChange={(e) =>
                              handleEditChange("contact.person", e.target.value)
                            }
                            fullWidth
                            aria-label="Edit contact person"
                            InputLabelProps={{
                              style: { color: muiTheme.palette.text.secondary },
                            }}
                            InputProps={{
                              style: { color: muiTheme.palette.text.primary },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Role"
                            value={editForm.contact.role}
                            onChange={(e) =>
                              handleEditChange("contact.role", e.target.value)
                            }
                            fullWidth
                            aria-label="Edit contact role"
                            InputLabelProps={{
                              style: { color: muiTheme.palette.text.secondary },
                            }}
                            InputProps={{
                              style: { color: muiTheme.palette.text.primary },
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item xs={12}>
                      <DialogActions sx={{ mt: 4, justifyContent: "flex-end" }}>
                        <Button
                          onClick={handleEditToggle}
                          sx={{
                            borderRadius: "8px",
                            textTransform: "none",
                            color: muiTheme.palette.text.secondary,
                            "&:hover": {
                              bgcolor: muiTheme.palette.action.hover,
                            },
                          }}
                          aria-label="Cancel editing"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSave}
                          variant="contained"
                          sx={{
                            borderRadius: "8px",
                            textTransform: "none",
                            px: 3,
                            bgcolor: muiTheme.palette.primary.main,
                            color: muiTheme.palette.primary.contrastText,
                            "&:hover": {
                              bgcolor: muiTheme.palette.primary.dark,
                            },
                          }}
                          startIcon={<Save />}
                          aria-label="Save partner details"
                        >
                          Save
                        </Button>
                      </DialogActions>
                    </Grid>
                  </Grid>
                ) : (
                  <Box>
                    <Card
                      sx={{
                        mb: 4,
                        borderRadius: "8px",
                        boxShadow: muiTheme.shadows[4],
                        bgcolor: isDarkMode
                          ? muiTheme.palette.grey[800]
                          : muiTheme.palette.background.paper,
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Typography
                          variant="h5"
                          fontWeight="medium"
                          fontFamily="'Poppins', sans-serif"
                          color={
                            !isDarkMode
                              ? systemBlue
                              : muiTheme.palette.primary.main
                          }
                          sx={{ fontSize: "1.25rem", mb: 3 }}
                        >
                          Partnership Details
                        </Typography>
                        <Grid container spacing={4}>
                          <Grid item xs={12}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 2,
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                fontWeight="bold"
                                color={muiTheme.palette.text.secondary}
                                sx={{ minWidth: 180 }}
                              >
                                Name
                              </Typography>
                              <Typography
                                variant="body1"
                                color={muiTheme.palette.text.primary}
                                sx={{
                                  fontSize: "1.1rem",
                                  fontWeight: "medium",
                                }}
                              >
                                {partner.name}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 2,
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                fontWeight="bold"
                                color={muiTheme.palette.text.secondary}
                                sx={{ minWidth: 180 }}
                              >
                                Project Name
                              </Typography>
                              <Typography
                                variant="body1"
                                color={muiTheme.palette.text.primary}
                                sx={{ fontSize: "1.1rem" }}
                              >
                                {partner.projectName}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 2,
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                fontWeight="bold"
                                color={muiTheme.palette.text.secondary}
                                sx={{ minWidth: 180 }}
                              >
                                Category
                              </Typography>
                              <Typography
                                variant="body1"
                                color={muiTheme.palette.text.primary}
                                sx={{ fontSize: "1.1rem" }}
                              >
                                {partner.category || "N/A"}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                    <Card
                      sx={{
                        mb: 4,
                        borderRadius: "8px",
                        boxShadow: muiTheme.shadows[4],
                        bgcolor: isDarkMode
                          ? muiTheme.palette.grey[800]
                          : muiTheme.palette.background.paper,
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Typography
                          variant="h5"
                          fontWeight="medium"
                          fontFamily="'Poppins', sans-serif"
                          color={
                            !isDarkMode
                              ? systemBlue
                              : muiTheme.palette.primary.main
                          }
                          sx={{ fontSize: "1.25rem", mb: 3 }}
                        >
                          Status
                        </Typography>
                        <Grid container spacing={4}>
                          <Grid item xs={12}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 2,
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                fontWeight="bold"
                                color={muiTheme.palette.text.secondary}
                                sx={{ minWidth: 180 }}
                              >
                                Status
                              </Typography>
                              <Chip
                                label={partner.status}
                                color={getStatusColor(partner.status)}
                                size="small"
                                sx={{ color: "#fff", fontWeight: 500 }}
                              />
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 2,
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                fontWeight="bold"
                                color={muiTheme.palette.text.secondary}
                                sx={{ minWidth: 180 }}
                              >
                                Duration
                              </Typography>
                              <Typography
                                variant="body1"
                                color={muiTheme.palette.text.primary}
                                sx={{ fontSize: "1.1rem" }}
                              >
                                {new Date(
                                  partner.startDate
                                ).toLocaleDateString()}{" "}
                                -{" "}
                                {new Date(partner.endDate).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 2,
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                fontWeight="bold"
                                color={muiTheme.palette.text.secondary}
                                sx={{ minWidth: 180 }}
                              >
                                Duration Status
                              </Typography>
                              <Chip
                                label={
                                  partner.durationStatus === "Custom"
                                    ? partner.durationStatusCustom
                                    : partner.durationStatus
                                }
                                color={getDurationStatusColor(
                                  partner.durationStatus
                                )}
                                size="small"
                                sx={{ color: "#fff", fontWeight: 500 }}
                              />
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                    <Card
                      sx={{
                        mb: 4,
                        borderRadius: "8px",
                        boxShadow: muiTheme.shadows[4],
                        bgcolor: isDarkMode
                          ? muiTheme.palette.grey[800]
                          : muiTheme.palette.background.paper,
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Typography
                          variant="h5"
                          fontWeight="medium"
                          fontFamily="'Poppins', sans-serif"
                          color={
                            !isDarkMode
                              ? systemBlue
                              : muiTheme.palette.primary.main
                          }
                          sx={{ fontSize: "1.25rem", mb: 3 }}
                        >
                          Contact Information
                        </Typography>
                        <Grid container spacing={4}>
                          <Grid item xs={12}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 2,
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                fontWeight="bold"
                                color={muiTheme.palette.text.secondary}
                                sx={{ minWidth: 180 }}
                              >
                                Email
                              </Typography>
                              <Typography
                                variant="body1"
                                color={muiTheme.palette.text.primary}
                                sx={{ fontSize: "1.1rem" }}
                              >
                                {partner.contact?.email || "N/A"}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 2,
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                fontWeight="bold"
                                color={muiTheme.palette.text.secondary}
                                sx={{ minWidth: 180 }}
                              >
                                Phone
                              </Typography>
                              <Typography
                                variant="body1"
                                color={muiTheme.palette.text.primary}
                                sx={{ fontSize: "1.1rem" }}
                              >
                                {partner.contact?.phone || "N/A"}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 2,
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                fontWeight="bold"
                                color={muiTheme.palette.text.secondary}
                                sx={{ minWidth: 180 }}
                              >
                                Contact Person
                              </Typography>
                              <Typography
                                variant="body1"
                                color={muiTheme.palette.text.primary}
                                sx={{ fontSize: "1.1rem" }}
                              >
                                {partner.contact?.person || "N/A"}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 2,
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                fontWeight="bold"
                                color={muiTheme.palette.text.secondary}
                                sx={{ minWidth: 180 }}
                              >
                                Role
                              </Typography>
                              <Typography
                                variant="body1"
                                color={muiTheme.palette.text.primary}
                                sx={{ fontSize: "1.1rem" }}
                              >
                                {partner.contact?.role || "N/A"}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Box>
                )}
              </CardContent>
            </Card>

            <Card
              sx={{
                mb: 4,
                borderRadius: "12px",
                boxShadow: muiTheme.shadows[4],
                bgcolor: muiTheme.palette.background.default,
              }}
            >
              <CardContent sx={{ p: 4 }}>
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
                    fontWeight="bold"
                    fontFamily="'Poppins', sans-serif"
                    color={
                      !isDarkMode ? systemBlue : muiTheme.palette.primary.main
                    }
                    sx={{ fontSize: "1.5rem" }}
                  >
                    Services
                  </Typography>
                  <Button
                    startIcon={<Add />}
                    onClick={handleAddService}
                    variant="contained"
                    sx={{
                      borderRadius: "8px",
                      textTransform: "none",
                      bgcolor: muiTheme.palette.primary.main,
                      color: muiTheme.palette.primary.contrastText,
                      "&:hover": { bgcolor: muiTheme.palette.primary.dark },
                    }}
                    aria-label="Add new service"
                  >
                    Add Service
                  </Button>
                </Box>
                {partner.services.length > 0 ? (
                  <List
                    sx={{
                      bgcolor: muiTheme.palette.background.paper,
                      borderRadius: "8px",
                    }}
                  >
                    {partner.services.map((service) => (
                      <ListItem
                        key={service._id}
                        sx={{
                          borderBottom: `1px solid ${muiTheme.palette.divider}`,
                          py: 2,
                          "&:last-child": { borderBottom: "none" },
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography
                              variant="subtitle1"
                              fontWeight="medium"
                              fontFamily="'Poppins', sans-serif"
                              color={muiTheme.palette.text.primary}
                            >
                              {service.name}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography
                                variant="body2"
                                color={muiTheme.palette.text.secondary}
                              >
                                Created:{" "}
                                {new Date(
                                  service.createdAt
                                ).toLocaleDateString()}
                              </Typography>
                              <Typography
                                variant="body2"
                                color={muiTheme.palette.text.secondary}
                              >
                                Status: {service.status || "N/A"}
                              </Typography>
                              <Typography
                                variant="body2"
                                color={muiTheme.palette.text.secondary}
                              >
                                Cost:{" "}
                                {service.cost ? `$${service.cost}` : "N/A"}
                              </Typography>
                              <Typography
                                variant="body2"
                                color={muiTheme.palette.text.secondary}
                              >
                                Description: {service.description || "N/A"}
                              </Typography>
                              {service.termSheets &&
                                service.termSheets.length > 0 && (
                                  <Box sx={{ mt: 1 }}>
                                    <Typography
                                      variant="body2"
                                      color={muiTheme.palette.text.secondary}
                                      fontWeight="medium"
                                    >
                                      Term Sheets:
                                    </Typography>
                                    {service.termSheets.map(
                                      (termSheet, index) => (
                                        <Box
                                          key={index}
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            mt: 0.5,
                                          }}
                                        >
                                          <Tooltip title="View the Term Sheet">
                                            <IconButton
                                              onClick={() =>
                                                window.open(termSheet, "_blank")
                                              }
                                              sx={{ mr: 1 }}
                                              aria-label={`View term sheet ${
                                                index + 1
                                              }`}
                                            >
                                              <Visibility
                                                sx={{
                                                  color:
                                                    muiTheme.palette.text
                                                      .primary,
                                                }}
                                              />
                                            </IconButton>
                                          </Tooltip>
                                          <Tooltip title="Delete Term Sheet">
                                            <IconButton
                                              onClick={() =>
                                                handleDeleteTermSheet(
                                                  service._id,
                                                  termSheet
                                                )
                                              }
                                              sx={{ mr: 1 }}
                                              aria-label={`Delete term sheet ${
                                                index + 1
                                              }`}
                                            >
                                              <Delete color="error" />
                                            </IconButton>
                                          </Tooltip>
                                        </Box>
                                      )
                                    )}
                                  </Box>
                                )}
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            onClick={() => handleEditService(service)}
                            sx={{ mr: 1 }}
                            aria-label={`Edit service ${service.name}`}
                          >
                            <Edit
                              sx={{ color: muiTheme.palette.primary.main }}
                            />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDeleteService(service._id)}
                            aria-label={`Delete service ${service.name}`}
                          >
                            <Delete color="error" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography
                    variant="body1"
                    color={muiTheme.palette.text.secondary}
                  >
                    No services available.
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Card
              sx={{
                mb: 4,
                borderRadius: "12px",
                boxShadow: muiTheme.shadows[4],
                bgcolor: muiTheme.palette.background.default,
              }}
            >
              <CardContent sx={{ p: 4 }}>
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
                    fontWeight="bold"
                    fontFamily="'Poppins', sans-serif"
                    color={
                      !isDarkMode ? systemBlue : muiTheme.palette.primary.main
                    }
                    sx={{ fontSize: "1.5rem" }}
                  >
                    Milestones
                  </Typography>
                  <Button
                    startIcon={<Add />}
                    onClick={handleAddMilestone}
                    variant="contained"
                    sx={{
                      borderRadius: "8px",
                      textTransform: "none",
                      bgcolor: muiTheme.palette.primary.main,
                      color: muiTheme.palette.primary.contrastText,
                      "&:hover": { bgcolor: muiTheme.palette.primary.dark },
                    }}
                    aria-label="Add new milestone"
                  >
                    Add Milestone
                  </Button>
                </Box>
                {partner.milestones.length > 0 ? (
                  <List
                    sx={{
                      bgcolor: muiTheme.palette.background.paper,
                      borderRadius: "8px",
                    }}
                  >
                    {partner.milestones.map((milestone) => (
                      <ListItem
                        key={milestone._id}
                        sx={{
                          borderBottom: `1px solid ${muiTheme.palette.divider}`,
                          py: 2,
                          "&:last-child": { borderBottom: "none" },
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography
                              variant="subtitle1"
                              fontWeight="medium"
                              fontFamily="'Poppins', sans-serif"
                              color={muiTheme.palette.text.primary}
                            >
                              {milestone.title}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography
                                variant="body2"
                                color={muiTheme.palette.text.secondary}
                              >
                                Date:{" "}
                                {new Date(milestone.date).toLocaleDateString()}
                              </Typography>
                              <Typography
                                variant="body2"
                                color={muiTheme.palette.text.secondary}
                              >
                                Description: {milestone.description || "N/A"}
                              </Typography>
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            onClick={() => handleEditMilestone(milestone)}
                            sx={{ mr: 1 }}
                            aria-label={`Edit milestone ${milestone.title}`}
                          >
                            <Edit
                              sx={{ color: muiTheme.palette.primary.main }}
                            />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDeleteMilestone(milestone._id)}
                            aria-label={`Delete milestone ${milestone.title}`}
                          >
                            <Delete color="error" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography
                    variant="body1"
                    color={muiTheme.palette.text.secondary}
                  >
                    No milestones available.
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Card
              sx={{
                mb: 4,
                borderRadius: "12px",
                boxShadow: muiTheme.shadows[4],
                bgcolor: muiTheme.palette.background.default,
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  fontFamily="'Poppins', sans-serif"
                  color={
                    !isDarkMode ? systemBlue : muiTheme.palette.primary.main
                  }
                  sx={{ fontSize: "1.5rem", mb: 4 }}
                >
                  Activity Log
                </Typography>
                {activityLogs.length > 0 ? (
                  <List
                    sx={{
                      bgcolor: muiTheme.palette.background.paper,
                      borderRadius: "8px",
                    }}
                  >
                    {activityLogs.map((log) => (
                      <ListItem
                        key={log._id}
                        sx={{
                          borderBottom: `1px solid ${muiTheme.palette.divider}`,
                          py: 2,
                          "&:last-child": { borderBottom: "none" },
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography
                              variant="subtitle1"
                              fontWeight="medium"
                              fontFamily="'Poppins', sans-serif"
                              color={muiTheme.palette.text.primary}
                            >
                              {log.action} by {log.userName || "Anonymous User"}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography
                                variant="body2"
                                color={muiTheme.palette.text.secondary}
                              >
                                {new Date(log.timestamp).toLocaleString()}
                              </Typography>
                              <Typography
                                variant="body2"
                                color={muiTheme.palette.text.secondary}
                              >
                                Partner: {log.partnerName}
                              </Typography>
                              <Typography
                                variant="body2"
                                color={muiTheme.palette.text.secondary}
                              >
                                Project: {log.projectName}
                              </Typography>
                              {log.changes && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography
                                    variant="body2"
                                    fontWeight="medium"
                                    color={muiTheme.palette.text.secondary}
                                  >
                                    Changes:
                                  </Typography>
                                  {formatChangeDetails(log.changes)}
                                </Box>
                              )}
                              <Typography
                                variant="body2"
                                color={muiTheme.palette.text.secondary}
                              >
                                Details:{" "}
                                {sanitizeHtml(
                                  log.details || "No additional details"
                                )}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography
                    variant="body1"
                    color={muiTheme.palette.text.secondary}
                  >
                    No activity log available.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Typography
            variant="body1"
            color={muiTheme.palette.text.secondary}
            textAlign="center"
            py={4}
            fontFamily="'Poppins', sans-serif"
          >
            Loading partner details...
          </Typography>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          p: 3,
          bgcolor: muiTheme.palette.background.default,
          display: "none",
        }}
      />
      {serviceModalOpen && (
        <ServiceModal
          open={serviceModalOpen}
          onClose={() => setServiceModalOpen(false)}
          partnerId={partner?._id}
          service={selectedService}
          onUpdate={fetchPartnerData}
          onSuccess={(message) => setSuccess(message)}
          onError={(message) => setError(message)}
        />
      )}
      {milestoneModalOpen && (
        <MilestoneModal
          open={milestoneModalOpen}
          onClose={() => setMilestoneModalOpen(false)}
          partnerId={partner?._id}
          milestone={selectedMilestone}
          onUpdate={fetchPartnerData}
          onSuccess={(message) => setSuccess(message)}
          onError={(message) => setError(message)}
        />
      )}
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
    </Dialog>
  );
};

export default PartnerDetailsModal;
