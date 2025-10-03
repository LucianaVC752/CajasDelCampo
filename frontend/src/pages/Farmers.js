import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  TextField,
  Box,
  Chip,
  Pagination,
  CircularProgress,
} from '@mui/material';
import {
  Person,
  LocationOn,
  Nature,
  Store,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { farmersAPI } from '../services/api';
import { motion } from 'framer-motion';

const Farmers = () => {
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchFarmers();
  }, [page, searchTerm]);

  const fetchFarmers = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 12,
        search: searchTerm,
      };
      
      const response = await farmersAPI.getFarmers(params);
      setFarmers(response.data.farmers);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching farmers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && farmers.length === 0) {
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
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
        Nuestros Campesinos
      </Typography>

      {/* Search */}
      <Box sx={{ mb: 4 }}>
        <TextField
          placeholder="Buscar campesinos..."
          value={searchTerm}
          onChange={handleSearchChange}
          fullWidth
          sx={{ maxWidth: 400 }}
        />
      </Box>

      {/* Farmers Grid */}
      {farmers.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No se encontraron campesinos
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {farmers.map((farmer, index) => (
              <Grid item xs={12} sm={6} md={4} key={farmer.farmer_id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        transition: 'transform 0.3s ease',
                      },
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={farmer.image_url || '/placeholder-farmer.jpg'}
                      alt={farmer.name}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                        {farmer.name}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {farmer.location}
                        </Typography>
                      </Box>
                      
                      {farmer.specialties && farmer.specialties.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          {farmer.specialties.map((specialty, idx) => (
                            <Chip
                              key={idx}
                              label={specialty}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))}
                        </Box>
                      )}
                      
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {farmer.story || 'Campesino dedicado a la agricultura sostenible.'}
                      </Typography>
                      
                      {farmer.years_experience && (
                        <Typography variant="body2" color="text.secondary">
                          {farmer.years_experience} años de experiencia
                        </Typography>
                      )}
                    </CardContent>
                    
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<Store />}
                        onClick={() => navigate(`/farmers/${farmer.farmer_id}`)}
                      >
                        Ver Productos
                      </Button>
                    </CardActions>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default Farmers;
