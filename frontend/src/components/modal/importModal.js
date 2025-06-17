import React, { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  LinearProgress,
  Card,
  CardContent,
  Grid,
  IconButton,
  TextField,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Close, Upload } from "@mui/icons-material";
import { useTheme } from "../../context/ThemeContext";
import CustomSnackbar from "../CustomSnackbar";
import axios from "axios";

// System blue color for light mode headers
const systemBlue = "#4285F4";

const ImportModal = ({ open, onClose }) => {
  const { isDarkMode, muiTheme } = useTheme();
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const resetState = useCallback(() => {
    setFile(null);
    setPreviewData([]);
    setProgress(0);
    setTotalRecords(0);
    setSuccess("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setError("");
    } else {
      setError("Please upload a valid CSV file.");
      setFile(null);
    }
  };

  const handlePreview = async () => {
    if (!file) {
      setError("No file selected.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        "/api/partners/import-preview",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log("Preview response:", response.data);
      setPreviewData(response.data.previewData);
      setTotalRecords(response.data.totalRecords);
      setSuccess("Preview loaded successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load preview.");
      console.error("Error loading preview:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file || !previewData.length) {
      setError("No preview data to import.");
      return;
    }

    setIsLoading(true);
    setProgress(0);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("/api/partners/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percent);
        },
      });
      console.log("Import response:", response.data);
      setSuccess(
        `Imported ${response.data.processedRecords} of ${response.data.totalRecords} records.`
      );
      if (response.data.errors.length) {
        setError(`Errors: ${response.data.errors.join("; ")}`);
      }
      resetState();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to import data.");
      console.error("Error importing:", err);
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const columns = [
    { field: "name", headerName: "Name", width: 150 },
    { field: "projectName", headerName: "Project Name", width: 150 },
    { field: "status", headerName: "Status", width: 100 },
    {
      field: "startDate",
      headerName: "Start Date",
      width: 120,
      valueFormatter: ({ value }) => new Date(value).toLocaleDateString(),
    },
    {
      field: "endDate",
      headerName: "End Date",
      width: 120,
      valueFormatter: ({ value }) => new Date(value).toLocaleDateString(),
    },
    { field: "durationStatus", headerName: "Duration Status", width: 120 },
    { field: "category", headerName: "Category", width: 120 },
    {
      field: "contact.email",
      headerName: "Email",
      width: 150,
      valueGetter: ({ row }) => row.contact.email,
    },
    {
      field: "contact.phone",
      headerName: "Phone",
      width: 120,
      valueGetter: ({ row }) => row.contact.phone,
    },
    {
      field: "contact.person",
      headerName: "Contact Person",
      width: 120,
      valueGetter: ({ row }) => row.contact.person,
    },
    {
      field: "contact.role",
      headerName: "Role",
      width: 120,
      valueGetter: ({ row }) => row.contact.role,
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      aria-labelledby="import-modal-title"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: "16px",
          backgroundColor: muiTheme.palette.background.paper,
          boxShadow: muiTheme.shadows[24],
        },
      }}
    >
      <DialogTitle
        id="import-modal-title"
        sx={{
          fontFamily: "'Poppins', sans-serif",
          color: !isDarkMode ? systemBlue : muiTheme.palette.primary.main,
          bgcolor: muiTheme.palette.background.default,
          py: 3,
          px: 4,
          position: "relative",
          borderBottom: `1px solid ${muiTheme.palette.divider}`,
          fontSize: "1.5rem",
          fontWeight: 600,
        }}
      >
        Import Partners
        <IconButton
          onClick={handleClose}
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
              variant="h5"
              fontWeight="medium"
              fontFamily="'Poppins', sans-serif"
              color={muiTheme.palette.text.primary}
              mb={3}
            >
              Upload CSV File
            </Typography>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} sm={6}>
                <TextField
                  type="file"
                  inputRef={fileInputRef}
                  onChange={handleFileChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ accept: ".csv" }}
                  aria-label="Upload CSV file"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="contained"
                  startIcon={<Upload />}
                  onClick={handlePreview}
                  disabled={isLoading || !file}
                  sx={{
                    borderRadius: "8px",
                    textTransform: "none",
                    bgcolor: muiTheme.palette.primary.main,
                    color: muiTheme.palette.primary.contrastText,
                    "&:hover": { bgcolor: muiTheme.palette.primary.dark },
                  }}
                  aria-label="Preview CSV data"
                >
                  Preview
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        {isLoading && (
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
                value={progress}
                sx={{
                  mb: 2,
                  bgcolor: muiTheme.palette.grey[300],
                  "& .MuiLinearProgress-bar": {
                    bgcolor: muiTheme.palette.primary.main,
                  },
                }}
              />
              <Typography
                variant="body1"
                color={muiTheme.palette.text.secondary}
                fontFamily="'Poppins', sans-serif"
              >
                {progress === 0
                  ? "Starting import..."
                  : `Inserting partner ${Math.round(
                      (progress / 100) * totalRecords
                    )} of ${totalRecords}`}
              </Typography>
            </CardContent>
          </Card>
        )}
        {previewData.length > 0 && (
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
                variant="h5"
                fontWeight="medium"
                fontFamily="'Poppins', sans-serif"
                color={muiTheme.palette.text.primary}
                mb={3}
              >
                Preview Data ({totalRecords} Records)
              </Typography>
              <Box sx={{ height: 400, width: "100%" }}>
                <DataGrid
                  rows={previewData.map((row, index) => ({
                    id: index,
                    ...row,
                  }))}
                  columns={columns}
                  pageSize={5}
                  rowsPerPageOptions={[5]}
                  disableSelectionOnClick
                  sx={{
                    "& .MuiDataGrid-cell": {
                      color: muiTheme.palette.text.primary,
                    },
                    "& .MuiDataGrid-columnHeaders": {
                      bgcolor: muiTheme.palette.background.default,
                    },
                    "& .MuiDataGrid-footerContainer": {
                      bgcolor: muiTheme.palette.background.default,
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        )}
      </DialogContent>
      <DialogActions
        sx={{ p: 3, bgcolor: muiTheme.palette.background.default }}
      >
        <Button
          onClick={handleClose}
          sx={{
            borderRadius: "8px",
            textTransform: "none",
            color: muiTheme.palette.text.secondary,
            "&:hover": { bgcolor: muiTheme.palette.action.hover },
          }}
          aria-label="Cancel import"
        >
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          variant="contained"
          disabled={isLoading || !previewData.length}
          sx={{
            borderRadius: "8px",
            textTransform: "none",
            px: 3,
            bgcolor: muiTheme.palette.primary.main,
            color: muiTheme.palette.primary.contrastText,
            "&:hover": { bgcolor: muiTheme.palette.primary.dark },
          }}
          aria-label="Import CSV data"
        >
          Import
        </Button>
      </DialogActions>
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

export default ImportModal;
