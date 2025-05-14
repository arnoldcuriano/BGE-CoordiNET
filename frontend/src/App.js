import React, { useState, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
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
import getMuiTheme from './styles/muiTheme';

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialMode = savedTheme ? savedTheme === 'dark' : prefersDark;
    console.log('App.js: Initial isDarkMode:', initialMode);
    return initialMode;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    console.log('App.js: Saved isDarkMode to localStorage:', isDarkMode);
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      console.log('App.js: Toggled isDarkMode to:', newMode);
      return newMode;
    });
  };

  const muiTheme = useMemo(() => {
    const theme = getMuiTheme(isDarkMode);
    console.log('App.js: muiTheme updated, text.primary:', theme.palette.text.primary, 'text.secondary:', theme.palette.text.secondary);
    console.log('App.js: muiTheme.transitions:', theme.transitions);
    return theme;
  }, [isDarkMode]);

  return (
    <ThemeProvider value={{ isDarkMode, toggleTheme, muiTheme }}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<ProtectedRoute isPublic><Login /></ProtectedRoute>} />
              <Route path="/signup" element={<ProtectedRoute isPublic><Signup /></ProtectedRoute>} />
              <Route path="/forgot-password" element={<ProtectedRoute isPublic><ForgotPassword /></ProtectedRoute>} />
              <Route path="/reset-password" element={<ProtectedRoute isPublic><ResetPassword /></ProtectedRoute>} />
              <Route path="/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute pageKey="dashboard"><Dashboard /></ProtectedRoute>} />
              <Route path="/hr-management/members" element={<ProtectedRoute pageKey="hrManagement"><Members /></ProtectedRoute>} />
              <Route path="/partners" element={<ProtectedRoute pageKey="partners"><Partners /></ProtectedRoute>} />
              <Route path="/hr-management" element={<ProtectedRoute pageKey="hrManagement"><HRManagement /></ProtectedRoute>} />
              <Route path='/finance-management' element={<ProtectedRoute pageKey="financeManagement"><PlaceholderPage pageName="Finance Management" /></ProtectedRoute>} />
              <Route path='/finance-management/members-list' element={<ProtectedRoute pageKey="financeManagement"><PlaceholderPage pageName="Finance Management" /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute pageKey="projects"><Projects /></ProtectedRoute>} />
              <Route path="/projects/active" element={<ProtectedRoute pageKey="projects"><Projects /></ProtectedRoute>} />
              <Route path="/projects/archived" element={<ProtectedRoute pageKey="projects"><Projects /></ProtectedRoute>} />
              <Route path="/it-inventory" element={<ProtectedRoute pageKey="itInventory"><ITInventory /></ProtectedRoute>} />
              <Route path="/quick-tools" element={<ProtectedRoute pageKey="quickTools"><QuickTools /></ProtectedRoute>} />
              <Route
                path="/superadmin-dashboard"
                element={<ProtectedRoute pageKey="superadminDashboard"><ErrorBoundary><SuperAdminDashboard /></ErrorBoundary></ProtectedRoute>}
              />
              <Route path="/profile-settings" element={<ProtectedRoute pageKey="settings"><ProfileSettings /></ProtectedRoute>} />
              <Route path="/account-settings" element={<ProtectedRoute pageKey="settings"><AccountSettings /></ProtectedRoute>} />
              <Route path="/no-access" element={<ProtectedRoute><NoAccess /></ProtectedRoute>} />
              <Route path="/help" element={<ProtectedRoute pageKey="help"><PlaceholderPage pageName="Help" /></ProtectedRoute>} />
              <Route path="/patch-notes" element={<ProtectedRoute pageKey="patchNotes"><PlaceholderPage pageName="Patch Notes" /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute pageKey="analytics"><PlaceholderPage pageName="Analytics" /></ProtectedRoute>} />
              <Route path="*" element={<ProtectedRoute pageKey="notFound"><PlaceholderPage pageName="Not Found" /></ProtectedRoute>} />
            </Routes>
          </Router>
        </AuthProvider>
      </MuiThemeProvider>
    </ThemeProvider>
  );
};

export default App;