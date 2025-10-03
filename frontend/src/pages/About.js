import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
} from '@mui/material';
import {
  Nature,
  LocalShipping,
  Support,
  Star,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const About = () => {
  const values = [
    {
      icon: <Nature sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Sostenibilidad',
      description: 'Promovemos prácticas agrícolas sostenibles que respetan el medio ambiente.',
    },
    {
      icon: <Support sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Apoyo Local',
      description: 'Apoyamos directamente a los campesinos colombianos y sus comunidades.',
    },
    {
      icon: <LocalShipping sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Frescura',
      description: 'Garantizamos productos frescos directamente del campo a tu hogar.',
    },
  ];

  const team = [
    {
      name: 'María González',
      role: 'Fundadora',
      description: 'Ingeniera Agrónoma con 10 años de experiencia en agricultura sostenible.',
    },
    {
      name: 'Carlos Rodríguez',
      role: 'CEO',
      description: 'Especialista en tecnología y desarrollo de plataformas digitales.',
    },
    {
      name: 'Ana Martínez',
      role: 'Directora de Operaciones',
      description: 'Experta en logística y cadena de suministro agrícola.',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Sobre Cajas del Campo
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph sx={{ maxWidth: 800, mx: 'auto' }}>
            Somos una plataforma que conecta a campesinos locales con consumidores 
            a través de suscripciones de productos frescos y naturales, promoviendo 
            la agricultura sostenible y el comercio justo.
          </Typography>
        </Box>

        {/* Mission Section */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, textAlign: 'center', mb: 4 }}>
            Nuestra Misión
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Para los Consumidores
              </Typography>
              <Typography variant="body1" paragraph>
                Ofrecer productos frescos, naturales y a un precio justo, eliminando 
                intermediarios. Brindamos la comodidad de recibir una caja de mercado 
                en casa y la satisfacción de apoyar directamente la economía local y 
                el consumo sostenible.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Para los Campesinos
              </Typography>
              <Typography variant="body1" paragraph>
                Proporcionar un canal de venta directa, asegurando un ingreso más 
                estable y justo por sus productos, y dándoles visibilidad en el 
                mercado digital para que puedan crecer y desarrollar sus negocios.
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Values Section */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, textAlign: 'center', mb: 4 }}>
            Nuestros Valores
          </Typography>
          <Grid container spacing={4}>
            {values.map((value, index) => (
              <Grid item xs={12} md={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  <Card sx={{ height: '100%', textAlign: 'center', p: 3 }}>
                    <CardContent>
                      <Box sx={{ mb: 2 }}>{value.icon}</Box>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        {value.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {value.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Team Section */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, textAlign: 'center', mb: 4 }}>
            Nuestro Equipo
          </Typography>
          <Grid container spacing={4}>
            {team.map((member, index) => (
              <Grid item xs={12} md={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  <Card sx={{ height: '100%', textAlign: 'center', p: 3 }}>
                    <CardContent>
                      <Avatar
                        sx={{
                          width: 80,
                          height: 80,
                          mx: 'auto',
                          mb: 2,
                          bgcolor: 'primary.main',
                        }}
                      >
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        {member.name}
                      </Typography>
                      <Typography variant="subtitle1" color="primary" gutterBottom>
                        {member.role}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {member.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Stats Section */}
        <Box sx={{ bgcolor: 'grey.50', p: 4, borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
            Nuestro Impacto
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} sm={3}>
              <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                500+
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Familias Beneficiadas
              </Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                50+
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Campesinos Asociados
              </Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                1000+
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Cajas Entregadas
              </Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                95%
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Satisfacción del Cliente
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </motion.div>
    </Container>
  );
};

export default About;
