import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Typography,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

const BulkEditModal = ({
  open,
  onClose,
  bulkEditStatus,
  setBulkEditStatus,
  handleBulkEdit,
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
      aria-labelledby="bulk-edit-modal-title"
    >
      <DialogTitle
        id="bulk-edit-modal-title"
        sx={{
          fontFamily: "'Poppins', sans-serif",
          color: muiTheme.palette.primary.main,
          position: "relative",
        }}
      >
        Bulk Edit Partners
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
          aria-label="Close bulk edit dialog"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography
          sx={{
            fontFamily: "'Poppins', sans-serif",
            color: muiTheme.palette.text.primary,
            mb: 2,
          }}
        >
          Select a new status for the selected partners.
        </Typography>
        <FormControl fullWidth margin="normal">
          <InputLabel>Status</InputLabel>
          <Select
            value={bulkEditStatus}
            onChange={(e) => setBulkEditStatus(e.target.value)}
            label="Status"
            sx={{
              borderRadius: "8px",
              background: muiTheme.palette.background.listItem,
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: muiTheme.palette.border.main,
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#34A853",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#34A853",
              },
            }}
            aria-label="Select new status for partners"
          >
            <MenuItem value="Hot">Hot</MenuItem>
            <MenuItem value="Warm">Warm</MenuItem>
            <MenuItem value="Cold">Cold</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          sx={{
            fontFamily: "'Poppins', sans-serif",
            color: muiTheme.palette.text.primary,
          }}
          aria-label="Cancel bulk edit"
        >
          Cancel
        </Button>
        <Button
          onClick={handleBulkEdit}
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
          aria-label="Save bulk edit changes"
          disabled={!bulkEditStatus}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkEditModal;
