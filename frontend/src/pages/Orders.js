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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  LocalShipping,
  Visibility,
  Cancel,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setOrders([
        {
          order_id: 1,
          order_number: 'CDS-1234567890-001',
          order_date: '2024-01-15',
          delivery_date: '2024-01-20',
          total_amount: 40000,
          status: 'delivered',
          address: {
            address_line1: 'Calle 123 #45-67',
            city: 'Bogotá',
            department: 'Cundinamarca',
          },
        },
        {
          order_id: 2,
          order_number: 'CDS-1234567890-002',
          order_date: '2024-01-22',
          delivery_date: '2024-01-27',
          total_amount: 40000,
          status: 'shipped',
          address: {
            address_line1: 'Calle 123 #45-67',
            city: 'Bogotá',
            department: 'Cundinamarca',
          },
        },
        {
          order_id: 3,
          order_number: 'CDS-1234567890-003',
          order_date: '2024-01-29',
          delivery_date: '2024-02-03',
          total_amount: 40000,
          status: 'pending',
          address: {
            address_line1: 'Calle 123 #45-67',
            city: 'Bogotá',
            department: 'Cundinamarca',
          },
        },
      ]);
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
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  const canCancel = (status) => {
    return ['pending', 'confirmed'].includes(status);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Cargando pedidos...
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
          Mis Pedidos
        </Typography>

        {orders.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <LocalShipping sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No tienes pedidos
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Crea una suscripción para comenzar a recibir productos frescos
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/subscriptions')}
              >
                Ver Suscripciones
              </Button>
            </CardContent>
          </Card>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Número de Pedido</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Entrega</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Dirección</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order, index) => (
                  <motion.tr
                    key={order.order_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {order.order_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(order.order_date)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(order.delivery_date)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatPrice(order.total_amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(order.status)}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.address.address_line1}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.address.city}, {order.address.department}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => navigate(`/orders/${order.order_id}`)}
                        >
                          Ver
                        </Button>
                        {canCancel(order.status) && (
                          <Button
                            size="small"
                            startIcon={<Cancel />}
                            color="error"
                            onClick={() => {
                              if (window.confirm('¿Estás seguro de que quieres cancelar este pedido?')) {
                                // Handle cancel
                                console.log('Cancel order:', order.order_id);
                              }
                            }}
                          >
                            Cancelar
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </motion.div>
    </Container>
  );
};

export default Orders;
