import React, { useState, useEffect } from 'react';
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
  ListItemSecondaryAction,
  Button,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { Link, useNavigate } from 'react-router-dom';
import { LightMode, DarkMode, Notifications, Search, Apps, Palette } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

const Navbar = ({ handleDrawerToggle, user, open, handleDrawerOpen, handleDrawerClose }) => {
  const { isDarkMode, toggleTheme, muiTheme } = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [appAnchorEl, setAppAnchorEl] = useState(null);
  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const menuOpen = Boolean(anchorEl);
  const notifOpen = Boolean(notifAnchorEl);
  const appOpen = Boolean(appAnchorEl);
  const colorOpen = Boolean(colorAnchorEl);
  const navigate = useNavigate();
  const { handleLogout } = useAuth();

  // Determine the color for icons and text based on mode
  const iconTextColor = isDarkMode ? muiTheme.palette.text.primary : muiTheme.palette.primary.main;

  // Determine the background gradient based on mode
  const backgroundGradient = isDarkMode
    ? muiTheme.custom.gradients.backgroundDefault
    : 'linear-gradient(90deg, #e3ffe7 0%, #d9e7ff 100%)';

  // Fetch notifications on component mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Fetch inventory notifications
        const inventoryResponse = await axios.get('/api/inventory/notifications');
        // Fetch partner notifications (assuming endpoint exists)
        const partnerResponse = await axios.get('/api/partners/notifications');
        // Combine notifications
        const combinedNotifications = [
          ...inventoryResponse.data.map(n => ({ ...n, type: 'inventory' })),
          ...partnerResponse.data.map(n => ({ ...n, type: 'partner' })),
        ];
        // Sort by createdAt (newest first)
        combinedNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setNotifications(combinedNotifications);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchNotifications();
  }, []);

  const handleMarkNotificationRead = async (notificationId, type) => {
    try {
      if (type === 'inventory') {
        await axios.post(`/api/inventory/notifications/${notificationId}/read`);
      } else if (type === 'partner') {
        await axios.post(`/api/partners/notifications/${notificationId}/read`);
      }
      setNotifications(notifications.map(n => n._id === notificationId ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

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
    console.log(`Selected color: ${color}`);
    handleColorClose();
  };

  const handleSidebarToggle = () => {
    if (window.innerWidth < 600) {
      handleDrawerToggle();
    } else {
      if (open) {
        handleDrawerClose();
      } else {
        handleDrawerOpen();
      }
    }
  };

  const apps = [
    { name: 'CoordiNET Dashboard', path: '/dashboard' },
    { name: 'CoordiNET Analytics', path: '/analytics' },
  ];

  const colors = [
    { name: 'Blue', value: '#1976d2' },
    { name: 'Green', value: '#34A853' },
    { name: 'Purple', value: '#9C27B0' },
  ];

  const transitionDuration = muiTheme.transitions?.duration?.standard ?? 300;

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: backgroundGradient,
        backdropFilter: 'blur(10px)',
        boxShadow: muiTheme.custom.shadows.paper,
        borderBottom: `1px solid ${muiTheme.palette.border.main}`,
        height: '64px',
      }}
    >
      <Toolbar
        sx={{
          height: '64px',
          minHeight: '64px !important',
          paddingLeft: { xs: 0, sm: 0 },
          paddingRight: { xs: '16px', sm: '24px' },
          background: backgroundGradient,
        }}
      >
        <IconButton
          color="inherit"
          aria-label={open ? "close drawer" : "open drawer"}
          edge="start"
          onClick={handleSidebarToggle}
          sx={{
            mr: 2,
            ml: 1,
            color: iconTextColor,
            '&:hover': {
              backgroundColor: muiTheme.custom.gradients.listItemHover,
            },
            transition: `all ${transitionDuration}ms ${muiTheme.custom.transitions?.easing?.easeInOut ?? 'ease-in-out'}`,
          }}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </IconButton>
        <Typography
          variant="h6"
          noWrap
          component={Link}
          to="/dashboard"
          sx={{
            flexGrow: 1,
            fontFamily: muiTheme.typography.fontFamily,
            fontWeight: 700,
            color: muiTheme.palette.primary.main,
            textDecoration: 'none',
          }}
        >
          BGE
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              display: searchOpen ? 'block' : 'none',
              width: searchOpen ? '200px' : '0px',
              overflow: 'hidden',
              transition: `width ${transitionDuration}ms ${muiTheme.custom.transitions?.easing?.easeInOut ?? 'ease-in-out'}`,
              mr: searchOpen ? 2 : 0,
            }}
          >
            <TextField
              size="small"
              placeholder="Search..."
              autoFocus
              onBlur={() => setSearchOpen(false)}
              sx={{
                width: '200px',
                backgroundColor: muiTheme.custom.gradients.listItem,
                borderRadius: '12px',
                '& .MuiInputBase-root': {
                  border: 'none',
                  background: 'transparent',
                  color: iconTextColor,
                  fontFamily: muiTheme.typography.fontFamily,
                },
                '& .MuiInputBase-input': {
                  padding: '8px 16px',
                },
                transition: `all ${transitionDuration}ms ${muiTheme.custom.transitions?.easing?.easeInOut ?? 'ease-in-out'}`,
              }}
            />
          </Box>
          {!searchOpen && (
            <IconButton
              color="inherit"
              onClick={() => setSearchOpen(true)}
              sx={{
                mr: 1,
                color: iconTextColor,
                '&:hover': {
                  backgroundColor: muiTheme.custom.gradients.listItemHover,
                },
                transition: `all ${transitionDuration}ms ${muiTheme.custom.transitions?.easing?.easeInOut ?? 'ease-in-out'}`,
              }}
            >
              <Search />
            </IconButton>
          )}
          <IconButton
            color="inherit"
            onClick={handleNotifMenu}
            sx={{
              mr: 1,
              color: iconTextColor,
              '&:hover': {
                backgroundColor: muiTheme.custom.gradients.listItemHover,
              },
              transition: `all ${transitionDuration}ms ${muiTheme.custom.transitions?.easing?.easeInOut ?? 'ease-in-out'}`,
            }}
          >
            <Badge badgeContent={notifications.filter(n => !n.read).length} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          <Menu
            anchorEl={notifAnchorEl}
            open={notifOpen}
            onClose={handleNotifClose}
            PaperProps={{
              sx: {
                background: muiTheme.palette.background.glass,
                boxShadow: muiTheme.custom.shadows.paper,
                border: muiTheme.palette.border.glass,
                maxHeight: '300px',
                width: '250px',
                overflowY: 'auto',
              },
            }}
          >
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <ListItem
                  key={notif._id}
                  sx={{
                    fontFamily: muiTheme.typography.fontFamily,
                    fontSize: '0.85rem',
                    color: iconTextColor,
                    backgroundColor: notif.read ? 'transparent' : muiTheme.palette.action.hover,
                    '&:hover': {
                      backgroundColor: muiTheme.custom.gradients.listItemHover,
                    },
                  }}
                >
                  <ListItemText
                    primary={notif.message}
                    secondary={new Date(notif.createdAt).toLocaleString()}
                    primaryTypographyProps={{
                      fontSize: '0.85rem',
                    }}
                    secondaryTypographyProps={{
                      fontSize: '0.75rem',
                    }}
                  />
                  <ListItemSecondaryAction>
                    {!notif.read && (
                      <Button
                        onClick={() => handleMarkNotificationRead(notif._id, notif.type)}
                        sx={{ color: muiTheme.palette.primary.main, fontSize: '0.75rem' }}
                      >
                        Mark as Read
                      </Button>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))
            ) : (
              <MenuItem
                sx={{
                  fontFamily: muiTheme.typography.fontFamily,
                  fontSize: '0.85rem',
                  color: iconTextColor,
                }}
              >
                No notifications
              </MenuItem>
            )}
          </Menu>
          <IconButton
            color="inherit"
            onClick={handleAppMenu}
            sx={{
              mr: 1,
              color: iconTextColor,
              '&:hover': {
                backgroundColor: muiTheme.custom.gradients.listItemHover,
              },
              transition: `all ${transitionDuration}ms ${muiTheme.custom.transitions?.easing?.easeInOut ?? 'ease-in-out'}`,
            }}
          >
            <Apps />
          </IconButton>
          <Menu
            anchorEl={appAnchorEl}
            open={appOpen}
            onClose={handleAppClose}
            PaperProps={{
              sx: {
                background: muiTheme.palette.background.glass,
                boxShadow: muiTheme.custom.shadows.paper,
                border: muiTheme.palette.border.glass,
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
                  fontFamily: muiTheme.typography.fontFamily,
                  fontSize: '0.85rem',
                  color: iconTextColor,
                  '&:hover': {
                    backgroundColor: muiTheme.custom.gradients.listItemHover,
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
            sx={{
              mr: 1,
              color: iconTextColor,
              '&:hover': {
                backgroundColor: muiTheme.custom.gradients.listItemHover,
              },
              transition: `all ${transitionDuration}ms ${muiTheme.custom.transitions?.easing?.easeInOut ?? 'ease-in-out'}`,
            }}
          >
            <Palette />
          </IconButton>
          <Menu
            anchorEl={colorAnchorEl}
            open={colorOpen}
            onClose={handleColorClose}
            PaperProps={{
              sx: {
                background: muiTheme.palette.background.glass,
                boxShadow: muiTheme.custom.shadows.paper,
                border: muiTheme.palette.border.glass,
              },
            }}
          >
            {colors.map((color) => (
              <MenuItem
                key={color.name}
                onClick={() => handleColorSelect(color.value)}
                sx={{
                  fontFamily: muiTheme.typography.fontFamily,
                  fontSize: '0.85rem',
                  color: iconTextColor,
                  '&:hover': {
                    backgroundColor: muiTheme.custom.gradients.listItemHover,
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
            checkedIcon={<DarkMode sx={{ color: muiTheme.palette.primary.main }} />}
            sx={{
              '& .MuiSwitch-track': {
                backgroundColor: iconTextColor,
              },
              '& .MuiSwitch-thumb': {
                backgroundColor: muiTheme.palette.background.default,
              },
            }}
          />
          {user && (
            <>
              <Tooltip
                title={`${user.firstName} ${user.lastName}`}
                arrow
                placement="bottom"
                sx={{
                  fontFamily: muiTheme.typography.fontFamily,
                  fontSize: '0.85rem',
                }}
              >
                <IconButton
                  onClick={handleMenu}
                  sx={{
                    p: 0,
                    '&:hover': {
                      backgroundColor: muiTheme.custom.gradients.listItemHover,
                    },
                    transition: `all ${transitionDuration}ms ${muiTheme.custom.transitions?.easing?.easeInOut ?? 'ease-in-out'}`,
                  }}
                >
                  <Avatar
                    alt={`${user.firstName} ${user.lastName}`}
                    src={user.profilePicture}
                    sx={{
                      width: 36,
                      height: 36,
                    }}
                  />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleClose}
                PaperProps={{
                  sx: {
                    background: muiTheme.palette.background.glass,
                    boxShadow: muiTheme.custom.shadows.paper,
                    border: muiTheme.palette.border.glass,
                  },
                }}
              >
                <MenuItem
                  onClick={handleClose}
                  component={Link}
                  to="/profile-settings"
                  sx={{
                    fontFamily: muiTheme.typography.fontFamily,
                    fontSize: '0.85rem',
                    color: iconTextColor,
                    '&:hover': {
                      backgroundColor: muiTheme.custom.gradients.listItemHover,
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
                    fontFamily: muiTheme.typography.fontFamily,
                    fontSize: '0.85rem',
                    color: iconTextColor,
                    '&:hover': {
                      backgroundColor: muiTheme.custom.gradients.listItemHover,
                    },
                  }}
                >
                  Account Settings
                </MenuItem>
                <MenuItem
                  onClick={handleLogoutClick}
                  sx={{
                    fontFamily: muiTheme.typography.fontFamily,
                    fontSize: '0.85rem',
                    color: iconTextColor,
                    '&:hover': {
                      backgroundColor: muiTheme.custom.gradients.listItemHover,
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