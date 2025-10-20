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
  Autocomplete,
} from '@mui/material';
import {
  Search,
  Edit,
  Visibility,
  LocalShipping,
  Delete,
  Restore,
  Add,
} from '@mui/icons-material';
import { Dialog, DialogTitle, DialogContent, DialogActions, Grid, Alert, Snackbar } from '@mui/material';
import { motion } from 'framer-motion';
import { ordersAPI, usersAPI, productsAPI, adminAPI, subscriptionsAPI } from '../../services/api';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Estado del diálogo y formulario de pedido
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [users, setUsers] = useState([]);
  const [userAddresses, setUserAddresses] = useState([]);
  const [products, setProducts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    address_id: '',
    delivery_date: '',
    items: [{ product_id: '', quantity: 1 }],
    shipping_cost: 0,
    special_instructions: '',
    status: '',
  });
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [newAddressText, setNewAddressText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [newNameText, setNewNameText] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await ordersAPI.getAllOrders({});
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error al obtener pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (orderId, newStatus) => {
    setOrders(orders.map(order => 
      order.order_id === orderId 
        ? { ...order, status: newStatus }
        : order
    ));
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handlers de diálogo y CRUD
  const fetchUsers = async () => {
    try {
      const { data } = await adminAPI.getUsers({ page: 1, limit: 100 });
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    }
  };

  const searchUsers = async (query) => {
    try {
      const { data } = await adminAPI.getUsers({ page: 1, limit: 20, search: query });
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error al buscar usuarios:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await productsAPI.getProducts({ page: 1, limit: 100 });
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error al obtener productos:', error);
    }
  };

  const handleUserChange = async (userId) => {
    setFormData(prev => ({ ...prev, user_id: userId, address_id: '' }));
    try {
      if (userId) {
        const { data } = await usersAPI.getUserAdmin(userId);
        const addresses = data.addresses || data.user?.addresses || [];
        setUserAddresses(addresses);
      } else {
        setUserAddresses([]);
      }
    } catch (error) {
      console.error('Error al obtener direcciones del usuario:', error);
    }
  };

  const openCreateDialog = async () => {
    setSnackbarSeverity('info');
    setSnackbarMsg('La creación de pedidos está deshabilitada');
    setSnackbarOpen(true);
    return;
  };

  const openEditDialog = async (order) => {
    setEditMode(true);
    setSelectedOrder(order);
    setFormData({
      user_id: order.user?.user_id || order.user?.id || order.user_id || '',
      address_id: order.address?.address_id || order.address?.id || order.address_id || '',
      delivery_date: (order.delivery_date || '').slice(0, 10),
      items: (order.items || []).map(it => ({
        product_id: it.product_id || it.product?.product_id || it.product?.id || '',
        quantity: it.quantity || 1,
      })),
      shipping_cost: order.shipping_cost || 0,
      special_instructions: order.special_instructions || '',
      status: order.status || '',
    });
    await Promise.all([fetchUsers(), fetchProducts()]);
    await handleUserChange(order.user?.user_id || order.user?.id || order.user_id);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSubmitting(false);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const addItemRow = () => {
    setFormData(prev => ({ ...prev, items: [...prev.items, { product_id: '', quantity: 1 }] }));
  };

  const removeItemRow = (index) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const computeTotals = () => {
    const subtotal = (formData.items || []).reduce((sum, it) => {
      const p = products.find(pr => (pr.product_id || pr.id) === it.product_id);
      const price = p ? (p.price ?? p.unit_price ?? 0) : 0;
      const qty = Number(it.quantity) || 0;
      return sum + price * qty;
    }, 0);
    const total = subtotal + (Number(formData.shipping_cost) || 0);
    return { subtotal, total };
  };

  const submitOrder = async () => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      if (editMode && selectedOrder) {
        // Edición flexible sin validaciones obligatorias
        const updatePayload = {};
        if (formData.address_id) updatePayload.address_id = formData.address_id;
        if (typeof formData.shipping_cost !== 'undefined') {
          updatePayload.shipping_cost = Number(formData.shipping_cost) || 0;
        }
        if (Object.keys(updatePayload).length > 0) {
          await ordersAPI.updateOrderAdmin(selectedOrder.order_id, updatePayload);
        }
        if (formData.status) {
          await ordersAPI.updateOrderStatus(selectedOrder.order_id, { status: formData.status });
        }
      } else {
        setSnackbarSeverity('warning');
        setSnackbarMsg('La creación de pedidos está deshabilitada');
        setSnackbarOpen(true);
        return;
      }
      setSnackbarSeverity('success');
      setSnackbarMsg(editMode ? 'Pedido actualizado correctamente' : 'Pedido creado correctamente');
      setSnackbarOpen(true);
      setDialogOpen(false);
      await fetchOrders();
    } catch (error) {
      console.error('Error al guardar pedido:', error);
      setSnackbarSeverity('error');
      setSnackbarMsg('Error al guardar pedido');
      setSnackbarOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async (order) => {
    if (!window.confirm('¿Cancelar este pedido?')) return;
    try {
      await ordersAPI.cancelOrderAdmin(order.order_id, { reason: 'Cancelado por admin' });
      await fetchOrders();
    } catch (error) {
      console.error('Error al cancelar pedido:', error);
    }
  };

  const handleRestoreOrder = async (order) => {
    try {
      await ordersAPI.restoreOrderAdmin(order.order_id);
      await fetchOrders();
    } catch (error) {
      console.error('Error al restaurar pedido:', error);
    }
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
          Gestión de Pedidos
        </Typography>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
              <TextField
                placeholder="Buscar pedidos..."
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
                  <MenuItem value="pending">Pendiente</MenuItem>
                  <MenuItem value="confirmed">Confirmado</MenuItem>
                  <MenuItem value="preparing">Preparando</MenuItem>
                  <MenuItem value="shipped">Enviado</MenuItem>
                  <MenuItem value="delivered">Entregado</MenuItem>
                  <MenuItem value="cancelled">Cancelado</MenuItem>
                </Select>
              </FormControl>

            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Número de Pedido</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Entrega</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Dirección</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrders.map((order, index) => (
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
                        {order.tracking_number && (
                          <Typography variant="caption" color="text.secondary">
                            Seguimiento: {order.tracking_number}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {order.user.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.user.email}
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
                        <Typography variant="caption" color="text.secondary">
                          {order.address.city}, {order.address.department}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" onClick={() => openEditDialog(order)} title="Editar">
                            <Edit />
                          </IconButton>
                          {order.status === 'cancelled' ? (
                            <IconButton size="small" onClick={() => handleRestoreOrder(order)} color="success" title="Restaurar">
                              <Restore />
                            </IconButton>
                          ) : (
                            <IconButton size="small" onClick={() => handleCancelOrder(order)} color="error" title="Cancelar">
                              <Delete />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
              <DialogTitle>{editMode ? 'Editar Pedido' : 'Crear Pedido'}</DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    {editMode ? (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          Cliente actual: {selectedOrder?.user?.name}
                        </Typography>
                        <Button variant="text" onClick={() => { setNewNameText(selectedOrder?.user?.name || ''); setNameDialogOpen(true); }}>
                          Editar nombre
                        </Button>
                      </Box>
                    ) : (
                      <Autocomplete
                        fullWidth
                        options={users}
                        getOptionLabel={(u) => `${u.name} (${u.email})`}
                        value={users.find((u) => (u.user_id || u.id) === formData.user_id) || null}
                        onChange={(e, newValue) => handleUserChange(newValue ? (newValue.user_id || newValue.id) : '')}
                        onInputChange={(e, newInputValue) => { if (newInputValue && newInputValue.length >= 2) searchUsers(newInputValue); }}
                        renderInput={(params) => <TextField {...params} label="Usuario (buscar por email/nombre)" />}
                      />
                    )}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    {editMode ? (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          Dirección actual: {selectedOrder?.address?.address_line1}
                        </Typography>
                        <Button variant="text" onClick={() => { setNewAddressText(selectedOrder?.address?.address_line1 || ''); setAddressDialogOpen(true); }}>
                          Editar dirección
                        </Button>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                          fullWidth
                          label="Dirección"
                          value={formData.address_line1}
                          onChange={(e) => handleFormChange('address_line1', e.target.value)}
                        />
                        <TextField
                          fullWidth
                          label="Ciudad"
                          value={formData.city}
                          onChange={(e) => handleFormChange('city', e.target.value)}
                        />
                        <TextField
                          fullWidth
                          label="Departamento"
                          value={formData.department}
                          onChange={(e) => handleFormChange('department', e.target.value)}
                        />
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Fecha de entrega"
                      type="date"
                      value={formData.delivery_date}
                      onChange={(e) => handleFormChange('delivery_date', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  {!editMode && (
                    <>
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>Suscripción</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Plan" value={formData.plan_name} onChange={(e) => handleFormChange('plan_name', e.target.value)} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Frecuencia</InputLabel>
                          <Select label="Frecuencia" value={formData.frequency} onChange={(e) => handleFormChange('frequency', e.target.value)}>
                            <MenuItem value="weekly">Semanal</MenuItem>
                            <MenuItem value="biweekly">Quincenal</MenuItem>
                            <MenuItem value="monthly">Mensual</MenuItem>
                            <MenuItem value="quarterly">Trimestral</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth type="number" label="Precio" value={formData.price} onChange={(e) => handleFormChange('price', e.target.value)} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Tamaño de caja</InputLabel>
                          <Select label="Tamaño de caja" value={formData.box_size} onChange={(e) => handleFormChange('box_size', e.target.value)}>
                            <MenuItem value="small">Pequeña</MenuItem>
                            <MenuItem value="medium">Mediana</MenuItem>
                            <MenuItem value="large">Grande</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth label="Preferencias (JSON opcional)" value={formData.custom_preferences} onChange={(e) => handleFormChange('custom_preferences', e.target.value)} multiline rows={3} />
                      </Grid>
                    </>
                  )}

                  {editMode && (
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Estado</InputLabel>
                        <Select
                          label="Estado"
                          value={formData.status}
                          onChange={(e) => handleFormChange('status', e.target.value)}
                        >
                          <MenuItem value="preparing">Preparando</MenuItem>
                          <MenuItem value="cancelled">Cancelado</MenuItem>
                          <MenuItem value="shipped">Enviado</MenuItem>
                          <MenuItem value="delivered">Entregado</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Indicaciones especiales"
                      value={formData.special_instructions}
                      onChange={(e) => handleFormChange('special_instructions', e.target.value)}
                      multiline
                      rows={3}
                    />
                  </Grid>

                </Grid>
              </DialogContent>
              <DialogActions>
                {errorMsg && (
                  <Box sx={{ flex: 1, mr: 2 }}>
                    <Alert severity="warning">{errorMsg}</Alert>
                  </Box>
                )}
                <Button onClick={closeDialog}>Cerrar</Button>
                <Button
                  onClick={submitOrder}
                  variant="contained"
                  disabled={submitting || (!editMode && (!formData.user_id || !formData.address_line1 || !formData.city || !formData.department || !formData.delivery_date || !formData.plan_name || !formData.frequency || !formData.price || !formData.box_size))}
                >
                  {editMode ? 'Guardar cambios' : 'Crear pedido'}
                </Button>
              </DialogActions>
            </Dialog>

          </CardContent>
        </Card>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMsg}
          </Alert>
        </Snackbar>

        <Dialog open={addressDialogOpen} onClose={() => setAddressDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Editar dirección</DialogTitle>
          <DialogContent dividers>
            <TextField
              fullWidth
              label="Nueva dirección"
              value={newAddressText}
              onChange={(e) => setNewAddressText(e.target.value)}
              multiline
              rows={2}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddressDialogOpen(false)}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={async () => {
                try {
                  const addressId = selectedOrder?.address?.address_id || formData.address_id;
                  if (!addressId) {
                    setSnackbarSeverity('warning');
                    setSnackbarMsg('No hay dirección seleccionada para editar');
                    setSnackbarOpen(true);
                    return;
                  }
                  await usersAPI.updateAddress(addressId, { address_line1: newAddressText });
                  // Refresca la lista de direcciones y el pedido seleccionado
                  await handleUserChange(formData.user_id);
                  setSelectedOrder(prev => ({
                    ...prev,
                    address: { ...prev.address, address_line1: newAddressText },
                  }));
                  setSnackbarSeverity('success');
                  setSnackbarMsg('Dirección actualizada');
                  setSnackbarOpen(true);
                  setAddressDialogOpen(false);
                } catch (error) {
                  console.error('Error al actualizar dirección:', error);
                  setSnackbarSeverity('error');
                  setSnackbarMsg('Error al actualizar dirección');
                  setSnackbarOpen(true);
                }
              }}
            >
              Guardar
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog open={nameDialogOpen} onClose={() => setNameDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Editar nombre</DialogTitle>
          <DialogContent dividers>
            <TextField
              fullWidth
              label="Nuevo nombre"
              value={newNameText}
              onChange={(e) => setNewNameText(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNameDialogOpen(false)}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={async () => {
                try {
                  const userId = selectedOrder?.user?.user_id || formData.user_id;
                  if (!userId) {
                    setSnackbarSeverity('warning');
                    setSnackbarMsg('No hay usuario seleccionado para editar');
                    setSnackbarOpen(true);
                    return;
                  }
                  await usersAPI.updateUserAdmin(userId, { name: newNameText });
                  setSelectedOrder(prev => ({
                    ...prev,
                    user: { ...prev.user, name: newNameText },
                  }));
                  setSnackbarSeverity('success');
                  setSnackbarMsg('Nombre actualizado');
                  setSnackbarOpen(true);
                  setNameDialogOpen(false);
                } catch (error) {
                  console.error('Error al actualizar nombre:', error);
                  setSnackbarSeverity('error');
                  setSnackbarMsg('Error al actualizar nombre');
                  setSnackbarOpen(true);
                }
              }}
            >
              Guardar
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  );
};

export default AdminOrders;
