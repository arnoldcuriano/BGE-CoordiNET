import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import MainContent from '../components/MainContent';

export default function DashboardLayoutBasic({ isDarkMode, toggleTheme, user, setUser }) {
  const navigate = useNavigate();
  const [logoutLoading, setLogoutLoading] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    console.log('Before toggle - isCollapsed:', isCollapsed);
    setIsCollapsed((prev) => {
      const newState = !prev;
      console.log('After toggle - isCollapsed:', newState);
      return newState;
    });
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/auth/logout', { withCredentials: true });
      console.log('Logout response:', response.data); // Debug
      localStorage.removeItem('isAuthenticated');
      setUser(null); // Reset user state
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error.response?.data || error.message);
    } finally {
      setLogoutLoading(false);
    }
  };

  console.log('Dashboard rendering with user:', user);

  return (
    <Layout
      isDarkMode={isDarkMode}
      toggleTheme={toggleTheme}
      user={user}
      handleLogout={handleLogout}
      logoutLoading={logoutLoading}
      isCollapsed={isCollapsed}
      toggleCollapse={toggleCollapse}
    >
      <MainContent />
    </Layout>
  );
}