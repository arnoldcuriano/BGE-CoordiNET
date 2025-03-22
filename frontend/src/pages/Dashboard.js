import * as React from 'react';
import { 
  Box, 
  Typography, 
  createTheme, 
  ThemeProvider, 
  CssBaseline, 
  AppBar, 
  Toolbar, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Badge, 
  Avatar, 
  Menu, 
  MenuItem, 
  CircularProgress, 
  Container, 
  Paper 
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BarChartIcon from '@mui/icons-material/BarChart';
import DescriptionIcon from '@mui/icons-material/Description';
import LayersIcon from '@mui/icons-material/Layers';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Define navigation items
const NAVIGATION = [
  {
    kind: 'header',
    title: 'Main items',
  },
  {
    segment: 'dashboard',
    title: 'Dashboard',
    icon: <DashboardIcon />,
  },
  {
    segment: 'orders',
    title: 'Orders',
    icon: <ShoppingCartIcon />,
  },
  {
    kind: 'divider',
  },
  {
    kind: 'header',
    title: 'Analytics',
  },
  {
    segment: 'reports',
    title: 'Reports',
    icon: <BarChartIcon />,
    children: [
      {
        segment: 'sales',
        title: 'Sales',
        icon: <DescriptionIcon />,
      },
      {
        segment: 'traffic',
        title: 'Traffic',
        icon: <DescriptionIcon />,
      },
    ],
  },
  {
    segment: 'integrations',
    title: 'Integrations',
    icon: <LayersIcon />,
  },
];

// Define a custom theme
const demoTheme = createTheme({
  palette: {
    mode: 'light', // Default to light mode
  },
});

// Main Dashboard component
export default function DashboardLayoutBasic() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [logoutLoading, setLogoutLoading] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [loading, setLoading] = React.useState(true); // Add loading state
  const navigate = useNavigate();

  // Check if the user is authenticated
  React.useEffect(() => {
    const checkAuth = async () => {
      const authState = localStorage.getItem('isAuthenticated');
      if (authState === 'true') {
        setLoading(false); // User is authenticated
      } else {
        try {
          await axios.get('http://localhost:5000/auth/user', { withCredentials: true });
          localStorage.setItem('isAuthenticated', 'true'); // Update localStorage
          setLoading(false);
        } catch (error) {
          localStorage.removeItem('isAuthenticated'); // Clear localStorage
          navigate('/login'); // Redirect to Login if not authenticated
        }
      }
    };

    checkAuth();
  }, [navigate]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    setLogoutLoading(true);
    axios.get('http://localhost:5000/auth/logout', { withCredentials: true })
      .then(() => {
        localStorage.removeItem('isAuthenticated'); // Clear localStorage
        setLogoutLoading(false);
        navigate('/login');
      })
      .catch((error) => {
        console.error('Error logging out:', error);
        setLogoutLoading(false);
      });
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const drawer = (
    <div>
      <Toolbar />
      <List>
        {NAVIGATION.map((item, index) => {
          if (item.kind === 'header') {
            return (
              <Typography key={index} variant="subtitle1" sx={{ px: 2, py: 1 }}>
                {item.title}
              </Typography>
            );
          } else if (item.kind === 'divider') {
            return <Divider key={index} />;
          } else {
            return (
              <ListItem button key={index}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.title} />
              </ListItem>
            );
          }
        })}
      </List>
    </div>
  );

  // Show loading state while checking authentication
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={demoTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        {/* AppBar */}
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
              <Avatar alt="User" src="/static/images/avatar/1.jpg" />
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
          </Toolbar>
        </AppBar>

        {/* Drawer */}
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
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
          }}
          open
        >
          {drawer}
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - 240px)` },
          }}
        >
          <Toolbar />
          <Container>
            <Typography variant="h4" gutterBottom>
              Dashboard
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Paper sx={{ p: 2, flex: 1 }}>
                <Typography variant="h6">Overview</Typography>
                <Typography variant="body1">Users: 14k (+25%)</Typography>
                <Typography variant="body1">Conversions: 325 (-25%)</Typography>
              </Paper>
              <Paper sx={{ p: 2, flex: 1 }}>
                <Typography variant="h6">Sessions</Typography>
                <Typography variant="body1">13,277 (+35%)</Typography>
              </Paper>
            </Box>
            <Paper sx={{ p: 2, mt: 3 }}>
              <Typography variant="h6">Page Views and Downloads</Typography>
              <Typography variant="body1">1.3M (8%)</Typography>
            </Paper>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}