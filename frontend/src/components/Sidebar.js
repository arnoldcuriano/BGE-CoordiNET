import React, { useState } from 'react';
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
  useTheme,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  CircularProgress,
  Collapse, // Added missing import
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

const Sidebar = ({
  mobileOpen,
  handleDrawerToggle,
  isCollapsed,
  isDarkMode,
  toggleCollapse,
  user,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { handleLogout, authState } = useAuth();

  const [anchorEl, setAnchorEl] = useState(null);
  const [openSubmenu, setOpenSubmenu] = useState(false);
  const open = Boolean(anchorEl);

  const effectiveIsDarkMode = isDarkMode !== undefined ? isDarkMode : false;
  const effectiveIsCollapsed = isCollapsed !== undefined ? isCollapsed : false;
  const accessPermissions = authState.accessPermissions || {};
  const isLoading = authState.loading;

  const drawerWidth = effectiveIsCollapsed ? 64 : 240;

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
      <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {!effectiveIsCollapsed && (
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: effectiveIsDarkMode ? '#ffffff' : '#1976d2',
              fontFamily: '"Poppins", sans-serif',
              textShadow: effectiveIsDarkMode ? '0 0 8px rgba(255, 255, 255, 0.3)' : 'none',
            }}
          >
            BGE CoordiNET
          </Typography>
        )}
      </Box>
      <Divider sx={{ borderColor: effectiveIsDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
          <CircularProgress size={24} sx={{ color: effectiveIsDarkMode ? '#ffffff' : '#1976d2' }} />
        </Box>
      ) : (
        <>
          {!effectiveIsCollapsed && (
            <Typography
              variant="caption"
              sx={{
                pl: 2,
                pt: 1,
                color: effectiveIsDarkMode ? '#cccccc' : '#666666',
                fontFamily: '"Poppins", sans-serif',
                fontSize: '0.75rem',
              }}
            >
              Menu List
            </Typography>
          )}
          <List sx={{ pl: 2, flexGrow: 1, overflow: 'auto' }}>
            {menuItems.map((item) => {
              const isSelected = location.pathname === item.path;
              if (
                !user ||
                !item.roles.includes(user?.role) ||
                (user?.role !== 'superadmin' && !accessPermissions[item.permissionKey])
              ) {
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
                        minHeight: 40,
                        justifyContent: effectiveIsCollapsed ? 'center' : 'initial',
                        px: 1.5,
                        backgroundColor: isSelected
                          ? effectiveIsDarkMode
                            ? 'rgba(255, 255, 255, 0.2)'
                            : 'rgba(0, 0, 0, 0.1)'
                          : 'transparent',
                        '&:hover': {
                          backgroundColor: effectiveIsDarkMode
                            ? 'rgba(255, 255, 255, 0.3)'
                            : 'rgba(0, 0, 0, 0.15)',
                          boxShadow: effectiveIsDarkMode
                            ? '0 0 10px rgba(255, 255, 255, 0.2)'
                            : '0 0 10px rgba(0, 0, 0, 0.1)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: effectiveIsCollapsed ? 0 : 2,
                          justifyContent: 'center',
                          color: effectiveIsDarkMode ? '#ffffff' : '#1976d2',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      {!effectiveIsCollapsed && (
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontWeight: isSelected ? 'bold' : 'normal',
                            color: effectiveIsDarkMode ? '#ffffff' : '#1976d2',
                            fontFamily: '"Poppins", sans-serif',
                            fontSize: '0.85rem',
                          }}
                        />
                      )}
                      {item.subItems && !effectiveIsCollapsed && (
                        openSubmenu ? <ExpandLessIcon /> : <ExpandMoreIcon />
                      )}
                    </ListItemButton>
                  </ListItem>
                  {item.subItems && !effectiveIsCollapsed && (
                    <Collapse in={openSubmenu} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding sx={{ pl: 4 }}>
                        {item.subItems.map((subItem) => (
                          <ListItem key={subItem.text} disablePadding>
                            <ListItemButton
                              component={Link}
                              to={subItem.path}
                              sx={{
                                minHeight: 36,
                                px: 1.5,
                                backgroundColor: location.pathname === subItem.path
                                  ? effectiveIsDarkMode
                                    ? 'rgba(255, 255, 255, 0.2)'
                                    : 'rgba(0, 0, 0, 0.1)'
                                  : 'transparent',
                                '&:hover': {
                                  backgroundColor: effectiveIsDarkMode
                                    ? 'rgba(255, 255, 255, 0.3)'
                                    : 'rgba(0, 0, 0, 0.15)',
                                  boxShadow: effectiveIsDarkMode
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
                                  color: effectiveIsDarkMode ? '#ffffff' : '#1976d2',
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
            {!effectiveIsCollapsed && (
              <>
                <Divider sx={{ borderColor: effectiveIsDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
                <Typography
                  variant="caption"
                  sx={{
                    pl: 2,
                    pt: 1,
                    color: effectiveIsDarkMode ? '#cccccc' : '#666666',
                    fontFamily: '"Poppins", sans-serif',
                    fontSize: '0.75rem',
                  }}
                >
                  Knowledge Base
                </Typography>
                <List sx={{ pl: 2 }}>
                  {knowledgeBaseItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                      <ListItemButton
                        component={Link}
                        to={item.path}
                        sx={{
                          minHeight: 40,
                          px: 1.5,
                          backgroundColor: location.pathname === item.path
                            ? effectiveIsDarkMode
                              ? 'rgba(255, 255, 255, 0.2)'
                              : 'rgba(0, 0, 0, 0.1)'
                            : 'transparent',
                          '&:hover': {
                            backgroundColor: effectiveIsDarkMode
                              ? 'rgba(255, 255, 255, 0.3)'
                              : 'rgba(0, 0, 0, 0.15)',
                            boxShadow: effectiveIsDarkMode
                              ? '0 0 10px rgba(255, 255, 255, 0.2)'
                              : '0 0 10px rgba(0, 0, 0, 0.1)',
                          },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 0,
                            mr: 2,
                            justifyContent: 'center',
                            color: effectiveIsDarkMode ? '#ffffff' : '#1976d2',
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                            color: effectiveIsDarkMode ? '#ffffff' : '#1976d2',
                            fontFamily: '"Poppins", sans-serif',
                            fontSize: '0.85rem',
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </List>
        </>
      )}
      <Divider sx={{ borderColor: effectiveIsDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
      <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {!effectiveIsCollapsed && user && (
          <Box sx={{ display: 'flex', alignItems: 'center', maxWidth: '80%' }}>
            <Avatar
              alt={`${user.firstName || ''} ${user.lastName || ''}`}
              src={user.profilePicture}
              sx={{
                width: 36,
                height: 36,
                mr: 1,
                border: effectiveIsDarkMode
                  ? '2px solid rgba(255, 255, 255, 0.3)'
                  : '2px solid rgba(0, 0, 0, 0.3)',
              }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 'medium',
                  color: effectiveIsDarkMode ? '#ffffff' : '#1976d2',
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
                  color: effectiveIsDarkMode ? '#cccccc' : '#666666',
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
            color: effectiveIsDarkMode ? '#ffffff' : '#1976d2',
          }}
        >
          <MoreVertIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          PaperProps={{
            sx: {
              background: effectiveIsDarkMode
                ? 'linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%)'
                : 'linear-gradient(135deg, rgba(224, 247, 250, 0.9) 0%, rgba(179, 229, 252, 0.9) 100%)',
              backdropFilter: 'blur(10px)',
              boxShadow: effectiveIsDarkMode
                ? '0 8px 32px rgba(0, 0, 0, 0.5)'
                : '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: effectiveIsDarkMode
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
              color: effectiveIsDarkMode ? '#ffffff' : '#1976d2',
              '&:hover': {
                backgroundColor: effectiveIsDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
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
              color: effectiveIsDarkMode ? '#ffffff' : '#1976d2',
              '&:hover': {
                backgroundColor: effectiveIsDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
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
              color: effectiveIsDarkMode ? '#ffffff' : '#1976d2',
              '&:hover': {
                backgroundColor: effectiveIsDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
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
            background: effectiveIsDarkMode
              ? 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)'
              : 'linear-gradient(180deg, #e0f7fa 0%, #b3e5fc 100%)',
            backdropFilter: 'blur(10px)',
            borderRight: 'none',
            boxShadow: effectiveIsDarkMode
              ? '0 8px 32px rgba(0, 0, 0, 0.5)'
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="persistent"
        open
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: effectiveIsDarkMode
              ? 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)'
              : 'linear-gradient(180deg, #e0f7fa 0%, #b3e5fc 100%)',
            backdropFilter: 'blur(10px)',
            borderRight: 'none',
            boxShadow: effectiveIsDarkMode
              ? '0 8px 32px rgba(0, 0, 0, 0.5)'
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
            transition: (theme) =>
              theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;