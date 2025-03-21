import React from 'react';
import { Container, Typography, Paper, Box, Toolbar } from '@mui/material';

const MainContent = () => {
  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        p: 3,
        width: { sm: `calc(100% - 240px)` },
      }}
    >
      <Toolbar />
      <Container>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography variant="h6">Overview</Typography>
            <Typography variant="body1">Users: 14k (+25%)</Typography>
            <Typography variant="body1">Conversions: 325 (-25%)</Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography variant="h6">Sessions</Typography>
            <Typography variant="body1">13,277 (+35%)</Typography>
          </Paper>
        </Box>
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6">Page Views and Downloads</Typography>
          <Typography variant="body1">1.3M (8%)</Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default MainContent;