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
import { useLocation } from 'react-router-dom';

const Payments = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openPayment, setOpenPayment] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentData, setPaymentData] = useState({
    payment_method: 'cash_on_delivery',
    amount: 0,
    shipping_address: {
      address_line1: '',
      city: '',
      department: '',
      postal_code: '',
      contact_name: '',
      contact_phone: ''
    }
  });
  const [showStripeForm, setShowStripeForm] = useState(false);
  const [subscriptionContext, setSubscriptionContext] = useState(null);

  useEffect(() => {
    fetchPayments();
    
    // Verificar si hay un order_id en la URL para abrir automáticamente el diálogo de pago
    const urlParams = new URLSearchParams(location.search);
    const orderId = urlParams.get('order_id');
    const subscriptionId = urlParams.get('subscription_id');
    
    if (orderId) {
      handleOpenPaymentFromOrderId(orderId);
    }
    if (subscriptionId) {
      handleOpenPaymentForSubscription(subscriptionId);
    }
  }, [location.search]);

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
      payment_method: 'cash_on_delivery',
      amount: order.total_amount,
      shipping_address: {
        address_line1: order.address?.address_line1 || '',
        city: order.address?.city || '',
        department: order.address?.department || '',
        postal_code: order.address?.postal_code || '',
        contact_name: order.address?.contact_name || user?.name || '',
        contact_phone: order.address?.contact_phone || user?.phone_number || ''
      }
    });
    setOpenPayment(true);
  };

  const handleOpenPaymentFromOrderId = async (orderId) => {
    try {
      // Obtener los detalles de la orden
      const response = await api.get(`/orders/${orderId}`);
      const order = response.data.order;

      // Prellenar datos y abrir diálogo (sin procesar automáticamente)
      setSelectedOrder(order);
      setPaymentData({
        payment_method: 'cash_on_delivery',
        amount: order.total_amount,
        shipping_address: {
          address_line1: order.address?.address_line1 || '',
          city: order.address?.city || '',
          department: order.address?.department || '',
          postal_code: order.address?.postal_code || '',
          contact_name: order.address?.contact_name || user?.name || '',
          contact_phone: order.address?.contact_phone || user?.phone_number || ''
        }
      });
      setOpenPayment(true);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Error al cargar los detalles de la orden');
    }
  };

  // Abrir flujo de pago para una suscripción (sin orden previa)
  const handleOpenPaymentForSubscription = async (subscriptionId) => {
    try {
      const subRes = await api.get(`/subscriptions/${subscriptionId}`);
      const subscription = subRes.data.subscription;

      // Intentar prellenar con dirección principal del usuario
      let shipping = {
        address_line1: '',
        city: '',
        department: '',
        postal_code: '',
        contact_name: user?.name || '',
        contact_phone: user?.phone_number || ''
      };
      try {
        const profileRes = await api.get('/users/profile');
        const defaultAddress = profileRes.data.user?.addresses?.[0];
        if (defaultAddress) {
          shipping = {
            address_line1: defaultAddress.address_line1 || '',
            city: defaultAddress.city || '',
            department: defaultAddress.department || '',
            postal_code: defaultAddress.postal_code || '',
            contact_name: defaultAddress.contact_name || user?.name || '',
            contact_phone: defaultAddress.contact_phone || user?.phone_number || ''
          };
        }
      } catch (e) {
        // Ignorar errores del perfil
      }

      setSelectedOrder(null);
      setSubscriptionContext({ id: subscriptionId, price: subscription.price });
      setPaymentData({
        payment_method: 'cash_on_delivery',
        amount: subscription.price,
        shipping_address: shipping,
      });
      setOpenPayment(true);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast.error('Error al cargar la suscripción para el pago');
    }
  };

  const handleClosePayment = () => {
    setOpenPayment(false);
    setSelectedOrder(null);
    setShowStripeForm(false);
    setSubscriptionContext(null);
    setPaymentData({
      payment_method: 'cash_on_delivery',
      amount: 0,
      shipping_address: {
        address_line1: '',
        city: '',
        department: '',
        postal_code: '',
        contact_name: '',
        contact_phone: ''
      }
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
    // Validar datos de envío para contraentrega
    const requiredFields = ['address_line1', 'city', 'department', 'contact_name', 'contact_phone'];
    const missingFields = requiredFields.filter(field => !paymentData.shipping_address[field]);
    if (missingFields.length > 0) {
      toast.error('Por favor completa todos los campos de envío requeridos');
      return;
    }

    // Caso 1: pago de orden ya existente
    if (selectedOrder) {
      try {
        await api.post('/payments', {
          order_id: selectedOrder.order_id,
          amount: selectedOrder.total_amount,
          payment_method: 'cash_on_delivery',
          shipping_address: paymentData.shipping_address,
        });

        // Actualizar suscripción si aplica
        if (selectedOrder.subscription_id) {
          try {
            await api.patch(`/subscriptions/${selectedOrder.subscription_id}/mark-as-paid`);
          } catch (subError) {
            console.error('Error actualizando suscripción:', subError);
          }
        }
        toast.success('Pago procesado exitosamente');
        handleClosePayment();
        fetchPayments();
      } catch (error) {
        console.error('Error processing payment:', error);
        toast.error(error.response?.data?.message || 'Error al procesar el pago');
      }
      return;
    }

    // Caso 2: pago de suscripción (crear orden y luego pago)
    if (subscriptionContext?.id) {
      try {
        const addressRes = await api.post('/users/addresses', {
          ...paymentData.shipping_address,
          is_default: true,
        });
        const addressId = addressRes.data.address.address_id;

        const orderRes = await api.post(`/orders/from-subscription/${subscriptionContext.id}`, {
          address_id: addressId,
          special_instructions: 'Pago de suscripción',
        });
        const order = orderRes.data.order;

        await api.post('/payments', {
          order_id: order.order_id,
          amount: order.total_amount,
          payment_method: 'cash_on_delivery',
          shipping_address: paymentData.shipping_address,
        });

        // Marcar suscripción como pagada
        if (order.subscription_id) {
          try {
            await api.patch(`/subscriptions/${order.subscription_id}/mark-as-paid`);
          } catch (subError) {
            console.error('Error actualizando suscripción:', subError);
          }
        }

        toast.success('Pago contraentrega registrado y suscripción procesada');
        handleClosePayment();
        fetchPayments();
      } catch (error) {
        console.error('Error processing subscription payment:', error);
        toast.error(error.response?.data?.message || 'Error al procesar el pago de suscripción');
      }
      return;
    }

    toast.error('No hay información suficiente para procesar el pago');
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
      case 'cash_on_delivery': return <Payment />;
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
              {openPayment && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Se ha abierto automáticamente el formulario de pago para tu orden.
                  </Typography>
                </Alert>
              )}
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
                         payment.payment_method === 'cash_on_delivery' ? 'Contraentrega' :
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
            {!showStripeForm && (
              <Box sx={{ pt: 1 }}>
                {selectedOrder ? (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Pedido #{selectedOrder.order_number || selectedOrder.order_id}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      Total: {formatPrice(selectedOrder.total_amount)}
                    </Typography>
                  </>
                ) : subscriptionContext ? (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Suscripción #{subscriptionContext.id}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      Total: {formatPrice(subscriptionContext.price)}
                    </Typography>
                  </>
                ) : null}
                
                {/* Selector de método eliminado: siempre Contraentrega */}

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Datos de Envío
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Dirección"
                          name="address_line1"
                          value={paymentData.shipping_address.address_line1}
                          onChange={(e) => setPaymentData({
                            ...paymentData,
                            shipping_address: {
                              ...paymentData.shipping_address,
                              address_line1: e.target.value
                            }
                          })}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Ciudad"
                          name="city"
                          value={paymentData.shipping_address.city}
                          onChange={(e) => setPaymentData({
                            ...paymentData,
                            shipping_address: {
                              ...paymentData.shipping_address,
                              city: e.target.value
                            }
                          })}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Departamento"
                          name="department"
                          value={paymentData.shipping_address.department}
                          onChange={(e) => setPaymentData({
                            ...paymentData,
                            shipping_address: {
                              ...paymentData.shipping_address,
                              department: e.target.value
                            }
                          })}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Código Postal"
                          name="postal_code"
                          value={paymentData.shipping_address.postal_code}
                          onChange={(e) => setPaymentData({
                            ...paymentData,
                            shipping_address: {
                              ...paymentData.shipping_address,
                              postal_code: e.target.value
                            }
                          })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Nombre de Contacto"
                          name="contact_name"
                          value={paymentData.shipping_address.contact_name}
                          onChange={(e) => setPaymentData({
                            ...paymentData,
                            shipping_address: {
                              ...paymentData.shipping_address,
                              contact_name: e.target.value
                            }
                          })}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Teléfono de Contacto"
                          name="contact_phone"
                          value={paymentData.shipping_address.contact_phone}
                          onChange={(e) => setPaymentData({
                            ...paymentData,
                            shipping_address: {
                              ...paymentData.shipping_address,
                              contact_phone: e.target.value
                            }
                          })}
                          required
                        />
                      </Grid>
                    </Grid>
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Pagarás en efectivo al momento de recibir tu pedido
                    </Alert>
                  </Box>
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
