import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Collapse,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import DescriptionIcon from '@mui/icons-material/Description';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [onsiteOpen, setOnsiteOpen] = useState(false);
  const [employeesOpen, setEmployeesOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith('/courses/')) {
      setCoursesOpen(true);
      const pathParts = location.pathname.split('/');
      if (pathParts.length >= 3) {
        const courseType = pathParts[2];
        if (courseType === 'onsite' && pathParts.length > 3) {
          setOnsiteOpen(true);
        }
      }
    }
    if (location.pathname === '/users' || location.pathname === '/previous-employees') {
      setEmployeesOpen(true);
    }
  }, [location.pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  const handleCoursesClick = () => {
    setCoursesOpen(!coursesOpen);
  };

  const handleOnsiteClick = () => {
    setOnsiteOpen(!onsiteOpen);
  };

  const handleEmployeesClick = () => {
    setEmployeesOpen(!employeesOpen);
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Enrollment System
        </Typography>
      </Toolbar>
      <List>
        {/* Dashboard */}
        <ListItem disablePadding>
          <ListItemButton
            selected={location.pathname === '/dashboard'}
            onClick={() => {
              navigate('/dashboard');
              setMobileOpen(false);
            }}
          >
            <ListItemIcon><DashboardIcon /></ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>

        {/* Courses with submenu */}
        <ListItem disablePadding>
          <ListItemButton onClick={handleCoursesClick}>
            <ListItemIcon><SchoolIcon /></ListItemIcon>
            <ListItemText primary="Courses" />
            {coursesOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={coursesOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {/* Onsite submenu */}
            <ListItem disablePadding>
              <ListItemButton onClick={handleOnsiteClick} sx={{ pl: 4 }}>
                <ListItemIcon><SchoolIcon /></ListItemIcon>
                <ListItemText primary="Onsite" />
                {onsiteOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={onsiteOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton
                  sx={{ pl: 6 }}
                  selected={location.pathname === '/courses/onsite/planning'}
                  onClick={() => {
                    navigate('/courses/onsite/planning');
                    setMobileOpen(false);
                  }}
                >
                  <ListItemIcon><EventIcon /></ListItemIcon>
                  <ListItemText primary="Planning" />
                </ListItemButton>
                <ListItemButton
                  sx={{ pl: 6 }}
                  selected={location.pathname === '/courses/onsite/upcoming'}
                  onClick={() => {
                    navigate('/courses/onsite/upcoming');
                    setMobileOpen(false);
                  }}
                >
                  <ListItemIcon><ScheduleIcon /></ListItemIcon>
                  <ListItemText primary="Upcoming" />
                </ListItemButton>
                <ListItemButton
                  sx={{ pl: 6 }}
                  selected={location.pathname === '/courses/onsite/ongoing'}
                  onClick={() => {
                    navigate('/courses/onsite/ongoing');
                    setMobileOpen(false);
                  }}
                >
                  <ListItemIcon><PlayCircleIcon /></ListItemIcon>
                  <ListItemText primary="Ongoing" />
                </ListItemButton>
                <ListItemButton
                  sx={{ pl: 6 }}
                  selected={location.pathname === '/courses/onsite/completed'}
                  onClick={() => {
                    navigate('/courses/onsite/completed');
                    setMobileOpen(false);
                  }}
                >
                  <ListItemIcon><CheckCircleIcon /></ListItemIcon>
                  <ListItemText primary="Completed" />
                </ListItemButton>
              </List>
            </Collapse>

            {/* Online - direct link */}
            <ListItemButton
              sx={{ pl: 4 }}
              selected={location.pathname === '/courses/online'}
              onClick={() => {
                navigate('/courses/online');
                setMobileOpen(false);
              }}
            >
              <ListItemIcon><SchoolIcon /></ListItemIcon>
              <ListItemText primary="Online" />
            </ListItemButton>

            {/* External - direct link */}
            <ListItemButton
              sx={{ pl: 4 }}
              selected={location.pathname === '/courses/external'}
              onClick={() => {
                navigate('/courses/external');
                setMobileOpen(false);
              }}
            >
              <ListItemIcon><SchoolIcon /></ListItemIcon>
              <ListItemText primary="External" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Employees with submenu */}
        <ListItem disablePadding>
          <ListItemButton onClick={handleEmployeesClick}>
            <ListItemIcon><PeopleIcon /></ListItemIcon>
            <ListItemText primary="Employees" />
            {employeesOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={employeesOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              sx={{ pl: 4 }}
              selected={location.pathname === '/users'}
              onClick={() => {
                navigate('/users');
                setMobileOpen(false);
              }}
            >
              <ListItemIcon><PeopleIcon /></ListItemIcon>
              <ListItemText primary="Active Employees" />
            </ListItemButton>
            <ListItemButton
              sx={{ pl: 4 }}
              selected={location.pathname === '/previous-employees'}
              onClick={() => {
                navigate('/previous-employees');
                setMobileOpen(false);
              }}
            >
              <ListItemIcon><HistoryIcon /></ListItemIcon>
              <ListItemText primary="Previous Employees" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Mentors */}
        <ListItem disablePadding>
          <ListItemButton
            selected={location.pathname === '/mentors'}
            onClick={() => {
              navigate('/mentors');
              setMobileOpen(false);
            }}
          >
            <ListItemIcon><PersonIcon /></ListItemIcon>
            <ListItemText primary="Mentors" />
          </ListItemButton>
        </ListItem>

        {/* Reports */}
        <ListItem disablePadding>
          <ListItemButton
            selected={location.pathname === '/reports'}
            onClick={() => {
              navigate('/reports');
              setMobileOpen(false);
            }}
          >
            <ListItemIcon><DescriptionIcon /></ListItemIcon>
            <ListItemText primary="Reports" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
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
          <Typography variant="h4" noWrap component="div" sx={{ flexGrow: 1 }}>
            ENROLL23
          </Typography>
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;

