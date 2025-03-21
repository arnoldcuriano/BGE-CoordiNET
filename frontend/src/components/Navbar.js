import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Switch, 
  Badge, 
  Avatar, 
  Menu, 
  MenuItem, 
  CircularProgress,
  Box
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { Box } from '@mui/material';

const Navbar = ({ isDarkMode, toggleTheme, user, handleDrawerToggle, handleLogout, logoutLoading }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const fullName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.displayName || 'User';

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { sm: `calc(100% - 240px)` },
        ml: { sm: '240px' },
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
        <Typography variant="h6" noWrap component="div">
          BGE-CoordiNET
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton color="inherit">
          <Badge badgeContent={4} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
        <IconButton color="inherit" onClick={handleMenuOpen}>
          <Avatar alt={fullName} src={user.profilePicture} />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
          <MenuItem onClick={handleLogout}>
            {logoutLoading ? <CircularProgress size={24} /> : 'Logout'}
          </MenuItem>
        </Menu>
        <Switch checked={isDarkMode} onChange={toggleTheme} />
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;