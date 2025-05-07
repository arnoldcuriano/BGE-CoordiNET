import React, { useState,  useMemo } from 'react';
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
import PeopleIcon from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import InventoryIcon from '@mui/icons-material/Inventory';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import GroupIcon from '@mui/icons-material/Group';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';

const Sidebar = ({
  mobileOpen,
  handleDrawerToggle,
  open,
  handleDrawerOpen,
  handleDrawerClose,
  user: propUser,
}) => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { handleLogout, authState } = useAuth();

  const [anchorEl, setAnchorEl] = useState(null);
  const [openSubmenu, setOpenSubmenu] = useState(false);
  const openMenu = Boolean(anchorEl);

  const accessPermissions = useMemo(() => authState.accessPermissions || {}, [authState.accessPermissions]);
  const isLoading = authState.loading;

  // Fallback to authState.userRole if propUser is undefined
  const user = useMemo(() => propUser || {
    role: authState.userRole,
    firstName: authState.firstName,
    lastName: authState.lastName,
    profilePicture: authState.profilePicture
  }, [propUser, authState]);

  const userRole = user.role;
  const isSuperAdmin = userRole === 'superadmin';

  const drawerWidth = 240;
  const miniDrawerWidth = 64;

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

  const handleSubmenuToggle = () => {
    setOpenSubmenu((prev) => !prev);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['admin', 'superadmin', 'viewer'], permissionKey: 'dashboard' },
    { text: 'Members', icon: <PeopleIcon />, path: '/members', roles: ['superadmin', 'viewer'], permissionKey: 'members' },
    { text: 'Partners', icon: <BusinessIcon />, path: '/partners', roles: ['superadmin', 'viewer'], permissionKey: 'partners' },
    { text: 'HR Management', icon: <GroupIcon />, path: '/hr-management', roles: ['superadmin', 'viewer'], permissionKey: 'hrManagement' },
    {
      text: 'Projects',
      icon: <WorkIcon />,
      path: '/projects',
      roles: ['superadmin', 'viewer'],
      permissionKey: 'projects',
      subItems: [
        { text: 'Active Projects', path: '/projects/active' },
        { text: 'Archived Projects', path: '/projects/archived' },
      ],
    },
    { text: 'IT Inventory', icon: <InventoryIcon />, path: '/it-inventory', roles: ['superadmin', 'viewer'], permissionKey: 'itInventory' },
    { text: 'Quick Tools', icon: <AutoFixHighIcon />, path: '/quick-tools', roles: ['superadmin', 'viewer'], permissionKey: 'quickTools' },
    { text: 'Super Admin Dashboard', icon: <AdminPanelSettingsIcon />, path: '/superadmin-dashboard', roles: ['superadmin'], permissionKey: 'superadminDashboard' },
  ];

  const knowledgeBaseItems = [
    { text: 'Help', icon: <HelpOutlineIcon />, path: '/help' },
    { text: 'Patch Notes', icon: <DescriptionIcon />, path: '/patch-notes' },
  ];

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ height: '64px', display: 'flex', alignItems: 'center', px: 2 }}>
        {open && (
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: isDarkMode ? '#ffffff' : '#1976d2',
              fontFamily: '"Poppins", sans-serif',
              textShadow: isDarkMode ? '0 0 8px rgba(255, 255, 255, 0.3)' : 'none',
            }}
          >
            BGE CoordiNET
          </Typography>
        )}
      </Box>
      <Divider sx={{ borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
          <CircularProgress size={24} sx={{ color: isDarkMode ? '#ffffff' : '#1976d2' }} />
        </Box>
      ) : (
        <>
          {open && (
            <Typography
              variant="caption"
              sx={{
                px: 2,
                pt: 1,
                color: isDarkMode ? '#cccccc' : '#666666',
                fontFamily: '"Poppins", sans-serif',
                fontSize: '0.75rem',
              }}
            >
              Menu List
            </Typography>
          )}
          <List sx={{ flexGrow: 1, overflow: 'auto' }}>
            {menuItems.map((item) => {
              const isSelected = location.pathname === item.path;
              const hasRole = user && item.roles.includes(userRole);
              const hasPermission = isSuperAdmin || (accessPermissions[item.permissionKey] === true);

              if (!hasRole || !hasPermission) {
                return null;
              }

              return (
                <React.Fragment key={item.text}>
                  <ListItem disablePadding>
                    <ListItemButton
                      component={item.subItems ? 'div' : Link}
                      to={item.subItems ? undefined : item.path}
                      onClick={item.subItems ? handleSubmenuToggle : undefined}
                      selected={isSelected}
                      sx={{
                        minHeight: 48,
                        justifyContent: open ? 'initial' : 'center',
                        px: 2.5,
                        backgroundColor: isSelected
                          ? isDarkMode
                            ? 'rgba(255, 255, 255, 0.2)'
                            : 'rgba(0, 0, 0, 0.1)'
                          : 'transparent',
                        '&:hover': {
                          backgroundColor: isDarkMode
                            ? 'rgba(255, 255, 255, 0.3)'
                            : 'rgba(0, 0, 0, 0.15)',
                          boxShadow: isDarkMode
                            ? '0 0 10px rgba(255, 255, 255, 0.2)'
                            : '0 0 10px rgba(0, 0, 0, 0.1)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <Tooltip
                        title={item.text}
                        placement="right"
                        disableHoverListener={open}
                        sx={{
                          fontFamily: '"Poppins", sans-serif',
                          fontSize: '0.85rem',
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 0,
                            mr: open ? 3 : 'auto',
                            justifyContent: 'center',
                            color: isDarkMode ? '#ffffff' : '#1976d2',
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                      </Tooltip>
                      {open && (
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontWeight: isSelected ? 'bold' : 'normal',
                            color: isDarkMode ? '#ffffff' : '#1976d2',
                            fontFamily: '"Poppins", sans-serif',
                            fontSize: '0.85rem',
                          }}
                        />
                      )}
                      {item.subItems && open && (
                        openSubmenu ? <ExpandLessIcon /> : <ExpandMoreIcon />
                      )}
                    </ListItemButton>
                  </ListItem>
                  {item.subItems && open && (
                    <Collapse in={openSubmenu} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding sx={{ pl: 4 }}>
                        {item.subItems.map((subItem) => (
                          <ListItem key={subItem.text} disablePadding>
                            <ListItemButton
                              component={Link}
                              to={subItem.path}
                              sx={{
                                minHeight: 36,
                                px: 2.5,
                                backgroundColor: location.pathname === subItem.path
                                  ? isDarkMode
                                    ? 'rgba(255, 255, 255, 0.2)'
                                    : 'rgba(0, 0, 0, 0.1)'
                                  : 'transparent',
                                '&:hover': {
                                  backgroundColor: isDarkMode
                                    ? 'rgba(255, 255, 255, 0.3)'
                                    : 'rgba(0, 0, 0, 0.15)',
                                  boxShadow: isDarkMode
                                    ? '0 0 10px rgba(255, 255, 255, 0.2)'
                                    : '0 0 10px rgba(0, 0, 0, 0.1)',
                                },
                                transition: 'all 0.3s ease',
                              }}
                            >
                              <ListItemText
                                primary={subItem.text}
                                primaryTypographyProps={{
                                  fontWeight: location.pathname === subItem.path ? 'bold' : 'normal',
                                  color: isDarkMode ? '#ffffff' : '#1976d2',
                                  fontFamily: '"Poppins", sans-serif',
                                  fontSize: '0.8rem',
                                }}
                              />
                            </ListItemButton>
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  )}
                </React.Fragment>
              );
            })}

            {/* Updated Knowledge Base Section */}
            <Divider sx={{ 
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              my: 1
            }} />
            <Typography
              variant="caption"
              sx={{
                px: 2,
                pt: 2,
                pb: 1,
                color: isDarkMode ? '#cccccc' : '#666666',
                fontFamily: '"Poppins", sans-serif',
                fontSize: '0.75rem',
                display: open ? 'block' : 'none',
              }}
            >
              Knowledge Base
            </Typography>
            <List>
              {knowledgeBaseItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    sx={{
                      minHeight: 48,
                      px: 2.5,
                      backgroundColor: location.pathname === item.path
                        ? isDarkMode
                          ? 'rgba(255, 255, 255, 0.2)'
                          : 'rgba(0, 0, 0, 0.1)'
                        : 'transparent',
                      '&:hover': {
                        backgroundColor: isDarkMode
                          ? 'rgba(255, 255, 255, 0.3)'
                          : 'rgba(0, 0, 0, 0.15)',
                        boxShadow: isDarkMode
                          ? '0 0 10px rgba(255, 255, 255, 0.2)'
                          : '0 0 10px rgba(0, 0, 0, 0.1)',
                      },
                      transition: 'all 0.3s ease',
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
                          color: isDarkMode ? '#ffffff' : '#1976d2',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                    </Tooltip>
                    {open && (
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                          color: isDarkMode ? '#ffffff' : '#1976d2',
                          fontFamily: '"Poppins", sans-serif',
                          fontSize: '0.85rem',
                        }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </List>
        </>
      )}
      <Divider sx={{ borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
      <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {open && user && (
          <Box sx={{ display: 'flex', alignItems: 'center', maxWidth: '80%' }}>
            <Avatar
              alt={`${user.firstName || ''} ${user.lastName || ''}`}
              src={user.profilePicture}
              sx={{
                width: 36,
                height: 36,
                mr: 1,
                border: isDarkMode
                  ? '2px solid rgba(255, 255, 255, 0.3)'
                  : '2px solid rgba(0, 0, 0, 0.3)',
              }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 'medium',
                  color: isDarkMode ? '#ffffff' : '#1976d2',
                  fontFamily: '"Poppins", sans-serif',
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
                  color: isDarkMode ? '#cccccc' : '#666666',
                  fontFamily: '"Poppins", sans-serif',
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
            color: isDarkMode ? '#ffffff' : '#1976d2',
          }}
        >
          <MoreVertIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={openMenu}
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
            background: isDarkMode
              ? 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)'
              : 'linear-gradient(180deg, #e0f7fa 0%, #b3e5fc 100%)',
            backdropFilter: 'blur(10px)',
            borderRight: 'none',
            boxShadow: isDarkMode
              ? '0 8px 32px rgba(0, 0, 0, 0.5)'
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
            top: 0,
            height: '100vh',
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
          transition: (theme) =>
            theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : miniDrawerWidth,
            boxSizing: 'border-box',
            background: isDarkMode
              ? 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)'
              : 'linear-gradient(180deg, #e0f7fa 0%, #b3e5fc 100%)',
            backdropFilter: 'blur(10px)',
            borderRight: 'none',
            boxShadow: isDarkMode
              ? '0 8px 32px rgba(0, 0, 0, 0.5)'
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
            top: 0,
            height: '100vh',
            overflowX: 'hidden',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;