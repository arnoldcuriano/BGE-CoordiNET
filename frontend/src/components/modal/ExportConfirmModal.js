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

const ExportConfirmModal = ({
  open,
  onClose,
  handleExportCSV,
  isExportSelected,
  partnersCount,
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
      aria-labelledby="export-confirm-modal-title"
    >
      <DialogTitle
        id="export-confirm-modal-title"
        sx={{
          fontFamily: "'Poppins', sans-serif",
          color: muiTheme.palette.primary.main,
          position: "relative",
        }}
      >
        Confirm Export
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
          aria-label="Close export confirmation"
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
          Are you sure you want to export {partnersCount} partner(s) to CSV?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          sx={{
            fontFamily: "'Poppins', sans-serif",
            color: muiTheme.palette.text.primary,
          }}
          aria-label="Cancel export"
        >
          Cancel
        </Button>
        <Button
          onClick={handleExportCSV}
          variant="contained"
          sx={{
            fontFamily: "'Poppins', sans-serif",
            backgroundColor: brandingBlue,
            color: "#fff",
            "&:hover": {
              backgroundColor: isDarkMode
                ? "#3367D6"
                : muiTheme.palette.primary.dark,
              transform: "scale(1.05)",
            },
            transition: "all 0.3s ease",
          }}
          aria-label="Confirm export"
        >
          Export
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportConfirmModal;
