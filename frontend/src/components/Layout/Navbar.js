import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ShoppingCart,
  Person,
  Dashboard,
  AdminPanelSettings,
  Info,
  ExitToApp,
  Store,
  LocalShipping,
  AccountCircle,
  Payment,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleMenuClose();
    navigate('/');
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    { text: 'Inicio', path: '/', icon: <Store /> },
    { text: 'Productos', path: '/products', icon: <ShoppingCart /> },
    { text: 'Campesinos', path: '/farmers', icon: <Person /> },
    { text: 'Sobre Nosotros', path: '/about', icon: <Info /> },
    { text: 'Contacto', path: '/contact', icon: <LocalShipping /> },
  ];

  const userMenuItems = [
    { text: 'Mi Perfil', path: '/profile', icon: <AccountCircle /> },
    { text: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
    { text: 'Mis Pedidos', path: '/orders', icon: <LocalShipping /> },
    { text: 'Mis Suscripciones', path: '/subscriptions', icon: <Store /> },
    { text: 'Mis Pagos', path: '/payments', icon: <Payment /> },
  ];

  const adminMenuItems = [
    { text: 'Panel Admin', path: '/admin', icon: <AdminPanelSettings /> },
    { text: 'Usuarios', path: '/admin/users', icon: <Person /> },
    { text: 'Productos', path: '/admin/products', icon: <ShoppingCart /> },
    { text: 'Campesinos', path: '/admin/farmers', icon: <Person /> },
    { text: 'Pedidos', path: '/admin/orders', icon: <LocalShipping /> },
  ];

  const renderDesktopMenu = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {menuItems.map((item) => (
        <Button
          key={item.path}
          color="inherit"
          onClick={() => navigate(item.path)}
          sx={{
            color: isActive(item.path) ? 'secondary.main' : 'inherit',
            fontWeight: isActive(item.path) ? 600 : 400,
          }}
        >
          {item.text}
        </Button>
      ))}
    </Box>
  );

  const renderMobileMenu = () => (
    <Drawer
      anchor="left"
      open={mobileMenuOpen}
      onClose={handleMobileMenuToggle}
      sx={{ display: { xs: 'block', md: 'none' } }}
    >
      <Box sx={{ width: 250, pt: 2 }}>
        <List>
          {menuItems.map((item) => (
            <ListItem
              key={item.path}
              button
              onClick={() => {
                navigate(item.path);
                handleMobileMenuToggle();
              }}
              selected={isActive(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );

  return (
    <AppBar position="sticky" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
      <Toolbar>
        {/* Mobile menu button */}
        <IconButton
          color="inherit"
          aria-label="menu"
          onClick={handleMobileMenuToggle}
          sx={{ display: { xs: 'block', md: 'none' }, mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        {/* Logo */}
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            cursor: 'pointer',
            fontWeight: 700,
            color: 'secondary.main',
          }}
          onClick={() => navigate('/')}
        >
          🌱 Cajas del Campo
        </Typography>

        {/* Desktop menu */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          {renderDesktopMenu()}
        </Box>

        {/* User menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {user ? (
            <>
              <IconButton
                color="inherit"
                onClick={handleMenuOpen}
                aria-label="user menu"
              >
                <AccountCircle />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                {userMenuItems.map((item) => (
                  <MenuItem
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      handleMenuClose();
                    }}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </MenuItem>
                ))}
                {isAdmin && (
                  <>
                    <MenuItem disabled>
                      <ListItemText primary="Administración" />
                    </MenuItem>
                    {adminMenuItems.map((item) => (
                      <MenuItem
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          handleMenuClose();
                        }}
                      >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                      </MenuItem>
                    ))}
                  </>
                )}
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <ExitToApp />
                  </ListItemIcon>
                  <ListItemText primary="Cerrar Sesión" />
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                color="inherit"
                onClick={() => navigate('/login')}
                variant="outlined"
                sx={{ borderColor: 'white', color: 'white' }}
              >
                Iniciar Sesión
              </Button>
              <Button
                color="secondary"
                onClick={() => navigate('/register')}
                variant="contained"
              >
                Registrarse
              </Button>
            </Box>
          )}
        </Box>
      </Toolbar>

      {/* Mobile menu */}
      {renderMobileMenu()}
    </AppBar>
  );
};

export default Navbar;
