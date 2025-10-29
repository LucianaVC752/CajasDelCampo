// Utilidades para manejo de protección CSRF en el frontend
// Integración con el sistema CSRF del backend

import { getCsrfToken, storeCsrfToken } from './auth.js';

// Configuración CSRF
const CSRF_CONFIG = {
  TOKEN_HEADER: 'x-csrf-token',
  COOKIE_NAME: 'csrf-token',
  REFRESH_THRESHOLD: 30 * 60 * 1000, // Refrescar token cada 30 minutos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 segundo entre reintentos
};

// Cache del token CSRF
let csrfTokenCache = null;
let lastTokenFetch = null;

/**
 * Obtiene el token CSRF del servidor
 * @param {boolean} forceRefresh - Forzar obtención de nuevo token
 * @returns {Promise<string|null>} - Token CSRF o null si falla
 */
export const fetchCsrfToken = async (forceRefresh = false) => {
  try {
    // Verificar si tenemos un token válido en cache
    if (!forceRefresh && csrfTokenCache && lastTokenFetch) {
      const timeSinceLastFetch = Date.now() - lastTokenFetch;
      if (timeSinceLastFetch < CSRF_CONFIG.REFRESH_THRESHOLD) {
        return csrfTokenCache;
      }
    }
    
    // Obtener nuevo token del servidor
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'include', // Incluir cookies
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error obteniendo token CSRF: ${response.status}`);
    }
    
    const data = await response.json();
    const token = data.csrfToken;
    
    if (!token) {
      throw new Error('Token CSRF no recibido del servidor');
    }
    
    // Actualizar cache y almacenamiento
    csrfTokenCache = token;
    lastTokenFetch = Date.now();
    storeCsrfToken(token);
    
    return token;
  } catch (error) {
    console.error('Error obteniendo token CSRF:', error);
    return null;
  }
};

/**
 * Obtiene el token CSRF actual (desde cache, storage o servidor)
 * @param {boolean} forceRefresh - Forzar obtención de nuevo token
 * @returns {Promise<string|null>} - Token CSRF o null si falla
 */
export const getCurrentCsrfToken = async (forceRefresh = false) => {
  // Intentar desde cache primero
  if (!forceRefresh && csrfTokenCache) {
    return csrfTokenCache;
  }
  
  // Intentar desde localStorage
  if (!forceRefresh) {
    const storedToken = getCsrfToken();
    if (storedToken) {
      csrfTokenCache = storedToken;
      return storedToken;
    }
  }
  
  // Obtener del servidor
  return await fetchCsrfToken(true);
};

/**
 * Añade el token CSRF a los headers de una petición
 * @param {object} headers - Headers existentes
 * @param {string} token - Token CSRF (opcional, se obtiene automáticamente)
 * @returns {Promise<object>} - Headers con token CSRF añadido
 */
export const addCsrfHeader = async (headers = {}, token = null) => {
  try {
    const csrfToken = token || await getCurrentCsrfToken();
    
    if (csrfToken) {
      return {
        ...headers,
        [CSRF_CONFIG.TOKEN_HEADER]: csrfToken
      };
    }
    
    console.warn('No se pudo obtener token CSRF');
    return headers;
  } catch (error) {
    console.error('Error añadiendo header CSRF:', error);
    return headers;
  }
};

/**
 * Verifica si una petición necesita protección CSRF
 * @param {string} method - Método HTTP
 * @param {string} url - URL de la petición
 * @returns {boolean} - true si necesita protección CSRF
 */
export const needsCsrfProtection = (method, url) => {
  // Solo métodos que modifican datos necesitan CSRF
  const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  // Solo rutas de API necesitan CSRF
  const isApiRoute = url.startsWith('/api/') || url.includes('/api/');
  
  // Excluir rutas específicas que no necesitan CSRF
  const excludedRoutes = ['/api/csrf-token', '/api/auth/refresh'];
  const isExcluded = excludedRoutes.some(route => url.includes(route));
  
  return protectedMethods.includes(method.toUpperCase()) && isApiRoute && !isExcluded;
};

/**
 * Wrapper para fetch que añade automáticamente protección CSRF
 * @param {string} url - URL de la petición
 * @param {object} options - Opciones de fetch
 * @returns {Promise<Response>} - Respuesta de la petición
 */
export const csrfFetch = async (url, options = {}) => {
  const { method = 'GET', headers = {}, ...otherOptions } = options;
  
  let finalHeaders = { ...headers };
  
  // Añadir token CSRF si es necesario
  if (needsCsrfProtection(method, url)) {
    finalHeaders = await addCsrfHeader(finalHeaders);
  }
  
  // Realizar petición
  let response = await fetch(url, {
    method,
    headers: finalHeaders,
    credentials: 'include', // Incluir cookies para CSRF
    ...otherOptions
  });
  
  // Si falla por CSRF, intentar refrescar token y reintentar
  if (response.status === 403 || response.status === 401) {
    const errorData = await response.clone().json().catch(() => ({}));
    
    if (errorData.message && errorData.message.toLowerCase().includes('csrf')) {
      console.warn('Error CSRF detectado, refrescando token...');
      
      // Refrescar token y reintentar
      const newToken = await fetchCsrfToken(true);
      if (newToken) {
        finalHeaders = await addCsrfHeader(headers, newToken);
        
        response = await fetch(url, {
          method,
          headers: finalHeaders,
          credentials: 'include',
          ...otherOptions
        });
      }
    }
  }
  
  return response;
};

/**
 * Configura interceptores para axios con protección CSRF
 * @param {object} axiosInstance - Instancia de axios
 */
export const setupAxiosCsrfInterceptors = (axiosInstance) => {
  // Interceptor de peticiones
  axiosInstance.interceptors.request.use(
    async (config) => {
      const { method = 'get', url = '' } = config;
      
      if (needsCsrfProtection(method, url)) {
        const token = await getCurrentCsrfToken();
        if (token) {
          config.headers[CSRF_CONFIG.TOKEN_HEADER] = token;
        }
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  
  // Interceptor de respuestas para manejar errores CSRF
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      // Verificar si es error CSRF y no hemos reintentado ya
      if (
        (error.response?.status === 403 || error.response?.status === 401) &&
        error.response?.data?.message?.toLowerCase().includes('csrf') &&
        !originalRequest._csrfRetry
      ) {
        originalRequest._csrfRetry = true;
        
        console.warn('Error CSRF en axios, refrescando token...');
        
        // Refrescar token
        const newToken = await fetchCsrfToken(true);
        if (newToken) {
          originalRequest.headers[CSRF_CONFIG.TOKEN_HEADER] = newToken;
          return axiosInstance(originalRequest);
        }
      }
      
      return Promise.reject(error);
    }
  );
};

/**
 * Inicializa la protección CSRF para la aplicación
 * @returns {Promise<boolean>} - true si se inicializó correctamente
 */
export const initializeCsrfProtection = async () => {
  try {
    console.log('Inicializando protección CSRF...');
    
    // Obtener token inicial
    const token = await fetchCsrfToken(true);
    
    if (token) {
      console.log('Protección CSRF inicializada correctamente');
      return true;
    } else {
      console.warn('No se pudo obtener token CSRF inicial');
      return false;
    }
  } catch (error) {
    console.error('Error inicializando protección CSRF:', error);
    return false;
  }
};

/**
 * Limpia el cache y almacenamiento de tokens CSRF
 */
export const clearCsrfTokens = () => {
  csrfTokenCache = null;
  lastTokenFetch = null;
  
  try {
    localStorage.removeItem('cajas_del_campo_csrf_token');
  } catch (error) {
    console.error('Error limpiando tokens CSRF:', error);
  }
};

/**
 * Configura renovación automática del token CSRF
 * @returns {function} - Función para limpiar el intervalo
 */
export const setupCsrfTokenRenewal = () => {
  const renewalInterval = setInterval(async () => {
    try {
      await fetchCsrfToken(true);
      console.log('Token CSRF renovado automáticamente');
    } catch (error) {
      console.error('Error renovando token CSRF:', error);
    }
  }, CSRF_CONFIG.REFRESH_THRESHOLD);
  
  return () => clearInterval(renewalInterval);
};

/**
 * Valida que un formulario tenga protección CSRF antes del envío
 * @param {HTMLFormElement} form - Elemento del formulario
 * @returns {Promise<boolean>} - true si tiene protección válida
 */
export const validateFormCsrfProtection = async (form) => {
  if (!form) return false;
  
  const method = form.method?.toUpperCase() || 'GET';
  const action = form.action || window.location.href;
  
  if (!needsCsrfProtection(method, action)) {
    return true; // No necesita protección
  }
  
  // Verificar que tengamos token disponible
  const token = await getCurrentCsrfToken();
  return !!token;
};

// Exportar configuración
export { CSRF_CONFIG };