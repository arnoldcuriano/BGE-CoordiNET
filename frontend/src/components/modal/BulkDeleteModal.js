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

const BulkDeleteModal = ({
  open,
  onClose,
  selectedPartnersCount,
  handleBulkDelete,
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
      aria-labelledby="bulk-delete-modal-title"
    >
      <DialogTitle
        id="bulk-delete-modal-title"
        sx={{
          fontFamily: "'Poppins', sans-serif",
          color: muiTheme.palette.primary.main,
          position: "relative",
        }}
      >
        Confirm Bulk Delete
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
          aria-label="Close bulk delete confirmation"
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
          Are you sure you want to delete {selectedPartnersCount} selected
          partner(s)? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          sx={{
            fontFamily: "'Poppins', sans-serif",
            color: muiTheme.palette.text.primary,
          }}
          aria-label="Cancel bulk delete"
        >
          Cancel
        </Button>
        <Button
          onClick={handleBulkDelete}
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
          aria-label="Confirm bulk delete"
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkDeleteModal;
