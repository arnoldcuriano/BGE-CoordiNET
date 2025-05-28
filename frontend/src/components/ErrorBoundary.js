import React, { Component } from 'react';
import { Typography, Box } from '@mui/material';

class ErrorBoundary extends Component {
  state = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error) {
    console.error('ErrorBoundary: getDerivedStateFromError:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary: componentDidCatch:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" color="error">
            Something went wrong
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            An error occurred while rendering this component. Please try again later.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            Error: {this.state.error?.message || 'Unknown error'}
          </Typography>
          {this.state.errorInfo && (
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
              Details: {this.state.errorInfo.componentStack}
            </Typography>
          )}
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;