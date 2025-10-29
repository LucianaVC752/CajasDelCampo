import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
  storeTokens, 
  getAccessToken, 
  getRefreshToken, 
  getUserData, 
  clearAuthData, 
  isAuthenticated as checkAuthentication,
  isTokenExpired,
  shouldRefreshToken,
  updateLastActivity,
  setupInactivityTimer,
  handleFailedLogin,
  clearFailedLogins,
  checkLoginLock,
  validateCredentials
} from '../utils/auth';
import { initializeCsrfProtection, clearCsrfTokens } from '../utils/csrf';
import { sanitizeFormData } from '../utils/sanitization';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(getAccessToken());
  const [loginAttempts, setLoginAttempts] = useState({});
  const [inactivityCleanup, setInactivityCleanup] = useState(null);

  // Set up axios interceptor for token
  useEffect(() => {
    if (token) {
      authAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete authAPI.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Initialize security and check authentication on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Inicializar protección CSRF
        await initializeCsrfProtection();
        
        // Verificar autenticación existente
        const storedToken = getAccessToken();
        const storedUser = getUserData();
        
        if (storedToken && storedUser && checkAuthentication()) {
          // Verificar si el token necesita refresh
          if (shouldRefreshToken(storedToken)) {
            try {
              await refreshTokenSilently();
            } catch (error) {
              console.warn('Token refresh failed during initialization:', error);
              handleLogout();
            }
          } else {
            setToken(storedToken);
            setUser(storedUser);
            
            // Configurar timer de inactividad
            const cleanup = setupInactivityTimer(handleLogout);
            setInactivityCleanup(() => cleanup);
          }
        } else if (storedToken) {
          // Token existe pero no es válido, limpiar
          handleLogout();
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
    
    // Cleanup al desmontar
    return () => {
      if (inactivityCleanup) {
        inactivityCleanup();
      }
    };
  }, []);

  const login = async (email, password) => {
    try {
      // Validar credenciales antes de enviar
      const validation = validateCredentials(email, password);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        toast.error(firstError);
        return { success: false, error: firstError };
      }
      
      // Verificar bloqueo por intentos fallidos
      const lockStatus = checkLoginLock(email);
      if (lockStatus.isLocked) {
        const message = `Cuenta bloqueada por ${lockStatus.remainingMinutes} minutos debido a múltiples intentos fallidos`;
        toast.error(message);
        return { success: false, error: message };
      }
      
      // Sanitizar datos de entrada
      const sanitizedData = sanitizeFormData({ email, password });
      
      const response = await authAPI.post('/auth/login', sanitizedData);
      const { user, accessToken, refreshToken } = response.data;
      
      // Almacenar tokens de forma segura
      storeTokens(accessToken, refreshToken, user);
      setToken(accessToken);
      setUser(user);
      
      // Limpiar intentos fallidos
      clearFailedLogins(email);
      setLoginAttempts(prev => ({ ...prev, [email]: 0 }));
      
      // Configurar timer de inactividad
      if (inactivityCleanup) {
        inactivityCleanup();
      }
      const cleanup = setupInactivityTimer(handleLogout);
      setInactivityCleanup(() => cleanup);
      
      toast.success('¡Bienvenido!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      
      // Manejar intentos fallidos
      const failureStatus = handleFailedLogin(email);
      setLoginAttempts(prev => ({ ...prev, [email]: failureStatus.attempts }));
      
      if (failureStatus.isLocked) {
        const lockMessage = `Demasiados intentos fallidos. Cuenta bloqueada por ${failureStatus.remainingMinutes} minutos`;
        toast.error(lockMessage);
        return { success: false, error: lockMessage };
      } else if (failureStatus.remainingAttempts) {
        const attemptMessage = `${message}. Intentos restantes: ${failureStatus.remainingAttempts}`;
        toast.error(attemptMessage);
        return { success: false, error: attemptMessage };
      }
      
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      // Sanitizar datos de entrada
      const sanitizedData = sanitizeFormData(userData);
      
      const response = await authAPI.post('/auth/register', sanitizedData);
      const { user, accessToken, refreshToken } = response.data;
      
      // Almacenar tokens de forma segura
      storeTokens(accessToken, refreshToken, user);
      setToken(accessToken);
      setUser(user);
      
      // Configurar timer de inactividad
      if (inactivityCleanup) {
        inactivityCleanup();
      }
      const cleanup = setupInactivityTimer(handleLogout);
      setInactivityCleanup(() => cleanup);
      
      toast.success('¡Cuenta creada exitosamente!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al crear la cuenta';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Limpiar todos los datos de autenticación
      clearAuthData();
      clearCsrfTokens();
      
      // Limpiar timer de inactividad
      if (inactivityCleanup) {
        inactivityCleanup();
        setInactivityCleanup(null);
      }
      
      setToken(null);
      setUser(null);
      setLoginAttempts({});
      
      toast.success('Sesión cerrada');
    }
  };
  
  const logout = handleLogout;

  const refreshTokenSilently = async () => {
    try {
      const refreshTokenValue = getRefreshToken();
      if (!refreshTokenValue) {
        throw new Error('No refresh token');
      }

      const response = await authAPI.post('/auth/refresh', {
        refreshToken: refreshTokenValue
      });
      
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      
      // Almacenar tokens de forma segura
      storeTokens(accessToken, newRefreshToken);
      setToken(accessToken);
      
      return accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      handleLogout();
      throw error;
    }
  };
  
  const refreshToken = refreshTokenSilently;

  const updateProfile = async (profileData) => {
    try {
      // Sanitizar datos del perfil
      const sanitizedData = sanitizeFormData(profileData);
      
      const response = await authAPI.put('/users/profile', sanitizedData);
      const updatedUser = response.data.user;
      
      setUser(updatedUser);
      
      // Actualizar datos almacenados
      storeTokens(token, getRefreshToken(), updatedUser);
      
      toast.success('Perfil actualizado');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al actualizar el perfil';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const forgotPassword = async (email) => {
    try {
      await authAPI.post('/auth/forgot-password', { email });
      toast.success('Se ha enviado un enlace de recuperación a tu correo');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al enviar el enlace de recuperación';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const resetPassword = async (token, password) => {
    try {
      await authAPI.post('/auth/reset-password', { token, password });
      toast.success('Contraseña actualizada exitosamente');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al actualizar la contraseña';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    loading,
    token,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    forgotPassword,
    resetPassword,
    isAuthenticated: !!user && checkAuthentication(),
    isAdmin: user?.role === 'admin',
    loginAttempts,
    checkLoginLock: (email) => checkLoginLock(email),
    updateActivity: updateLastActivity
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
