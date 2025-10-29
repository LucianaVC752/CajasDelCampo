import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Google,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { validateForm, FORM_VALIDATIONS } from '../utils/validation';
import { sanitizeFormData } from '../utils/sanitization';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();
  const watchedEmail = watch('email');
  const watchedPassword = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    setValidationErrors({});

    try {
      const validation = validateForm(data, FORM_VALIDATIONS.login);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setError('Por favor corrige los errores en el formulario');
        return;
      }

      const sanitizedData = sanitizeFormData(data, ['password']);
      const result = await login(sanitizedData.email, sanitizedData.password);

      if (result?.success) {
        navigate('/dashboard');
      } else {
        setError(result?.error || 'Credenciales inválidas');
      }
    } catch (e) {
      setError(e.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth
    console.log('Google login clicked');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ py: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography
            component="h1"
            variant="h4"
            gutterBottom
            sx={{ fontWeight: 600, color: 'primary.main' }}
          >
            Iniciar Sesión
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Ingresa tus credenciales para acceder a tu cuenta
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
            <TextField
              {...register('email', FORM_VALIDATIONS.login.email)}
              margin="normal"
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              error={!!errors.email || !!validationErrors.email}
              helperText={errors.email?.message || validationErrors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
                endAdornment: validationErrors.email ? (
                  <InputAdornment position="end">
                    <Cancel color="error" />
                  </InputAdornment>
                ) : watchedEmail ? (
                  <InputAdornment position="end">
                    <CheckCircle color="success" />
                  </InputAdornment>
                ) : null,
              }}
            />
            
            <TextField
              {...register('password', FORM_VALIDATIONS.login.password)}
              margin="normal"
              fullWidth
              name="password"
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              error={!!errors.password || !!validationErrors.password}
              helperText={errors.password?.message || validationErrors.password}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                    {validationErrors.password ? (
                      <Cancel color="error" sx={{ ml: 1 }} />
                    ) : watchedPassword && watchedPassword.length >= 8 ? (
                      <CheckCircle color="success" sx={{ ml: 1 }} />
                    ) : null}
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ textAlign: 'right', mt: 1 }}>
              <Link
                component={RouterLink}
                to="/forgot-password"
                variant="body2"
                color="primary"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                O continúa con
              </Typography>
            </Divider>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<Google />}
              onClick={handleGoogleLogin}
              sx={{ mb: 2 }}
            >
              Continuar con Google
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                ¿No tienes una cuenta?{' '}
                <Link
                  component={RouterLink}
                  to="/register"
                  variant="body2"
                  color="primary"
                  sx={{ fontWeight: 500 }}
                >
                  Regístrate aquí
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default Login;
