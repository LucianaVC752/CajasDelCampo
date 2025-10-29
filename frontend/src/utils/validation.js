// Utilidades de validación para el frontend
// Balanceando seguridad y experiencia de usuario

// Expresiones regulares para validación
export const REGEX_PATTERNS = {
  // Email: estándar RFC 5322 simplificado
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // Contraseña: 12-128 chars, al menos 1 minúscula, 1 mayúscula, 1 número, 1 especial, sin espacios
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[^\s]{12,128}$/,
  
  // Teléfono: formato internacional flexible (relajado para UX)
  phone: /^[\+]?[1-9][\d\s\-\(\)]{7,20}$/,
  
  // Nombre: solo letras, espacios, acentos y algunos caracteres especiales (relajado)
  name: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-'\.]{2,100}$/,
  
  // Dirección: alfanumérico con caracteres especiales comunes (relajado)
  address: /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\-#.,°\/]{5,255}$/,
  
  // Ciudad/Departamento: similar a nombre pero más flexible
  location: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-'\.]{2,100}$/,
  
  // Código postal: alfanumérico flexible
  postalCode: /^[a-zA-Z0-9\-\s]{3,20}$/,
  
  // Precio: números decimales positivos
  price: /^\d+(\.\d{1,2})?$/,
  
  // Cantidad: números enteros positivos
  quantity: /^[1-9]\d*$/,
  
  // Texto general: sin scripts ni HTML (más permisivo para descripciones)
  safeText: /^[^<>{}]*$/
};

// Validaciones de longitud
export const LENGTH_LIMITS = {
  name: { min: 2, max: 100 },
  email: { min: 5, max: 255 },
  password: { min: 12, max: 128 },
  phone: { min: 7, max: 20 },
  address: { min: 5, max: 255 },
  city: { min: 2, max: 100 },
  postalCode: { min: 3, max: 20 },
  description: { min: 0, max: 1000 }, // Relajado para UX
  notes: { min: 0, max: 500 }
};

// Funciones de validación individuales
export const validators = {
  // Validación de email
  email: (value) => {
    if (!value) return { isValid: false, message: 'El email es requerido' };
    if (value.length < LENGTH_LIMITS.email.min || value.length > LENGTH_LIMITS.email.max) {
      return { isValid: false, message: `El email debe tener entre ${LENGTH_LIMITS.email.min} y ${LENGTH_LIMITS.email.max} caracteres` };
    }
    if (!REGEX_PATTERNS.email.test(value)) {
      return { isValid: false, message: 'Formato de email inválido' };
    }
    return { isValid: true };
  },

  // Validación de contraseña (estricta para seguridad)
  password: (value, email = '') => {
    if (!value) return { isValid: false, message: 'La contraseña es requerida' };
    if (value.length < LENGTH_LIMITS.password.min) {
      return { isValid: false, message: `La contraseña debe tener al menos ${LENGTH_LIMITS.password.min} caracteres` };
    }
    if (value.length > LENGTH_LIMITS.password.max) {
      return { isValid: false, message: `La contraseña no puede exceder ${LENGTH_LIMITS.password.max} caracteres` };
    }
    if (!REGEX_PATTERNS.password.test(value)) {
      return { 
        isValid: false, 
        message: 'La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número, 1 carácter especial y no debe contener espacios' 
      };
    }
    if (email && value.toLowerCase().includes(email.toLowerCase().split('@')[0])) {
      return { isValid: false, message: 'La contraseña no debe contener tu email' };
    }
    return { isValid: true };
  },

  // Validación de nombre (relajada para UX)
  name: (value, required = true) => {
    if (!value && required) return { isValid: false, message: 'El nombre es requerido' };
    if (!value && !required) return { isValid: true };
    if (value.length < LENGTH_LIMITS.name.min || value.length > LENGTH_LIMITS.name.max) {
      return { isValid: false, message: `El nombre debe tener entre ${LENGTH_LIMITS.name.min} y ${LENGTH_LIMITS.name.max} caracteres` };
    }
    if (!REGEX_PATTERNS.name.test(value)) {
      return { isValid: false, message: 'El nombre contiene caracteres no válidos' };
    }
    return { isValid: true };
  },

  // Validación de teléfono (relajada para UX internacional)
  phone: (value, required = false) => {
    if (!value && !required) return { isValid: true };
    if (!value && required) return { isValid: false, message: 'El teléfono es requerido' };
    if (value.length < LENGTH_LIMITS.phone.min || value.length > LENGTH_LIMITS.phone.max) {
      return { isValid: false, message: `El teléfono debe tener entre ${LENGTH_LIMITS.phone.min} y ${LENGTH_LIMITS.phone.max} caracteres` };
    }
    if (!REGEX_PATTERNS.phone.test(value)) {
      return { isValid: false, message: 'Formato de teléfono inválido' };
    }
    return { isValid: true };
  },

  // Validación de dirección (relajada para direcciones complejas)
  address: (value, required = true) => {
    if (!value && required) return { isValid: false, message: 'La dirección es requerida' };
    if (!value && !required) return { isValid: true };
    if (value.length < LENGTH_LIMITS.address.min || value.length > LENGTH_LIMITS.address.max) {
      return { isValid: false, message: `La dirección debe tener entre ${LENGTH_LIMITS.address.min} y ${LENGTH_LIMITS.address.max} caracteres` };
    }
    if (!REGEX_PATTERNS.address.test(value)) {
      return { isValid: false, message: 'La dirección contiene caracteres no válidos' };
    }
    return { isValid: true };
  },

  // Validación de precio (estricta para evitar valores negativos)
  price: (value, required = true) => {
    if (!value && !required) return { isValid: true };
    if (!value && required) return { isValid: false, message: 'El precio es requerido' };
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      return { isValid: false, message: 'El precio debe ser un número positivo' };
    }
    if (numValue > 999999.99) {
      return { isValid: false, message: 'El precio es demasiado alto' };
    }
    if (!REGEX_PATTERNS.price.test(value.toString())) {
      return { isValid: false, message: 'Formato de precio inválido (máximo 2 decimales)' };
    }
    return { isValid: true };
  },

  // Validación de cantidad (estricta para evitar valores negativos)
  quantity: (value, required = true) => {
    if (!value && !required) return { isValid: true };
    if (!value && required) return { isValid: false, message: 'La cantidad es requerida' };
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1) {
      return { isValid: false, message: 'La cantidad debe ser un número entero positivo' };
    }
    if (numValue > 10000) {
      return { isValid: false, message: 'La cantidad es demasiado alta' };
    }
    return { isValid: true };
  },

  // Validación de texto general (relajada pero segura)
  safeText: (value, required = false, maxLength = LENGTH_LIMITS.description.max) => {
    if (!value && !required) return { isValid: true };
    if (!value && required) return { isValid: false, message: 'Este campo es requerido' };
    if (value.length > maxLength) {
      return { isValid: false, message: `El texto no puede exceder ${maxLength} caracteres` };
    }
    if (!REGEX_PATTERNS.safeText.test(value)) {
      return { isValid: false, message: 'El texto contiene caracteres no permitidos' };
    }
    return { isValid: true };
  }
};

// Función para validar formularios completos
export const validateForm = (formData, validationRules) => {
  const errors = {};
  let isValid = true;

  Object.keys(validationRules).forEach(field => {
    const rules = validationRules[field];
    const value = formData[field];
    
    for (const rule of rules) {
      const result = rule(value);
      if (!result.isValid) {
        errors[field] = result.message;
        isValid = false;
        break; // Solo mostrar el primer error por campo
      }
    }
  });

  return { isValid, errors };
};

// Función para obtener la fortaleza de contraseña (para UX)
export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: 'Sin contraseña', color: 'error' };
  
  let score = 0;
  const checks = {
    length: password.length >= 12,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    noSpaces: !/\s/.test(password)
  };

  Object.values(checks).forEach(check => {
    if (check) score++;
  });

  if (score < 3) return { score, label: 'Muy débil', color: 'error' };
  if (score < 5) return { score, label: 'Débil', color: 'warning' };
  if (score < 6) return { score, label: 'Buena', color: 'info' };
  return { score, label: 'Muy fuerte', color: 'success' };
};

// Validaciones específicas para diferentes formularios
export const FORM_VALIDATIONS = {
  login: {
    email: [validators.email],
    password: [(value) => value ? { isValid: true } : { isValid: false, message: 'La contraseña es requerida' }]
  },
  
  register: {
    name: [validators.name],
    email: [validators.email],
    password: [(value, formData) => validators.password(value, formData?.email)],
    phone_number: [(value) => validators.phone(value, false)]
  },
  
  profile: {
    name: [validators.name],
    email: [validators.email],
    phone_number: [(value) => validators.phone(value, false)]
  },
  
  address: {
    address_line1: [validators.address],
    address_line2: [(value) => validators.address(value, false)],
    city: [(value) => validators.name(value, true)],
    department: [(value) => validators.name(value, true)],
    postal_code: [(value) => validators.safeText(value, false, LENGTH_LIMITS.postalCode.max)],
    contact_name: [(value) => validators.name(value, false)],
    contact_phone: [(value) => validators.phone(value, false)]
  },
  
  product: {
    name: [validators.name],
    description: [(value) => validators.safeText(value, false, LENGTH_LIMITS.description.max)],
    price: [validators.price],
    stock_quantity: [(value) => validators.quantity(value, false)]
  }
};