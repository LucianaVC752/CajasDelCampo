import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import {
  People,
  ShoppingCart,
  Store,
  AttachMoney,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalOrders: 0,
    totalRevenue: 0,
    newUsers: 0,
    newSubscriptions: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setStats({
        totalUsers: 1250,
        activeSubscriptions: 890,
        totalOrders: 2340,
        totalRevenue: 125000000,
        newUsers: 45,
        newSubscriptions: 32,
      });
      setLoading(false);
    }, 1000);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const statCards = [
    {
      title: 'Total Usuarios',
      value: stats.totalUsers,
      icon: <People sx={{ fontSize: 40, color: 'primary.main' }} />,
      change: stats.newUsers,
      changeType: 'positive',
    },
    {
      title: 'Suscripciones Activas',
      value: stats.activeSubscriptions,
      icon: <Store sx={{ fontSize: 40, color: 'secondary.main' }} />,
      change: stats.newSubscriptions,
      changeType: 'positive',
    },
    {
      title: 'Total Pedidos',
      value: stats.totalOrders,
      icon: <ShoppingCart sx={{ fontSize: 40, color: 'success.main' }} />,
      change: 12,
      changeType: 'positive',
    },
    {
      title: 'Ingresos Totales',
      value: formatPrice(stats.totalRevenue),
      icon: <AttachMoney sx={{ fontSize: 40, color: 'warning.main' }} />,
      change: 8.5,
      changeType: 'positive',
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
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          Panel de Administración
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {statCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          {stat.title}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                          {stat.value}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          {stat.changeType === 'positive' ? (
                            <TrendingUp color="success" sx={{ fontSize: 16, mr: 0.5 }} />
                          ) : (
                            <TrendingDown color="error" sx={{ fontSize: 16, mr: 0.5 }} />
                          )}
                          <Typography
                            variant="body2"
                            color={stat.changeType === 'positive' ? 'success.main' : 'error.main'}
                          >
                            +{stat.change}%
                          </Typography>
                        </Box>
                      </Box>
                      {stat.icon}
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Quick Actions */}
        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Acciones Rápidas
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <People sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Gestionar Usuarios
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ver y administrar usuarios registrados
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Store sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Gestionar Productos
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Administrar catálogo de productos
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <ShoppingCart sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Ver Pedidos
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Monitorear pedidos y entregas
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <AttachMoney sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Reportes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ver reportes y estadísticas
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
};

export default AdminDashboard;
