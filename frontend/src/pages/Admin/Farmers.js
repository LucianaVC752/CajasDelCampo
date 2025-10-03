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
} from '@mui/material';
import {
  Search,
  Edit,
  Delete,
  Add,
  Restore,
  Store,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const AdminFarmers = () => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFarmers();
  }, []);

  const fetchFarmers = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setFarmers([
        {
          farmer_id: 1,
          name: 'María González',
          location: 'Bogotá, Cundinamarca',
          email: 'maria@example.com',
          phone: '+57 300 123 4567',
          is_active: true,
          years_experience: 15,
          specialties: ['vegetales', 'hierbas'],
          products_count: 12,
          image_url: '/placeholder-farmer.jpg',
        },
        {
          farmer_id: 2,
          name: 'Carlos Rodríguez',
          location: 'Medellín, Antioquia',
          email: 'carlos@example.com',
          phone: '+57 300 234 5678',
          is_active: true,
          years_experience: 8,
          specialties: ['frutas', 'tubérculos'],
          products_count: 8,
          image_url: '/placeholder-farmer.jpg',
        },
        {
          farmer_id: 3,
          name: 'Ana Martínez',
          location: 'Cali, Valle del Cauca',
          email: 'ana@example.com',
          phone: '+57 300 345 6789',
          is_active: false,
          years_experience: 12,
          specialties: ['legumbres'],
          products_count: 5,
          image_url: '/placeholder-farmer.jpg',
        },
      ]);
      setLoading(false);
    }, 1000);
  };

  const handleToggleStatus = (farmerId) => {
    setFarmers(farmers.map(farmer => 
      farmer.farmer_id === farmerId 
        ? { ...farmer, is_active: !farmer.is_active }
        : farmer
    ));
  };

  const filteredFarmers = farmers.filter(farmer =>
    farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.email.toLowerCase().includes(searchTerm.toLowerCase())
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
              <Button variant="contained" startIcon={<Add />}>
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
                          src={farmer.image_url}
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
                          {farmer.specialties.map((specialty, idx) => (
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
                            {farmer.products_count}
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
                          <IconButton size="small">
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
      </motion.div>
    </Container>
  );
};

export default AdminFarmers;
