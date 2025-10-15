import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Pause,
  PlayArrow,
  Cancel,
  Store,
  Payment,
  DeleteForever,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const Subscriptions = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    plan_name: '',
    frequency: 'monthly',
    box_size: 'medium',
    price: 0,
  });

  useEffect(() => {
    fetchSubscriptions();
    fetchPlans();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/subscriptions/my-subscriptions');
      setSubscriptions(response.data.subscriptions);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setError('Error al cargar las suscripciones');
      toast.error('Error al cargar las suscripciones');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await api.get('/subscriptions/plans/available');
      setPlans(response.data.plans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Error al cargar los planes disponibles');
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      plan_name: '',
      frequency: 'monthly',
      box_size: 'medium',
      price: 0,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handlePlanChange = (plan) => {
    setFormData({
      ...formData,
      plan_name: plan.name,
      box_size: plan.box_size,
      price: plan.price,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/subscriptions', formData);
      toast.success('Suscripción creada exitosamente');
      setSubscriptions([...subscriptions, response.data.subscription]);
      handleClose();
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error(error.response?.data?.message || 'Error al crear la suscripción');
    }
  };

  const handlePaySubscription = async (subscriptionId) => {
    try {
      // Redirigir a la vista de pagos con la suscripción
      window.location.href = `/payments?subscription_id=${subscriptionId}`;
    } catch (error) {
      console.error('Error redirecting to payments:', error);
      toast.error('Error al redirigir a la vista de pagos');
    }
  };

  const handlePause = async (subscriptionId) => {
    try {
      await api.patch(`/subscriptions/${subscriptionId}/pause`);
      toast.success('Suscripción pausada');
      fetchSubscriptions();
    } catch (error) {
      console.error('Error pausing subscription:', error);
      toast.error(error.response?.data?.message || 'Error al pausar la suscripción');
    }
  };

  const handleResume = async (subscriptionId) => {
    try {
      await api.patch(`/subscriptions/${subscriptionId}/resume`);
      toast.success('Suscripción reanudada');
      fetchSubscriptions();
    } catch (error) {
      console.error('Error resuming subscription:', error);
      toast.error(error.response?.data?.message || 'Error al reanudar la suscripción');
    }
  };

  const handleCancel = async (subscriptionId) => {
    if (window.confirm('¿Estás seguro de que quieres cancelar esta suscripción?')) {
      try {
        await api.patch(`/subscriptions/${subscriptionId}/cancel`, {
          cancellation_reason: 'Cancelado por el usuario'
        });
        toast.success('Suscripción cancelada');
        fetchSubscriptions();
      } catch (error) {
        console.error('Error cancelling subscription:', error);
        toast.error(error.response?.data?.message || 'Error al cancelar la suscripción');
      }
    }
  };

  const handleRemoveCard = async (subscriptionId) => {
    try {
      await api.patch(`/subscriptions/${subscriptionId}/hide`);
      toast.success('Tarjeta oculta permanentemente');
      fetchSubscriptions();
    } catch (error) {
      console.error('Error hiding subscription card:', error);
      toast.error(error.response?.data?.message || 'Error al ocultar la tarjeta');
    }
  };
  const handleDeletePendingPayments = async (subscriptionId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar todos los pagos pendientes de esta suscripción?')) {
      try {
        const response = await api.delete(`/payments/delete-pending-payments/${subscriptionId}`);
        toast.success(`${response.data.deleted_count} pagos pendientes eliminados correctamente`);
        fetchSubscriptions();
      } catch (error) {
        console.error('Error deleting pending payments:', error);
        toast.error(error.response?.data?.message || 'Error al eliminar pagos pendientes');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Activa';
      case 'paused': return 'Pausada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Cargando suscripciones...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchSubscriptions}>
          Reintentar
        </Button>
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Mis Suscripciones
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpen}
          >
            Nueva Suscripción
          </Button>
        </Box>

        {subscriptions.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Store sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No tienes suscripciones activas
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Crea tu primera suscripción para recibir productos frescos del campo
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleOpen}
              >
                Crear Suscripción
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {subscriptions.map((subscription, index) => (
              <Grid item xs={12} md={6} key={subscription.subscription_id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {subscription.plan_name}
                        </Typography>
                        <Chip
                          label={getStatusText(subscription.status)}
                          color={getStatusColor(subscription.status)}
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="h5" color="primary" gutterBottom>
                        {formatPrice(subscription.price)}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Frecuencia: {subscription.frequency === 'weekly' ? 'Semanal' : 
                                   subscription.frequency === 'biweekly' ? 'Quincenal' : 
                                   subscription.frequency === 'monthly' ? 'Mensual' : 'Cada 3 meses'}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Tamaño: {subscription.box_size === 'small' ? 'Pequeña' :
                                subscription.box_size === 'medium' ? 'Mediana' : 'Grande'}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Próxima entrega: {new Date(subscription.next_delivery_date).toLocaleDateString('es-CO')}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                        {subscription.status === 'active' && (
                          <>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<Payment />}
                              onClick={() => handlePaySubscription(subscription.subscription_id)}
                              color="success"
                            >
                              Pagar
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Pause />}
                              onClick={() => handlePause(subscription.subscription_id)}
                            >
                              Pausar
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Cancel />}
                              onClick={() => handleCancel(subscription.subscription_id)}
                              color="error"
                            >
                              Cancelar
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<DeleteForever />}
                              onClick={() => handleDeletePendingPayments(subscription.subscription_id)}
                              color="error"
                            >
                              Eliminar pagos pendientes
                            </Button>
                          </>
                        )}
                        {subscription.status === 'paused' && (
                          <>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<Payment />}
                              onClick={() => handlePaySubscription(subscription.subscription_id)}
                              color="success"
                            >
                              Pagar
                            </Button>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<PlayArrow />}
                              onClick={() => handleResume(subscription.subscription_id)}
                            >
                              Reanudar
                            </Button>
                          </>
                        )}
                        {subscription.status === 'cancelled' && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DeleteForever />}
                            onClick={() => handleRemoveCard(subscription.subscription_id)}
                            color="error"
                          >
                            Eliminar tarjeta
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Create Subscription Dialog */}
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>Nueva Suscripción</DialogTitle>
          <DialogContent>
            <Box component="form" sx={{ pt: 1 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Selecciona un Plan
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {plans.map((plan, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: formData.plan_name === plan.name ? 2 : 1,
                        borderColor: formData.plan_name === plan.name ? 'primary.main' : 'divider',
                      }}
                      onClick={() => handlePlanChange(plan)}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {plan.name}
                        </Typography>
                        <Typography variant="h5" color="primary" gutterBottom>
                          {formatPrice(plan.price)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {plan.description}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {plan.products}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Frecuencia</InputLabel>
                      <Select
                        name="frequency"
                        value={formData.frequency}
                        onChange={handleChange}
                        label="Frecuencia"
                      >
                        <MenuItem value="weekly">Semanal</MenuItem>
                        <MenuItem value="biweekly">Quincenal</MenuItem>
                        <MenuItem value="monthly">Mensual</MenuItem>
                        <MenuItem value="quarterly">Cada 3 meses</MenuItem>
                      </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tamaño de Caja</InputLabel>
                    <Select
                      name="box_size"
                      value={formData.box_size}
                      onChange={handleChange}
                      label="Tamaño de Caja"
                    >
                      <MenuItem value="small">Pequeña</MenuItem>
                      <MenuItem value="medium">Mediana</MenuItem>
                      <MenuItem value="large">Grande</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button onClick={handleSubmit} variant="contained" disabled={!formData.plan_name}>
              Crear Suscripción
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  );
};

export default Subscriptions;
