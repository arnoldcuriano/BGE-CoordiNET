import { createTheme } from '@mui/material/styles';

// Define the theme as a function that takes isDarkMode as a parameter
const getMuiTheme = (isDarkMode) =>
  createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      background: {
        default: isDarkMode ? '#1a1a2e' : '#e0f7fa',
        paper: isDarkMode ? 'rgba(30, 30, 50, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        glass: isDarkMode ? 'transparent' : 'rgba(255, 255, 255, 0.3)',
        listItem: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.5)',
        listItemHover: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.7)',
      },
      primary: {
        main: isDarkMode ? '#90caf9' : '#4285F4',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#34A853',
        contrastText: '#ffffff',
      },
      text: {
        primary: isDarkMode ? '#e0e0e0' : '#333',
        secondary: isDarkMode ? '#b0b0b0' : '#666',
      },
      border: {
        main: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', // Add border.main
      },
      success: {
        main: '#4caf50', // Define success.main for success messages
      },
      error: {
        main: '#f44336', // Define error.main for error messages
      },
    },
    typography: {
      fontFamily: "'Poppins', sans-serif",
    },
    custom: {
      gradients: {
        backgroundDefault: isDarkMode
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
          : 'linear-gradient(135deg, #e0f7fa 0%, #b3e5fc 100%)',
        glass: isDarkMode
          ? 'transparent'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(220, 240, 255, 0.2))',
      },
      border: {
        glass: isDarkMode ? 'none' : '1px solid rgba(255, 255, 255, 0.5)',
      },
      shadow: {
        paper: isDarkMode ? '0 8px 32px rgba(0, 0, 0, 0.5)' : '0 8px 32px rgba(0, 0, 0, 0.1)',
        glass: isDarkMode ? 'none' : '0 8px 32px rgba(0, 0, 0, 0.1)',
        listItem: isDarkMode ? '0 4px 15px rgba(0, 0, 0, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.1)',
        listItemHover: isDarkMode ? '0 8px 20px rgba(0, 0, 0, 0.4)' : '0 8px 20px rgba(0, 0, 0, 0.2)',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: '8px',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            },
          },
        },
      },
    },
  });

export default getMuiTheme;