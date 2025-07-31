import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Breadcrumbs,
  CircularProgress,
  Avatar,
  Button,
  Toolbar,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Home,
  ChevronRight,
  Edit,
  Close,
  Clear,
  CheckCircle,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import usePermission from "../hooks/usePermission";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import CustomSnackbar from "../components/CustomSnackbar";

// Animations
const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" },
};

const UserDetails = () => {
  const { muiTheme } = useTheme();
  const { userId } = useParams();
  const navigate = useNavigate();
  const { authState } = useAuth();
  const hrPermission = usePermission("hrManagement");
  const hasHRManagementPermission =
    authState.userRole === "superadmin" || hrPermission;
  const isOwnProfile = authState.user?.id === userId;
  const canUploadPhoto = isOwnProfile || authState.userRole === "superadmin";
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
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
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [errors, setErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [isSendingResetLink, setIsSendingResetLink] = useState(false);
  const [showResetLinkSuccess, setShowResetLinkSuccess] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "success",
    message: "",
  });
  const brandingBlue = "#4285F4";
  const greenLightColor = "#34A853";
  const disabledColor = "#666";

  // Fetch user data
  useEffect(() => {
    if (!authState.isAuthenticated || authState.loading) {
      console.log("UserDetails: Skipping fetch due to auth state", {
        isAuthenticated: authState.isAuthenticated,
        loading: authState.loading,
        user: authState.user,
      });
      return;
    }
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

    const fetchUser = async () => {
      setLoading(true);
      try {
        console.log("UserDetails: Fetching user with ID:", userId);
        const response = await axios.get(`/auth/user/${userId}`, {
          withCredentials: true,
        });
        console.log("UserDetails: User fetched:", response.data);
        setUser(response.data);
        setFormData({
          firstName: response.data.firstName || "",
          lastName: response.data.lastName || "",
          email: response.data.email || "",
          contactNumber: response.data.contactNumber || "",
          employeeId: response.data.employeeId || "",
          department: response.data.department || "Other",
          position: response.data.position || "",
          status: response.data.status || "Active",
          birthdate: response.data.birthdate
            ? response.data.birthdate.split("T")[0]
            : "",
          gender: response.data.gender || "",
          civilStatus: response.data.civilStatus || "",
          governmentIds: response.data.governmentIds || {
            sss: "",
            philHealth: "",
            tin: "",
            pagIbig: "",
          },
          hireDate: response.data.hireDate
            ? new Date(response.data.hireDate).toISOString().split("T")[0]
            : "",
          role: response.data.role || "employee",
          profilePicture: null,
        });
        setProfilePicturePreview(
          response.data.profilePicture || "/images/default-avatar.png"
        );
      } catch (error) {
        console.error("UserDetails: Error fetching user:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          userId,
        });
        setSnackbar({
          open: true,
          severity: "error",
          message:
            error.response?.data?.message ||
            "Failed to fetch user details. Please check if the user exists.",
        });
        navigate("/hr-management");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [authState, hasHRManagementPermission, navigate, userId]);

  // Password strength calculation
  const calculatePasswordStrength = (password) => {
    if (!password) return null;
    if (password.length < 8) return { label: "Weak", color: "error.main" };
    if (
      password.length >= 12 &&
      /[a-zA-Z]/.test(password) &&
      /\d/.test(password) &&
      /[!@#$%^&*]/.test(password)
    ) {
      return { label: "Strong", color: "success.main" };
    }
    if (
      password.length >= 8 &&
      /[a-zA-Z]/.test(password) &&
      /\d/.test(password)
    ) {
      return { label: "Medium", color: "warning.main" };
    }
    return { label: "Weak", color: "error.main" };
  };

  // Update password strength on newPassword change
  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(passwordData.newPassword));
  }, [passwordData.newPassword]);

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Handle password field changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setPasswordErrors((prev) => ({ ...prev, ...validateField(name, value) }));
  };

  // Real-time validation for profile form
  const validateField = useCallback(
    (name, value) => {
      const newErrors = {};
      if (name === "firstName" && !value.trim()) {
        newErrors.firstName = "First name is required";
      }
      if (name === "lastName" && !value.trim()) {
        newErrors.lastName = "Last name is required";
      }
      if (name === "email") {
        if (!value) {
          newErrors.email = "Email is required";
        } else {
          const domain = value.split("@")[1];
          const allowedDomains = ["bgecorp.com", "beglobalecommercecorp.com"];
          if (!allowedDomains.includes(domain)) {
            newErrors.email =
              "Email must be from bgecorp.com or beglobalecommercecorp.com";
          }
        }
      }
      if (name === "employeeId" && !value.trim()) {
        newErrors.employeeId = "Employee ID is required";
      }
      if (
        name === "governmentIds.sss" &&
        value &&
        !/^\d{2}-\d{7}-\d$/.test(value)
      ) {
        newErrors.sss = "SSS number must be in format XX-XXXXXXX-X";
      }
      if (
        name === "governmentIds.philHealth" &&
        value &&
        !/^\d{2}-\d{9}-\d$/.test(value)
      ) {
        newErrors.philHealth =
          "PhilHealth number must be in format XX-XXXXXXXXX-X";
      }
      if (
        name === "governmentIds.tin" &&
        value &&
        !/^\d{3}-\d{3}-\d{3}-\d{3}$/.test(value)
      ) {
        newErrors.tin = "TIN must be in format XXX-XXX-XXX-XXX";
      }
      if (
        name === "governmentIds.pagIbig" &&
        value &&
        !/^\d{4}-\d{4}-\d{4}$/.test(value)
      ) {
        newErrors.pagIbig = "Pag-IBIG number must be in format XXXX-XXXX-XXXX";
      }
      if (name === "contactNumber" && value && !/^\+?\d{10,12}$/.test(value)) {
        newErrors.contactNumber = "Contact number must be 10-12 digits";
      }
      if (name === "birthdate" && value && new Date(value) > new Date()) {
        newErrors.birthdate = "Birthdate cannot be in the future";
      }
      if (name === "hireDate" && value && new Date(value) > new Date()) {
        newErrors.hireDate = "Hire date cannot be in the future";
      }
      if (name === "newPassword" && value && value.length < 8) {
        newErrors.newPassword =
          "New password must be at least 8 characters long";
      }
      if (name === "confirmNewPassword" && value !== passwordData.newPassword) {
        newErrors.confirmNewPassword = "Passwords do not match";
      }
      return newErrors;
    },
    [passwordData.newPassword]
  );

  // Validate password form
  const validatePasswordForm = () => {
    const newErrors = {};
    if (!passwordData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = "New password must be at least 8 characters long";
    }
    if (!passwordData.confirmNewPassword) {
      newErrors.confirmNewPassword = "Confirm password is required";
    } else if (passwordData.confirmNewPassword !== passwordData.newPassword) {
      newErrors.confirmNewPassword = "Passwords do not match";
    }
    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate entire profile form
  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      if (key === "governmentIds") {
        Object.keys(formData.governmentIds).forEach((subKey) => {
          const fieldErrors = validateField(
            `governmentIds.${subKey}`,
            formData.governmentIds[subKey]
          );
          Object.assign(newErrors, fieldErrors);
        });
      } else if (key !== "profilePicture") {
        const fieldErrors = validateField(key, formData[key]);
        Object.assign(newErrors, fieldErrors);
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle profile form changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profilePicture") {
      const file = files[0];
      if (file) {
        const allowedTypes = ["image/jpeg", "image/png"];
        const maxSize = 5 * 1024 * 1024; // 5 MB
        if (!allowedTypes.includes(file.type)) {
          setErrors((prev) => ({
            ...prev,
            profilePicture: "Only JPEG and PNG files are allowed.",
          }));
          return;
        }
        if (file.size > maxSize) {
          setErrors((prev) => ({
            ...prev,
            profilePicture: "File size exceeds 5 MB limit.",
          }));
          return;
        }
        setFormData((prev) => ({ ...prev, profilePicture: file }));
        setProfilePicturePreview(URL.createObjectURL(file));
        setErrors((prev) => ({ ...prev, profilePicture: null }));
      }
    } else if (name.startsWith("governmentIds.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        governmentIds: { ...prev.governmentIds, [field]: value },
      }));
      setErrors((prev) => ({ ...prev, ...validateField(name, value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({ ...prev, ...validateField(name, value) }));
    }
  };

  // Reset profile picture
  const handleResetPhoto = async () => {
    if (authState.userRole !== "superadmin") {
      setSnackbar({
        open: true,
        severity: "error",
        message: "Access denied: Only superadmins can remove profile pictures.",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("profilePicture", "");
      formDataToSend.append("firstName", formData.firstName);
      formDataToSend.append("lastName", formData.lastName);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("contactNumber", formData.contactNumber || "");
      formDataToSend.append("employeeId", formData.employeeId);
      formDataToSend.append("department", formData.department);
      formDataToSend.append("position", formData.position || "");
      formDataToSend.append("status", formData.status);
      formDataToSend.append("birthdate", formData.birthdate || "");
      formDataToSend.append("gender", formData.gender || "");
      formDataToSend.append("civilStatus", formData.civilStatus || "");
      formDataToSend.append(
        "governmentIds",
        JSON.stringify(formData.governmentIds)
      );
      formDataToSend.append("hireDate", formData.hireDate || "");
      formDataToSend.append("role", formData.role);

      await axios.put(`/auth/edit-member/${userId}`, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      setFormData((prev) => ({ ...prev, profilePicture: null }));
      setProfilePicturePreview("/images/default-avatar.png");
      setSnackbar({
        open: true,
        severity: "success",
        message: "Profile picture removed successfully",
      });
    } catch (error) {
      console.error("UserDetails: Error removing profile picture:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      setSnackbar({
        open: true,
        severity: "error",
        message:
          error.response?.data?.message || "Failed to remove profile picture.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle profile form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setConfirmDialogOpen(true);
  };

  // Confirm profile submission
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
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
        if (key === "profilePicture" && value && canUploadPhoto) {
          formDataToSend.append(key, value);
        } else if (key === "profilePicture") {
          formDataToSend.append(key, "");
        } else {
          formDataToSend.append(key, value);
        }
      });

      console.log(
        "UserDetails: Submitting form data:",
        Object.fromEntries(formDataToSend)
      );

      await axios.put(`/auth/edit-member/${userId}`, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      setSnackbar({
        open: true,
        severity: "success",
        message: "Profile updated successfully",
      });

      // Refresh user data
      const response = await axios.get(`/auth/user/${userId}`, {
        withCredentials: true,
      });
      setUser(response.data);
      setFormData({
        firstName: response.data.firstName || "",
        lastName: response.data.lastName || "",
        email: response.data.email || "",
        contactNumber: response.data.contactNumber || "",
        employeeId: response.data.employeeId || "",
        department: response.data.department || "Other",
        position: response.data.position || "",
        status: response.data.status || "Active",
        birthdate: response.data.birthdate
          ? response.data.birthdate.split("T")[0]
          : "",
        gender: response.data.gender || "",
        civilStatus: response.data.civilStatus || "",
        governmentIds: response.data.governmentIds || {
          sss: "",
          philHealth: "",
          tin: "",
          pagIbig: "",
        },
        hireDate: response.data.hireDate
          ? new Date(response.data.hireDate).toISOString().split("T")[0]
          : "",
        role: response.data.role || "employee",
        profilePicture: null,
      });
      setProfilePicturePreview(
        response.data.profilePicture || "/images/default-avatar.png"
      );
      setIsEditing(false);
      setErrors({});
    } catch (error) {
      console.error("UserDetails: Error saving profile:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      const errorMessage =
        error.response?.data?.message || "Failed to save profile.";
      setErrors((prev) => ({ ...prev, form: errorMessage }));
      setSnackbar({
        open: true,
        severity: "error",
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
      setConfirmDialogOpen(false);
    }
  };

  // Handle password form submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;
    setIsSettingPassword(true);
    try {
      const response = await axios.post(
        "/auth/update-password",
        {
          setNewPassword: passwordData.newPassword,
        },
        { withCredentials: true }
      );
      toast.success(response.data.message || "Password set successfully");
      setPasswordData({ newPassword: "", confirmNewPassword: "" });
      setPasswordErrors({});
      setShowPasswordFields(false);
    } catch (error) {
      console.error("UserDetails: Error setting password:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      const errorMessage =
        error.response?.data?.message || "Failed to set password.";
      setPasswordErrors((prev) => ({ ...prev, form: errorMessage }));
      toast.error(errorMessage);
    } finally {
      setIsSettingPassword(false);
    }
  };

  // Handle send reset link
  const handleSendResetLink = async () => {
    if (!hasHRManagementPermission) {
      setSnackbar({
        open: true,
        severity: "error",
        message: "Access denied: Insufficient permissions to send reset link.",
      });
      return;
    }
    setIsSendingResetLink(true);
    try {
      const response = await axios.post(
        "/auth/send-reset-link",
        { email: formData.email },
        { withCredentials: true }
      );
      setIsSendingResetLink(false);
      setShowResetLinkSuccess(true);
      setSnackbar({
        open: true,
        severity: "success",
        message:
          response.data.message || "Password reset link sent to user’s email",
      });
      setTimeout(() => setShowResetLinkSuccess(false), 2000);
    } catch (error) {
      console.error("UserDetails: Error sending reset link:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      setIsSendingResetLink(false);
      setSnackbar({
        open: true,
        severity: "error",
        message: error.response?.data?.message || "Failed to send reset link.",
      });
    }
  };

  // Handle set password button click
  const handleSetPasswordClick = () => {
    setShowPasswordFields(true);
  };

  // Handle cancel password
  const handleCancelPassword = () => {
    setShowPasswordFields(false);
    setPasswordData({ newPassword: "", confirmNewPassword: "" });
    setPasswordErrors({});
  };

  // Cancel editing
  const handleCancel = () => {
    setIsEditing(false);
    setShowPasswordFields(false);
    setErrors({});
    setPasswordData({ newPassword: "", confirmNewPassword: "" });
    setPasswordErrors({});
    setProfilePicturePreview(
      user?.profilePicture || "/images/default-avatar.png"
    );
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      contactNumber: user?.contactNumber || "",
      employeeId: user?.employeeId || "",
      department: user?.department || "Other",
      position: user?.position || "",
      status: user?.status || "Active",
      birthdate: user?.birthdate ? user.birthdate.split("T")[0] : "",
      gender: user?.gender || "",
      civilStatus: user?.civilStatus || "",
      governmentIds: user?.governmentIds || {
        sss: "",
        philHealth: "",
        tin: "",
        pagIbig: "",
      },
      hireDate: user?.hireDate
        ? new Date(user.hireDate).toISOString().split("T")[0]
        : "",
      role: user?.role || "employee",
      profilePicture: null,
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress aria-label="Loading user details" />
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: muiTheme.custom.gradients.backgroundDefault,
        p: { xs: 3, sm: 4, md: 5 },
        position: "relative",
        overflow: "hidden",
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
          background: muiTheme.custom.isDarkMode
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
        <motion.div {...fadeIn}>
          <Breadcrumbs
            separator={<ChevronRight fontSize="small" />}
            aria-label="breadcrumb"
            sx={{ mb: 4, fontFamily: "'Poppins', sans-serif" }}
          >
            <Link
              to="/dashboard"
              style={{
                textDecoration: "none",
                color: muiTheme.palette.text.secondary,
                display: "flex",
                alignItems: "center",
                fontSize: "1rem",
                fontWeight: 400,
              }}
            >
              <Home sx={{ mr: 0.5 }} fontSize="small" />
              Home
            </Link>
            <Link
              to="/hr-management"
              style={{
                textDecoration: "none",
                color: muiTheme.palette.text.secondary,
                fontSize: "1rem",
                fontWeight: 400,
              }}
            >
              HR Management
            </Link>
            <Typography
              color="text.primary"
              sx={{ fontSize: "1rem", fontWeight: 500 }}
            >
              {user.firstName} {user.lastName}
            </Typography>
          </Breadcrumbs>
          <Grid container spacing={4}>
            {/* Left Column: Account Management */}
            <Grid item xs={12} sm={6} md={4}>
              <motion.div {...fadeIn}>
                <Paper
                  sx={{
                    background: muiTheme.palette.background.paper,
                    backdropFilter: "blur(10px)",
                    borderRadius: "16px",
                    border: muiTheme.custom.isDarkMode
                      ? "1px solid rgba(255, 255, 255, 0.2)"
                      : "1px solid rgba(0, 0, 0, 0.1)",
                    boxShadow: muiTheme.custom.isDarkMode
                      ? "0 8px 24px rgba(0, 0, 0, 0.4)"
                      : "0 8px 24px rgba(0, 0, 0, 0.15)",
                    p: { xs: 3, sm: 4 },
                    textAlign: "center",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 500,
                      color: muiTheme.palette.text.primary,
                      mb: 3,
                    }}
                  >
                    Account Management
                  </Typography>
                  <Box sx={{ position: "relative", mb: 2 }}>
                    <Avatar
                      src={profilePicturePreview}
                      alt={`${user.firstName} ${user.lastName}`}
                      sx={{
                        width: 160,
                        height: 160,
                        mx: "auto",
                        border: `3px solid ${muiTheme.palette.primary.main}`,
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                        transition: "transform 0.3s ease",
                        "&:hover": { transform: "scale(1.05)" },
                      }}
                    />
                    {isEditing &&
                      authState.userRole === "superadmin" &&
                      profilePicturePreview !==
                        "/images/default-avatar.png" && (
                        <Tooltip title="Remove profile picture">
                          <IconButton
                            onClick={handleResetPhoto}
                            disabled={isSubmitting}
                            sx={{
                              position: "absolute",
                              top: 0,
                              right: 0,
                              backgroundColor:
                                muiTheme.palette.background.paper,
                              borderRadius: "50%",
                              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                              "&:hover": {
                                backgroundColor: muiTheme.palette.error.light,
                              },
                            }}
                            aria-label="Remove profile picture"
                          >
                            <Clear
                              sx={{ color: muiTheme.palette.error.main }}
                            />
                          </IconButton>
                        </Tooltip>
                      )}
                  </Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 500,
                      color: muiTheme.palette.text.primary,
                      mb: 3,
                    }}
                  >
                    {user.firstName} {user.lastName}
                  </Typography>
                  {isEditing && canUploadPhoto && (
                    <TextField
                      type="file"
                      accept="image/jpeg,image/png"
                      name="profilePicture"
                      onChange={handleChange}
                      inputProps={{ "aria-label": "Upload profile picture" }}
                      error={!!errors.profilePicture}
                      helperText={errors.profilePicture}
                      sx={{ mb: 3 }}
                    />
                  )}
                  <Divider
                    sx={{ mb: 3, borderColor: muiTheme.palette.divider }}
                  />
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 500,
                      color: muiTheme.palette.text.primary,
                      mb: 2,
                      fontSize: "1rem",
                    }}
                  >
                    Set Password
                  </Typography>
                  <form onSubmit={handlePasswordSubmit}>
                    {passwordErrors.form && (
                      <Typography
                        color="error"
                        variant="body1"
                        sx={{
                          mb: 2,
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: "1rem",
                        }}
                      >
                        {passwordErrors.form}
                      </Typography>
                    )}
                    <AnimatePresence>
                      {showPasswordFields && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                          <TextField
                            label="New Password"
                            name="newPassword"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            fullWidth
                            error={!!passwordErrors.newPassword}
                            helperText={passwordErrors.newPassword}
                            aria-label="New password"
                            sx={{
                              mb: 2,
                              "& .MuiOutlinedInput-root": {
                                borderRadius: "8px",
                                "&:hover fieldset": {
                                  borderColor: greenLightColor,
                                },
                                "&.Mui-focused fieldset": {
                                  borderColor: greenLightColor,
                                },
                              },
                              "& .MuiInputLabel-root": {
                                fontFamily: "'Poppins', sans-serif",
                              },
                            }}
                          />
                          {passwordStrength && (
                            <Typography
                              variant="caption"
                              sx={{
                                fontFamily: "'Poppins', sans-serif",
                                color: muiTheme.palette[passwordStrength.color],
                                mb: 2,
                                display: "block",
                              }}
                            >
                              Password Strength: {passwordStrength.label}
                            </Typography>
                          )}
                          <TextField
                            label="Confirm New Password"
                            name="confirmNewPassword"
                            type="password"
                            value={passwordData.confirmNewPassword}
                            onChange={handlePasswordChange}
                            fullWidth
                            error={!!passwordErrors.confirmNewPassword}
                            helperText={passwordErrors.confirmNewPassword}
                            aria-label="Confirm new password"
                            sx={{
                              mb: 2,
                              "& .MuiOutlinedInput-root": {
                                borderRadius: "8px",
                                "&:hover fieldset": {
                                  borderColor: greenLightColor,
                                },
                                "&.Mui-focused fieldset": {
                                  borderColor: greenLightColor,
                                },
                              },
                              "& .MuiInputLabel-root": {
                                fontFamily: "'Poppins', sans-serif",
                              },
                            }}
                          />
                          <Box
                            sx={{
                              display: "flex",
                              gap: 2,
                              justifyContent: "center",
                            }}
                          >
                            <Tooltip title="Cancel password changes">
                              <Button
                                variant="outlined"
                                onClick={handleCancelPassword}
                                disabled={isSettingPassword}
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.primary,
                                  borderColor: muiTheme.palette.text.primary,
                                  borderRadius: "12px",
                                  py: 1.5,
                                  px: 3,
                                  fontSize: "1rem",
                                  fontWeight: 500,
                                  textTransform: "none",
                                  transition: "all 0.3s ease",
                                  "&:hover": {
                                    backgroundColor: muiTheme.custom.isDarkMode
                                      ? "rgba(255, 255, 255, 0.15)"
                                      : "rgba(52, 168, 83, 0.1)",
                                    transform: "translateY(-2px)",
                                  },
                                  "&:disabled": {
                                    borderColor: disabledColor,
                                    color: disabledColor,
                                  },
                                }}
                                aria-label="Cancel password changes"
                              >
                                Cancel
                              </Button>
                            </Tooltip>
                            <Tooltip title="Save new password">
                              <Button
                                type="submit"
                                variant="contained"
                                disabled={isSettingPassword}
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  backgroundColor: brandingBlue,
                                  color: "#fff",
                                  borderRadius: "12px",
                                  py: 1.5,
                                  px: 3,
                                  fontSize: "1rem",
                                  fontWeight: 500,
                                  textTransform: "none",
                                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                                  transition: "all 0.3s ease",
                                  "&:hover": {
                                    backgroundColor: "#3367D6",
                                    transform: "translateY(-2px)",
                                    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.3)",
                                  },
                                  "&:disabled": {
                                    backgroundColor: disabledColor,
                                    color: "#fff",
                                    boxShadow: "none",
                                  },
                                }}
                                aria-label="Save new password"
                              >
                                {isSettingPassword ? (
                                  <CircularProgress size={24} color="inherit" />
                                ) : (
                                  "Save New Password"
                                )}
                              </Button>
                            </Tooltip>
                          </Box>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {!showPasswordFields && (
                      <Tooltip title="Set a new password for the user">
                        <Button
                          variant="contained"
                          onClick={handleSetPasswordClick}
                          disabled={isSettingPassword}
                          sx={{
                            fontFamily: "'Poppins', sans-serif",
                            backgroundColor: brandingBlue,
                            color: "#fff",
                            borderRadius: "12px",
                            py: 1.5,
                            px: 3,
                            fontSize: "1rem",
                            fontWeight: 500,
                            textTransform: "none",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                            transition: "all 0.3s ease",
                            "&:hover": {
                              backgroundColor: "#3367D6",
                              transform: "translateY(-2px)",
                              boxShadow: "0 6px 16px rgba(0, 0, 0, 0.3)",
                            },
                            "&:disabled": {
                              backgroundColor: disabledColor,
                              color: "#fff",
                              boxShadow: "none",
                            },
                          }}
                          aria-label="Set password"
                        >
                          {isSettingPassword ? (
                            <CircularProgress size={24} color="inherit" />
                          ) : (
                            "Set Password"
                          )}
                        </Button>
                      </Tooltip>
                    )}
                  </form>
                  {hasHRManagementPermission && (
                    <Tooltip title="Send a password reset link to the user's email">
                      <Button
                        variant="outlined"
                        onClick={handleSendResetLink}
                        disabled={isSendingResetLink || showResetLinkSuccess}
                        sx={{
                          fontFamily: "'Poppins', sans-serif",
                          color: muiTheme.palette.text.primary,
                          borderColor: muiTheme.palette.text.primary,
                          borderRadius: "12px",
                          py: 1.5,
                          px: 3,
                          mt: 2,
                          fontSize: "1rem",
                          fontWeight: 500,
                          textTransform: "none",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            backgroundColor: muiTheme.custom.isDarkMode
                              ? "rgba(255, 255, 255, 0.15)"
                              : "rgba(52, 168, 83, 0.1)",
                            transform: "translateY(-2px)",
                          },
                          "&:disabled": {
                            borderColor: disabledColor,
                            color: disabledColor,
                          },
                        }}
                        aria-label="Send password reset link"
                      >
                        {isSendingResetLink ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : showResetLinkSuccess ? (
                          <CheckCircle sx={{ color: greenLightColor }} />
                        ) : (
                          "Send Reset Link"
                        )}
                      </Button>
                    </Tooltip>
                  )}
                </Paper>
              </motion.div>
            </Grid>
            {/* Right Column: Profile Information */}
            <Grid item xs={12} sm={6} md={8}>
              <motion.div {...fadeIn}>
                <Paper
                  sx={{
                    background: muiTheme.palette.background.paper,
                    backdropFilter: "blur(10px)",
                    borderRadius: "16px",
                    border: muiTheme.custom.isDarkMode
                      ? "1px solid rgba(255, 255, 255, 0.2)"
                      : "1px solid rgba(0, 0, 0, 0.1)",
                    boxShadow: muiTheme.custom.isDarkMode
                      ? "0 8px 24px rgba(0, 0, 0, 0.4)"
                      : "0 8px 24px rgba(0, 0, 0, 0.15)",
                    p: { xs: 3, sm: 4 },
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
                        fontWeight: 600,
                      }}
                    >
                      Profile Information
                    </Typography>
                    {hasHRManagementPermission && (
                      <Button
                        variant="contained"
                        startIcon={isEditing ? <Close /> : <Edit />}
                        onClick={() => setIsEditing(!isEditing)}
                        sx={{
                          fontFamily: "'Poppins', sans-serif",
                          backgroundColor: brandingBlue,
                          color: "#fff",
                          borderRadius: "12px",
                          py: 1.5,
                          px: 3,
                          fontSize: "1rem",
                          fontWeight: 500,
                          textTransform: "none",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            backgroundColor: "#3367D6",
                            transform: "translateY(-2px)",
                            boxShadow: "0 6px 16px rgba(0, 0, 0, 0.3)",
                          },
                          "&:disabled": {
                            backgroundColor: disabledColor,
                            color: "#fff",
                            boxShadow: "none",
                          },
                        }}
                        aria-label={
                          isEditing ? "Cancel editing" : "Edit profile"
                        }
                      >
                        {isEditing ? "Cancel" : "Edit Profile"}
                      </Button>
                    )}
                  </Box>
                  <form onSubmit={handleSubmit}>
                    {errors.form && (
                      <Typography
                        color="error"
                        variant="body1"
                        sx={{
                          mb: 3,
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: "1rem",
                        }}
                      >
                        {errors.form}
                      </Typography>
                    )}
                    {/* Basic Information */}
                    <Box sx={{ mb: 4 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: "'Poppins', sans-serif",
                          fontWeight: 500,
                          color: muiTheme.palette.text.primary,
                          mb: 2,
                        }}
                      >
                        Basic Information
                      </Typography>
                      <Divider
                        sx={{ mb: 3, borderColor: muiTheme.palette.divider }}
                      />
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          {isEditing ? (
                            <TextField
                              label="First Name"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleChange}
                              fullWidth
                              required
                              error={!!errors.firstName}
                              helperText={errors.firstName}
                              InputProps={{ readOnly: !isEditing }}
                              aria-label="First name"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "8px",
                                  "&:hover fieldset": {
                                    borderColor: greenLightColor,
                                  },
                                  "&.Mui-focused fieldset": {
                                    borderColor: greenLightColor,
                                  },
                                },
                                "& .MuiInputLabel-root": {
                                  fontFamily: "'Poppins', sans-serif",
                                },
                              }}
                            />
                          ) : (
                            <>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.secondary,
                                  mb: 0.5,
                                }}
                              >
                                First Name
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.primary,
                                  fontSize: "1.1rem",
                                }}
                              >
                                {user.firstName}
                              </Typography>
                            </>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          {isEditing ? (
                            <TextField
                              label="Last Name"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleChange}
                              fullWidth
                              required
                              error={!!errors.lastName}
                              helperText={errors.lastName}
                              InputProps={{ readOnly: !isEditing }}
                              aria-label="Last name"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "8px",
                                  "&:hover fieldset": {
                                    borderColor: greenLightColor,
                                  },
                                  "&.Mui-focused fieldset": {
                                    borderColor: greenLightColor,
                                  },
                                },
                                "& .MuiInputLabel-root": {
                                  fontFamily: "'Poppins', sans-serif",
                                },
                              }}
                            />
                          ) : (
                            <>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.secondary,
                                  mb: 0.5,
                                }}
                              >
                                Last Name
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.primary,
                                  fontSize: "1.1rem",
                                }}
                              >
                                {user.lastName}
                              </Typography>
                            </>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          {isEditing ? (
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
                              InputProps={{ readOnly: !isEditing }}
                              aria-label="Birthdate"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "8px",
                                  "&:hover fieldset": {
                                    borderColor: greenLightColor,
                                  },
                                  "&.Mui-focused fieldset": {
                                    borderColor: greenLightColor,
                                  },
                                },
                                "& .MuiInputLabel-root": {
                                  fontFamily: "'Poppins', sans-serif",
                                },
                              }}
                            />
                          ) : (
                            <>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.secondary,
                                  mb: 0.5,
                                }}
                              >
                                Birthdate
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.primary,
                                  fontSize: "1.1rem",
                                }}
                              >
                                {user.birthdate
                                  ? new Date(
                                      user.birthdate
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </Typography>
                            </>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          {isEditing ? (
                            <FormControl fullWidth>
                              <InputLabel
                                sx={{ fontFamily: "'Poppins', sans-serif" }}
                              >
                                Gender
                              </InputLabel>
                              <Select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                label="Gender"
                                InputProps={{ readOnly: !isEditing }}
                                aria-label="Gender"
                                sx={{
                                  borderRadius: "8px",
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor:
                                      muiTheme.palette.border?.main ||
                                      muiTheme.palette.divider,
                                  },
                                  "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: greenLightColor,
                                  },
                                  "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                    { borderColor: greenLightColor },
                                }}
                              >
                                <MenuItem value="">Select</MenuItem>
                                <MenuItem value="Male">Male</MenuItem>
                                <MenuItem value="Female">Female</MenuItem>
                                <MenuItem value="Other">Other</MenuItem>
                              </Select>
                            </FormControl>
                          ) : (
                            <>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.secondary,
                                  mb: 0.5,
                                }}
                              >
                                Gender
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.primary,
                                  fontSize: "1.1rem",
                                }}
                              >
                                {user.gender || "N/A"}
                              </Typography>
                            </>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          {isEditing ? (
                            <FormControl fullWidth>
                              <InputLabel
                                sx={{ fontFamily: "'Poppins', sans-serif" }}
                              >
                                Civil Status
                              </InputLabel>
                              <Select
                                name="civilStatus"
                                value={formData.civilStatus}
                                onChange={handleChange}
                                label="Civil Status"
                                InputProps={{ readOnly: !isEditing }}
                                aria-label="Civil status"
                                sx={{
                                  borderRadius: "8px",
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor:
                                      muiTheme.palette.border?.main ||
                                      muiTheme.palette.divider,
                                  },
                                  "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: greenLightColor,
                                  },
                                  "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                    { borderColor: greenLightColor },
                                }}
                              >
                                <MenuItem value="">Select</MenuItem>
                                <MenuItem value="Single">Single</MenuItem>
                                <MenuItem value="Married">Married</MenuItem>
                                <MenuItem value="Divorced">Divorced</MenuItem>
                                <MenuItem value="Widowed">Widowed</MenuItem>
                              </Select>
                            </FormControl>
                          ) : (
                            <>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.secondary,
                                  mb: 0.5,
                                }}
                              >
                                Civil Status
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.primary,
                                  fontSize: "1.1rem",
                                }}
                              >
                                {user.civilStatus || "N/A"}
                              </Typography>
                            </>
                          )}
                        </Grid>
                        <Grid item xs={12}>
                          {isEditing ? (
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
                              InputProps={{ readOnly: !isEditing }}
                              placeholder="example@bgecorp.com"
                              aria-label="Email"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "8px",
                                  "&:hover fieldset": {
                                    borderColor: greenLightColor,
                                  },
                                  "&.Mui-focused fieldset": {
                                    borderColor: greenLightColor,
                                  },
                                },
                                "& .MuiInputLabel-root": {
                                  fontFamily: "'Poppins', sans-serif",
                                },
                              }}
                            />
                          ) : (
                            <>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.secondary,
                                  mb: 0.5,
                                }}
                              >
                                Email
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.primary,
                                  fontSize: "1.1rem",
                                }}
                              >
                                {user.email}
                              </Typography>
                            </>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          {isEditing ? (
                            <TextField
                              label="Contact Number"
                              name="contactNumber"
                              value={formData.contactNumber}
                              onChange={handleChange}
                              fullWidth
                              error={!!errors.contactNumber}
                              helperText={errors.contactNumber}
                              InputProps={{ readOnly: !isEditing }}
                              placeholder="+639123456789"
                              aria-label="Contact number"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "8px",
                                  "&:hover fieldset": {
                                    borderColor: greenLightColor,
                                  },
                                  "&.Mui-focused fieldset": {
                                    borderColor: greenLightColor,
                                  },
                                },
                                "& .MuiInputLabel-root": {
                                  fontFamily: "'Poppins', sans-serif",
                                },
                              }}
                            />
                          ) : (
                            <>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.secondary,
                                  mb: 0.5,
                                }}
                              >
                                Contact Number
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.primary,
                                  fontSize: "1.1rem",
                                }}
                              >
                                {user.contactNumber || "N/A"}
                              </Typography>
                            </>
                          )}
                        </Grid>
                      </Grid>
                    </Box>
                    {/* Employment Details */}
                    <Box sx={{ mb: 4 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: "'Poppins', sans-serif",
                          fontWeight: 500,
                          color: muiTheme.palette.text.primary,
                          mb: 2,
                        }}
                      >
                        Employment Details
                      </Typography>
                      <Divider
                        sx={{ mb: 3, borderColor: muiTheme.palette.divider }}
                      />
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          {isEditing ? (
                            <TextField
                              label="Employee ID"
                              name="employeeId"
                              value={formData.employeeId}
                              onChange={handleChange}
                              fullWidth
                              required
                              error={!!errors.employeeId}
                              helperText={errors.employeeId}
                              InputProps={{ readOnly: !isEditing }}
                              placeholder="EMP001"
                              aria-label="Employee ID"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "8px",
                                  "&:hover fieldset": {
                                    borderColor: greenLightColor,
                                  },
                                  "&.Mui-focused fieldset": {
                                    borderColor: greenLightColor,
                                  },
                                },
                                "& .MuiInputLabel-root": {
                                  fontFamily: "'Poppins', sans-serif",
                                },
                              }}
                            />
                          ) : (
                            <>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.secondary,
                                  mb: 0.5,
                                }}
                              >
                                Employee ID
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.primary,
                                  fontSize: "1.1rem",
                                }}
                              >
                                {user.employeeId}
                              </Typography>
                            </>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          {isEditing ? (
                            <FormControl fullWidth>
                              <InputLabel
                                sx={{ fontFamily: "'Poppins', sans-serif" }}
                              >
                                Department
                              </InputLabel>
                              <Select
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                label="Department"
                                InputProps={{ readOnly: !isEditing }}
                                aria-label="Department"
                                sx={{
                                  borderRadius: "8px",
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor:
                                      muiTheme.palette.border?.main ||
                                      muiTheme.palette.divider,
                                  },
                                  "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: greenLightColor,
                                  },
                                  "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                    { borderColor: greenLightColor },
                                }}
                              >
                                <MenuItem value="HR">HR</MenuItem>
                                <MenuItem value="Admin">Admin</MenuItem>
                                <MenuItem value="Audit">Audit</MenuItem>
                                <MenuItem value="Finance">Finance</MenuItem>
                                <MenuItem value="Digital Marketing">
                                  Digital Marketing
                                </MenuItem>
                                <MenuItem value="Culture">Culture</MenuItem>
                                <MenuItem value="Fulfillment">
                                  Fulfillment
                                </MenuItem>
                                <MenuItem value="Other">Other</MenuItem>
                              </Select>
                            </FormControl>
                          ) : (
                            <>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.secondary,
                                  mb: 0.5,
                                }}
                              >
                                Department
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.primary,
                                  fontSize: "1.1rem",
                                }}
                              >
                                {user.department}
                              </Typography>
                            </>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          {isEditing ? (
                            <TextField
                              label="Position"
                              name="position"
                              value={formData.position}
                              onChange={handleChange}
                              fullWidth
                              InputProps={{ readOnly: !isEditing }}
                              aria-label="Position"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "8px",
                                  "&:hover fieldset": {
                                    borderColor: greenLightColor,
                                  },
                                  "&.Mui-focused fieldset": {
                                    borderColor: greenLightColor,
                                  },
                                },
                                "& .MuiInputLabel-root": {
                                  fontFamily: "'Poppins', sans-serif",
                                },
                              }}
                            />
                          ) : (
                            <>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.secondary,
                                  mb: 0.5,
                                }}
                              >
                                Position
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.primary,
                                  fontSize: "1.1rem",
                                }}
                              >
                                {user.position || "N/A"}
                              </Typography>
                            </>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          {isEditing ? (
                            <FormControl fullWidth>
                              <InputLabel
                                sx={{ fontFamily: "'Poppins', sans-serif" }}
                              >
                                Role
                              </InputLabel>
                              <Select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                label="Role"
                                InputProps={{ readOnly: !isEditing }}
                                aria-label="Role"
                                sx={{
                                  borderRadius: "8px",
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor:
                                      muiTheme.palette.border?.main ||
                                      muiTheme.palette.divider,
                                  },
                                  "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: greenLightColor,
                                  },
                                  "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                    { borderColor: greenLightColor },
                                }}
                              >
                                <MenuItem value="superadmin">
                                  Superadmin
                                </MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                                <MenuItem value="hr">HR</MenuItem>
                                <MenuItem value="employee">Employee</MenuItem>
                              </Select>
                            </FormControl>
                          ) : (
                            <>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.secondary,
                                  mb: 0.5,
                                }}
                              >
                                Role
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.primary,
                                  fontSize: "1.1rem",
                                }}
                              >
                                {user.role}
                              </Typography>
                            </>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          {isEditing ? (
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
                              InputProps={{ readOnly: !isEditing }}
                              aria-label="Hire date"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "8px",
                                  "&:hover fieldset": {
                                    borderColor: greenLightColor,
                                  },
                                  "&.Mui-focused fieldset": {
                                    borderColor: greenLightColor,
                                  },
                                },
                                "& .MuiInputLabel-root": {
                                  fontFamily: "'Poppins', sans-serif",
                                },
                              }}
                            />
                          ) : (
                            <>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.secondary,
                                  mb: 0.5,
                                }}
                              >
                                Hire Date
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.primary,
                                  fontSize: "1.1rem",
                                }}
                              >
                                {user.hireDate
                                  ? new Date(user.hireDate).toLocaleDateString()
                                  : "N/A"}
                              </Typography>
                            </>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          {isEditing ? (
                            <FormControl fullWidth>
                              <InputLabel
                                sx={{ fontFamily: "'Poppins', sans-serif" }}
                              >
                                Status
                              </InputLabel>
                              <Select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                label="Status"
                                InputProps={{ readOnly: !isEditing }}
                                aria-label="Status"
                                sx={{
                                  borderRadius: "8px",
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor:
                                      muiTheme.palette.border?.main ||
                                      muiTheme.palette.divider,
                                  },
                                  "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: greenLightColor,
                                  },
                                  "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                    { borderColor: greenLightColor },
                                }}
                              >
                                <MenuItem value="Active">Active</MenuItem>
                                <MenuItem value="Resigned">Resigned</MenuItem>
                              </Select>
                            </FormControl>
                          ) : (
                            <>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.secondary,
                                  mb: 0.5,
                                }}
                              >
                                Status
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.primary,
                                  fontSize: "1.1rem",
                                }}
                              >
                                {user.status}
                              </Typography>
                            </>
                          )}
                        </Grid>
                      </Grid>
                    </Box>
                    {/* Government IDs */}
                    <Box sx={{ mb: 4 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: "'Poppins', sans-serif",
                          fontWeight: 500,
                          color: muiTheme.palette.text.primary,
                          mb: 2,
                        }}
                      >
                        Government IDs
                      </Typography>
                      <Divider
                        sx={{ mb: 3, borderColor: muiTheme.palette.divider }}
                      />
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          {isEditing ? (
                            <TextField
                              label="SSS Number"
                              name="governmentIds.sss"
                              value={formData.governmentIds.sss}
                              onChange={handleChange}
                              fullWidth
                              error={!!errors.sss}
                              helperText={errors.sss}
                              InputProps={{ readOnly: !isEditing }}
                              placeholder="XX-XXXXXXX-X"
                              aria-label="SSS number"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "8px",
                                  "&:hover fieldset": {
                                    borderColor: greenLightColor,
                                  },
                                  "&.Mui-focused fieldset": {
                                    borderColor: greenLightColor,
                                  },
                                },
                                "& .MuiInputLabel-root": {
                                  fontFamily: "'Poppins', sans-serif",
                                },
                              }}
                            />
                          ) : (
                            <>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.secondary,
                                  mb: 0.5,
                                }}
                              >
                                SSS Number
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.primary,
                                  fontSize: "1.1rem",
                                }}
                              >
                                {user.governmentIds?.sss || "N/A"}
                              </Typography>
                            </>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          {isEditing ? (
                            <TextField
                              label="PhilHealth Number"
                              name="governmentIds.philHealth"
                              value={formData.governmentIds.philHealth}
                              onChange={handleChange}
                              fullWidth
                              error={!!errors.philHealth}
                              helperText={errors.philHealth}
                              InputProps={{ readOnly: !isEditing }}
                              placeholder="XX-XXXXXXXXX-X"
                              aria-label="PhilHealth number"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "8px",
                                  "&:hover fieldset": {
                                    borderColor: greenLightColor,
                                  },
                                  "&.Mui-focused fieldset": {
                                    borderColor: greenLightColor,
                                  },
                                },
                                "& .MuiInputLabel-root": {
                                  fontFamily: "'Poppins', sans-serif",
                                },
                              }}
                            />
                          ) : (
                            <>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.secondary,
                                  mb: 0.5,
                                }}
                              >
                                PhilHealth Number
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.primary,
                                  fontSize: "1.1rem",
                                }}
                              >
                                {user.governmentIds?.philHealth || "N/A"}
                              </Typography>
                            </>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          {isEditing ? (
                            <TextField
                              label="TIN"
                              name="governmentIds.tin"
                              value={formData.governmentIds.tin}
                              onChange={handleChange}
                              fullWidth
                              error={!!errors.tin}
                              helperText={errors.tin}
                              InputProps={{ readOnly: !isEditing }}
                              placeholder="XXX-XXX-XXX-XXX"
                              aria-label="TIN"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "8px",
                                  "&:hover fieldset": {
                                    borderColor: greenLightColor,
                                  },
                                  "&.Mui-focused fieldset": {
                                    borderColor: greenLightColor,
                                  },
                                },
                                "& .MuiInputLabel-root": {
                                  fontFamily: "'Poppins', sans-serif",
                                },
                              }}
                            />
                          ) : (
                            <>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.secondary,
                                  mb: 0.5,
                                }}
                              >
                                TIN
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.primary,
                                  fontSize: "1.1rem",
                                }}
                              >
                                {user.governmentIds?.tin || "N/A"}
                              </Typography>
                            </>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          {isEditing ? (
                            <TextField
                              label="Pag-IBIG Number"
                              name="governmentIds.pagIbig"
                              value={formData.governmentIds.pagIbig}
                              onChange={handleChange}
                              fullWidth
                              error={!!errors.pagIbig}
                              helperText={errors.pagIbig}
                              InputProps={{ readOnly: !isEditing }}
                              placeholder="XXXX-XXXX-XXXX"
                              aria-label="Pag-IBIG number"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "8px",
                                  "&:hover fieldset": {
                                    borderColor: greenLightColor,
                                  },
                                  "&.Mui-focused fieldset": {
                                    borderColor: greenLightColor,
                                  },
                                },
                                "& .MuiInputLabel-root": {
                                  fontFamily: "'Poppins', sans-serif",
                                },
                              }}
                            />
                          ) : (
                            <>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.secondary,
                                  mb: 0.5,
                                }}
                              >
                                Pag-IBIG Number
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontFamily: "'Poppins', sans-serif",
                                  color: muiTheme.palette.text.primary,
                                  fontSize: "1.1rem",
                                }}
                              >
                                {user.governmentIds?.pagIbig || "N/A"}
                              </Typography>
                            </>
                          )}
                        </Grid>
                      </Grid>
                    </Box>
                    {isEditing && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        sx={{
                          position: "sticky",
                          bottom: 0,
                          zIndex: 10,
                          background: muiTheme.palette.background.paper,
                          p: 2,
                          borderTop: `1px solid ${muiTheme.palette.divider}`,
                          boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 2,
                          }}
                        >
                          <Tooltip title="Cancel changes to profile">
                            <Button
                              variant="outlined"
                              onClick={handleCancel}
                              disabled={isSubmitting}
                              sx={{
                                fontFamily: "'Poppins', sans-serif",
                                color: muiTheme.palette.text.primary,
                                borderColor: muiTheme.palette.text.primary,
                                borderRadius: "12px",
                                py: 1.5,
                                px: 3,
                                fontSize: "1rem",
                                fontWeight: 500,
                                textTransform: "none",
                                transition: "all 0.3s ease",
                                "&:hover": {
                                  backgroundColor: muiTheme.custom.isDarkMode
                                    ? "rgba(255, 255, 255, 0.15)"
                                    : "rgba(52, 168, 83, 0.1)",
                                  transform: "translateY(-2px)",
                                },
                                "&:disabled": {
                                  borderColor: disabledColor,
                                  color: disabledColor,
                                },
                              }}
                              aria-label="Cancel editing"
                            >
                              Cancel
                            </Button>
                          </Tooltip>
                          <Tooltip title="Save changes to profile">
                            <Button
                              type="submit"
                              variant="contained"
                              disabled={isSubmitting}
                              sx={{
                                fontFamily: "'Poppins', sans-serif",
                                backgroundColor: brandingBlue,
                                color: "#fff",
                                borderRadius: "12px",
                                py: 1.5,
                                px: 3,
                                fontSize: "1rem",
                                fontWeight: 500,
                                textTransform: "none",
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                                transition: "all 0.3s ease",
                                "&:hover": {
                                  backgroundColor: "#3367D6",
                                  transform: "translateY(-2px)",
                                  boxShadow: "0 6px 16px rgba(0, 0, 0, 0.3)",
                                },
                                "&:disabled": {
                                  backgroundColor: disabledColor,
                                  color: "#fff",
                                  boxShadow: "none",
                                },
                              }}
                              aria-label="Save changes"
                            >
                              {isSubmitting ? (
                                <CircularProgress size={24} color="inherit" />
                              ) : (
                                "Save"
                              )}
                            </Button>
                          </Tooltip>
                        </Box>
                      </motion.div>
                    )}
                  </form>
                </Paper>
              </motion.div>
            </Grid>
          </Grid>
        </motion.div>

        {/* Snackbar for feedback */}
        <CustomSnackbar
          open={snackbar.open}
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          message={snackbar.message}
          sx={{ fontFamily: "'Poppins', sans-serif" }}
        />

        {/* Confirmation Dialog */}
        <Dialog
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
          aria-labelledby="confirm-dialog-title"
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: "12px",
              padding: 2,
              background: muiTheme.palette.background.paper,
            },
          }}
        >
          <DialogTitle
            id="confirm-dialog-title"
            sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500 }}
          >
            Confirm Changes
          </DialogTitle>
          <DialogContent>
            <Typography
              sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "1rem" }}
            >
              Are you sure you want to save the changes to this profile?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setConfirmDialogOpen(false)}
              sx={{
                fontFamily: "'Poppins', sans-serif",
                color: muiTheme.palette.text.primary,
                textTransform: "none",
              }}
              aria-label="Cancel changes"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSubmit}
              variant="contained"
              disabled={isSubmitting}
              sx={{
                fontFamily: "'Poppins', sans-serif",
                backgroundColor: brandingBlue,
                color: "#fff",
                borderRadius: "8px",
                textTransform: "none",
                "&:hover": { backgroundColor: "#3367D6" },
                "&:disabled": { backgroundColor: disabledColor },
              }}
              aria-label="Confirm save changes"
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default UserDetails;
