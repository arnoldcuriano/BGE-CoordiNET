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

  const routes = [
    { path: "/login", element: <Login />, isPublic: true },
    { path: "/signup", element: <Signup />, isPublic: true },
    { path: "/forgot-password", element: <ForgotPassword />, isPublic: true },
    { path: "/reset-password", element: <ResetPassword />, isPublic: true },
    { path: "/welcome", element: <Welcome /> },
    { path: "/dashboard", element: <Dashboard />, pageKey: "dashboard" },
    { path: "/hr-management/members", element: <Members />, pageKey: "hrManagement" },
    { path: "/partners", element: <Partners />, pageKey: "partners" },
    { path: "/hr-management", element: <HRManagement />, pageKey: "hrManagement" },
    { path: "/finance-management", element: <PlaceholderPage pageName="Finance Management" />, pageKey: "financeManagement" },
    { path: "/finance-management/members-list", element: <PlaceholderPage pageName="Finance Management" />, pageKey: "financeManagement" },
    { path: "/projects", element: <Projects />, pageKey: "projects" },
    { path: "/projects/active", element: <Projects />, pageKey: "projects" },
    { path: "/projects/archived", element: <Projects />, pageKey: "projects" },
    { path: "/it-inventory", element: <ITInventory />, pageKey: "itInventory" },
    { path: "/quick-tools", element: <QuickTools />, pageKey: "quickTools" },
    { 
      path: "/superadmin-dashboard", 
      element: <ErrorBoundary><SuperAdminDashboard /></ErrorBoundary>, 
      pageKey: "superadminDashboard" 
    },
    { path: "/profile-settings", element: <ProfileSettings />, pageKey: "settings" },
    { path: "/account-settings", element: <AccountSettings />, pageKey: "settings" },
    { path: "/no-access", element: <NoAccess /> },
    { path: "/help", element: <PlaceholderPage pageName="Help" />, pageKey: "help" },
    { path: "/patch-notes", element: <PlaceholderPage pageName="Patch Notes" />, pageKey: "patchNotes" },
    { path: "/analytics", element: <PlaceholderPage pageName="Analytics" />, pageKey: "analytics" },
    { path: "*", element: <PlaceholderPage pageName="Not Found" />, pageKey: "notFound" },
  ];

  return (
    <ThemeProvider value={{ isDarkMode, toggleTheme, muiTheme }}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
              {routes.map(({ path, element, isPublic, pageKey }) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <ProtectedRoute isPublic={isPublic} pageKey={pageKey}>
                      {element}
                    </ProtectedRoute>
                  }
                />
              ))}
            </Routes>
          </Router>
        </AuthProvider>
      </MuiThemeProvider>
    </ThemeProvider>
  );
};

export default App;