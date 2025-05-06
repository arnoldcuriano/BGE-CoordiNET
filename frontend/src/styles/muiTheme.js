import { createTheme } from '@mui/material/styles';

// Define the theme as a function that takes isDarkMode as a parameter
const getMuiTheme = (isDarkMode) =>
  createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      background: {
        default: isDarkMode ? '#1a1a2e' : '#e6e8ff',
        paper: isDarkMode ? 'rgba(30, 30, 50, 0.8)' : '#f0f2ff',
        glass: isDarkMode ? 'transparent' : 'rgba(230, 232, 255, 0.7)',
        listItem: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
        listItemHover: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(169, 201, 255, 0.5)',
      },
      primary: {
        main: isDarkMode ? '#90caf9' : '#4a90e2',
        contrastText: '#ffffff',
      },
      secondary: {
        main: isDarkMode ? '#34A853' : '#00c4cc',
        contrastText: '#ffffff',
      },
      text: {
        primary: isDarkMode ? '#e0e0e0' : '#1a202c',
        secondary: isDarkMode ? '#b0b0b0' : '#4a5568',
      },
      border: {
        main: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(74, 144, 226, 0.1)', // Subtle blue border
      },
      success: {
        main: '#4caf50',
      },
      error: {
        main: '#f44336',
      },
    },
    typography: {
      fontFamily: "'Poppins', sans-serif",
    },
    custom: {
      gradients: {
        backgroundDefault: isDarkMode
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
          : 'linear-gradient(135deg, #e6e8ff 0%, #a9c9ff 100%)',
        glass: isDarkMode
          ? 'transparent'
          : 'linear-gradient(135deg, rgba(230, 232, 255, 0.7), rgba(169, 201, 255, 0.4))',
      },
      border: {
        glass: isDarkMode ? 'none' : '1px solid rgba(74, 144, 226, 0.2)', // Softer blue glass border
      },
      shadow: {
        paper: isDarkMode ? '0 8px 32px rgba(0, 0, 0, 0.5)' : '0 6px 20px rgba(74, 144, 226, 0.1)',
        glass: isDarkMode ? 'none' : '0 6px 20px rgba(74, 144, 226, 0.1)',
        listItem: isDarkMode ? '0 4px 15px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(74, 144, 226, 0.05)',
        listItemHover: isDarkMode ? '0 8px 20px rgba(0, 0, 0, 0.4)' : '0 6px 16px rgba(74, 144, 226, 0.1)',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: '12px', // Slightly larger radius for a modern look
            '&:hover': {
              boxShadow: isDarkMode ? '0 8px 20px rgba(0, 0, 0, 0.4)' : '0 6px 16px rgba(74, 144, 226, 0.2)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px', // Match button radius
              '& fieldset': {
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(74, 144, 226, 0.2)',
              },
              '&:hover fieldset': {
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : '#4a90e2',
              },
            },
          },
        },
      },
    },
  });

export default getMuiTheme;