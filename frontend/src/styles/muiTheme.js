import { createTheme } from '@mui/material/styles';

const getMuiTheme = (isDarkMode) => {
  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: isDarkMode ? '#ffffff' : '#1976d2',
      },
      secondary: {
        main: isDarkMode ? '#ff4081' : '#f50057',
      },
      background: {
        default: isDarkMode ? '#121212' : '#f7f9fc',
        listItem: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        glass: isDarkMode ? 'rgba(30, 30, 50, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      },
      text: {
        primary: isDarkMode ? '#e0e0e0' : '#1a1a2e',
        secondary: isDarkMode ? '#b0b0b0' : '#666',
      },
      border: {
        main: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        glass: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.2)',
      },
    },
    transitions: {
      easing: {
        easeInOut: 'ease-in-out',
      },
      duration: {
        standard: 300,
        leavingScreen: 195,
      },
    },
    custom: {
      gradients: {
        backgroundDefault: isDarkMode
          ? 'linear-gradient(135deg, #1a1a2e 0%, #121212 100%)'
          : 'linear-gradient(135deg, #f7f9fc 0%, #e8ecef 100%)',
        listItem: isDarkMode
          ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.1) 100%)'
          : 'linear-gradient(145deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.03) 100%)',
        listItemHover: isDarkMode
          ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.15) 100%)'
          : 'linear-gradient(145deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.05) 100%)',
      },
      shadows: {
        paper: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
        listItem: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.05)',
        buttonHover: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
    },
    typography: {
      fontFamily: "'Poppins', sans-serif",
    },
  });

  console.log('getMuiTheme: Generated theme transitions:', theme.transitions);
  return theme;
};

export default getMuiTheme;