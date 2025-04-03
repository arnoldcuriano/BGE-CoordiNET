import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import CircularProgress from '@mui/material/CircularProgress';
import Login from './pages/Login';
import DashboardLayoutBasic from './pages/Dashboard'; // Assuming this is DashboardLayoutBasic
import ForgotPassword from './pages/ForgotPassword';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Signup from './pages/Signup';
import Members from './pages/Members'; // Add this import
import ProtectedRoute from './components/ProtectedRoute';
import axios from 'axios';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  const theme = createTheme({
    typography: { fontFamily: 'Poppins, sans-serif' },
    palette: { mode: isDarkMode ? 'dark' : 'light' },
  });

  const toggleTheme = () => setIsDarkMode((prevMode) => !prevMode);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/auth/user', { withCredentials: true });
        if (response.data) {
          setUser(response.data);
          localStorage.setItem('isAuthenticated', 'true');
        } else {
          throw new Error('No user data');
        }
      } catch (error) {
        console.error('Auth check failed:', error.response?.data || error.message);
        localStorage.removeItem('isAuthenticated');
        setUser(null);
      } finally {
        setAuthChecked(true);
      }
    };
    checkAuth();

    const handleStorageChange = (event) => {
      if (event.key === 'isAuthenticated' && event.newValue !== 'true') {
        setUser(null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (!authChecked) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<ProtectedRoute isPublic user={user}><Login /></ProtectedRoute>} />
          <Route path="/forgot-password" element={<ProtectedRoute isPublic user={user}><ForgotPassword /></ProtectedRoute>} />
          <Route path="/signup" element={<ProtectedRoute isPublic user={user}><Signup /></ProtectedRoute>} />
          <Route path="/" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user}>
                <DashboardLayoutBasic isDarkMode={isDarkMode} toggleTheme={toggleTheme} user={user} setUser={setUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin-dashboard"
            element={
              <ProtectedRoute user={user}>
                <SuperAdminDashboard isDarkMode={isDarkMode} toggleTheme={toggleTheme} user={user} setUser={setUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/members"
            element={
              <ProtectedRoute user={user}>
                <Members isDarkMode={isDarkMode} toggleTheme={toggleTheme} user={user} setUser={setUser} />
              </ProtectedRoute>
            }
          />
          
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;