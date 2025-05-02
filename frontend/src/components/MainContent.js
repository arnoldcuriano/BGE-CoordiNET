import React from 'react';
import { Typography, Paper, Box, Toolbar } from '@mui/material';

const MainContent = ({ isCollapsed, user, isDarkMode }) => {
  return (
    <>
      <Toolbar />
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: isDarkMode ? '#fff' : '#1976d2' }}>
        Dashboard
      </Typography>
      <Box sx={{ display: 'flex', gap: 3 }}>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6">Overview</Typography>
          <Typography variant="body1">Users: 144 (+25%)</Typography>
          <Typography variant="body1">Conversions: 325 (+25%)</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6">Lorem Ipsum</Typography>
          <Typography variant="body1">13,277 (+35%)</Typography>
        </Paper>
      </Box>
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6">Events and Management</Typography>
        <Typography variant="body1">Lorem Ipsum</Typography>
      </Paper>
    </>
  );
};

export default MainContent;