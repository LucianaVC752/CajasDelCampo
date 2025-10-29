// Utilidades de sanitización XSS para el frontend
// Protección contra ataques de Cross-Site Scripting

// Mapa de caracteres HTML peligrosos
const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

// Patrones peligrosos para detectar y remover
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /<link\b[^>]*>/gi,
  /<meta\b[^>]*>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  /on\w+\s*=/gi // Eventos como onclick, onload, etc.
];

// URLs permitidas para imágenes y recursos
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'data:image/', 'blob:'];

/**
 * Escapa caracteres HTML peligrosos
 * @param {string} text - Texto a escapar
 * @returns {string} - Texto escapado
 */
export const escapeHtml = (text) => {
  if (typeof text !== 'string') return text;
  return text.replace(/[&<>"'`=\/]/g, (char) => HTML_ESCAPE_MAP[char]);
};

/**
 * Desescapa caracteres HTML (para mostrar texto escapado)
 * @param {string} text - Texto escapado
 * @returns {string} - Texto original
 */
export const unescapeHtml = (text) => {
  if (typeof text !== 'string') return text;
  const reverseMap = Object.fromEntries(
    Object.entries(HTML_ESCAPE_MAP).map(([key, value]) => [value, key])
  );
  return text.replace(/&amp;|&lt;|&gt;|&quot;|&#x27;|&#x2F;|&#x60;|&#x3D;/g, 
    (entity) => reverseMap[entity] || entity);
};

/**
 * Remueve scripts y contenido peligroso
 * @param {string} input - Texto de entrada
 * @returns {string} - Texto limpio
 */
export const removeScripts = (input) => {
  if (typeof input !== 'string') return input;
  
  let cleaned = input;
  DANGEROUS_PATTERNS.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  return cleaned;
};

/**
 * Sanitiza texto para mostrar de forma segura
 * @param {string} text - Texto a sanitizar
 * @param {object} options - Opciones de sanitización
 * @returns {string} - Texto sanitizado
 */
export const sanitizeText = (text, options = {}) => {
  if (!text || typeof text !== 'string') return text || '';
  
  const {
    allowBasicHtml = false,
    maxLength = null,
    preserveLineBreaks = true
  } = options;
  
  let sanitized = text;
  
  // Remover scripts y contenido peligroso
  sanitized = removeScripts(sanitized);
  
  // Si no se permite HTML básico, escapar todo
  if (!allowBasicHtml) {
    sanitized = escapeHtml(sanitized);
  } else {
    // Solo permitir tags básicos seguros
    const allowedTags = ['b', 'i', 'em', 'strong', 'br', 'p'];
    const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
    
    sanitized = sanitized.replace(tagPattern, (match, tagName) => {
      if (allowedTags.includes(tagName.toLowerCase())) {
        return match;
      }
      return escapeHtml(match);
    });
  }
  
  // Preservar saltos de línea si se especifica
  if (preserveLineBreaks && !allowBasicHtml) {
    sanitized = sanitized.replace(/\n/g, '<br>');
  }
  
  // Limitar longitud si se especifica
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '...';
  }
  
  return sanitized.trim();
};

/**
 * Sanitiza URLs para prevenir ataques
 * @param {string} url - URL a sanitizar
 * @returns {string|null} - URL sanitizada o null si es peligrosa
 */
export const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  try {
    const urlObj = new URL(url);
    
    // Verificar protocolo permitido
    const isAllowed = ALLOWED_PROTOCOLS.some(protocol => 
      urlObj.protocol.startsWith(protocol.replace(':', ''))
    );
    
    if (!isAllowed) return null;
    
    // Verificar que no contenga javascript
    if (url.toLowerCase().includes('javascript:') || 
        url.toLowerCase().includes('vbscript:')) {
      return null;
    }
    
    return url;
  } catch (error) {
    // URL inválida
    return null;
  }
};

/**
 * Sanitiza datos de formulario recursivamente
 * @param {object} data - Datos a sanitizar
 * @param {object} options - Opciones de sanitización
 * @returns {object} - Datos sanitizados
 */
export const sanitizeFormData = (data, options = {}) => {
  if (!data || typeof data !== 'object') return data;
  
  const {
    skipFields = ['password', 'password_confirmation'], // No sanitizar contraseñas
    textFields = ['description', 'notes', 'bio', 'content'],
    urlFields = ['website', 'image_url', 'link']
  } = options;
  
  const sanitized = {};
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    
    // Saltar campos especificados
    if (skipFields.includes(key)) {
      sanitized[key] = value;
      return;
    }
    
    // Sanitizar según el tipo de campo
    if (typeof value === 'string') {
      if (urlFields.includes(key)) {
        sanitized[key] = sanitizeUrl(value);
      } else if (textFields.includes(key)) {
        sanitized[key] = sanitizeText(value, { 
          allowBasicHtml: true, 
          preserveLineBreaks: true 
        });
      } else {
        sanitized[key] = sanitizeText(value);
      }
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeText(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeFormData(value, options);
    } else {
      sanitized[key] = value;
    }
  });
  
  return sanitized;
};

/**
 * Sanitiza contenido para mostrar en componentes React
 * @param {string} content - Contenido a mostrar
 * @param {object} options - Opciones de sanitización
 * @returns {object} - Objeto con contenido sanitizado y flag de seguridad
 */
export const sanitizeForDisplay = (content, options = {}) => {
  if (!content) return { content: '', isSafe: true };
  
  const sanitized = sanitizeText(content, options);
  const isSafe = sanitized === content; // Verificar si se modificó el contenido
  
  return {
    content: sanitized,
    isSafe,
    __html: sanitized // Para dangerouslySetInnerHTML si es necesario
  };
};

/**
 * Valida y sanitiza archivos subidos
 * @param {File} file - Archivo a validar
 * @param {object} options - Opciones de validación
 * @returns {object} - Resultado de validación
 */
export const validateFile = (file, options = {}) => {
  const {
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize = 5 * 1024 * 1024, // 5MB por defecto
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  } = options;
  
  if (!file) {
    return { isValid: false, message: 'No se seleccionó ningún archivo' };
  }
  
  // Validar tipo MIME
  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      message: `Tipo de archivo no permitido. Permitidos: ${allowedTypes.join(', ')}` 
    };
  }
  
  // Validar extensión
  const extension = '.' + file.name.split('.').pop().toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return { 
      isValid: false, 
      message: `Extensión no permitida. Permitidas: ${allowedExtensions.join(', ')}` 
    };
  }
  
  // Validar tamaño
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return { 
      isValid: false, 
      message: `El archivo es demasiado grande. Máximo: ${maxSizeMB}MB` 
    };
  }
  
  // Validar nombre del archivo
  const sanitizedName = sanitizeText(file.name);
  if (sanitizedName !== file.name) {
    return { 
      isValid: false, 
      message: 'El nombre del archivo contiene caracteres no válidos' 
    };
  }
  
  return { isValid: true, sanitizedName };
};

// Configuración de Content Security Policy
export const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", 'https://js.stripe.com'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'connect-src': ["'self'", 'https://api.stripe.com'],
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"]
};

/**
 * Genera el header CSP como string
 * @returns {string} - Header CSP
 */
export const generateCSPHeader = () => {
  return Object.entries(CSP_CONFIG)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
};