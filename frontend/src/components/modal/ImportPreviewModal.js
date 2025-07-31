import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
  Button,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

const ImportPreviewModal = ({
  open,
  onClose,
  parsedData,
  handleConfirmImport,
  muiTheme,
  isDarkMode,
  brandingBlue,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      disableEnforceFocus
      aria-labelledby="import-preview-modal-title"
    >
      <DialogTitle
        id="import-preview-modal-title"
        sx={{
          fontFamily: "'Poppins', sans-serif",
          color: muiTheme.palette.primary.main,
          position: "relative",
        }}
      >
        Preview CSV Import
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
          aria-label="Close import preview"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Review the data below. Rows with errors will be skipped.
        </Typography>
        <TableContainer component={Paper}>
          <Table aria-label="Import preview table">
            <TableHead>
              <TableRow>
                <TableCell>Row</TableCell>
                <TableCell>Partner Name</TableCell>
                <TableCell>Project Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Duration Status</TableCell>
                <TableCell>Errors</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {parsedData.map((row) => (
                <TableRow
                  key={row.rowIndex}
                  sx={{
                    bgcolor: row.errors.length > 0 ? "error.light" : "inherit",
                  }}
                >
                  <TableCell
                    sx={{
                      color:
                        !isDarkMode && row.errors.length > 0
                          ? "#fff"
                          : muiTheme.palette.text.primary,
                    }}
                  >
                    {row.rowIndex}
                  </TableCell>
                  <TableCell
                    sx={{
                      color:
                        !isDarkMode && row.errors.length > 0
                          ? "#fff"
                          : muiTheme.palette.text.primary,
                    }}
                  >
                    {row["Partner Name"] || "N/A"}
                  </TableCell>
                  <TableCell
                    sx={{
                      color:
                        !isDarkMode && row.errors.length > 0
                          ? "#fff"
                          : muiTheme.palette.text.primary,
                    }}
                  >
                    {row["Project Name"] || "N/A"}
                  </TableCell>
                  <TableCell
                    sx={{
                      color:
                        !isDarkMode && row.errors.length > 0
                          ? "#fff"
                          : muiTheme.palette.text.primary,
                    }}
                  >
                    {row["Status"] || "N/A"}
                  </TableCell>
                  <TableCell
                    sx={{
                      color:
                        !isDarkMode && row.errors.length > 0
                          ? "#fff"
                          : muiTheme.palette.text.primary,
                    }}
                  >
                    {row["Start Date"] || "N/A"}
                  </TableCell>
                  <TableCell
                    sx={{
                      color:
                        !isDarkMode && row.errors.length > 0
                          ? "#fff"
                          : muiTheme.palette.text.primary,
                    }}
                  >
                    {row["End Date"] || "N/A"}
                  </TableCell>
                  <TableCell
                    sx={{
                      color:
                        !isDarkMode && row.errors.length > 0
                          ? "#fff"
                          : muiTheme.palette.text.primary,
                    }}
                  >
                    {row["Duration Status"] || "N/A"}
                  </TableCell>
                  <TableCell
                    sx={{
                      color:
                        !isDarkMode && row.errors.length > 0
                          ? "#fff"
                          : muiTheme.palette.text.primary,
                    }}
                  >
                    {row.errors.join(", ") || "None"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          sx={{
            fontFamily: "'Poppins', sans-serif",
            color: muiTheme.palette.text.primary,
          }}
          aria-label="Cancel import"
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirmImport}
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
          aria-label="Confirm import"
          disabled={parsedData.every((row) => row.errors.length > 0)}
        >
          Import
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportPreviewModal;
