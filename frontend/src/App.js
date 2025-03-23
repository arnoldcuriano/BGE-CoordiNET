import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Create a theme based on the dark mode state
  const theme = createTheme({
    typography: {
      fontFamily: 'Poppins, sans-serif',
    },
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
    },
  });

  // Toggle dark mode
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Listen for changes to localStorage (e.g., logout in another tab)
  useEffect(() => {
    const handleStorageChange = (event) => {
      console.log('Storage event:', event); // Debugging
      if (event.key === 'isAuthenticated' && event.newValue === null) {
        console.log('User logged out in another tab. Redirecting to /login.'); // Debugging
        window.location.href = '/login'; // Redirect to Login if logged out in another tab
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup the event listener
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Apply baseline styles for Material-UI */}
      <Router>
        <Routes>
          {/* Protected Routes for Unauthenticated Users */}
          <Route
            path="/login"
            element={
              <ProtectedRoute isAuthenticatedPage>
                <Login />
              </ProtectedRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <ProtectedRoute isAuthenticatedPage>
                <ForgotPassword />
              </ProtectedRoute>
            }
          />

          {/* Default Route */}
          <Route path="/" element={<Login />} />

          {/* Dashboard Route (Authenticated Users Only) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;