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
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  LocalShipping,
  LocationOn,
  Person,
  Phone,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setOrder({
        order_id: parseInt(id),
        order_number: 'CDS-1234567890-001',
        order_date: '2024-01-15T10:30:00Z',
        delivery_date: '2024-01-20',
        total_amount: 40000,
        subtotal: 33613,
        tax_amount: 6387,
        shipping_cost: 0,
        status: 'delivered',
        tracking_number: 'TRK123456789',
        address: {
          address_line1: 'Calle 123 #45-67',
          address_line2: 'Apto 201',
          city: 'Bogotá',
          department: 'Cundinamarca',
          postal_code: '110111',
          contact_name: 'Juan Pérez',
          contact_phone: '+57 300 123 4567',
        },
        orderItems: [
          {
            product_name: 'Tomate',
            quantity: 2,
            price_at_purchase: 5000,
            total_price: 10000,
            product_unit: 'kg',
            farmer_name: 'María González',
          },
          {
            product_name: 'Lechuga',
            quantity: 3,
            price_at_purchase: 3000,
            total_price: 9000,
            product_unit: 'unidad',
            farmer_name: 'Carlos Rodríguez',
          },
          {
            product_name: 'Papa',
            quantity: 5,
            price_at_purchase: 4000,
            total_price: 20000,
            product_unit: 'kg',
            farmer_name: 'Ana Martínez',
          },
        ],
      });
      setLoading(false);
    }, 1000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'preparing': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmado';
      case 'preparing': return 'Preparando';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Cargando pedido...
        </Typography>
      </Container>
    );
  }

  if (error || !order) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Pedido no encontrado'}</Alert>
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/orders')}
          >
            Volver
          </Button>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Pedido #{order.order_number}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Order Info */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Información del Pedido
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Fecha del Pedido
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(order.order_date)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Fecha de Entrega
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(order.delivery_date)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Estado
                    </Typography>
                    <Chip
                      label={getStatusText(order.status)}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </Grid>
                  {order.tracking_number && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Número de Seguimiento
                      </Typography>
                      <Typography variant="body1">
                        {order.tracking_number}
                      </Typography>
                    </Grid>
                  )}
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Productos
                </Typography>
                
                {order.orderItems.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {item.product_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.farmer_name} • {item.quantity} {item.product_unit}
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatPrice(item.total_price)}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Order Summary */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Resumen del Pedido
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Subtotal:</Typography>
                  <Typography variant="body2">{formatPrice(order.subtotal)}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">IVA (19%):</Typography>
                  <Typography variant="body2">{formatPrice(order.tax_amount)}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Envío:</Typography>
                  <Typography variant="body2">{formatPrice(order.shipping_cost)}</Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Total:</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatPrice(order.total_amount)}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Dirección de Entrega
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                  <LocationOn fontSize="small" color="action" />
                  <Box>
                    <Typography variant="body2">
                      {order.address.address_line1}
                    </Typography>
                    {order.address.address_line2 && (
                      <Typography variant="body2">
                        {order.address.address_line2}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      {order.address.city}, {order.address.department}
                    </Typography>
                    {order.address.postal_code && (
                      <Typography variant="body2">
                        {order.address.postal_code}
                      </Typography>
                    )}
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Person fontSize="small" color="action" />
                  <Typography variant="body2">
                    {order.address.contact_name}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Phone fontSize="small" color="action" />
                  <Typography variant="body2">
                    {order.address.contact_phone}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
};

export default OrderDetail;
