import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Button,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

const ExportFieldsModal = ({
  open,
  onClose,
  exportFields,
  toggleExportField,
  handleNext,
  availableFields,
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
      aria-labelledby="export-fields-modal-title"
    >
      <DialogTitle
        id="export-fields-modal-title"
        sx={{
          fontFamily: "'Poppins', sans-serif",
          color: muiTheme.palette.primary.main,
          position: "relative",
        }}
      >
        Select Fields to Export
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
          aria-label="Close export fields selection"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {availableFields.map((field) => (
          <FormControlLabel
            key={field.id}
            control={
              <Checkbox
                checked={exportFields.includes(field.id)}
                onChange={() => toggleExportField(field.id)}
                sx={{
                  color: !isDarkMode ? "#333" : "#fff",
                  "&.Mui-checked": { color: "#2E914A" },
                }}
                aria-label={`Include ${field.label} in export`}
              />
            }
            label={field.label}
            sx={{ display: "block", mb: 1 }}
          />
        ))}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          sx={{
            fontFamily: "'Poppins', sans-serif",
            color: muiTheme.palette.text.primary,
          }}
          aria-label="Cancel field selection"
        >
          Cancel
        </Button>
        <Button
          onClick={handleNext}
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
          aria-label="Confirm field selection"
          disabled={exportFields.length === 0}
        >
          Next
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportFieldsModal;
