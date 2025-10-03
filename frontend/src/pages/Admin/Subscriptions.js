import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  Button,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material';
import {
  Search,
  Edit,
  Visibility,
  Pause,
  PlayArrow,
  Cancel,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminSubscriptions = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/subscriptions');
      setSubscriptions(response.data.subscriptions);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setError('Error al cargar las suscripciones');
      toast.error('Error al cargar las suscripciones');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (subscriptionId, newStatus) => {
    try {
      if (newStatus === 'paused') {
        await api.patch(`/subscriptions/${subscriptionId}/pause`);
        toast.success('Suscripción pausada');
      } else if (newStatus === 'active') {
        await api.patch(`/subscriptions/${subscriptionId}/resume`);
        toast.success('Suscripción reanudada');
      } else if (newStatus === 'cancelled') {
        await api.patch(`/subscriptions/${subscriptionId}/cancel`, {
          cancellation_reason: 'Cancelado por administrador'
        });
        toast.success('Suscripción cancelada');
      }
      fetchSubscriptions();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Error al actualizar la suscripción');
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

  const getFrequencyText = (frequency) => {
    switch (frequency) {
      case 'weekly': return 'Semanal';
      case 'biweekly': return 'Quincenal';
      case 'monthly': return 'Mensual';
      default: return frequency;
    }
  };

  const getBoxSizeText = (boxSize) => {
    switch (boxSize) {
      case 'small': return 'Pequeña';
      case 'medium': return 'Mediana';
      case 'large': return 'Grande';
      default: return boxSize;
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = 
      subscription.plan_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (subscription.user && subscription.user.name && subscription.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (subscription.user && subscription.user.email && subscription.user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !statusFilter || subscription.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          Gestión de Suscripciones
        </Typography>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
              <TextField
                placeholder="Buscar suscripciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ minWidth: 300 }}
              />
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Filtrar por Estado</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Filtrar por Estado"
                >
                  <MenuItem value="">Todos los estados</MenuItem>
                  <MenuItem value="active">Activa</MenuItem>
                  <MenuItem value="paused">Pausada</MenuItem>
                  <MenuItem value="cancelled">Cancelada</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Frecuencia</TableCell>
                    <TableCell>Tamaño</TableCell>
                    <TableCell>Precio</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Próxima Entrega</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSubscriptions.map((subscription, index) => (
                    <motion.tr
                      key={subscription.subscription_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {subscription.user.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {subscription.user.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {subscription.plan_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getFrequencyText(subscription.frequency)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getBoxSizeText(subscription.box_size)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatPrice(subscription.price)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusText(subscription.status)}
                          color={getStatusColor(subscription.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {subscription.next_delivery_date 
                            ? formatDate(subscription.next_delivery_date)
                            : 'N/A'
                          }
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                          <IconButton size="small">
                            <Edit />
                          </IconButton>
                          {subscription.status === 'active' && (
                            <IconButton
                              size="small"
                              onClick={() => handleStatusChange(subscription.subscription_id, 'paused')}
                              color="warning"
                            >
                              <Pause />
                            </IconButton>
                          )}
                          {subscription.status === 'paused' && (
                            <IconButton
                              size="small"
                              onClick={() => handleStatusChange(subscription.subscription_id, 'active')}
                              color="success"
                            >
                              <PlayArrow />
                            </IconButton>
                          )}
                          {subscription.status !== 'cancelled' && (
                            <IconButton
                              size="small"
                              onClick={() => handleStatusChange(subscription.subscription_id, 'cancelled')}
                              color="error"
                            >
                              <Cancel />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </motion.div>
    </Container>
  );
};

export default AdminSubscriptions;
