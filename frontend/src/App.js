import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Welcome from './pages/Welcome';
import Members from './pages/Members';
import Partners from './pages/Partners';
import HRManagement from './pages/HRManagement';
import Projects from './pages/Projects';
import ITInventory from './pages/ITInventory';
import QuickTools from './pages/QuickTools';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ProfileSettings from './pages/ProfileSettings';
import AccountSettings from './pages/AccountSettings';
import NoAccess from './pages/NoAccess';
import PlaceholderPage from './pages/PlaceholderPage';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('theme');
    if (savedMode) {
      try {
        return JSON.parse(savedMode);
      } catch (error) {
        console.error('Error parsing theme from localStorage:', error.message);
        localStorage.removeItem('theme');
        return false;
      }
    }
    return false;
  });

  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem('theme', JSON.stringify(newMode));
      return newMode;
    });
  };

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDarkMode ? 'dark' : 'light',
          primary: { main: '#1976d2' },
          secondary: { main: '#34A853' },
          text: {
            primary: isDarkMode ? '#ffffff' : '#333333',
            secondary: isDarkMode ? '#cccccc' : '#666666',
          },
          background: {
            default: isDarkMode ? '#121212' : '#f5f5f5',
            paper: isDarkMode ? '#1e1e1e' : '#ffffff',
            listItem: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)',
          },
          border: {
            main: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
          },
        },
        custom: {
          shadow: {
            paper: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
            listItem: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.05)',
          },
        },
        typography: {
          fontFamily: '"Poppins", sans-serif',
        },
      }),
    [isDarkMode]
  );

  console.log('App.js: Rendering with isDarkMode:', isDarkMode);

  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/login" element={<ProtectedRoute isPublic><Login isDarkMode={isDarkMode} toggleTheme={toggleTheme} /></ProtectedRoute>} />
            <Route path="/signup" element={<ProtectedRoute isPublic><Signup isDarkMode={isDarkMode} toggleTheme={toggleTheme} /></ProtectedRoute>} />
            <Route path="/forgot-password" element={<ProtectedRoute isPublic><ForgotPassword isDarkMode={isDarkMode} toggleTheme={toggleTheme} /></ProtectedRoute>} />
            <Route path="/welcome" element={<ProtectedRoute><Welcome isDarkMode={isDarkMode} toggleTheme={toggleTheme} isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute pageKey="dashboard"><Dashboard isDarkMode={isDarkMode} toggleTheme={toggleTheme} isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} /></ProtectedRoute>} />
            <Route path="/members" element={<ProtectedRoute pageKey="members"><Members isDarkMode={isDarkMode} toggleTheme={toggleTheme} isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} /></ProtectedRoute>} />
            <Route path="/partners" element={<ProtectedRoute pageKey="partners"><Partners isDarkMode={isDarkMode} toggleTheme={toggleTheme} isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} /></ProtectedRoute>} />
            <Route path="/hr-management" element={<ProtectedRoute pageKey="hrManagement"><HRManagement isDarkMode={isDarkMode} toggleTheme={toggleTheme} isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute pageKey="projects"><Projects isDarkMode={isDarkMode} toggleTheme={toggleTheme} isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} /></ProtectedRoute>} />
            <Route path="/projects/active" element={<ProtectedRoute pageKey="projects"><Projects isDarkMode={isDarkMode} toggleTheme={toggleTheme} isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} /></ProtectedRoute>} />
            <Route path="/projects/archived" element={<ProtectedRoute pageKey="projects"><Projects isDarkMode={isDarkMode} toggleTheme={toggleTheme} isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} /></ProtectedRoute>} />
            <Route path="/it-inventory" element={<ProtectedRoute pageKey="itInventory"><ITInventory isDarkMode={isDarkMode} toggleTheme={toggleTheme} isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} /></ProtectedRoute>} />
            <Route path="/quick-tools" element={<ProtectedRoute pageKey="quickTools"><QuickTools isDarkMode={isDarkMode} toggleTheme={toggleTheme} isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} /></ProtectedRoute>} />
            <Route
              path="/superadmin-dashboard"
              element={
                <ProtectedRoute pageKey="superadminDashboard">
                  <ErrorBoundary>
                    <SuperAdminDashboard isDarkMode={isDarkMode} toggleTheme={toggleTheme} isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route path="/profile-settings" element={<ProtectedRoute><ProfileSettings isDarkMode={isDarkMode} toggleTheme={toggleTheme} isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} /></ProtectedRoute>} />
            <Route path="/account-settings" element={<ProtectedRoute><AccountSettings isDarkMode={isDarkMode} toggleTheme={toggleTheme} isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} /></ProtectedRoute>} />
            <Route path="/no-access" element={<ProtectedRoute><NoAccess isDarkMode={isDarkMode} toggleTheme={toggleTheme} isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} /></ProtectedRoute>} />
            <Route path="/help" element={<ProtectedRoute><PlaceholderPage isDarkMode={isDarkMode} toggleTheme={toggleTheme} pageName="Help" isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} /></ProtectedRoute>} />
            <Route path="/patch-notes" element={<ProtectedRoute><PlaceholderPage isDarkMode={isDarkMode} toggleTheme={toggleTheme} pageName="Patch Notes" isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><PlaceholderPage isDarkMode={isDarkMode} toggleTheme={toggleTheme} pageName="Analytics" isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} /></ProtectedRoute>} />
            <Route path="*" element={<ProtectedRoute><PlaceholderPage isDarkMode={isDarkMode} toggleTheme={toggleTheme} pageName="Not Found" isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} /></ProtectedRoute>} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;