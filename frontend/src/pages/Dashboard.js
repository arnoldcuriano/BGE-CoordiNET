import * as React from 'react';
import { 
  Box, 
  Typography, 
  Toolbar, 
  CircularProgress, 
  Container, 
  Paper 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout'; // Import the Layout component
import MainContent from '../components/MainContent'; // Import the MainContent component

// Main Dashboard component
export default function DashboardLayoutBasic({ isDarkMode, toggleTheme }) {
  const [logoutLoading, setLogoutLoading] = React.useState(false);
  const [loading, setLoading] = React.useState(true); // Add loading state
  const [user, setUser] = React.useState({
    displayName: 'John Doe',
    profilePicture: '/static/images/avatar/1.jpg',
  });
  const navigate = useNavigate();

  // Fetch user data from the backend
  React.useEffect(() => {
    const checkAuth = async () => {
      const authState = localStorage.getItem('isAuthenticated');
      if (authState === 'true') {
        setLoading(false); // User is authenticated
      } else {
        try {
          const response = await axios.get('http://localhost:5000/auth/user', { withCredentials: true });
          localStorage.setItem('isAuthenticated', 'true'); // Update localStorage
          setLoading(false);
        } catch (error) {
          localStorage.removeItem('isAuthenticated'); // Clear localStorage
          navigate('/login'); // Redirect to Login if not authenticated
        }
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = () => {
    setLogoutLoading(true);
    axios.get('http://localhost:5000/auth/logout', { withCredentials: true })
      .then(() => {
        localStorage.removeItem('isAuthenticated'); // Clear localStorage
        setLogoutLoading(false);
        navigate('/login');
      })
      .catch((error) => {
        console.error('Error logging out:', error);
        setLogoutLoading(false);
      });
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Layout
      isDarkMode={isDarkMode}
      toggleTheme={toggleTheme}
      user={user}
      handleLogout={handleLogout}
      logoutLoading={logoutLoading}
    >
      <MainContent />
    </Layout>
  );
}