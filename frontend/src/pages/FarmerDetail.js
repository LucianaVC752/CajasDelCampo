import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Person,
  LocationOn,
  Nature,
  Store,
  Star,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { farmersAPI } from '../services/api';
import { motion } from 'framer-motion';

const FarmerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFarmer();
  }, [id]);

  const fetchFarmer = async () => {
    try {
      setLoading(true);
      const response = await farmersAPI.getFarmer(id);
      setFarmer(response.data.farmer);
    } catch (error) {
      setError('Error al cargar el campesino');
      console.error('Error fetching farmer:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Cargando campesino...
        </Typography>
      </Container>
    );
  }

  if (error || !farmer) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Campesino no encontrado'}</Alert>
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
        <Grid container spacing={4}>
          {/* Farmer Image */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardMedia
                component="img"
                height="400"
                image={farmer.image_url || '/placeholder-farmer.jpg'}
                alt={farmer.name}
                sx={{ objectFit: 'cover' }}
              />
            </Card>
          </Grid>

          {/* Farmer Info */}
          <Grid item xs={12} md={8}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
              {farmer.name}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LocationOn color="action" />
              <Typography variant="h6" color="text.secondary">
                {farmer.location}
              </Typography>
            </Box>

            {farmer.specialties && farmer.specialties.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Especialidades
                </Typography>
                {farmer.specialties.map((specialty, idx) => (
                  <Chip
                    key={idx}
                    label={specialty}
                    color="primary"
                    variant="outlined"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Historia
            </Typography>
            <Typography variant="body1" paragraph>
              {farmer.story || 'Campesino dedicado a la agricultura sostenible y el cultivo de productos frescos.'}
            </Typography>

            {farmer.years_experience && (
              <Typography variant="body1" paragraph>
                <strong>Experiencia:</strong> {farmer.years_experience} años
              </Typography>
            )}

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<Store />}
                onClick={() => navigate(`/farmers/${farmer.farmer_id}/products`)}
              >
                Ver Productos
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/farmers')}
              >
                Volver
              </Button>
            </Box>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
};

export default FarmerDetail;
