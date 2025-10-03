import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  ShoppingCart,
  LocalShipping,
  Store,
  Person,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeSubscriptions: 0,
    totalOrders: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    // Simulate loading user data
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const quickActions = [
    {
      title: 'Ver Productos',
      description: 'Explora nuestra selección de productos frescos',
      icon: <ShoppingCart sx={{ fontSize: 40, color: 'primary.main' }} />,
      action: () => navigate('/products'),
      color: 'primary',
    },
    {
      title: 'Mis Suscripciones',
      description: 'Gestiona tus suscripciones activas',
      icon: <Store sx={{ fontSize: 40, color: 'secondary.main' }} />,
      action: () => navigate('/subscriptions'),
      color: 'secondary',
    },
    {
      title: 'Mis Pedidos',
      description: 'Revisa el estado de tus pedidos',
      icon: <LocalShipping sx={{ fontSize: 40, color: 'success.main' }} />,
      action: () => navigate('/orders'),
      color: 'success',
    },
    {
      title: 'Mi Perfil',
      description: 'Actualiza tu información personal',
      icon: <Person sx={{ fontSize: 40, color: 'info.main' }} />,
      action: () => navigate('/profile'),
      color: 'info',
    },
  ];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Cargando dashboard...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Welcome Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            ¡Bienvenido, {user?.name}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Aquí puedes gestionar tus suscripciones, pedidos y configuraciones.
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Suscripciones Activas
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {stats.activeSubscriptions}
                    </Typography>
                  </Box>
                  <Store color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Pedidos
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {stats.totalOrders}
                    </Typography>
                  </Box>
                  <LocalShipping color="secondary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Pedidos Pendientes
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {stats.pendingOrders}
                    </Typography>
                  </Box>
                  <ShoppingCart color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Mi Perfil
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      ✓
                    </Typography>
                  </Box>
                  <Person color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Acciones Rápidas
        </Typography>
        <Grid container spacing={3}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      transition: 'transform 0.3s ease',
                    },
                  }}
                  onClick={action.action}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Box sx={{ mb: 2 }}>{action.icon}</Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      {action.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {action.description}
                    </Typography>
                    <Button
                      variant="contained"
                      color={action.color}
                      fullWidth
                      onClick={(e) => {
                        e.stopPropagation();
                        action.action();
                      }}
                    >
                      Acceder
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Recent Activity */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Actividad Reciente
          </Typography>
          <Card>
            <CardContent>
              <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
                No hay actividad reciente. ¡Explora nuestros productos y comienza tu primera suscripción!
              </Typography>
              <Box sx={{ textAlign: 'center' }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/products')}
                  sx={{ px: 4 }}
                >
                  Ver Productos
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </motion.div>
    </Container>
  );
};

export default Dashboard;
