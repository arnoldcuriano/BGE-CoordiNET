import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

const DeletePartnerModal = ({
  open,
  onClose,
  partnerName,
  handleDeletePartner,
  muiTheme,
  brandingBlue,
  isDarkMode,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableEnforceFocus
      aria-labelledby="delete-partner-modal-title"
    >
      <DialogTitle
        id="delete-partner-modal-title"
        sx={{
          fontFamily: "'Poppins', sans-serif",
          color: muiTheme.palette.primary.main,
          position: "relative",
        }}
      >
        Confirm Delete
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
          aria-label="Close delete partner confirmation"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography
          sx={{
            fontFamily: "'Poppins', sans-serif",
            color: muiTheme.palette.text.primary,
          }}
        >
          Are you sure you want to delete the partner "{partnerName}"? This
          action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          sx={{
            fontFamily: "'Poppins', sans-serif",
            color: muiTheme.palette.text.primary,
          }}
          aria-label="Cancel delete partner"
        >
          Cancel
        </Button>
        <Button
          onClick={handleDeletePartner}
          variant="contained"
          color="error"
          sx={{
            fontFamily: "'Poppins', sans-serif",
            backgroundColor: "#D32F2F",
            color: "#fff",
            "&:hover": {
              backgroundColor: isDarkMode ? "#B71C1C" : "#B71C1C",
              transform: "scale(1.05)",
            },
            transition: "all 0.3s ease",
          }}
          aria-label="Confirm delete partner"
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeletePartnerModal;
