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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Payment,
  Receipt,
  CreditCard,
  AccountBalance,
  Google,
  Refresh,
  Visibility,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import StripePayment from '../components/Payment/StripePayment';

const Payments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openPayment, setOpenPayment] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentData, setPaymentData] = useState({
    payment_method: 'credit_card',
    amount: 0,
  });
  const [showStripeForm, setShowStripeForm] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/payments/my-payments');
      setPayments(response.data.payments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError('Error al cargar los pagos');
      toast.error('Error al cargar los pagos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayment = (order) => {
    setSelectedOrder(order);
    setPaymentData({
      payment_method: 'credit_card',
      amount: order.total_amount,
    });
    setOpenPayment(true);
  };

  const handleClosePayment = () => {
    setOpenPayment(false);
    setSelectedOrder(null);
    setShowStripeForm(false);
    setPaymentData({
      payment_method: 'credit_card',
      amount: 0,
    });
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentData({
      ...paymentData,
      [name]: value,
    });
  };

  const handleProcessPayment = async () => {
    if (!selectedOrder) return;

    if (paymentData.payment_method === 'credit_card') {
      setShowStripeForm(true);
    } else {
      try {
        await api.post('/payments', {
          order_id: selectedOrder.order_id,
          amount: paymentData.amount,
          payment_method: paymentData.payment_method
        });
        toast.success('Pago procesado exitosamente');
        handleClosePayment();
        fetchPayments();
      } catch (error) {
        console.error('Error processing payment:', error);
        toast.error(error.response?.data?.message || 'Error al procesar el pago');
      }
    }
  };

  const handleStripeSuccess = (paymentIntent) => {
    toast.success('Pago procesado exitosamente');
    handleClosePayment();
    fetchPayments();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'cancelled': return 'default';
      case 'refunded': return 'info';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'pending': return 'Pendiente';
      case 'failed': return 'Fallido';
      case 'cancelled': return 'Cancelado';
      case 'refunded': return 'Reembolsado';
      default: return status;
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'credit_card': return <CreditCard />;
      case 'pse': return <AccountBalance />;
      case 'google_pay': return <Google />;
      default: return <Payment />;
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
          Cargando pagos...
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
        <Button variant="contained" onClick={fetchPayments}>
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
            Mis Pagos
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchPayments}
          >
            Actualizar
          </Button>
        </Box>

        {payments.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Payment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No tienes pagos registrados
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Los pagos aparecerán aquí una vez que proceses una suscripción
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID de Pago</TableCell>
                  <TableCell>Pedido</TableCell>
                  <TableCell>Método</TableCell>
                  <TableCell>Monto</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((payment, index) => (
                  <motion.tr
                    key={payment.payment_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <TableCell>#{payment.payment_id}</TableCell>
                    <TableCell>#{payment.order?.order_number || payment.order_id}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getPaymentMethodIcon(payment.payment_method)}
                        {payment.payment_method === 'credit_card' ? 'Tarjeta' :
                         payment.payment_method === 'pse' ? 'PSE' :
                         payment.payment_method === 'google_pay' ? 'Google Pay' :
                         payment.payment_method}
                      </Box>
                    </TableCell>
                    <TableCell>{formatPrice(payment.amount)}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(payment.status)}
                        color={getStatusColor(payment.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(payment.payment_date).toLocaleDateString('es-CO')}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Ver detalles">
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Payment Dialog */}
        <Dialog open={openPayment} onClose={handleClosePayment} maxWidth="md" fullWidth>
          <DialogTitle>Procesar Pago</DialogTitle>
          <DialogContent>
            {selectedOrder && !showStripeForm && (
              <Box sx={{ pt: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Pedido #{selectedOrder.order_number || selectedOrder.order_id}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Total: {formatPrice(selectedOrder.total_amount)}
                </Typography>
                
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Método de Pago</InputLabel>
                  <Select
                    name="payment_method"
                    value={paymentData.payment_method}
                    onChange={handlePaymentChange}
                    label="Método de Pago"
                  >
                    <MenuItem value="credit_card">Tarjeta de Crédito/Débito</MenuItem>
                    <MenuItem value="pse">PSE</MenuItem>
                    <MenuItem value="google_pay">Google Pay</MenuItem>
                  </Select>
                </FormControl>

                {paymentData.payment_method === 'credit_card' && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Serás redirigido a Stripe para completar el pago de forma segura
                  </Alert>
                )}
              </Box>
            )}
            
            {selectedOrder && showStripeForm && (
              <StripePayment
                order={selectedOrder}
                onSuccess={handleStripeSuccess}
                onCancel={() => setShowStripeForm(false)}
              />
            )}
          </DialogContent>
          {!showStripeForm && (
            <DialogActions>
              <Button onClick={handleClosePayment}>Cancelar</Button>
              <Button onClick={handleProcessPayment} variant="contained">
                Procesar Pago
              </Button>
            </DialogActions>
          )}
        </Dialog>
      </motion.div>
    </Container>
  );
};

export default Payments;
