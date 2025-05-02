import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Switch,
  Tooltip,
  TextField,
  Badge,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link, useNavigate } from 'react-router-dom';
import { LightMode, DarkMode, Notifications, Search, Apps, ChevronLeft, ChevronRight, Palette } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ handleDrawerToggle, user, isDarkMode, toggleTheme, isCollapsed, toggleCollapse }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [appAnchorEl, setAppAnchorEl] = useState(null);
  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const open = Boolean(anchorEl);
  const notifOpen = Boolean(notifAnchorEl);
  const appOpen = Boolean(appAnchorEl);
  const colorOpen = Boolean(colorAnchorEl);
  const navigate = useNavigate();
  const { handleLogout } = useAuth();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotifMenu = (event) => {
    setNotifAnchorEl(event.currentTarget);
  };

  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  const handleAppMenu = (event) => {
    setAppAnchorEl(event.currentTarget);
  };

  const handleAppClose = () => {
    setAppAnchorEl(null);
  };

  const handleColorMenu = (event) => {
    setColorAnchorEl(event.currentTarget);
  };

  const handleColorClose = () => {
    setColorAnchorEl(null);
  };

  const handleLogoutClick = async () => {
    handleClose();
    const success = await handleLogout(navigate);
    if (success) {
      navigate('/login');
    }
  };

  const handleColorSelect = (color) => {
    // Update theme primary color (requires theme update in App.js)
    console.log(`Selected color: ${color}`);
    handleColorClose();
  };

  const notifications = [
    { id: 1, message: 'New member added to the team' },
    { id: 2, message: 'Project deadline approaching' },
  ];

  const apps = [
    { name: 'CoordiNET Dashboard', path: '/dashboard' },
    { name: 'CoordiNET Analytics', path: '/analytics' },
  ];

  const colors = [
    { name: 'Blue', value: '#1976d2' },
    { name: 'Green', value: '#34A853' },
    { name: 'Purple', value: '#9C27B0' },
  ];

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: isDarkMode
          ? 'linear-gradient(90deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%)'
          : 'linear-gradient(90deg, rgba(224, 247, 250, 0.9) 0%, rgba(179, 229, 252, 0.9) 100%)',
        backdropFilter: 'blur(10px)',
        boxShadow: isDarkMode
          ? '0 8px 32px rgba(0, 0, 0, 0.5)'
          : '0 8px 32px rgba(0, 0, 0, 0.1)',
        borderBottom: isDarkMode
          ? '1px solid rgba(255, 255, 255, 0.1)'
          : '1px solid rgba(0, 0, 0, 0.1)',
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
        <IconButton
          color="inherit"
          aria-label={isCollapsed ? 'expand sidebar' : 'collapse sidebar'}
          onClick={toggleCollapse}
          sx={{ mr: 2, display: { xs: 'none', sm: 'inline-flex' } }}
        >
          {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
        <Typography
          variant="h6"
          noWrap
          component={Link}
          to="/dashboard"
          sx={{
            flexGrow: 1,
            fontFamily: '"Poppins", sans-serif',
            fontWeight: 600,
            color: isDarkMode ? '#ffffff' : '#1976d2',
            textShadow: isDarkMode ? '0 0 8px rgba(255, 255, 255, 0.3)' : 'none',
            textDecoration: 'none',
          }}
        >
          BGE CoordiNET
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {searchOpen ? (
            <TextField
              size="small"
              placeholder="Search..."
              autoFocus
              onBlur={() => setSearchOpen(false)}
              sx={{
                mr: 2,
                width: '200px',
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                borderRadius: '4px',
                '& .MuiInputBase-input': {
                  color: isDarkMode ? '#ffffff' : '#1976d2',
                  fontFamily: '"Poppins", sans-serif',
                },
              }}
            />
          ) : (
            <IconButton
              color="inherit"
              onClick={() => setSearchOpen(true)}
              sx={{ mr: 1 }}
            >
              <Search />
            </IconButton>
          )}
          <IconButton
            color="inherit"
            onClick={handleNotifMenu}
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={notifications.length} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          <Menu
            anchorEl={notifAnchorEl}
            open={notifOpen}
            onClose={handleNotifClose}
            PaperProps={{
              sx: {
                background: isDarkMode
                  ? 'linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%)'
                  : 'linear-gradient(135deg, rgba(224, 247, 250, 0.9) 0%, rgba(179, 229, 252, 0.9) 100%)',
                backdropFilter: 'blur(10px)',
                boxShadow: isDarkMode
                  ? '0 8px 32px rgba(0, 0, 0, 0.5)'
                  : '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: isDarkMode
                  ? '1px solid rgba(255, 255, 255, 0.1)'
                  : '1px solid rgba(0, 0, 0, 0.1)',
                maxHeight: '300px',
                width: '250px',
              },
            }}
          >
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <MenuItem
                  key={notif.id}
                  onClick={handleNotifClose}
                  sx={{
                    fontFamily: '"Poppins", sans-serif',
                    fontSize: '0.85rem',
                    color: isDarkMode ? '#ffffff' : '#1976d2',
                    '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                    },
                  }}
                >
                  {notif.message}
                </MenuItem>
              ))
            ) : (
              <MenuItem
                sx={{
                  fontFamily: '"Poppins", sans-serif',
                  fontSize: '0.85rem',
                  color: isDarkMode ? '#ffffff' : '#1976d2',
                }}
              >
                No notifications
              </MenuItem>
            )}
          </Menu>
          <IconButton
            color="inherit"
            onClick={handleAppMenu}
            sx={{ mr: 1 }}
          >
            <Apps />
          </IconButton>
          <Menu
            anchorEl={appAnchorEl}
            open={appOpen}
            onClose={handleAppClose}
            PaperProps={{
              sx: {
                background: isDarkMode
                  ? 'linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%)'
                  : 'linear-gradient(135deg, rgba(224, 247, 250, 0.9) 0%, rgba(179, 229, 252, 0.9) 100%)',
                backdropFilter: 'blur(10px)',
                boxShadow: isDarkMode
                  ? '0 8px 32px rgba(0, 0, 0, 0.5)'
                  : '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: isDarkMode
                  ? '1px solid rgba(255, 255, 255, 0.1)'
                  : '1px solid rgba(0, 0, 0, 0.1)',
              },
            }}
          >
            {apps.map((app) => (
              <MenuItem
                key={app.name}
                onClick={handleAppClose}
                component={Link}
                to={app.path}
                sx={{
                  fontFamily: '"Poppins", sans-serif',
                  fontSize: '0.85rem',
                  color: isDarkMode ? '#ffffff' : '#1976d2',
                  '&:hover': {
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                  },
                }}
              >
                {app.name}
              </MenuItem>
            ))}
          </Menu>
          <IconButton
            color="inherit"
            onClick={handleColorMenu}
            sx={{ mr: 1 }}
          >
            <Palette />
          </IconButton>
          <Menu
            anchorEl={colorAnchorEl}
            open={colorOpen}
            onClose={handleColorClose}
            PaperProps={{
              sx: {
                background: isDarkMode
                  ? 'linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%)'
                  : 'linear-gradient(135deg, rgba(224, 247, 250, 0.9) 0%, rgba(179, 229, 252, 0.9) 100%)',
                backdropFilter: 'blur(10px)',
                boxShadow: isDarkMode
                  ? '0 8px 32px rgba(0, 0, 0, 0.5)'
                  : '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: isDarkMode
                  ? '1px solid rgba(255, 255, 255, 0.1)'
                  : '1px solid rgba(0, 0, 0, 0.1)',
              },
            }}
          >
            {colors.map((color) => (
              <MenuItem
                key={color.name}
                onClick={() => handleColorSelect(color.value)}
                sx={{
                  fontFamily: '"Poppins", sans-serif',
                  fontSize: '0.85rem',
                  color: isDarkMode ? '#ffffff' : '#1976d2',
                  '&:hover': {
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: color.value,
                      borderRadius: '50%',
                      mr: 1,
                    }}
                  />
                  {color.name}
                </Box>
              </MenuItem>
            ))}
          </Menu>
          <Switch
            checked={isDarkMode}
            onChange={toggleTheme}
            icon={<LightMode sx={{ color: '#ffb300' }} />}
            checkedIcon={<DarkMode sx={{ color: '#1976d2' }} />}
          />
          {user && (
            <>
              <Tooltip
                title={`${user.firstName} ${user.lastName}`}
                arrow
                placement="bottom"
                sx={{
                  fontFamily: '"Poppins", sans-serif',
                  fontSize: '0.85rem',
                }}
              >
                <IconButton
                  onClick={handleMenu}
                  sx={{
                    p: 0,
                    '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                      boxShadow: isDarkMode ? '0 0 10px rgba(255, 255, 255, 0.3)' : 'none',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Avatar
                    alt={`${user.firstName} ${user.lastName}`}
                    src={user.profilePicture}
                    sx={{
                      width: 36,
                      height: 36,
                      border: isDarkMode
                        ? '2px solid rgba(255, 255, 255, 0.3)'
                        : '2px solid rgba(0, 0, 0, 0.3)',
                    }}
                  />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                  sx: {
                    background: isDarkMode
                      ? 'linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%)'
                      : 'linear-gradient(135deg, rgba(224, 247, 250, 0.9) 0%, rgba(179, 229, 252, 0.9) 100%)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: isDarkMode
                      ? '0 8px 32px rgba(0, 0, 0, 0.5)'
                      : '0 8px 32px rgba(0, 0, 0, 0.1)',
                    border: isDarkMode
                      ? '1px solid rgba(255, 255, 255, 0.1)'
                      : '1px solid rgba(0, 0, 0, 0.1)',
                  },
                }}
              >
                <MenuItem
                  onClick={handleClose}
                  component={Link}
                  to="/profile-settings"
                  sx={{
                    fontFamily: '"Poppins", sans-serif',
                    fontSize: '0.85rem',
                    color: isDarkMode ? '#ffffff' : '#1976d2',
                    '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                    },
                  }}
                >
                  Profile Settings
                </MenuItem>
                <MenuItem
                  onClick={handleClose}
                  component={Link}
                  to="/account-settings"
                  sx={{
                    fontFamily: '"Poppins", sans-serif',
                    fontSize: '0.85rem',
                    color: isDarkMode ? '#ffffff' : '#1976d2',
                    '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                    },
                  }}
                >
                  Account Settings
                </MenuItem>
                <MenuItem
                  onClick={handleLogoutClick}
                  sx={{
                    fontFamily: '"Poppins", sans-serif',
                    fontSize: '0.85rem',
                    color: isDarkMode ? '#ffffff' : '#1976d2',
                    '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                    },
                  }}
                >
                  Logout
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;