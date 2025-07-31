import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  LinearProgress,
} from "@mui/material";

const ImportProgressModal = ({
  open,
  importProgress,
  currentImportItem,
  muiTheme,
}) => {
  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEnforceFocus
      aria-labelledby="import-progress-modal-title"
    >
      <DialogTitle
        id="import-progress-modal-title"
        sx={{
          fontFamily: "'Poppins', sans-serif",
          color: muiTheme.palette.primary.main,
          bgcolor: muiTheme.palette.background.default,
          py: 3,
          px: 4,
          position: "relative",
          borderBottom: `1px solid ${muiTheme.palette.divider}`,
          fontSize: "1.5rem",
          fontWeight: 600,
        }}
      >
        Importing Partners
      </DialogTitle>
      <DialogContent sx={{ p: 4 }}>
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
          value={importProgress}
          sx={{
            mb: 2,
            bgcolor:
              muiTheme.palette.grey[
                muiTheme.palette.mode === "dark" ? 800 : 300
              ],
            "& .MuiLinearProgress-bar": {
              bgcolor: muiTheme.palette.primary.main,
            },
          }}
          aria-label="Import progress"
        />
        <Typography
          variant="body1"
          color={muiTheme.palette.text.secondary}
          fontFamily="'Poppins', sans-serif"
        >
          {importProgress === 0
            ? "Starting import..."
            : `Inserting ${currentImportItem} (${Math.round(importProgress)}%)`}
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default ImportProgressModal;
