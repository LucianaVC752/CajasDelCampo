// Utilidades de autenticación y manejo seguro de tokens
// Implementa timeout de sesión, limpieza de datos y validaciones

// Configuración de seguridad
const AUTH_CONFIG = {
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutos en milisegundos
  REFRESH_THRESHOLD: 5 * 60 * 1000, // Refrescar token 5 minutos antes de expirar
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutos de bloqueo
  STORAGE_PREFIX: 'cajas_del_campo_'
};

// Claves de almacenamiento
const STORAGE_KEYS = {
  ACCESS_TOKEN: AUTH_CONFIG.STORAGE_PREFIX + 'access_token',
  REFRESH_TOKEN: AUTH_CONFIG.STORAGE_PREFIX + 'refresh_token',
  USER_DATA: AUTH_CONFIG.STORAGE_PREFIX + 'user_data',
  LAST_ACTIVITY: AUTH_CONFIG.STORAGE_PREFIX + 'last_activity',
  LOGIN_ATTEMPTS: AUTH_CONFIG.STORAGE_PREFIX + 'login_attempts',
  LOCKOUT_UNTIL: AUTH_CONFIG.STORAGE_PREFIX + 'lockout_until',
  CSRF_TOKEN: AUTH_CONFIG.STORAGE_PREFIX + 'csrf_token'
};

/**
 * Decodifica un JWT sin verificar la firma (solo para leer datos)
 * @param {string} token - Token JWT
 * @returns {object|null} - Payload decodificado o null si es inválido
 */
export const decodeJWT = (token) => {
  if (!token || typeof token !== 'string') return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch (error) {
    console.warn('Error decodificando JWT:', error);
    return null;
  }
};

/**
 * Verifica si un token ha expirado
 * @param {string} token - Token JWT
 * @returns {boolean} - true si ha expirado
 */
export const isTokenExpired = (token) => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};

/**
 * Verifica si un token necesita ser refrescado
 * @param {string} token - Token JWT
 * @returns {boolean} - true si necesita refresh
 */
export const shouldRefreshToken = (token) => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = (decoded.exp - currentTime) * 1000;
  
  return timeUntilExpiry < AUTH_CONFIG.REFRESH_THRESHOLD;
};

/**
 * Almacena tokens de forma segura
 * @param {string} accessToken - Token de acceso
 * @param {string} refreshToken - Token de refresco
 * @param {object} userData - Datos del usuario
 */
export const storeTokens = (accessToken, refreshToken, userData = null) => {
  try {
    if (accessToken) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    }
    if (refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
    if (userData) {
      // Sanitizar datos del usuario antes de almacenar
      const sanitizedUserData = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        // No almacenar datos sensibles como contraseñas
      };
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(sanitizedUserData));
    }
    
    // Actualizar timestamp de última actividad
    updateLastActivity();
  } catch (error) {
    console.error('Error almacenando tokens:', error);
  }
};

/**
 * Obtiene el token de acceso almacenado
 * @returns {string|null} - Token de acceso o null
 */
export const getAccessToken = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  } catch (error) {
    console.error('Error obteniendo token de acceso:', error);
    return null;
  }
};

/**
 * Obtiene el token de refresco almacenado
 * @returns {string|null} - Token de refresco o null
 */
export const getRefreshToken = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('Error obteniendo token de refresco:', error);
    return null;
  }
};

/**
 * Obtiene los datos del usuario almacenados
 * @returns {object|null} - Datos del usuario o null
 */
export const getUserData = () => {
  try {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error obteniendo datos del usuario:', error);
    return null;
  }
};

/**
 * Limpia todos los datos de autenticación
 */
export const clearAuthData = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    // También limpiar sessionStorage por seguridad
    Object.values(STORAGE_KEYS).forEach(key => {
      sessionStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error limpiando datos de autenticación:', error);
  }
};

/**
 * Actualiza el timestamp de última actividad
 */
export const updateLastActivity = () => {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
  } catch (error) {
    console.error('Error actualizando última actividad:', error);
  }
};

/**
 * Verifica si la sesión ha expirado por inactividad
 * @returns {boolean} - true si la sesión ha expirado
 */
export const isSessionExpired = () => {
  try {
    const lastActivity = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
    if (!lastActivity) return true;
    
    const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
    return timeSinceLastActivity > AUTH_CONFIG.SESSION_TIMEOUT;
  } catch (error) {
    console.error('Error verificando expiración de sesión:', error);
    return true;
  }
};

/**
 * Verifica si el usuario está autenticado y la sesión es válida
 * @returns {boolean} - true si está autenticado
 */
export const isAuthenticated = () => {
  const accessToken = getAccessToken();
  
  if (!accessToken) return false;
  if (isTokenExpired(accessToken)) return false;
  if (isSessionExpired()) return false;
  
  return true;
};

/**
 * Maneja los intentos de login fallidos
 * @param {string} identifier - Email o identificador del usuario
 * @returns {object} - Estado del bloqueo
 */
export const handleFailedLogin = (identifier) => {
  try {
    const key = STORAGE_KEYS.LOGIN_ATTEMPTS + '_' + btoa(identifier);
    const lockoutKey = STORAGE_KEYS.LOCKOUT_UNTIL + '_' + btoa(identifier);
    
    // Verificar si ya está bloqueado
    const lockoutUntil = localStorage.getItem(lockoutKey);
    if (lockoutUntil && Date.now() < parseInt(lockoutUntil)) {
      const remainingTime = Math.ceil((parseInt(lockoutUntil) - Date.now()) / 60000);
      return {
        isLocked: true,
        remainingMinutes: remainingTime,
        attempts: AUTH_CONFIG.MAX_LOGIN_ATTEMPTS
      };
    }
    
    // Incrementar intentos
    const attempts = parseInt(localStorage.getItem(key) || '0') + 1;
    localStorage.setItem(key, attempts.toString());
    
    // Verificar si se alcanzó el límite
    if (attempts >= AUTH_CONFIG.MAX_LOGIN_ATTEMPTS) {
      const lockoutUntil = Date.now() + AUTH_CONFIG.LOCKOUT_DURATION;
      localStorage.setItem(lockoutKey, lockoutUntil.toString());
      
      return {
        isLocked: true,
        remainingMinutes: Math.ceil(AUTH_CONFIG.LOCKOUT_DURATION / 60000),
        attempts
      };
    }
    
    return {
      isLocked: false,
      attempts,
      remainingAttempts: AUTH_CONFIG.MAX_LOGIN_ATTEMPTS - attempts
    };
  } catch (error) {
    console.error('Error manejando login fallido:', error);
    return { isLocked: false, attempts: 0 };
  }
};

/**
 * Limpia los intentos de login fallidos (después de login exitoso)
 * @param {string} identifier - Email o identificador del usuario
 */
export const clearFailedLogins = (identifier) => {
  try {
    const key = STORAGE_KEYS.LOGIN_ATTEMPTS + '_' + btoa(identifier);
    const lockoutKey = STORAGE_KEYS.LOCKOUT_UNTIL + '_' + btoa(identifier);
    
    localStorage.removeItem(key);
    localStorage.removeItem(lockoutKey);
  } catch (error) {
    console.error('Error limpiando intentos fallidos:', error);
  }
};

/**
 * Verifica si un usuario está bloqueado
 * @param {string} identifier - Email o identificador del usuario
 * @returns {object} - Estado del bloqueo
 */
export const checkLoginLock = (identifier) => {
  try {
    const lockoutKey = STORAGE_KEYS.LOCKOUT_UNTIL + '_' + btoa(identifier);
    const lockoutUntil = localStorage.getItem(lockoutKey);
    
    if (lockoutUntil && Date.now() < parseInt(lockoutUntil)) {
      const remainingTime = Math.ceil((parseInt(lockoutUntil) - Date.now()) / 60000);
      return {
        isLocked: true,
        remainingMinutes: remainingTime
      };
    }
    
    return { isLocked: false };
  } catch (error) {
    console.error('Error verificando bloqueo:', error);
    return { isLocked: false };
  }
};

/**
 * Almacena el token CSRF
 * @param {string} token - Token CSRF
 */
export const storeCsrfToken = (token) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CSRF_TOKEN, token);
  } catch (error) {
    console.error('Error almacenando token CSRF:', error);
  }
};

/**
 * Obtiene el token CSRF almacenado
 * @returns {string|null} - Token CSRF o null
 */
export const getCsrfToken = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.CSRF_TOKEN);
  } catch (error) {
    console.error('Error obteniendo token CSRF:', error);
    return null;
  }
};

/**
 * Valida credenciales antes de enviarlas al servidor
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {object} - Resultado de validación
 */
export const validateCredentials = (email, password) => {
  const errors = {};
  
  // Validar email
  if (!email) {
    errors.email = 'El email es requerido';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Formato de email inválido';
  }
  
  // Validar contraseña
  if (!password) {
    errors.password = 'La contraseña es requerida';
  } else if (password.length < 8) {
    errors.password = 'La contraseña debe tener al menos 8 caracteres';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Configura un timer para logout automático por inactividad
 * @param {function} logoutCallback - Función a ejecutar en logout
 * @returns {function} - Función para limpiar el timer
 */
export const setupInactivityTimer = (logoutCallback) => {
  let inactivityTimer;
  
  const resetTimer = () => {
    clearTimeout(inactivityTimer);
    updateLastActivity();
    
    inactivityTimer = setTimeout(() => {
      if (isSessionExpired()) {
        logoutCallback();
      }
    }, AUTH_CONFIG.SESSION_TIMEOUT);
  };
  
  // Eventos que resetean el timer
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  
  events.forEach(event => {
    document.addEventListener(event, resetTimer, true);
  });
  
  // Iniciar el timer
  resetTimer();
  
  // Función de limpieza
  return () => {
    clearTimeout(inactivityTimer);
    events.forEach(event => {
      document.removeEventListener(event, resetTimer, true);
    });
  };
};

// Exportar configuración para uso en otros módulos
export { AUTH_CONFIG, STORAGE_KEYS };