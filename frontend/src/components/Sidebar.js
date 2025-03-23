import React, { useState } from 'react';
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
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const Sidebar = ({ mobileOpen, handleDrawerToggle, isCollapsed, toggleCollapse, user, handleLogout, logoutLoading }) => {
  const theme = useTheme();


  // Define navigation items
  const navigationItems = [
    {
      segment: 'dashboard',
      title: 'Dashboard',
      icon: <DashboardIcon />,
    },
    {
      segment: 'members',
      title: 'Members',
      icon: <PeopleIcon />,
    },
    {
      segment: 'project',
      title: 'Project',
      icon: <AssignmentIcon />,
    },
    {
      segment: 'it-inventory',
      title: 'IT Inventory System',
      icon: <InventoryIcon />,
    },
  ];

  return (
    <Box
      component="nav"
      sx={{
        width: { sm: isCollapsed ? 64 : 240 },
        flexShrink: { sm: 0 },
      }}
      aria-label="mailbox folders"
    >
      {/* Drawer for mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            BGE-CoordiNET
          </Typography>
        </Toolbar>
        <Divider />
        <List>
          {navigationItems.map((item) => (
            <ListItem button={true} key={item.segment}> {/* Ensure button is passed as a boolean */}
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.title} />
            </ListItem>
          ))}
        </List>
        <Divider />
        <Box sx={{ p: 2, mt: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar alt={user.displayName} src={user.profilePicture} />
            <Typography variant="body1">{user.displayName}</Typography>
          </Box>
          <IconButton onClick={handleLogout} sx={{ mt: 2 }}>
            {logoutLoading ? <CircularProgress size={24} /> : <LogoutIcon />}
            <Typography variant="body2" sx={{ ml: 1 }}>Logout</Typography>
          </IconButton>
        </Box>
      </Drawer>

      {/* Drawer for desktop */}
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
          {navigationItems.map((item) => (
            <Tooltip key={item.segment} title={item.title} placement="right">
              <ListItem button={true}> {/* Ensure button is passed as a boolean */}
                <ListItemIcon>{item.icon}</ListItemIcon>
                {!isCollapsed && <ListItemText primary={item.title} />}
              </ListItem>
            </Tooltip>
          ))}
        </List>
        <Divider />
        <Box sx={{ p: 2, mt: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar alt={user.displayName} src={user.profilePicture} />
            {!isCollapsed && <Typography variant="body1">{user.displayName}</Typography>}
          </Box>
          <IconButton onClick={handleLogout} sx={{ mt: 2 }}>
            {logoutLoading ? <CircularProgress size={24} /> : <LogoutIcon />}
            {!isCollapsed && <Typography variant="body2" sx={{ ml: 1 }}>Logout</Typography>}
          </IconButton>
        </Box>
      </Drawer>
    </Box>
  );
};

export default Sidebar;