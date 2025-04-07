import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Avatar,
  IconButton,
  useTheme,
  CircularProgress,
  Tooltip,
  Stack,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const Sidebar = ({
  mobileOpen,
  handleDrawerToggle,
  isCollapsed,
  user = { firstName: '', lastName: '', profilePicture: '', role: 'viewer' },
  handleLogout,
  logoutLoading,
  isDarkMode,
  toggleCollapse,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);

  const isDark = theme.palette.mode === 'dark' || isDarkMode;

  const displayName = user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';

  const baseNavigationItems = [
    { segment: 'dashboard', title: 'Dashboard', icon: <DashboardOutlinedIcon /> },
    { segment: 'members', title: 'Members', icon: <GroupOutlinedIcon /> },
    { segment: 'project', title: 'Projects', icon: <AssignmentTurnedInOutlinedIcon /> },
    { segment: 'it-inventory', title: 'IT Inventory', icon: <Inventory2OutlinedIcon /> },
  ];

  const adminNavigationItems = user.role === 'superadmin'
    ? [{ segment: 'superadmin-dashboard', title: 'Super Admin', icon: <AdminPanelSettingsOutlinedIcon /> }]
    : [];

  const navigationItems = [...baseNavigationItems, ...adminNavigationItems];

  const drawerWidth = isCollapsed ? 64 : 240;

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const currentPath = location.pathname.split('/')[1] || 'dashboard';

  console.log('Sidebar rendering with props:', { isCollapsed, toggleCollapse, drawerWidth });

  const renderListItem = (item) => (
    <Tooltip key={item.segment} title={isCollapsed ? item.title : ''} placement="right" arrow>
      <ListItem
        button
        onClick={() => navigate(`/${item.segment}`)}
        sx={{
          borderRadius: 1,
          mx: 0.5,
          my: 0.5,
          py: 0.75,
          backgroundColor: currentPath === item.segment ? (isDark ? '#4285F4' : '#e3f2fd') : 'transparent',
          '&:hover': {
            backgroundColor: isDark ? 'rgba(66, 133, 244, 0.2)' : 'rgba(66, 133, 244, 0.1)',
            transform: 'translateX(4px)',
            transition: 'all 0.3s ease',
          },
          transition: 'all 0.3s ease',
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: '40px',
            color: currentPath === item.segment ? (isDark ? '#ffffff' : '#4285F4') : isDark ? 'rgba(255,255,255,0.7)' : '#4a4a4a',
          }}
        >
          {React.cloneElement(item.icon, { sx: { fontSize: 24 } })} {/* Match Navbar icon size */}
        </ListItemIcon>
        {!isCollapsed && (
          <ListItemText
            primary={item.title}
            primaryTypographyProps={{
              variant: 'body2',
              fontWeight: 'medium',
              noWrap: true,
              color: currentPath === item.segment ? (isDark ? '#ffffff' : '#4285F4') : isDark ? 'rgba(255,255,255,0.7)' : '#4a4a4a',
            }}
          />
        )}
      </ListItem>
    </Tooltip>
  );

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ height: 'auto', pt: 1, pb: 0.5, px: 1 }}>
        {!isCollapsed && (
          <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'text.secondary', fontWeight: 'medium' }}>
            Menu Items
          </Typography>
        )}
      </Box>
      <List sx={{ flexGrow: 1 }}>{navigationItems.map(renderListItem)}</List> {/* Removed overflow */}
      <Divider sx={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }} />
      <Box sx={{ p: isCollapsed ? 0.5 : 1 }}>
        <Stack direction="row" spacing={isCollapsed ? 0 : 1} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={isCollapsed ? 0 : 1} alignItems="center">
            <Avatar
              alt={displayName}
              src={user.profilePicture}
              sx={{ width: 32, height: 32, border: `2px solid ${isDark ? '#90caf9' : '#4285F4'}` }}
            />
            {!isCollapsed && (
              <Box>
                <Typography variant="body2" fontWeight="medium" noWrap color={isDark ? '#ffffff' : '#4a4a4a'}>
                  {displayName}
                </Typography>
                <Typography variant="caption" noWrap color={isDark ? 'rgba(255,255,255,0.5)' : 'text.secondary'}>
                  {user.role}
                </Typography>
              </Box>
            )}
          </Stack>
          <Tooltip title={isCollapsed ? 'More' : ''} placement="right" arrow>
            <IconButton onClick={handleMenuOpen} sx={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#4a4a4a' }}>
              <MoreVertIcon />
            </IconButton>
          </Tooltip>
        </Stack>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
          PaperProps={{
            elevation: 6,
            sx: {
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              backgroundColor: isDark ? '#424242' : '#ffffff',
              color: isDark ? '#ffffff' : '#4a4a4a',
            },
          }}
        >
          <MenuItem onClick={handleLogout} disabled={logoutLoading}>
            {logoutLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CircularProgress size={16} color="inherit" />
                <Typography variant="body2">Logging out...</Typography>
              </Box>
            ) : (
              <Typography variant="body2">Logout</Typography>
            )}
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }} aria-label="sidebar">
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 240,
            backgroundColor: isDark ? '#121212' : '#ffffff',
            borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            backgroundColor: isDark ? '#121212' : '#ffffff',
            borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
            borderTop: 'none',
            boxShadow: 'none',
            top: 64,
            height: 'calc(100% - 64px)',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;