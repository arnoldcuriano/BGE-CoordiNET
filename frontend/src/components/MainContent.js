import React from 'react';
import { Typography, Paper, Box } from '@mui/material';

const MainContent = ({ isCollapsed }) => {
  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        width: { sm: isCollapsed ? `calc(100% - 64px)` : `calc(100% - 240px)` }, 
        transition: (theme) =>
          theme.transitions.create(['width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        // Ensure content starts at the top
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',  // Align content to the start
        gap: 2,  // Add slight spacing between sections
        p: 3,
        '@media (min-width: 600px)': {
          width: isCollapsed ? 'calc(100% - 64px)' : 'calc(100% - 240px)',
        },
      }}
    >
      {/* Remove the Toolbar to prevent unnecessary spacing */}
      <Box>
        <Typography variant="h4" gutterBottom>
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
      </Box>
    </Box>
  );
};

export default MainContent;
