import React, { useState, useMemo } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  CircularProgress,
  Collapse,
  Tooltip,
} from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import GroupIcon from '@mui/icons-material/Group';
import HelpIcon from '@mui/icons-material/Help';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import DescriptionIcon from '@mui/icons-material/Description';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AddCardIcon from '@mui/icons-material/AddCard';

const Sidebar = ({
  mobileOpen,
  handleDrawerToggle,
  open,
  handleDrawerOpen,
  handleDrawerClose,
  user: propUser,
}) => {
  const { isDarkMode, muiTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { handleLogout, authState } = useAuth();

  // Determine the color for icons and text based on mode
  const iconTextColor = isDarkMode ? muiTheme.palette.text.primary : muiTheme.palette.primary.main;
  const secondaryTextColor = isDarkMode ? muiTheme.palette.text.secondary : muiTheme.palette.primary.main;

  // Determine the background gradient based on mode
  const backgroundGradient = isDarkMode
    ? muiTheme.custom.gradients.backgroundDefault // Keep dark mode gradient
    : 'linear-gradient(190deg, #e3ffe7 0%, #d9e7ff 100%)'; // Light mode gradient

  const [anchorEl, setAnchorEl] = useState(null);
  const [openSubmenu, setOpenSubmenu] = useState({});

  // Extract transition values with fallbacks
  const transitionDuration = muiTheme.transitions?.duration?.standard ?? 300;
  const transitionEasing = muiTheme.transitions?.easing?.easeInOut ?? 'ease-in-out';

  // Debug logging to inspect muiTheme.transitions
  console.log('Sidebar: muiTheme.transitions:', muiTheme.transitions);

  const accessPermissions = useMemo(() => {
    const perms = authState.accessPermissions || {};
    if (perms instanceof Map) {
      const obj = {};
      perms.forEach((value, key) => {
        obj[key] = value;
      });
      return obj;
    }
    return perms;
  }, [authState.accessPermissions]);

  const isLoading = authState.loading;

  const user = useMemo(() => propUser || {
    role: authState.role,
    firstName: authState.firstName,
    lastName: authState.lastName,
    profilePicture: authState.profilePicture
  }, [propUser, authState]);

  const userRole = user.role;
  const isSuperAdmin = userRole === 'superadmin';

  const drawerWidth = 260;
  const miniDrawerWidth = 70;

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogoutClick = async () => {
    handleClose();
    const success = await handleLogout(navigate);
    if (success) {
      navigate('/login');
    }
  };

  const handleSubmenuToggle = (menuText) => {
    setOpenSubmenu((prev) => ({
      ...prev,
      [menuText]: !prev[menuText],
    }));
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', permissionKey: 'dashboard' },
    { text: 'Partners', icon: <AddBusinessIcon />, path: '/partners', permissionKey: 'partners' },
    {
      text: 'HR Management',
      icon: <GroupIcon />,
      path: '/hr-management',
      permissionKey: 'hrManagement',
      subItems: [
        { text: 'Members', path: '/hr-management/members', permissionKey: 'members' }
      ]
    },
    { text: 'Finance Management', icon: <AddCardIcon />, path: '/finance-management', permissionKey: 'financeManagement' },
    {
      text: 'Projects',
      icon: <CreateNewFolderIcon />,
      path: '/projects',
      permissionKey: 'projects',
      subItems: [
        { text: 'Active Projects', path: '/projects/active', permissionKey: 'projects' },
        { text: 'Archived Projects', path: '/projects/archived', permissionKey: 'projects' },
      ],
    },
    { text: 'IT Inventory', icon: <DevicesOtherIcon />, path: '/it-inventory', permissionKey: 'itInventory' },
    { text: 'Quick Tools', icon: <AutoFixHighIcon />, path: '/quick-tools', permissionKey: 'quickTools' },
    { text: 'Super Admin Dashboard', icon: <AdminPanelSettingsIcon />, path: '/superadmin-dashboard', permissionKey: 'superadminDashboard' },
  ];

  const knowledgeBaseItems = [
    { text: 'Help', icon: <HelpIcon />, path: '/help', permissionKey: 'help' },
    { text: 'Patch Notes', icon: <DescriptionIcon />, path: '/patch-notes', permissionKey: 'patchNotes' },
  ];

  const drawerContent = (
    <Box key={isDarkMode ? 'dark' : 'light'} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          px: 2,
          background: backgroundGradient, // Use dynamic gradient
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${muiTheme.palette.border.main}`,
        }}
      >
        {open && (
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontFamily: muiTheme.typography.fontFamily,
              color: muiTheme.palette.primary.main,
            }}
          >
            BGE
          </Typography>
        )}
      </Box>
      <Divider sx={{ borderColor: muiTheme.palette.border.main }} />
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
          <CircularProgress size={24} sx={{ color: muiTheme.palette.primary.main }} />
        </Box>
      ) : (
        <>
          {open && (
            <Typography
              variant="caption"
              sx={{
                px: 2,
                pt: 2,
                pb: 1,
                color: secondaryTextColor,
                fontFamily: muiTheme.typography.fontFamily,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Navigation
            </Typography>
          )}
          <List sx={{ flexGrow: 1, overflow: 'auto' }}>
            {menuItems.map((item) => {
              const isSelected = location.pathname === item.path;
              const hasPermission = isSuperAdmin || (accessPermissions[item.permissionKey] === true);
              const hasSubmenuPermission = item.subItems
                ? item.subItems.some(subItem => isSuperAdmin || (accessPermissions[subItem.permissionKey] === true))
                : false;
              console.log(`Menu item ${item.text} permission:`, hasPermission, `Has Submenu Permission:`, hasSubmenuPermission, `Access Permissions:`, accessPermissions);

              if (!hasPermission && !hasSubmenuPermission) {
                return null;
              }

              return (
                <React.Fragment key={item.text}>
                  <ListItem disablePadding>
                    <ListItemButton
                      component={item.subItems ? 'div' : Link}
                      to={item.subItems ? undefined : item.path}
                      onClick={item.subItems ? () => handleSubmenuToggle(item.text) : undefined}
                      selected={isSelected}
                      sx={{
                        minHeight: 48,
                        justifyContent: open ? 'initial' : 'center',
                        px: 2.5,
                        background: isSelected
                          ? muiTheme.custom.gradients.listItemHover
                          : 'transparent',
                        borderLeft: isSelected
                          ? `3px solid ${muiTheme.palette.primary.main}`
                          : 'none',
                        '&:hover': {
                          background: muiTheme.custom.gradients.listItemHover,
                        },
                        transition: `all ${transitionDuration}ms ${transitionEasing}`,
                      }}
                    >
                      <Tooltip
                        title={item.text}
                        placement="right"
                        disableHoverListener={open}
                        sx={{
                          fontFamily: muiTheme.typography.fontFamily,
                          fontSize: '0.85rem',
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 0,
                            mr: open ? 3 : 'auto',
                            justifyContent: 'center',
                            color: iconTextColor,
                            transition: `all ${transitionDuration}ms ${transitionEasing}`,
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                      </Tooltip>
                      {open && (
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontWeight: isSelected ? 500 : 400,
                            color: iconTextColor,
                            fontFamily: muiTheme.typography.fontFamily,
                            fontSize: '0.9rem',
                          }}
                        />
                      )}
                      {item.subItems && open && (
                        openSubmenu[item.text] ? 
                        <ExpandLessIcon sx={{ color: iconTextColor }} /> : 
                        <ExpandMoreIcon sx={{ color: iconTextColor }} />
                      )}
                    </ListItemButton>
                  </ListItem>
                  {item.subItems && open && (
                    <Collapse
                      in={openSubmenu[item.text]}
                      timeout={transitionDuration}
                      unmountOnExit
                      sx={{
                        transition: `all ${transitionDuration}ms ${transitionEasing}`,
                      }}
                    >
                      <List component="div" disablePadding sx={{ pl: 4 }}>
                        {item.subItems.map((subItem) => {
                          const subHasPermission = isSuperAdmin || (accessPermissions[subItem.permissionKey] === true);
                          console.log(`Submenu item ${subItem.text} permission:`, subHasPermission, `Access Permissions:`, accessPermissions);

                          if (!subHasPermission) {
                            return null;
                          }

                          return (
                            <ListItem key={subItem.text} disablePadding>
                              <ListItemButton
                                component={Link}
                                to={subItem.path}
                                sx={{
                                  minHeight: 36,
                                  px: 2.5,
                                  backgroundColor: location.pathname === subItem.path
                                    ? muiTheme.custom.gradients.listItemHover
                                    : 'transparent',
                                  '&:hover': {
                                    backgroundColor: muiTheme.custom.gradients.listItemHover,
                                  },
                                  transition: `all ${transitionDuration}ms ${transitionEasing}`,
                                }}
                              >
                                <ListItemText
                                  primary={subItem.text}
                                  primaryTypographyProps={{
                                    fontWeight: location.pathname === subItem.path ? 500 : 400,
                                    color: iconTextColor,
                                    fontFamily: muiTheme.typography.fontFamily,
                                    fontSize: '0.85rem',
                                  }}
                                />
                              </ListItemButton>
                            </ListItem>
                          );
                        })}
                      </List>
                    </Collapse>
                  )}
                </React.Fragment>
              );
            })}

            <Divider sx={{ borderColor: muiTheme.palette.border.main, my: 1 }} />
            <Typography
              variant="caption"
              sx={{
                px: 2,
                pt: 2,
                pb: 1,
                color: secondaryTextColor,
                fontFamily: muiTheme.typography.fontFamily,
                display: open ? 'block' : 'none',
              }}
            >
              Knowledge Base
            </Typography>
            <List>
              {knowledgeBaseItems.map((item) => {
                const hasPermission = isSuperAdmin || (accessPermissions[item.permissionKey] === true);
                console.log(`Knowledge Base item ${item.text} permission:`, hasPermission, `Access Permissions:`, accessPermissions);
                if (!hasPermission) return null;

                return (
                  <ListItem key={item.text} disablePadding>
                    <ListItemButton
                      component={Link}
                      to={item.path}
                      sx={{
                        minHeight: 48,
                        px: 2.5,
                        backgroundColor: location.pathname === item.path
                          ? muiTheme.custom.gradients.listItemHover
                          : 'transparent',
                        '&:hover': {
                          backgroundColor: muiTheme.custom.gradients.listItemHover,
                        },
                        transition: `all ${transitionDuration}ms ${transitionEasing}`,
                      }}
                    >
                      <Tooltip
                        title={item.text}
                        placement="right"
                        disableHoverListener={open}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 0,
                            mr: open ? 3 : 'auto',
                            justifyContent: 'center',
                            color: iconTextColor,
                            transition: `all ${transitionDuration}ms ${transitionEasing}`,
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                      </Tooltip>
                      {open && (
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontWeight: location.pathname === item.path ? 500 : 400,
                            color: iconTextColor,
                            fontFamily: muiTheme.typography.fontFamily,
                            fontSize: '0.9rem',
                          }}
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </List>
        </>
      )}
      <Divider sx={{ borderColor: muiTheme.palette.border.main }} />
      <Box
        sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: backgroundGradient, // Use dynamic gradient
          backdropFilter: 'blur(10px)',
          borderTop: `1px solid ${muiTheme.palette.border.main}`,
        }}
      >
        {open && user && (
          <Box sx={{ display: 'flex', alignItems: 'center', maxWidth: '80%' }}>
            <Avatar
              alt={`${user.firstName || ''} ${user.lastName || ''}`}
              src={user.profilePicture}
              sx={{
                width: 36,
                height: 36,
                mr: 1,
              }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: iconTextColor,
                  fontFamily: muiTheme.typography.fontFamily,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'User'}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: secondaryTextColor,
                  fontFamily: muiTheme.typography.fontFamily,
                }}
              >
                {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Unknown Role'}
              </Typography>
            </Box>
          </Box>
        )}
        <IconButton
          onClick={handleMenu}
          sx={{
            color: iconTextColor,
            '&:hover': {
              backgroundColor: muiTheme.custom.gradients.listItemHover,
            },
          }}
        >
          <MoreVertIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
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
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            background: backgroundGradient, // Use dynamic gradient
            backdropFilter: 'blur(10px)',
            borderRight: `1px solid ${muiTheme.palette.border.main}`,
            boxShadow: muiTheme.custom.shadows.paper,
            top: 0,
            height: '100vh',
            transition: `all ${transitionDuration}ms ${transitionEasing}`,
          },
        }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: open ? drawerWidth : miniDrawerWidth,
          flexShrink: 0,
          transition: `all ${transitionDuration}ms ${transitionEasing}`,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : miniDrawerWidth,
            boxSizing: 'border-box',
            background: backgroundGradient, // Use dynamic gradient
            backdropFilter: 'blur(10px)',
            borderRight: `1px solid ${muiTheme.palette.border.main}`,
            boxShadow: muiTheme.custom.shadows.paper,
            top: 0,
            height: '100vh',
            overflowX: 'hidden',
            transition: `all ${transitionDuration}ms ${transitionEasing}`,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;