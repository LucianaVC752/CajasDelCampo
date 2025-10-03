import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  LocalShipping,
  Nature,
  Support,
  Star,
  ShoppingCart,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Home = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const features = [
    {
      icon: <Nature sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Productos Frescos',
      description: 'Directamente del campo a tu hogar, garantizando frescura y calidad.',
    },
    {
      icon: <LocalShipping sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Envío Gratis',
      description: 'Entregamos a tu puerta sin costo adicional en todas las suscripciones.',
    },
    {
      icon: <Support sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Apoyo Local',
      description: 'Contribuimos al desarrollo de la economía campesina colombiana.',
    },
  ];

  const testimonials = [
    {
      name: 'María González',
      location: 'Bogotá',
      rating: 5,
      comment: 'Los productos llegan súper frescos y la calidad es excelente. ¡Recomendado!',
    },
    {
      name: 'Carlos Rodríguez',
      location: 'Medellín',
      rating: 5,
      comment: 'Me encanta apoyar a los campesinos locales y comer sano.',
    },
    {
      name: 'Ana Martínez',
      location: 'Cali',
      rating: 5,
      comment: 'El servicio es muy bueno y los productos siempre están en perfecto estado.',
    },
  ];

  const subscriptionPlans = [
    {
      name: 'Caja Pequeña',
      price: '$25.000',
      description: 'Perfecta para 1-2 personas',
      products: '4-6 productos frescos',
      popular: false,
    },
    {
      name: 'Caja Mediana',
      price: '$40.000',
      description: 'Ideal para 2-4 personas',
      products: '6-8 productos frescos',
      popular: true,
    },
    {
      name: 'Caja Grande',
      price: '$60.000',
      description: 'Perfecta para familias grandes',
      products: '8-12 productos frescos',
      popular: false,
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Typography
              variant={isMobile ? 'h3' : 'h2'}
              component="h1"
              gutterBottom
              sx={{ fontWeight: 700, mb: 3 }}
            >
              Productos Frescos del Campo
            </Typography>
            <Typography
              variant={isMobile ? 'h6' : 'h5'}
              paragraph
              sx={{ mb: 4, opacity: 0.9 }}
            >
              Conectamos a campesinos locales con consumidores a través de 
              suscripciones de productos frescos y naturales.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                onClick={() => navigate('/products')}
                startIcon={<ShoppingCart />}
                sx={{ px: 4, py: 1.5 }}
              >
                Ver Productos
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                size="large"
                onClick={() => navigate('/subscriptions')}
                sx={{ px: 4, py: 1.5, borderColor: 'white', color: 'white' }}
              >
                Suscribirse
              </Button>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h4"
          component="h2"
          textAlign="center"
          gutterBottom
          sx={{ mb: 6, fontWeight: 600 }}
        >
          ¿Por qué elegir Cajas del Campo?
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    p: 3,
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      transition: 'transform 0.3s ease',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Subscription Plans Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            component="h2"
            textAlign="center"
            gutterBottom
            sx={{ mb: 6, fontWeight: 600 }}
          >
            Nuestros Planes de Suscripción
          </Typography>
          <Grid container spacing={4}>
            {subscriptionPlans.map((plan, index) => (
              <Grid item xs={12} md={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      position: 'relative',
                      border: plan.popular ? `2px solid ${theme.palette.primary.main}` : 'none',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        transition: 'transform 0.3s ease',
                      },
                    }}
                  >
                    {plan.popular && (
                      <Chip
                        label="Más Popular"
                        color="primary"
                        sx={{
                          position: 'absolute',
                          top: -12,
                          left: '50%',
                          transform: 'translateX(-50%)',
                        }}
                      />
                    )}
                    <CardContent sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                        {plan.name}
                      </Typography>
                      <Typography
                        variant="h3"
                        color="primary"
                        gutterBottom
                        sx={{ fontWeight: 700 }}
                      >
                        {plan.price}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {plan.description}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {plan.products}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                      <Button
                        variant={plan.popular ? 'contained' : 'outlined'}
                        color="primary"
                        fullWidth
                        onClick={() => navigate('/subscriptions')}
                      >
                        Suscribirse
                      </Button>
                    </CardActions>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h4"
          component="h2"
          textAlign="center"
          gutterBottom
          sx={{ mb: 6, fontWeight: 600 }}
        >
          Lo que dicen nuestros clientes
        </Typography>
        <Grid container spacing={4}>
          {testimonials.map((testimonial, index) => (
            <Grid item xs={12} md={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <Card sx={{ height: '100%', p: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', mb: 2 }}>
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} color="warning" fontSize="small" />
                      ))}
                    </Box>
                    <Typography variant="body2" paragraph sx={{ fontStyle: 'italic' }}>
                      "{testimonial.comment}"
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {testimonial.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {testimonial.location}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
          color: 'white',
          py: 8,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            ¿Listo para empezar?
          </Typography>
          <Typography variant="h6" paragraph sx={{ mb: 4, opacity: 0.9 }}>
            Únete a nuestra comunidad y disfruta de productos frescos del campo
          </Typography>
          <Button
            variant="contained"
            color="inherit"
            size="large"
            onClick={() => navigate('/register')}
            sx={{ px: 4, py: 1.5, color: 'primary.main' }}
          >
            Crear Cuenta Gratis
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
