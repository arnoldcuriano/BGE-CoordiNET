import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Papa from "papaparse";
import {
  Add as AddIcon,
  FileUpload as FileUploadIcon,
  FileDownload as FileDownloadIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  History as HistoryIcon,
  Comment as CommentIcon,
} from "@mui/icons-material";
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
  TablePagination,
  TableSortLabel,
  Tooltip,
  Autocomplete,
  Checkbox,
} from "@mui/material";
import CustomSnackbar from "../components/CustomSnackbar";
import PartnerDetailsModal from "../components/modal/PartnerDetailsModal";
import ActivityLogsModal from "../components/modal/ActivityLogsModal";
import CommentModal from "../components/modal/CommentModal";
import ImportProgressModal from "../components/modal/ImportProgressModal";
import ImportPreviewModal from "../components/modal/ImportPreviewModal";
import ImportSummaryModal from "../components/modal/ImportSummaryModal";
import ExportFieldsModal from "../components/modal/ExportFieldsModal";
import ExportConfirmModal from "../components/modal/ExportConfirmModal";
import CreatePartnerModal from "../components/modal/CreatePartnerModal";
import BulkEditModal from "../components/modal/BulkEditModal";
import DeletePartnerModal from "../components/modal/DeletePartnerModal";
import BulkDeleteModal from "../components/modal/BulkDeleteModal";
import ErrorBoundary from "../components/ErrorBoundary";

const PartnerManagement = () => {
  const { isDarkMode, muiTheme } = useTheme();
  const { authState } = useAuth();
  const isAdmin = ["admin", "superadmin"].includes(authState.userRole);
  const [partners, setPartners] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState(null);
  const [activityLogsModalOpen, setActivityLogsModalOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentPartner, setCommentPartner] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [newPartner, setNewPartner] = useState({
    name: "",
    projectName: "",
    status: "Cold",
    startDate: "",
    endDate: "",
    durationStatus: "Upcoming",
    durationStatusCustom: "",
    category: "",
    contact: { email: "", phone: "", person: "", role: "" },
  });
  const [selectedPartners, setSelectedPartners] = useState([]);
  const [bulkEditStatus, setBulkEditStatus] = useState("Cold");
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [currentImportItem, setCurrentImportItem] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [exportConfirmOpen, setExportConfirmOpen] = useState(false);
  const [isExportSelected, setIsExportSelected] = useState(false);
  const [exportFieldsModalOpen, setExportFieldsModalOpen] = useState(false);
  const [exportFields, setExportFields] = useState([
    "name",
    "projectName",
    "status",
    "startDate",
    "endDate",
    "durationStatus",
    "durationStatusCustom",
    "category",
    "contactEmail",
    "contactPhone",
    "contactPerson",
    "contactRole",
    "services",
  ]);
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [parsedData, setParsedData] = useState([]);
  const [importSummary, setImportSummary] = useState(null);
  const fileInputRef = useRef(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("name");

  const brandingBlue = "#4285F4";
  const greenLightColor = "#34A853";
  const greenLightHoverBackground = "rgba(52, 168, 83, 0.1)";
  const hoverGreen = "#2E914A";
  const hoverBackground = isDarkMode
    ? "rgba(255, 255, 255, 0.15)"
    : greenLightHoverBackground;
  const disabledColor = "#666";

  const availableFields = [
    { id: "name", label: "Partner Name" },
    { id: "projectName", label: "Project Name" },
    { id: "status", label: "Status" },
    { id: "startDate", label: "Start Date" },
    { id: "endDate", label: "End Date" },
    { id: "durationStatus", label: "Duration Status" },
    { id: "durationStatusCustom", label: "Custom Duration Status" },
    { id: "category", label: "Category" },
    { id: "contactEmail", label: "Contact Email" },
    { id: "contactPhone", label: "Contact Phone" },
    { id: "contactPerson", label: "Contact Person" },
    { id: "contactRole", label: "Contact Role" },
    { id: "services", label: "Services" },
  ];

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const response = await axios.get("/api/partners");
      setPartners(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to fetch partners. Please try again later."
      );
      console.error("Error fetching partners:", err);
    }
  };

  const uniqueCategories = [
    ...new Set(partners.map((partner) => partner.category || "")),
  ].filter(Boolean);

  const handleChangeStatus = async (partnerId, newStatus) => {
    try {
      await axios.put(`/api/partners/${partnerId}/status`, {
        status: newStatus,
      });
      setSuccess(`Partner status changed to ${newStatus}`);
      fetchPartners();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update partner status. Please try again later."
      );
      console.error("Error updating partner status:", err);
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
      setSuccess("Partner deleted successfully");
      fetchPartners();
      setDeleteModalOpen(false);
      setPartnerToDelete(null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete partner. Please try again later."
      );
      console.error("Error deleting partner:", err);
      setDeleteModalOpen(false);
      setPartnerToDelete(null);
    }
  };

  const handleCreatePartner = async () => {
    const {
      name,
      projectName,
      status,
      startDate,
      endDate,
      durationStatus,
      durationStatusCustom,
      category,
      contact,
    } = newPartner;
    if (!name || !projectName || !startDate || !endDate) {
      setError(
        "Please fill in all required fields (Name, Project Name, Start Date, End Date)."
      );
      return;
    }
    try {
      await axios.post("/api/partners", {
        name,
        projectName,
        status,
        startDate,
        endDate,
        durationStatus,
        durationStatusCustom:
          durationStatus === "Custom" ? durationStatusCustom : "",
        category: category || undefined,
        contact,
      });
      setSuccess("Partner created successfully");
      setCreateModalOpen(false);
      setNewPartner({
        name: "",
        projectName: "",
        status: "Cold",
        startDate: "",
        endDate: "",
        durationStatus: "Upcoming",
        durationStatusCustom: "",
        category: "",
        contact: { email: "", phone: "", person: "", role: "" },
      });
      fetchPartners();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to create partner. Please try again later."
      );
      console.error("Error creating partner:", err);
    }
  };

  const handleOpenExportConfirm = (selected = false) => {
    if (selected && selectedPartners.length === 0) {
      setError("Please select at least one partner to export.");
      return;
    }
    setIsExportSelected(selected);
    setExportFieldsModalOpen(true);
  };

  const toggleExportField = (fieldId) => {
    setExportFields((prev) =>
      prev.includes(fieldId)
        ? prev.filter((id) => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleExportCSV = () => {
    if (exportFields.length === 0) {
      setError("Please select at least one field to export.");
      return;
    }
    try {
      const partnersToExport = isExportSelected
        ? selectedPartners
        : filteredPartners;
      const headers = availableFields
        .filter((field) => exportFields.includes(field.id))
        .map((field) => field.label);
      const rows = partnersToExport.map((partner) => {
        const row = {};
        if (exportFields.includes("name"))
          row["Partner Name"] = partner.name || "";
        if (exportFields.includes("projectName"))
          row["Project Name"] = partner.projectName || "";
        if (exportFields.includes("status"))
          row["Status"] = partner.status || "";
        if (exportFields.includes("startDate"))
          row["Start Date"] = partner.startDate
            ? new Date(partner.startDate).toLocaleDateString()
            : "";
        if (exportFields.includes("endDate"))
          row["End Date"] = partner.endDate
            ? new Date(partner.endDate).toLocaleDateString()
            : "";
        if (exportFields.includes("durationStatus"))
          row["Duration Status"] = partner.durationStatus || "";
        if (exportFields.includes("durationStatusCustom"))
          row["Custom Duration Status"] = partner.durationStatusCustom || "N/A";
        if (exportFields.includes("category"))
          row["Category"] = partner.category || "N/A";
        if (exportFields.includes("contactEmail"))
          row["Contact Email"] = partner.contact?.email || "N/A";
        if (exportFields.includes("contactPhone"))
          row["Contact Phone"] = partner.contact?.phone || "N/A";
        if (exportFields.includes("contactPerson"))
          row["Contact Person"] = partner.contact?.person || "N/A";
        if (exportFields.includes("contactRole"))
          row["Contact Role"] = partner.contact?.role || "N/A";
        if (exportFields.includes("services")) {
          row["Services"] = partner.services
            .map(
              (s) =>
                `Name: ${s.name || ""}, Status: ${s.status || "N/A"}, Cost: ${
                  s.cost ? `$${s.cost}` : "N/A"
                }, Term Sheets: ${s.termSheets?.join("; ") || "N/A"}`
            )
            .join(" | ");
        }
        return row;
      });
      const csvContent = Papa.unparse(
        { fields: headers, data: rows },
        { quotes: true, delimiter: ",", header: true }
      );
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute(
        "download",
        isExportSelected ? "selected_partners.csv" : "partners.csv"
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccess(
        `Successfully exported ${
          isExportSelected ? "selected" : "all"
        } partners to CSV`
      );
      setExportConfirmOpen(false);
      setExportFieldsModalOpen(false);
    } catch (err) {
      setError("Failed to export partners to CSV. Please try again.");
      console.error("Error exporting CSV:", err);
    }
  };

  const validateRow = (row) => {
    const errors = [];
    if (!row["Partner Name"]) errors.push("Missing Partner Name");
    if (!row["Project Name"]) errors.push("Missing Project Name");
    if (!row["Start Date"] || !isValidDate(row["Start Date"]))
      errors.push("Invalid Start Date");
    if (!row["End Date"] || !isValidDate(row["End Date"]))
      errors.push("Invalid End Date");
    if (
      row["Contact Email"] &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row["Contact Email"])
    )
      errors.push("Invalid Contact Email");
    if (row["Status"] && !["Hot", "Warm", "Cold"].includes(row["Status"]))
      errors.push("Invalid Status");
    if (
      row["Duration Status"] &&
      !["Upcoming", "Ongoing", "Custom"].includes(row["Duration Status"])
    )
      errors.push("Invalid Duration Status");
    return errors;
  };

  const isValidDate = (dateStr) => {
    const [month, day, year] = dateStr.split("/");
    const date = new Date(
      `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    );
    return date instanceof Date && !isNaN(date);
  };

  const resetImportState = () => {
    setParsedData([]);
    setImportSummary(null);
    setImportPreviewOpen(false);
    setIsImporting(false);
    setImportProgress(0);
    setCurrentImportItem("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImportCSV = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setError("Please select a CSV file to import.");
      return;
    }
    if (file.type !== "text/csv") {
      setError("Please upload a valid CSV file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      Papa.parse(e.target.result, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (result) => {
          const dataRows = result.data;
          if (!dataRows.length) {
            setError("No data rows parsed from CSV.");
            return;
          }
          const validatedRows = dataRows.map((row, index) => ({
            ...row,
            errors: validateRow(row),
            rowIndex: index + 2,
          }));
          setParsedData(validatedRows);
          setImportPreviewOpen(true);
        },
        error: (err) => {
          setError(`Failed to parse CSV: ${err.message}`);
          console.error("Error parsing CSV:", err);
        },
      });
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    setIsImporting(true);
    setImportProgress(0);
    setCurrentImportItem("");
    setImportPreviewOpen(false);
    const validRows = parsedData.filter((row) => row.errors.length === 0);
    const failedRows = [];
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
      setCurrentImportItem(row["Partner Name"] || `Partner ${i + 1}`);
      try {
        const contact = {
          email: row["Contact Email"] || "",
          phone: row["Contact Phone"] || "",
          person: row["Contact Person"] || "",
          role: row["Contact Role"] || "",
        };
        let parsedServices = [];
        if (row["Services"] && row["Services"].trim()) {
          const serviceItems = row["Services"]
            .replace(/"/g, "")
            .split(" | ")
            .filter((item) => item.trim());
          parsedServices = serviceItems.map((item) => {
            const parts = item.split(", ").reduce((acc, part) => {
              const [key, value] = part.split(": ");
              if (key && value !== undefined) acc[key.trim()] = value.trim();
              else if (key) acc[key.trim()] = "";
              return acc;
            }, {});
            return {
              name: parts["Name"] || "",
              status: parts["Status"] || "Active",
              cost: parts["Cost"]?.startsWith("$")
                ? Number(parts["Cost"].slice(1))
                : undefined,
              termSheets:
                parts["Term Sheets"] && parts["Term Sheets"] !== "N/A"
                  ? parts["Term Sheets"].split("; ")
                  : [],
            };
          });
        }
        const parseDate = (dateStr) => {
          const [month, day, year] = dateStr.split("/");
          return new Date(
            `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
          ).toISOString();
        };
        await axios.post(
          "/api/partners",
          {
            name: row["Partner Name"]?.trim() || "",
            projectName: row["Project Name"]?.trim() || "",
            status: row["Status"]?.trim() || "Cold",
            startDate: parseDate(row["Start Date"]),
            endDate: parseDate(row["End Date"]),
            durationStatus: row["Duration Status"]?.trim() || "Upcoming",
            durationStatusCustom:
              row["Duration Status"] === "Custom"
                ? row["Duration Status Custom"]?.trim() || ""
                : "",
            category: row["Category"]?.trim() || undefined,
            contact,
            services: parsedServices,
          },
          { headers: { "Content-Type": "application/json" } }
        );
      } catch (err) {
        failedRows.push({
          row: row.rowIndex,
          error: err.response?.data?.message || err.message,
        });
      }
    }
    setIsImporting(false);
    setImportSummary({
      total: parsedData.length,
      successful: validRows.length - failedRows.length,
      skipped: parsedData.filter((row) => row.errors.length > 0).length,
      failed: failedRows,
    });
    if (
      failedRows.length > 0 ||
      parsedData.some((row) => row.errors.length > 0)
    ) {
      setError(
        `Imported with issues. Skipped ${
          parsedData.filter((row) => row.errors.length > 0).length
        } rows with errors. Failed rows: ${failedRows
          .map((f) => `Row ${f.row}: ${f.error}`)
          .join(", ")}`
      );
    } else {
      setSuccess("Partners imported successfully");
    }
    fetchPartners();
    resetImportState();
  };

  const handleBulkDelete = async () => {
    if (selectedPartners.length === 0) {
      setError("Please select at least one partner to delete.");
      setBulkDeleteModalOpen(false);
      return;
    }
    try {
      await Promise.all(
        selectedPartners.map((partner) =>
          axios.delete(`/api/partners/${partner._id}`)
        )
      );
      setSuccess("Selected partners deleted successfully");
      setSelectedPartners([]);
      setBulkDeleteModalOpen(false);
      fetchPartners();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete selected partners. Please try again later."
      );
      console.error("Error deleting selected partners:", err);
      setBulkDeleteModalOpen(false);
    }
  };

  const handleBulkEdit = async () => {
    if (selectedPartners.length === 0) {
      setError("Please select at least one partner to edit.");
      return;
    }
    try {
      await Promise.all(
        selectedPartners.map((partner) =>
          axios.put(`/api/partners/${partner._id}/status`, {
            status: bulkEditStatus,
          })
        )
      );
      setSuccess("Selected partners updated successfully");
      setSelectedPartners([]);
      setBulkEditModalOpen(false);
      fetchPartners();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update selected partners. Please try again later."
      );
      console.error("Error updating selected partners:", err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      setError("Comment cannot be empty.");
      return;
    }
    if (!commentPartner) return;
    try {
      await axios.post(`/api/partners/${commentPartner._id}/comment`, {
        comment: newComment.trim(),
        userId: authState.userId,
        userName: authState.userName,
      });
      setSuccess("Comment added successfully");
      setCommentModalOpen(false);
      setNewComment("");
      setCommentPartner(null);
      fetchPartners();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to add comment. Please try again later."
      );
      console.error("Error adding comment:", err);
    }
  };

  const handleOpenCommentModal = (partner) => {
    setCommentPartner(partner);
    setNewComment("");
    setCommentModalOpen(true);
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

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
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
    return order === "desc"
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  };

  const descendingComparator = (a, b, orderBy) => {
    if (orderBy === "startDate") {
      return new Date(b.startDate) - new Date(a.startDate);
    }
    if (orderBy === "services") {
      return b.services.length - a.services.length;
    }
    if (b[orderBy] < a[orderBy]) return -1;
    if (b[orderBy] > a[orderBy]) return 1;
    return 0;
  };

  const filteredPartners = partners.filter((partner) => {
    const matchesSearch =
      (partner.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (partner.projectName || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (partner.status || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (partner.category || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (partner.contact?.email || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (partner.contact?.person || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus ? partner.status === filterStatus : true;
    const matchesCategory = filterCategory
      ? (partner.category || "") === filterCategory
      : true;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const sortedPartners = stableSort(
    filteredPartners,
    getComparator(order, orderBy)
  );
  const paginatedPartners = sortedPartners.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenActivityLogs = async () => {
    try {
      const response = await axios.get("/api/partners/activity-logs");
      setActivityLogs(response.data);
      setActivityLogsModalOpen(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to fetch activity logs. Please try again later."
      );
      console.error("Error fetching activity logs:", err);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: muiTheme.custom.gradients.backgroundDefault,
        p: { xs: 2, sm: 3, md: 4 },
        position: "relative",
        overflow: "hidden",
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
              Partner Management
            </Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateModalOpen(true)}
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
                      backgroundColor: isDarkMode ? "#fff" : "transparent",
                      color: isDarkMode
                        ? "#333"
                        : muiTheme.palette.text.primary,
                      border: !isDarkMode ? "1px solid #333" : "none",
                      borderRadius: "8px",
                      py: 1.5,
                      px: 3,
                      fontSize: "0.875rem",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        backgroundColor: hoverBackground,
                        border: !isDarkMode
                          ? "1px solid #34A853"
                          : "1px solid #34A853",
                        color: isDarkMode
                          ? "#fff"
                          : muiTheme.palette.text.primary,
                        transform: "scale(1.05)",
                      },
                      "&:active": {
                        border: !isDarkMode
                          ? "1px solid #34A853"
                          : "1px solid #34A853",
                      },
                      "&:disabled": { border: "none", color: disabledColor },
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
                      backgroundColor: isDarkMode ? "#fff" : "transparent",
                      color: isDarkMode
                        ? "#333"
                        : muiTheme.palette.text.primary,
                      border: !isDarkMode ? "1px solid #333" : "none",
                      borderRadius: "8px",
                      py: 1.5,
                      px: 3,
                      fontSize: "0.875rem",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        backgroundColor: hoverBackground,
                        border: !isDarkMode
                          ? "1px solid #34A853"
                          : "1px solid #34A853",
                        color: isDarkMode
                          ? "#fff"
                          : muiTheme.palette.text.primary,
                        transform: "scale(1.05)",
                      },
                      "&:active": {
                        border: !isDarkMode
                          ? "1px solid #34A853"
                          : "1px solid #34A853",
                      },
                      "&:disabled": { border: "none", color: disabledColor },
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
                      backgroundColor: isDarkMode ? "#fff" : "transparent",
                      color: isDarkMode
                        ? "#333"
                        : muiTheme.palette.text.primary,
                      border: !isDarkMode ? "1px solid #333" : "none",
                      borderRadius: "8px",
                      py: 1.5,
                      px: 3,
                      fontSize: "0.875rem",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        backgroundColor: hoverBackground,
                        border: !isDarkMode
                          ? "1px solid #34A853"
                          : "1px solid #34A853",
                        color: isDarkMode
                          ? "#fff"
                          : muiTheme.palette.text.primary,
                        transform: "scale(1.05)",
                      },
                      "&:active": {
                        border: !isDarkMode
                          ? "1px solid #34A853"
                          : "1px solid #34A853",
                      },
                      "&:disabled": { border: "none", color: disabledColor },
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
                    backgroundColor: isDarkMode ? "#fff" : "transparent",
                    color: isDarkMode ? "#333" : muiTheme.palette.text.primary,
                    border: !isDarkMode ? "1px solid #333" : "none",
                    borderRadius: "8px",
                    p: 1.5,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: hoverBackground,
                      border: !isDarkMode
                        ? "1px solid #34A853"
                        : "1px solid #34A853",
                      transform: "scale(1.05)",
                    },
                    "&:active": {
                      border: !isDarkMode
                        ? "1px solid #34A853"
                        : "1px solid #34A853",
                    },
                    "&:disabled": { border: "none", color: disabledColor },
                  }}
                  aria-label="View activity log"
                >
                  <HistoryIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
                flex: "1 1 auto",
              }}
            >
              <TextField
                label="Search by Partner or Project Name"
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
                  flex: "1 1 300px",
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    background: muiTheme.palette.background.listItem,
                    "& fieldset": { borderColor: muiTheme.palette.border.main },
                    "&:hover fieldset": { borderColor: greenLightColor },
                    "&.Mui-focused fieldset": { borderColor: greenLightColor },
                  },
                }}
                aria-label="Search partners"
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
                  aria-label="Filter by status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Hot">Hot</MenuItem>
                  <MenuItem value="Warm">Warm</MenuItem>
                  <MenuItem value="Cold">Cold</MenuItem>
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
                  aria-label="Filter by category"
                >
                  <MenuItem value="">All</MenuItem>
                  {uniqueCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            {selectedPartners.length > 0 && (
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Typography
                  variant="subtitle1"
                  sx={{ color: muiTheme.palette.text.primary, mr: 2 }}
                >
                  {selectedPartners.length} partner(s) selected
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => setBulkDeleteModalOpen(true)}
                  sx={{
                    backgroundColor: "#D32F2F",
                    color: "#fff",
                    borderRadius: "8px",
                    py: 1,
                    px: 2,
                    fontSize: "0.875rem",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: "#B71C1C",
                      transform: "scale(1.05)",
                    },
                    "&:active": { backgroundColor: "#A00000" },
                    "&:disabled": {
                      backgroundColor: disabledColor,
                      color: "#fff",
                    },
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
                    color: isDarkMode ? "#000" : "#fff",
                    borderRadius: "8px",
                    py: 1,
                    px: 2,
                    fontSize: "0.875rem",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: muiTheme.palette.primary.dark,
                      transform: "scale(1.05)",
                    },
                    "&:active": {
                      backgroundColor: muiTheme.palette.primary.light,
                    },
                    "&:disabled": {
                      backgroundColor: disabledColor,
                      color: "#fff",
                    },
                  }}
                  aria-label="Edit selected partners"
                >
                  Edit Selected
                </Button>
              </Box>
            )}
          </Box>
          <TableContainer
            component={Paper}
            sx={{ background: muiTheme.palette.background.listItem }}
          >
            <Table role="grid" aria-label="Partners table">
              <TableHead>
                <TableRow role="row">
                  <TableCell padding="checkbox" role="columnheader">
                    <Checkbox
                      checked={
                        paginatedPartners.length > 0 &&
                        selectedPartners.length === paginatedPartners.length
                      }
                      onChange={(e) => {
                        if (e.target.checked)
                          setSelectedPartners(paginatedPartners);
                        else setSelectedPartners([]);
                      }}
                      sx={{
                        color: !isDarkMode ? "#333" : "#fff",
                        "&.Mui-checked": { color: hoverGreen },
                      }}
                      aria-label="Select all partners on this page"
                    />
                  </TableCell>
                  <TableCell role="columnheader">No.</TableCell>
                  <TableCell role="columnheader">
                    <TableSortLabel
                      active={orderBy === "name"}
                      direction={orderBy === "name" ? order : "asc"}
                      onClick={() => handleRequestSort("name")}
                      aria-sort={orderBy === "name" ? order : "none"}
                    >
                      Partner Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell role="columnheader">
                    <TableSortLabel
                      active={orderBy === "projectName"}
                      direction={orderBy === "projectName" ? order : "asc"}
                      onClick={() => handleRequestSort("projectName")}
                      aria-sort={orderBy === "projectName" ? order : "none"}
                    >
                      Project Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell role="columnheader">
                    <TableSortLabel
                      active={orderBy === "status"}
                      direction={orderBy === "status" ? order : "asc"}
                      onClick={() => handleRequestSort("status")}
                      aria-sort={orderBy === "status" ? order : "none"}
                    >
                      Status
                    </TableSortLabel>
                  </TableCell>
                  <TableCell role="columnheader">
                    <TableSortLabel
                      active={orderBy === "startDate"}
                      direction={orderBy === "startDate" ? order : "asc"}
                      onClick={() => handleRequestSort("startDate")}
                      aria-sort={orderBy === "startDate" ? order : "none"}
                    >
                      Duration
                    </TableSortLabel>
                  </TableCell>
                  <TableCell role="columnheader">
                    <TableSortLabel
                      active={orderBy === "category"}
                      direction={orderBy === "category" ? order : "asc"}
                      onClick={() => handleRequestSort("category")}
                      aria-sort={orderBy === "category" ? order : "none"}
                    >
                      Category
                    </TableSortLabel>
                  </TableCell>
                  <TableCell role="columnheader">
                    <TableSortLabel
                      active={orderBy === "services"}
                      direction={orderBy === "services" ? order : "asc"}
                      onClick={() => handleRequestSort("services")}
                      aria-sort={orderBy === "services" ? order : "none"}
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
                    selected={selectedPartners.some(
                      (p) => p._id === partner._id
                    )}
                    aria-describedby={`actions-${partner._id}`}
                  >
                    <TableCell padding="checkbox" role="gridcell">
                      <Checkbox
                        checked={selectedPartners.some(
                          (p) => p._id === partner._id
                        )}
                        onChange={(e) => {
                          if (e.target.checked)
                            setSelectedPartners([...selectedPartners, partner]);
                          else
                            setSelectedPartners(
                              selectedPartners.filter(
                                (p) => p._id !== partner._id
                              )
                            );
                        }}
                        sx={{
                          color: !isDarkMode ? "#333" : "#fff",
                          "&.Mui-checked": { color: hoverGreen },
                        }}
                        aria-label={`Select ${partner.name}`}
                      />
                    </TableCell>
                    <TableCell role="gridcell">
                      {page * rowsPerPage + index + 1}
                    </TableCell>
                    <TableCell role="gridcell">{partner.name}</TableCell>
                    <TableCell role="gridcell">{partner.projectName}</TableCell>
                    <TableCell role="gridcell">
                      <FormControl sx={{ minWidth: 100 }}>
                        <Select
                          value={partner.status}
                          onChange={(e) =>
                            handleChangeStatus(partner._id, e.target.value)
                          }
                          sx={{ height: "32px" }}
                          aria-label={`Change status for ${partner.name}`}
                        >
                          <MenuItem value="Hot">
                            <Chip
                              label="Hot"
                              color="error"
                              size="small"
                              sx={{ color: isDarkMode ? "white" : undefined }}
                            />
                          </MenuItem>
                          <MenuItem value="Warm">
                            <Chip
                              label="Warm"
                              color="warning"
                              size="small"
                              sx={{ color: isDarkMode ? "white" : undefined }}
                            />
                          </MenuItem>
                          <MenuItem value="Cold">
                            <Chip
                              label="Cold"
                              color="info"
                              size="small"
                              sx={{ color: isDarkMode ? "white" : undefined }}
                            />
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell role="gridcell">
                      {new Date(partner.startDate).toLocaleDateString()} -{" "}
                      {new Date(partner.endDate).toLocaleDateString()}
                      <Chip
                        label={
                          partner.durationStatus === "Custom"
                            ? partner.durationStatusCustom
                            : partner.durationStatus
                        }
                        color={getDurationStatusColor(partner.durationStatus)}
                        size="small"
                        sx={{ ml: 1, color: isDarkMode ? "white" : undefined }}
                      />
                    </TableCell>
                    <TableCell role="gridcell">
                      {partner.category || "N/A"}
                    </TableCell>
                    <TableCell role="gridcell">
                      {partner.services.length}
                    </TableCell>
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
                        sx={{ color: "red" }}
                        aria-label={`Delete ${partner.name}`}
                      >
                        <DeleteIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleOpenCommentModal(partner)}
                        sx={{ color: muiTheme.palette.primary.main }}
                        aria-label={`Add comment for ${partner.name}`}
                      >
                        <CommentIcon />
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
      <CommentModal
        open={commentModalOpen}
        onClose={() => {
          setCommentModalOpen(false);
          setNewComment("");
          setCommentPartner(null);
        }}
        partnerName={commentPartner?.name}
        newComment={newComment}
        setNewComment={setNewComment}
        handleAddComment={handleAddComment}
        muiTheme={muiTheme}
        brandingBlue={brandingBlue}
        isDarkMode={isDarkMode}
      />
      <ImportProgressModal
        open={isImporting}
        importProgress={importProgress}
        currentImportItem={currentImportItem}
        muiTheme={muiTheme}
      />
      <ImportPreviewModal
        open={importPreviewOpen}
        onClose={resetImportState}
        parsedData={parsedData}
        handleConfirmImport={handleConfirmImport}
        muiTheme={muiTheme}
        isDarkMode={isDarkMode}
        brandingBlue={brandingBlue}
      />
      <ImportSummaryModal
        open={!!importSummary}
        onClose={() => setImportSummary(null)}
        importSummary={importSummary}
        muiTheme={muiTheme}
      />
      <ExportFieldsModal
        open={exportFieldsModalOpen}
        onClose={() => setExportFieldsModalOpen(false)}
        exportFields={exportFields}
        toggleExportField={toggleExportField}
        handleNext={() => {
          setExportFieldsModalOpen(false);
          setExportConfirmOpen(true);
        }}
        availableFields={availableFields}
        muiTheme={muiTheme}
        brandingBlue={brandingBlue}
        isDarkMode={isDarkMode}
      />
      <ExportConfirmModal
        open={exportConfirmOpen}
        onClose={() => setExportConfirmOpen(false)}
        handleExportCSV={handleExportCSV}
        isExportSelected={isExportSelected}
        partnersCount={
          isExportSelected ? selectedPartners.length : filteredPartners.length
        }
        muiTheme={muiTheme}
        brandingBlue={brandingBlue}
        isDarkMode={isDarkMode}
      />
      <CreatePartnerModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        newPartner={newPartner}
        setNewPartner={setNewPartner}
        handleCreatePartner={handleCreatePartner}
        uniqueCategories={uniqueCategories}
        muiTheme={muiTheme}
        brandingBlue={brandingBlue}
        isDarkMode={isDarkMode}
      />
      <BulkEditModal
        open={bulkEditModalOpen}
        onClose={() => setBulkEditModalOpen(false)}
        bulkEditStatus={bulkEditStatus}
        setBulkEditStatus={setBulkEditStatus}
        handleBulkEdit={handleBulkEdit}
        muiTheme={muiTheme}
        brandingBlue={brandingBlue}
        isDarkMode={isDarkMode}
      />
      <DeletePartnerModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        partnerName={partnerToDelete?.name}
        handleDeletePartner={handleDeletePartner}
        muiTheme={muiTheme}
      />
      <BulkDeleteModal
        open={bulkDeleteModalOpen}
        onClose={() => setBulkDeleteModalOpen(false)}
        selectedPartnersCount={selectedPartners.length}
        handleBulkDelete={handleBulkDelete}
        muiTheme={muiTheme}
        brandingBlue={brandingBlue}
        isDarkMode={isDarkMode}
      />
      <PartnerDetailsModal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        partner={selectedPartner}
      />
      <ActivityLogsModal
        open={activityLogsModalOpen}
        onClose={() => setActivityLogsModalOpen(false)}
        logs={activityLogs}
      />
      <CustomSnackbar
        open={!!success}
        message={success}
        severity="success"
        onClose={() => setSuccess("")}
      />
      <CustomSnackbar
        open={!!error}
        message={error}
        severity="error"
        onClose={() => setError("")}
      />
    </Box>
  );
};

export default PartnerManagement;
