import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
  Typography,
  Box,
  Avatar,
  IconButton,
  useTheme,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import InventoryIcon from '@mui/icons-material/Inventory';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const Sidebar = ({ 
  mobileOpen, 
  handleDrawerToggle, 
  isCollapsed, 
  toggleCollapse, 
  user = { displayName: '', profilePicture: '', role: 'viewer' },
  handleLogout, 
  logoutLoading 
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Base navigation items
  const baseNavigationItems = [
    {
      segment: 'dashboard',
      title: 'Dashboard',
      icon: <DashboardIcon />,
      onClick: () => navigate('/dashboard')
    },
    {
      segment: 'members',
      title: 'Members',
      icon: <PeopleIcon />,
      onClick: () => navigate('/members')
    },
    {
      segment: 'project',
      title: 'Projects',
      icon: <AssignmentIcon />,
      onClick: () => navigate('/projects')
    },
    {
      segment: 'it-inventory',
      title: 'IT Inventory',
      icon: <InventoryIcon />,
      onClick: () => navigate('/inventory')
    }
  ];

  // Super Admin specific items
  const adminNavigationItems = user?.role === 'superadmin' ? [
    {
      segment: 'superadmin-dashboard',
      title: 'Super Admin',
      icon: <AdminPanelSettingsIcon />,
      onClick: () => navigate('/superadmin-dashboard')
    }
  ] : [];

  // Combine all navigation items
  const navigationItems = [...baseNavigationItems, ...adminNavigationItems];

  // List item component
  const renderListItem = (item) => (
    <Tooltip 
      key={item.segment} 
      title={isCollapsed ? item.title : ''} 
      placement="right"
      arrow
    >
      <ListItem 
        button
        onClick={item.onClick}
        sx={{
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
          borderRadius: 1,
          mx: 1,
          my: 0.5
        }}
      >
        <ListItemIcon sx={{ minWidth: '40px' }}>
          {item.icon}
        </ListItemIcon>
        {!isCollapsed && (
          <ListItemText 
            primary={item.title} 
            primaryTypographyProps={{ noWrap: true }}
          />
        )}
      </ListItem>
    </Tooltip>
  );

  return (
    <Box
      component="nav"
      sx={{
        width: { sm: isCollapsed ? 64 : 240 },
        flexShrink: { sm: 0 },
      }}
      aria-label="mailbox folders"
    >
      {/* Mobile Drawer */}
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
            width: 240,
          },
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            BGE-CoordiNET
          </Typography>
        </Toolbar>
        <Divider />
        <List>
          {navigationItems.map(renderListItem)}
        </List>
        <Divider />
        <Box sx={{ p: 2, mt: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar alt={user.displayName} src={user.profilePicture} />
            <Typography variant="body1" noWrap>
              {user.displayName}
            </Typography>
          </Box>
          <IconButton 
            onClick={handleLogout} 
            sx={{ mt: 2 }}
            disabled={logoutLoading}
          >
            {logoutLoading ? <CircularProgress size={24} /> : <LogoutIcon />}
            <Typography variant="body2" sx={{ ml: 1 }}>
              Logout
            </Typography>
          </IconButton>
        </Box>
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: isCollapsed ? 64 : 240,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
        open
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {!isCollapsed && 'BGE-CoordiNET'}
          </Typography>
          <IconButton onClick={toggleCollapse}>
            {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Toolbar>
        <Divider />
        <List>
          {navigationItems.map(renderListItem)}
        </List>
        <Divider />
        <Box sx={{ p: 2, mt: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar alt={user.displayName} src={user.profilePicture} />
            {!isCollapsed && (
              <Typography variant="body1" noWrap>
                {user.displayName}
              </Typography>
            )}
          </Box>
          <IconButton 
            onClick={handleLogout} 
            sx={{ mt: 2 }}
            disabled={logoutLoading}
          >
            {logoutLoading ? <CircularProgress size={24} /> : <LogoutIcon />}
            {!isCollapsed && (
              <Typography variant="body2" sx={{ ml: 1 }}>
                Logout
              </Typography>
            )}
          </IconButton>
        </Box>
      </Drawer>
    </Box>
  );
};

export default Sidebar;