import React from 'react';
import { Snackbar, Alert } from '@mui/material';

const CustomSnackbar = ({ open, onClose, severity, message, sx, ...props }) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      {...props}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%', ...sx }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default CustomSnackbar;