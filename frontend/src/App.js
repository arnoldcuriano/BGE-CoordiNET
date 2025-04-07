import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import CircularProgress from '@mui/material/CircularProgress';
import Login from './pages/Login';
import DashboardLayoutBasic from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Signup from './pages/Signup';
import Members from './pages/Members';
import ProtectedRoute from './components/ProtectedRoute';
import axios from 'axios';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const theme = createTheme({
    typography: { fontFamily: 'Poppins, sans-serif' },
    palette: { mode: isDarkMode ? 'dark' : 'light' },
  });

  const toggleTheme = () => setIsDarkMode((prevMode) => !prevMode);
  const toggleCollapse = () => setIsCollapsed((prev) => !prev);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication status...');
        const response = await axios.get('/auth/user', { withCredentials: true });
        if (response.data) {
          console.log('User authenticated:', response.data);
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
        console.log('Authentication check completed, user:', user);
      }
    };
    checkAuth();

    const handleStorageChange = (event) => {
      if (event.key === 'isAuthenticated' && event.newValue !== 'true') {
        console.log('Local storage changed, setting user to null');
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
          <Route path="/login" element={<ProtectedRoute isPublic user={user}><Login setUser={setUser} isDarkMode={isDarkMode} toggleTheme={toggleTheme} /></ProtectedRoute>} />
          <Route path="/forgot-password" element={<ProtectedRoute isPublic user={user}><ForgotPassword /></ProtectedRoute>} />
          <Route path="/signup" element={<ProtectedRoute isPublic user={user}><Signup /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute isPublic user={user}><Login setUser={setUser} isDarkMode={isDarkMode} toggleTheme={toggleTheme} /></ProtectedRoute>} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user}>
                <DashboardLayoutBasic
                  isDarkMode={isDarkMode}
                  toggleTheme={toggleTheme}
                  user={user}
                  setUser={setUser}
                  isCollapsed={isCollapsed}
                  toggleCollapse={toggleCollapse}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin-dashboard"
            element={
              <ProtectedRoute user={user}>
                <SuperAdminDashboard
                  isDarkMode={isDarkMode}
                  toggleTheme={toggleTheme}
                  user={user}
                  setUser={setUser}
                  isCollapsed={isCollapsed}
                  toggleCollapse={toggleCollapse}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/members"
            element={
              <ProtectedRoute user={user}>
                <Members
                  isDarkMode={isDarkMode}
                  toggleTheme={toggleTheme}
                  user={user}
                  setUser={setUser}
                  isCollapsed={isCollapsed}
                  toggleCollapse={toggleCollapse}
                />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;