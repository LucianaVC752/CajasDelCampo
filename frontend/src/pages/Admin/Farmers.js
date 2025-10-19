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
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
} from '@mui/material';
import {
  Search,
  Edit,
  Delete,
  Add,
  Restore,
  Store,
  Save,
  Cancel,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminFarmers = () => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    email: '',
    phone: '',
    years_experience: '',
    specialties: '', // coma separada: "frutas, tubérculos"
    is_active: true,
  });

  useEffect(() => {
    fetchFarmers();
  }, []);

  const fetchFarmers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Admin: listar todos (activos e inactivos)
      const response = await api.get('/farmers/admin/all');
      setFarmers(response.data.farmers || []);
    } catch (error) {
      console.error('Error fetching farmers:', error);
      setError('Error al cargar los campesinos');
      toast.error('Error al cargar los campesinos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (farmer = null) => {
    if (farmer) {
      setEditingFarmer(farmer);
      setFormData({
        name: farmer.name || '',
        location: farmer.location || '',
        email: farmer.email || '',
        phone: farmer.phone || '',
        years_experience: farmer.years_experience ?? '',
        specialties: Array.isArray(farmer.specialties) ? farmer.specialties.join(', ') : (farmer.specialties || ''),
        is_active: farmer.is_active !== false,
      });
      setImageFile(null);
    } else {
      setEditingFarmer(null);
      setFormData({
        name: '',
        location: '',
        email: '',
        phone: '',
        years_experience: '',
        specialties: '',
        is_active: true,
      });
      setImageFile(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingFarmer(null);
    setImageFile(null);
    setFormData({
      name: '',
      location: '',
      email: '',
      phone: '',
      years_experience: '',
      specialties: '',
      is_active: true,
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Reglas: sin URL, solo archivo. Obligatorio en creación.
      if (!editingFarmer && !imageFile) {
        toast.error('Debes subir un archivo de imagen al crear');
        return;
      }
      if (imageFile && imageFile.size > 2 * 1024 * 1024) {
        toast.error('El archivo de imagen excede 2MB');
        return;
      }

      if (imageFile) {
        const multipart = new FormData();
        multipart.append('image', imageFile);
        Object.entries(formData).forEach(([key, value]) => {
          multipart.append(key, value !== undefined && value !== null ? value : '');
        });

        if (editingFarmer) {
          await api.put(`/farmers/${editingFarmer.farmer_id}`, multipart, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          toast.success('Campesino actualizado exitosamente');
        } else {
          await api.post('/farmers', multipart, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          toast.success('Campesino creado exitosamente');
        }
      } else {
        // Actualización sin cambiar imagen
        if (editingFarmer) {
          await api.patch(`/farmers/${editingFarmer.farmer_id}`, formData);
          toast.success('Campesino actualizado exitosamente');
        } else {
          // No se permite creación sin imagen
          toast.error('Debes subir un archivo de imagen al crear');
          return;
        }
      }

      handleCloseDialog();
      fetchFarmers();
    } catch (error) {
      console.error('Error saving farmer:', error);
      toast.error(error.response?.data?.message || 'Error al guardar el campesino');
    }
  };

  const handleToggleStatus = async (farmerId) => {
    try {
      const current = farmers.find(f => f.farmer_id === farmerId);
      await api.patch(`/farmers/${farmerId}`, {
        is_active: !current?.is_active,
      });
      toast.success('Estado actualizado');
      fetchFarmers();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  const filteredFarmers = farmers.filter(farmer =>
    (farmer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (farmer.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (farmer.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Cargando campesinos...
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
        <Button variant="contained" onClick={fetchFarmers}>
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
          Gestión de Campesinos
        </Typography>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <TextField
                placeholder="Buscar campesinos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ minWidth: 300 }}
              />
              <Button 
                variant="contained" 
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
              >
                Agregar Campesino
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Imagen</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Ubicación</TableCell>
                    <TableCell>Contacto</TableCell>
                    <TableCell>Experiencia</TableCell>
                    <TableCell>Especialidades</TableCell>
                    <TableCell>Productos</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredFarmers.map((farmer, index) => (
                    <motion.tr
                      key={farmer.farmer_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <TableCell>
                        <Avatar
                          src={`/api/farmers/${farmer.farmer_id}/image`}
                          alt={farmer.name}
                          sx={{ width: 40, height: 40 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {farmer.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {farmer.location}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {farmer.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {farmer.phone}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {farmer.years_experience} años
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {(farmer.specialties || []).map((specialty, idx) => (
                            <Chip
                              key={idx}
                              label={specialty}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Store fontSize="small" color="action" />
                          <Typography variant="body2">
                            {farmer.products_count ?? farmer.products?.length ?? 0}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={farmer.is_active ? 'Activo' : 'Inactivo'}
                          color={farmer.is_active ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton 
                            size="small"
                            onClick={() => handleOpenDialog(farmer)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleStatus(farmer.farmer_id)}
                            color={farmer.is_active ? 'error' : 'success'}
                          >
                            {farmer.is_active ? <Delete /> : <Restore />}
                          </IconButton>
                        </Box>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Farmer Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingFarmer ? 'Editar Campesino' : 'Nuevo Campesino'}
          </DialogTitle>
          <DialogContent>
            <Box component="form" sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nombre"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Ubicación"
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    type="email"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Teléfono"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Años de experiencia"
                    name="years_experience"
                    type="number"
                    value={formData.years_experience}
                    onChange={handleFormChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Especialidades (separadas por coma)"
                    name="specialties"
                    value={formData.specialties}
                    onChange={handleFormChange}
                    placeholder="frutas, tubérculos, hierbas"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                  >
                    Subir imagen desde el ordenador
                    <input
                      hidden
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileChange}
                    />
                  </Button>
                  {imageFile && (
                    <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                      Archivo: {imageFile.name} ({Math.round(imageFile.size / 1024)} KB)
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Solo archivo de imagen (máx. 2MB). No se admite URL.
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} startIcon={<Cancel />}>Cancelar</Button>
            <Button onClick={handleSubmit} variant="contained" startIcon={<Save />}>
              {editingFarmer ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  );
};

export default AdminFarmers;
