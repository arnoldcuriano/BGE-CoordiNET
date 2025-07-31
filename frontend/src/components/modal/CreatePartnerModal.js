import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Button,
  IconButton,
  Typography,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

const CreatePartnerModal = ({
  open,
  onClose,
  newPartner,
  setNewPartner,
  handleCreatePartner,
  uniqueCategories,
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
      aria-labelledby="create-partner-modal-title"
    >
      <DialogTitle
        id="create-partner-modal-title"
        sx={{
          fontFamily: "'Poppins', sans-serif",
          color: muiTheme.palette.primary.main,
          position: "relative",
        }}
      >
        Create New Partner
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
          aria-label="Close create partner dialog"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <TextField
          label="Partner Name"
          value={newPartner.name}
          onChange={(e) =>
            setNewPartner({ ...newPartner, name: e.target.value })
          }
          fullWidth
          margin="normal"
          required
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
              background: muiTheme.palette.background.listItem,
              "& fieldset": { borderColor: muiTheme.palette.border.main },
              "&:hover fieldset": { borderColor: "#34A853" },
              "&.Mui-focused fieldset": { borderColor: "#34A853" },
            },
          }}
          aria-label="Partner name"
        />
        <TextField
          label="Project Name"
          value={newPartner.projectName}
          onChange={(e) =>
            setNewPartner({ ...newPartner, projectName: e.target.value })
          }
          fullWidth
          margin="normal"
          required
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
              background: muiTheme.palette.background.listItem,
              "& fieldset": { borderColor: muiTheme.palette.border.main },
              "&:hover fieldset": { borderColor: "#34A853" },
              "&.Mui-focused fieldset": { borderColor: "#34A853" },
            },
          }}
          aria-label="Project name"
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Status</InputLabel>
          <Select
            value={newPartner.status}
            onChange={(e) =>
              setNewPartner({ ...newPartner, status: e.target.value })
            }
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
            aria-label="Partner status"
          >
            <MenuItem value="Hot">Hot</MenuItem>
            <MenuItem value="Warm">Warm</MenuItem>
            <MenuItem value="Cold">Cold</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Start Date"
          type="date"
          value={newPartner.startDate}
          onChange={(e) =>
            setNewPartner({ ...newPartner, startDate: e.target.value })
          }
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
          required
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
              background: muiTheme.palette.background.listItem,
              "& fieldset": { borderColor: muiTheme.palette.border.main },
              "&:hover fieldset": { borderColor: "#34A853" },
              "&.Mui-focused fieldset": { borderColor: "#34A853" },
            },
          }}
          aria-label="Start date"
        />
        <TextField
          label="End Date"
          type="date"
          value={newPartner.endDate}
          onChange={(e) =>
            setNewPartner({ ...newPartner, endDate: e.target.value })
          }
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
          required
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
              background: muiTheme.palette.background.listItem,
              "& fieldset": { borderColor: muiTheme.palette.border.main },
              "&:hover fieldset": { borderColor: "#34A853" },
              "&.Mui-focused fieldset": { borderColor: "#34A853" },
            },
          }}
          aria-label="End date"
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Duration Status</InputLabel>
          <Select
            value={newPartner.durationStatus}
            onChange={(e) =>
              setNewPartner({ ...newPartner, durationStatus: e.target.value })
            }
            label="Duration Status"
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
            aria-label="Duration status"
          >
            <MenuItem value="Upcoming">Upcoming</MenuItem>
            <MenuItem value="Ongoing">Ongoing</MenuItem>
            <MenuItem value="Custom">Custom</MenuItem>
          </Select>
        </FormControl>
        {newPartner.durationStatus === "Custom" && (
          <TextField
            label="Custom Duration Status"
            value={newPartner.durationStatusCustom}
            onChange={(e) =>
              setNewPartner({
                ...newPartner,
                durationStatusCustom: e.target.value,
              })
            }
            fullWidth
            margin="normal"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                background: muiTheme.palette.background.listItem,
                "& fieldset": { borderColor: muiTheme.palette.border.main },
                "&:hover fieldset": { borderColor: "#34A853" },
                "&.Mui-focused fieldset": { borderColor: "#34A853" },
              },
            }}
            aria-label="Custom duration status"
          />
        )}
        <Autocomplete
          freeSolo
          options={uniqueCategories}
          value={newPartner.category}
          onChange={(e, newValue) =>
            setNewPartner({ ...newPartner, category: newValue || "" })
          }
          onInputChange={(e, newInputValue) =>
            setNewPartner({ ...newPartner, category: newInputValue })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Category"
              margin="normal"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  background: muiTheme.palette.background.listItem,
                  "& fieldset": { borderColor: muiTheme.palette.border.main },
                  "&:hover fieldset": { borderColor: "#34A853" },
                  "&.Mui-focused fieldset": { borderColor: "#34A853" },
                },
              }}
              aria-label="Category"
            />
          )}
        />
        <Typography
          variant="subtitle1"
          sx={{
            mt: 2,
            fontFamily: "'Poppins', sans-serif",
            color: muiTheme.palette.text.primary,
          }}
        >
          Contact Information
        </Typography>
        <TextField
          label="Contact Email"
          value={newPartner.contact.email}
          onChange={(e) =>
            setNewPartner({
              ...newPartner,
              contact: { ...newPartner.contact, email: e.target.value },
            })
          }
          fullWidth
          margin="normal"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
              background: muiTheme.palette.background.listItem,
              "& fieldset": { borderColor: muiTheme.palette.border.main },
              "&:hover fieldset": { borderColor: "#34A853" },
              "&.Mui-focused fieldset": { borderColor: "#34A853" },
            },
          }}
          aria-label="Contact email"
        />
        <TextField
          label="Contact Phone"
          value={newPartner.contact.phone}
          onChange={(e) =>
            setNewPartner({
              ...newPartner,
              contact: { ...newPartner.contact, phone: e.target.value },
            })
          }
          fullWidth
          margin="normal"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
              background: muiTheme.palette.background.listItem,
              "& fieldset": { borderColor: muiTheme.palette.border.main },
              "&:hover fieldset": { borderColor: "#34A853" },
              "&.Mui-focused fieldset": { borderColor: "#34A853" },
            },
          }}
          aria-label="Contact phone"
        />
        <TextField
          label="Contact Person"
          value={newPartner.contact.person}
          onChange={(e) =>
            setNewPartner({
              ...newPartner,
              contact: { ...newPartner.contact, person: e.target.value },
            })
          }
          fullWidth
          margin="normal"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
              background: muiTheme.palette.background.listItem,
              "& fieldset": { borderColor: muiTheme.palette.border.main },
              "&:hover fieldset": { borderColor: "#34A853" },
              "&.Mui-focused fieldset": { borderColor: "#34A853" },
            },
          }}
          aria-label="Contact person"
        />
        <TextField
          label="Contact Role"
          value={newPartner.contact.role}
          onChange={(e) =>
            setNewPartner({
              ...newPartner,
              contact: { ...newPartner.contact, role: e.target.value },
            })
          }
          fullWidth
          margin="normal"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
              background: muiTheme.palette.background.listItem,
              "& fieldset": { borderColor: muiTheme.palette.border.main },
              "&:hover fieldset": { borderColor: "#34A853" },
              "&.Mui-focused fieldset": { borderColor: "#34A853" },
            },
          }}
          aria-label="Contact role"
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          sx={{
            fontFamily: "'Poppins', sans-serif",
            color: muiTheme.palette.text.primary,
          }}
          aria-label="Cancel create partner"
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreatePartner}
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
          aria-label="Create partner"
          disabled={
            !newPartner.name ||
            !newPartner.projectName ||
            !newPartner.startDate ||
            !newPartner.endDate
          }
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePartnerModal;
