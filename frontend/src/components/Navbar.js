import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Box,
  Avatar,
  Menu,
  MenuItem,
  CircularProgress,
  Typography,
  Tooltip,
  Stack,
  Divider,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

const Navbar = ({
  isDarkMode,
  toggleTheme,
  handleDrawerToggle,
  user,
  handleLogout,
  logoutLoading,
  isCollapsed,
  toggleCollapse = () => console.log('toggleCollapse not provided'),
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);

  const isDark = theme.palette.mode === 'dark' || isDarkMode;

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleToggleCollapse = () => {
    console.log('Collapse/Expand icon clicked, calling toggleCollapse');
    if (typeof toggleCollapse === 'function') {
      toggleCollapse();
    } else {
      console.error('toggleCollapse is not a function:', toggleCollapse);
    }
  };

  const displayName = user?.displayName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User';

  console.log('Navbar rendering with props:', { isCollapsed, toggleCollapse });

  const MaterialUISwitch = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: '20px',
    backgroundColor: isDark ? '#424242' : '#e0e0e0',
    transition: 'background 0.3s',
    '&:hover': {
      backgroundColor: isDark ? '#616161' : '#bdbdbd',
    },
  }));

  return (
    <AppBar
      position="fixed"
      sx={{
        width: '100%',
        transition: (theme) =>
          theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: isDark ? '#121212' : '#ffffff',
        color: isDark ? '#ffffff' : '#4a4a4a',
        boxShadow: 'none',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon sx={{ fontSize: 24 }} />
        </IconButton>
        <IconButton
          color="inherit"
          aria-label={isCollapsed ? 'expand sidebar' : 'collapse sidebar'}
          onClick={handleToggleCollapse}
          sx={{ mr: 1, display: { xs: 'none', sm: 'block' }, zIndex: 10 }}
        >
          {isCollapsed ? <MenuIcon sx={{ fontSize: 24 }} /> : <MenuOpenIcon sx={{ fontSize: 24 }} />}
        </IconButton>
        <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 'bold', color: isDark ? '#90caf9' : '#4285F4' }}>
          CoordiNET
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Tooltip title="Notifications">
            <IconButton color="inherit">
              <Badge badgeContent={4} color="error">
                <NotificationsIcon sx={{ fontSize: 24 }} />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <MaterialUISwitch onClick={toggleTheme}>
              {isDark ? (
                <Brightness7Icon sx={{ fontSize: 24, color: '#ffb74d' }} />
              ) : (
                <Brightness4Icon sx={{ fontSize: 24, color: '#64b5f6' }} />
              )}
              <Typography variant="body2" sx={{ color: isDark ? '#ffffff' : '#4a4a4a' }}>
                {isDark ? 'Light' : 'Dark'}
              </Typography>
            </MaterialUISwitch>
          </Tooltip>

          <Tooltip title={displayName}>
            <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
              <Avatar
                alt={displayName}
                src={user?.profilePicture}
                sx={{ width: 36, height: 36, border: `2px solid ${isDark ? '#90caf9' : '#4285F4'}` }}
              />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 6,
              sx: {
                mt: 1,
                borderRadius: 2,
                minWidth: 200,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                backgroundColor: isDark ? '#424242' : '#ffffff',
                color: isDark ? '#ffffff' : '#4a4a4a',
              },
            }}
          >
            <MenuItem disabled sx={{ opacity: 1, flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="body1" fontWeight="medium">
                {displayName}
              </Typography>
              <Typography variant="caption" color={isDark ? 'rgba(255,255,255,0.7)' : 'text.secondary'}>
                {user?.role || 'No role'}
              </Typography>
            </MenuItem>
            <Divider sx={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }} />
            <MenuItem onClick={handleMenuClose}>
              <Typography variant="body2">Profile</Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout} disabled={logoutLoading}>
              {logoutLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  <Typography variant="body2">Logging out...</Typography>
                </Box>
              ) : (
                <Typography variant="body2">Logout</Typography>
              )}
            </MenuItem>
          </Menu>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;