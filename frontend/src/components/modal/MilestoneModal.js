import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Button,
  IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import axios from "axios";

const MilestoneModal = ({
  open,
  onClose,
  partnerId,
  milestone,
  onUpdate,
  onSuccess,
  onError,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    if (milestone) {
      setTitle(milestone.title);
      setDescription(milestone.description || "");
      setDate(
        milestone.date
          ? new Date(milestone.date).toISOString().split("T")[0]
          : ""
      );
    } else {
      // Reset form when adding a new milestone
      setTitle("");
      setDescription("");
      setDate("");
    }
  }, [milestone, open]);

  const handleSaveMilestone = async () => {
    try {
      const milestoneData = { title, description, date };
      if (milestone) {
        // Update existing milestone
        await axios.put(
          `/api/partners/${partnerId}/milestones/${milestone._id}`,
          milestoneData
        );
        onSuccess("Milestone updated successfully");
      } else {
        // Add new milestone
        await axios.post(
          `/api/partners/${partnerId}/milestones`,
          milestoneData
        );
        onSuccess("Milestone added successfully");
      }

      onUpdate(); // Trigger parent to fetch updated data
      onClose(); // Close the modal after successful save
    } catch (err) {
      onError("Failed to save milestone. Please try again.");
      console.error("Error saving milestone:", err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          fontFamily: "'Poppins', sans-serif",
          color: "primary.main",
          position: "relative",
        }}
      >
        {milestone ? "Edit Milestone" : "Add Milestone"}
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <TextField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          margin="normal"
          multiline
          rows={3}
        />
        <TextField
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
          required
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleSaveMilestone}
          variant="contained"
          color="primary"
          disabled={!title || !date}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MilestoneModal;
