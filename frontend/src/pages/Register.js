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
  Grid,
  LinearProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Phone,
  Google,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { validateForm, getPasswordStrength, FORM_VALIDATIONS } from '../utils/validation';
import { sanitizeFormData } from '../utils/sanitization';

const Register = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });
  const [validationErrors, setValidationErrors] = useState({});

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm();

  const password = watch('password');
  const watchedFields = watch();

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    setValidationErrors({});

    try {
      // Validación del lado del cliente
      const validation = validateForm(data, FORM_VALIDATIONS.register);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setError('Por favor corrige los errores en el formulario');
        return;
      }

      // Sanitizar datos antes de enviar
      const sanitizedData = sanitizeFormData(data, ['password', 'confirmPassword']);
      
      await registerUser(sanitizedData);
      navigate('/dashboard');
    } catch (error) {
      setError(error.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth
    console.log('Google login clicked');
  };

  // Efecto para evaluar la fortaleza de la contraseña
  React.useEffect(() => {
    if (password) {
      const strength = getPasswordStrength(password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ score: 0, feedback: [] });
    }
  }, [password]);

  // Validación progresiva en tiempo real
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (Object.keys(watchedFields).length > 0) {
        const validation = validateForm(watchedFields, FORM_VALIDATIONS.register);
        setValidationErrors(validation.errors);
      }
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [watchedFields]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const getPasswordStrengthColor = (score) => {
    switch (score) {
      case 0:
      case 1:
        return 'error';
      case 2:
        return 'warning';
      case 3:
        return 'info';
      case 4:
        return 'success';
      default:
        return 'error';
    }
  };

  const getPasswordStrengthText = (score) => {
    switch (score) {
      case 0:
        return 'Muy débil';
      case 1:
        return 'Débil';
      case 2:
        return 'Regular';
      case 3:
        return 'Fuerte';
      case 4:
        return 'Muy fuerte';
      default:
        return 'Muy débil';
    }
  };

  return (
    <Container component="main" maxWidth="md" sx={{ py: 8 }}>
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
            Crear Cuenta
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Únete a nuestra comunidad y disfruta de productos frescos del campo
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('name', FORM_VALIDATIONS.register.name)}
                  fullWidth
                  id="name"
                  label="Nombre"
                  name="name"
                  autoComplete="given-name"
                  error={!!errors.name || !!validationErrors.name}
                  helperText={errors.name?.message || validationErrors.name}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: validationErrors.name ? (
                      <InputAdornment position="end">
                        <Cancel color="error" />
                      </InputAdornment>
                    ) : watchedFields.name && !validationErrors.name && watchedFields.name.length >= 2 ? (
                      <InputAdornment position="end">
                        <CheckCircle color="success" />
                      </InputAdornment>
                    ) : null,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('phone_number', FORM_VALIDATIONS.register.phone_number)}
                  fullWidth
                  id="phone_number"
                  label="Teléfono (Opcional)"
                  name="phone_number"
                  autoComplete="tel"
                  error={!!errors.phone_number || !!validationErrors.phone_number}
                  helperText={errors.phone_number?.message || validationErrors.phone_number}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: validationErrors.phone_number ? (
                      <InputAdornment position="end">
                        <Cancel color="error" />
                      </InputAdornment>
                    ) : watchedFields.phone_number && !validationErrors.phone_number && watchedFields.phone_number.length > 0 ? (
                      <InputAdornment position="end">
                        <CheckCircle color="success" />
                      </InputAdornment>
                    ) : null,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  {...register('email', {
                    required: 'El email es requerido',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido',
                    },
                  })}
                  fullWidth
                  id="email"
                  label="Email"
                  name="email"
                  autoComplete="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('password', {
                    required: 'La contraseña es requerida',
                    minLength: {
                      value: 8,
                      message: 'La contraseña debe tener al menos 8 caracteres',
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'La contraseña debe contener al menos una minúscula, una mayúscula y un número',
                    },
                  })}
                  fullWidth
                  name="password"
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
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
                      </InputAdornment>
                    ),
                  }}
                />
                {/* Indicador de fortaleza de contraseña */}
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Fortaleza: {getPasswordStrengthText(passwordStrength.score)}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(passwordStrength.score / 4) * 100}
                    color={getPasswordStrengthColor(passwordStrength.score)}
                    sx={{ mt: 0.5 }}
                  />
                  {passwordStrength.feedback?.length > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {passwordStrength.feedback.join(' • ')}
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('confirmPassword', {
                    required: 'Confirma tu contraseña',
                    validate: (value) =>
                      value === password || 'Las contraseñas no coinciden',
                  })}
                  fullWidth
                  name="confirmPassword"
                  label="Confirmar Contraseña"
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  autoComplete="new-password"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle confirm password visibility"
                          onClick={toggleConfirmPasswordVisibility}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </Button>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                O regístrate con
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
                ¿Ya tienes una cuenta?{' '}
                <Link
                  component={RouterLink}
                  to="/login"
                  variant="body2"
                  color="primary"
                  sx={{ fontWeight: 500 }}
                >
                  Inicia sesión aquí
                </Link>
              </Typography>
            </Box>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Al crear una cuenta, aceptas nuestros{' '}
                <Link href="/terms" color="primary">
                  Términos y Condiciones
                </Link>{' '}
                y nuestra{' '}
                <Link href="/privacy" color="primary">
                  Política de Privacidad
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default Register;
