// Frontend: App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
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
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;