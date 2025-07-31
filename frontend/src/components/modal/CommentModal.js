import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

const CommentModal = ({
  open,
  onClose,
  partnerName,
  newComment,
  setNewComment,
  handleAddComment,
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
      aria-labelledby="comment-modal-title"
    >
      <DialogTitle
        id="comment-modal-title"
        sx={{
          fontFamily: "'Poppins', sans-serif",
          color: muiTheme.palette.primary.main,
          position: "relative",
        }}
      >
        Add Comment for {partnerName}
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
          aria-label="Close comment dialog"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <TextField
          label="Comment"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          fullWidth
          multiline
          rows={4}
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
          aria-label="Enter comment"
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          sx={{
            fontFamily: "'Poppins', sans-serif",
            color: muiTheme.palette.text.primary,
          }}
          aria-label="Cancel comment"
        >
          Cancel
        </Button>
        <Button
          onClick={handleAddComment}
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
          aria-label="Add comment"
          disabled={!newComment?.trim()}
        >
          Add Comment
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommentModal;
