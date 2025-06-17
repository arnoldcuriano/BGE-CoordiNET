import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import {
  UploadFile as UploadFileIcon,
  PictureAsPdf as PdfIcon,
  Description as DocxIcon,
  TableChart as XlsxIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import axios from "axios";

const ServiceModal = ({
  open,
  onClose,
  partnerId,
  service,
  onUpdate,
  onSuccess,
  onError,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [status, setStatus] = useState("Active");
  const [termSheets, setTermSheets] = useState([]); // Array of files
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (service) {
      setName(service.name);
      setDescription(service.description || "");
      setCost(service.cost || "");
      setStatus(service.status || "Active");
      setTermSheets([]); // Reset uploaded files (we'll append new ones)
    } else {
      setName("");
      setDescription("");
      setCost("");
      setStatus("Active");
      setTermSheets([]);
    }
  }, [service, open]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const maxSize = 10 * 1024 * 1024; // 10 MB

    const validFiles = Array.from(files).filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        onError("Only PDF, DOCX, and XLSX files are allowed.");
        return false;
      }
      if (file.size > maxSize) {
        onError("File size exceeds 10 MB limit.");
        return false;
      }
      return true;
    });

    setTermSheets((prev) => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (indexToRemove) => {
    setTermSheets((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const getFileIcon = (file) => {
    const fileType = file.type;
    if (fileType === "application/pdf")
      return <PdfIcon sx={{ color: "red" }} />;
    if (
      fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
      return <DocxIcon sx={{ color: "blue" }} />;
    if (
      fileType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
      return <XlsxIcon sx={{ color: "green" }} />;
    return <UploadFileIcon />;
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("cost", cost);
      formData.append("status", status);
      termSheets.forEach((file) => {
        formData.append("termSheets", file);
      });

      const url = service
        ? `/api/partners/${partnerId}/services/${service._id}`
        : `/api/partners/${partnerId}/services`;
      const method = service ? "put" : "post";

      const response = await axios[method](url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onSuccess(`${service ? "Updated" : "Added"} service successfully`);
      onUpdate();
      onClose();
    } catch (err) {
      console.error("Error saving service:", err.message);
      onError(
        err.response?.data?.message ||
          "Failed to save service. Please try again later."
      );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{service ? "Edit Service" : "Add Service"}</DialogTitle>
      <DialogContent>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          margin="normal"
          multiline
          rows={3}
        />
        <TextField
          label="Cost"
          type="number"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          fullWidth
          margin="normal"
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Status</InputLabel>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            label="Status"
          >
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body1" sx={{ mt: 2, mb: 1 }}>
          Term Sheets (PDF/DOCX/XLSX only, max 10 MB each)
        </Typography>
        <Box
          sx={{
            border: "2px dashed",
            borderColor: dragActive ? "primary.main" : "grey.400",
            borderRadius: "8px",
            p: 3,
            textAlign: "center",
            backgroundColor: dragActive ? "action.hover" : "background.paper",
            transition: "all 0.3s ease",
            cursor: "pointer",
            mb: 2,
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
        >
          <UploadFileIcon sx={{ fontSize: 40, color: "grey.600", mb: 1 }} />
          <Typography variant="body2" color="textSecondary">
            Drag and drop files here or click to select files
          </Typography>
          <Typography variant="caption" color="textSecondary">
            (PDF, DOCX, XLSX only, max 10 MB each)
          </Typography>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.xlsx"
            multiple
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </Box>
        {termSheets.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              Selected Files:
            </Typography>
            <List dense>
              {termSheets.map((file, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveFile(index)}
                    >
                      <DeleteIcon color="error" />
                    </IconButton>
                  }
                >
                  <ListItemIcon>{getFileIcon(file)}</ListItemIcon>
                  <ListItemText
                    primary={file.name}
                    secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ServiceModal;
