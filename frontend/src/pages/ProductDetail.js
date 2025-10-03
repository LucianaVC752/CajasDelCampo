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
  ShoppingCart,
  Nature,
  LocalShipping,
  Person,
  Star,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { motion } from 'framer-motion';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getProduct(id);
      setProduct(response.data.product);
    } catch (error) {
      setError('Error al cargar el producto');
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
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
          Cargando producto...
        </Typography>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Producto no encontrado'}</Alert>
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
          {/* Product Image */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardMedia
                component="img"
                height="400"
                image={product.image_url || '/placeholder-vegetable.jpg'}
                alt={product.name}
                sx={{ objectFit: 'cover' }}
              />
            </Card>
          </Grid>

          {/* Product Info */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                  {product.name}
                </Typography>
                {product.organic && (
                  <Chip
                    icon={<Nature />}
                    label="Orgánico"
                    color="success"
                    size="large"
                  />
                )}
              </Box>
              
              <Typography variant="h5" color="primary" sx={{ fontWeight: 600, mb: 2 }}>
                {formatPrice(product.price)} / {product.unit}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Descripción
            </Typography>
            <Typography variant="body1" paragraph>
              {product.description || 'Sin descripción disponible.'}
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Información del Campesino
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Person color="action" />
                <Typography variant="body1">
                  {product.farmer?.name}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LocalShipping color="action" />
                <Typography variant="body1">
                  {product.farmer?.location}
                </Typography>
              </Box>
              {product.farmer?.story && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {product.farmer.story}
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<ShoppingCart />}
                onClick={() => navigate('/subscriptions')}
                sx={{ flexGrow: 1 }}
              >
                Suscribirse
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/products')}
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

export default ProductDetail;
