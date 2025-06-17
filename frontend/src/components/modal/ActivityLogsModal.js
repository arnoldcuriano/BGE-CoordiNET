import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Autocomplete,
  Card,
  CardContent,
} from "@mui/material";
import { Close, Search } from "@mui/icons-material";

const ActivityLogsModal = ({ open, onClose, logs }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterUser, setFilterUser] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const uniqueActions = [...new Set(logs.map((log) => log.action))];
  const uniqueUsers = [
    ...new Set(
      logs.map((log) =>
        JSON.stringify({ _id: log.userId?._id, name: log.userName })
      )
    ),
  ].map((user) => JSON.parse(user));

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.userName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.action || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.partnerName || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (log.details || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = filterAction ? log.action === filterAction : true;
    const matchesUser = filterUser ? log.userId?._id === filterUser._id : true;
    const logDate = new Date(log.timestamp);
    const matchesDateRange =
      (!startDate || logDate >= new Date(startDate)) &&
      (!endDate ||
        logDate <= new Date(new Date(endDate).setHours(23, 59, 59, 999)));
    return matchesSearch && matchesAction && matchesUser && matchesDateRange;
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableEnforceFocus
      aria-labelledby="activity-logs-modal-title"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: "16px",
          backgroundColor: "background.paper",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
        },
      }}
    >
      <DialogTitle
        id="activity-logs-modal-title"
        sx={{
          fontFamily: "'Poppins', sans-serif",
          color: "primary.main",
          bgcolor: "background.default",
          py: 3,
          px: 4,
          position: "relative",
          borderBottom: "1px solid",
          borderColor: "divider",
          pb: 4,
        }}
      >
        Partner Activity Logs
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 16,
            top: 16,
            color: "text.secondary",
            "&:hover": { color: "text.primary" },
          }}
          aria-label="close"
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          pt: "48px",
          pb: 4,
          px: 4,
          mt: "20px",
          overflowY: "visible",
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <TextField
            label="Search Logs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <Search sx={{ mr: 1, color: "text.secondary" }} />
              ),
            }}
            sx={{ flex: "1 1 200px", minWidth: 200 }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Action</InputLabel>
            <Select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              label="Action"
            >
              <MenuItem value="">All</MenuItem>
              {uniqueActions.map((action) => (
                <MenuItem key={action} value={action}>
                  {action}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Autocomplete
            options={uniqueUsers}
            getOptionLabel={(option) => option.name || "N/A"}
            value={filterUser}
            onChange={(event, newValue) => setFilterUser(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Filter by User"
                sx={{ minWidth: 200 }}
              />
            )}
          />
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />
        </Box>
        <Divider sx={{ my: 2 }} />
        <Card
          sx={{
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {filteredLogs.length > 0 ? (
              <List sx={{ bgcolor: "background.default", borderRadius: "8px" }}>
                {filteredLogs.map((log, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      py: 2,
                      px: 4,
                      "&:last-child": { borderBottom: "none" },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography
                          variant="subtitle1"
                          fontWeight="medium"
                          color="text.primary"
                        >
                          {log.userName || "N/A"}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary">
                            Action: {log.action}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Partner: {log.partnerName || "N/A"} (Project:{" "}
                            {log.projectName || "N/A"})
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Details: {log.details || "N/A"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Timestamp:{" "}
                            {new Date(log.timestamp).toLocaleString()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ p: 3 }}>
                No activity logs available.
              </Typography>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityLogsModal;
