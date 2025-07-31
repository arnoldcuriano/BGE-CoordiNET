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

const ImportSummaryModal = ({ open, onClose, importSummary, muiTheme }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableEnforceFocus
      aria-labelledby="import-summary-modal-title"
    >
      <DialogTitle
        id="import-summary-modal-title"
        sx={{
          fontFamily: "'Poppins', sans-serif",
          color: muiTheme.palette.primary.main,
          position: "relative",
        }}
      >
        Import Summary
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
          aria-label="Close import summary"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2, fontFamily: "'Poppins', sans-serif" }}>
          Total Entries: {importSummary?.total}
          <br />
          Successful Entries: {importSummary?.successful}
          <br />
          Skipped Entries (with Errors): {importSummary?.skipped}
          <br />
          Failed Entries: {importSummary?.failed?.length}
        </Typography>
        {importSummary?.failed?.length > 0 && (
          <>
            <Typography
              variant="subtitle1"
              sx={{ mb: 1, fontFamily: "'Poppins', sans-serif" }}
            >
              Failed Rows:
            </Typography>
            <ul>
              {importSummary.failed.map((f) => (
                <li key={f.row}>
                  Row {f.row}: {f.error}
                </li>
              ))}
            </ul>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          sx={{
            fontFamily: "'Poppins', sans-serif",
            color: muiTheme.palette.text.primary,
          }}
          aria-label="Close import summary"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportSummaryModal;
