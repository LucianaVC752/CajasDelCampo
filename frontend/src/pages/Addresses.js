import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  LocationOn,
  Star,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';

const Addresses = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    address_line1: '',
    address_line2: '',
    city: '',
    department: '',
    postal_code: '',
    contact_name: '',
    contact_phone: '',
    is_default: false,
  });

  // Check if user came from payment flow
  const urlParams = new URLSearchParams(location.search);
  const fromPayment = location.state?.fromPayment || urlParams.get('fromPayment') === 'true';
  const subscriptionId = location.state?.subscriptionId || urlParams.get('subscriptionId');

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/addresses');
      setAddresses(response.data.addresses);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Error al cargar las direcciones');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (address = null) => {
    if (address) {
      setEditingAddress(address);
      setFormData(address);
    } else {
      setEditingAddress(null);
      setFormData({
        address_line1: '',
        address_line2: '',
        city: '',
        department: '',
        postal_code: '',
        contact_name: '',
        contact_phone: '',
        is_default: false,
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingAddress(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica en el frontend
    if (!formData.address_line1 || !formData.city || !formData.department) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }
    
    try {
      if (editingAddress) {
        await api.put(`/users/addresses/${editingAddress.address_id}`, formData);
        toast.success('Dirección actualizada exitosamente');
      } else {
        await api.post('/users/addresses', formData);
        toast.success('Dirección creada exitosamente');
      }
      fetchAddresses();
      handleClose();
    } catch (error) {
      console.error('Error saving address:', error);
      console.error('Error details:', error.response?.data);
      
      // Mostrar errores de validación específicos
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => err.msg).join(', ');
        toast.error(`Errores de validación: ${errorMessages}`);
      } else {
        toast.error(error.response?.data?.message || 'Error al guardar la dirección');
      }
    }
  };

  const handleDelete = async (addressId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta dirección?')) {
      try {
        await api.delete(`/users/addresses/${addressId}`);
        toast.success('Dirección eliminada exitosamente');
        fetchAddresses();
      } catch (error) {
        console.error('Error deleting address:', error);
        toast.error('Error al eliminar la dirección');
      }
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      await api.patch(`/users/addresses/${addressId}/default`);
      toast.success('Dirección principal actualizada');
      fetchAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error('Error al establecer dirección principal');
    }
  };

  const handleContinueToPayment = async () => {
    if (subscriptionId) {
      try {
        // Crear orden para la suscripción
        const response = await api.post(`/orders/from-subscription/${subscriptionId}`, {
          special_instructions: 'Pago de suscripción'
        });
        
        // Redirigir a la vista de pagos
        navigate(`/payments?order_id=${response.data.order.order_id}`);
      } catch (error) {
        console.error('Error creating order:', error);
        toast.error(error.response?.data?.message || 'Error al crear la orden de pago');
      }
    } else {
      navigate('/payments');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Cargando direcciones...
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Mis Direcciones
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {fromPayment && addresses.some(addr => addr.is_default) && (
              <Button
                variant="contained"
                color="success"
                onClick={handleContinueToPayment}
              >
                Continuar con el Pago
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpen()}
            >
              Agregar Dirección
            </Button>
          </Box>
        </Box>

        {fromPayment && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Necesitas configurar una dirección de envío para continuar con el pago de tu suscripción.
              {addresses.some(addr => addr.is_default) && ' Ya tienes una dirección principal configurada, puedes continuar con el pago.'}
            </Typography>
          </Alert>
        )}

        {addresses.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <LocationOn sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No tienes direcciones registradas
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Agrega una dirección para recibir tus pedidos
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpen()}
              >
                Agregar Primera Dirección
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {addresses.map((address, index) => (
              <Grid item xs={12} md={6} key={address.address_id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationOn color="primary" />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {address.contact_name || 'Dirección'}
                          </Typography>
                          {address.is_default && (
                            <Chip
                              icon={<Star />}
                              label="Principal"
                              color="primary"
                              size="small"
                            />
                          )}
                        </Box>
                        <Box>
                          <IconButton
                            size="small"
                            onClick={() => handleOpen(address)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(address.address_id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" paragraph>
                        {address.address_line1}
                        {address.address_line2 && `, ${address.address_line2}`}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        {address.city}, {address.department}
                        {address.postal_code && ` ${address.postal_code}`}
                      </Typography>
                      
                      {address.contact_phone && (
                        <Typography variant="body2" color="text.secondary">
                          Tel: {address.contact_phone}
                        </Typography>
                      )}
                      
                      {!address.is_default && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleSetDefault(address.address_id)}
                          sx={{ mt: 2 }}
                        >
                          Establecer como Principal
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Add/Edit Address Dialog */}
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingAddress ? 'Editar Dirección' : 'Agregar Dirección'}
          </DialogTitle>
          <DialogContent>
            <Box component="form" sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Dirección Principal"
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Dirección Secundaria (Opcional)"
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Ciudad"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Departamento"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Código Postal"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nombre de Contacto"
                    name="contact_name"
                    value={formData.contact_name}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Teléfono de Contacto"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.is_default}
                        onChange={handleChange}
                        name="is_default"
                      />
                    }
                    label="Establecer como dirección principal"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingAddress ? 'Actualizar' : 'Agregar'}
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  );
};

export default Addresses;
