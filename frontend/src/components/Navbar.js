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
} from '@mui/material';
import { styled } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Brightness4Icon from '@mui/icons-material/Brightness4'; // Dark mode icon
import Brightness7Icon from '@mui/icons-material/Brightness7'; // Light mode icon

const Navbar = ({ isDarkMode, toggleTheme, handleDrawerToggle, user, handleLogout, logoutLoading, isCollapsed }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  console.log('Navbar - isCollapsed:', isCollapsed); // Debugging

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // ✅ Custom MaterialUISwitch with Icons
  const MaterialUISwitch = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    padding: '4px 12px',
    borderRadius: '20px',
    backgroundColor: isDarkMode ? '#333' : '#ccc',
    transition: 'background 0.3s',
    '&:hover': {
      backgroundColor: isDarkMode ? '#555' : '#bbb',
    }
  }));

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { 
          xs: '100%',
          sm: isCollapsed ? `calc(100% - 64px)` : `calc(100% - 240px)`
        },
        ml: { 
          xs: 0,
          sm: isCollapsed ? '64px' : '240px'
        },
        transition: theme => theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        zIndex: (theme) => theme.zIndex.drawer + 1,
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
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Notifications">
            <IconButton color="inherit">
              <Badge badgeContent={4} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Switch with Icons */}
          <Tooltip title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <MaterialUISwitch onClick={toggleTheme}>
              {isDarkMode ? <Brightness7Icon sx={{ color: '#ffb74d' }} /> : <Brightness4Icon sx={{ color: '#64b5f6' }} />}
              <Typography variant="body2">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</Typography>
            </MaterialUISwitch>
          </Tooltip>

          <Tooltip title={user.displayName || 'User Menu'}>
            <IconButton color="inherit" onClick={handleMenuOpen}>
              <Avatar 
                alt={user.displayName} 
                src={user.profilePicture}
                sx={{ width: 32, height: 32 }}
              />
            </IconButton>
          </Tooltip>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleMenuClose}>
            <Typography>Profile</Typography>
          </MenuItem>
          <MenuItem onClick={handleLogout} disabled={logoutLoading}>
            {logoutLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} />
                <Typography>Logging out...</Typography>
              </Box>
            ) : (
              <Typography>Logout</Typography>
            )}
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
