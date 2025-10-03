const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('phone_number')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('phone_number')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  handleValidationErrors
];

// Address validation rules
const validateAddress = [
  body('address_line1')
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Address line 1 must be between 5 and 255 characters'),
  body('city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  body('department')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Department must be between 2 and 100 characters'),
  body('postal_code')
    .optional()
    .isPostalCode('CO')
    .withMessage('Valid Colombian postal code is required'),
  body('contact_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Contact name must be between 2 and 100 characters'),
  body('contact_phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid contact phone number is required'),
  handleValidationErrors
];

// Product validation rules
const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('price')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Price must be a valid decimal number')
    .custom((value) => {
      if (parseFloat(value) < 0) {
        throw new Error('Price must be positive');
      }
      return true;
    }),
  body('unit')
    .isIn(['kg', 'g', 'lb', 'unidad', 'docena', 'manojo', 'atado'])
    .withMessage('Invalid unit'),
  body('category')
    .optional()
    .isIn(['vegetales', 'frutas', 'hierbas', 'tubérculos', 'legumbres', 'otros'])
    .withMessage('Invalid category'),
  body('farmer_id')
    .isInt({ min: 1 })
    .withMessage('Valid farmer ID is required'),
  handleValidationErrors
];

// Subscription validation rules
const validateSubscription = [
  body('plan_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Plan name must be between 2 and 100 characters'),
  body('frequency')
    .isIn(['weekly', 'biweekly', 'monthly'])
    .withMessage('Frequency must be weekly, biweekly, or monthly'),
  body('price')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Price must be a valid decimal number')
    .custom((value) => {
      if (parseFloat(value) < 0) {
        throw new Error('Price must be positive');
      }
      return true;
    }),
  body('box_size')
    .isIn(['small', 'medium', 'large'])
    .withMessage('Box size must be small, medium, or large'),
  handleValidationErrors
];

// Order validation rules
const validateOrder = [
  body('address_id')
    .isInt({ min: 1 })
    .withMessage('Valid address ID is required'),
  body('delivery_date')
    .isISO8601()
    .withMessage('Valid delivery date is required')
    .custom((value) => {
      const deliveryDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deliveryDate < today) {
        throw new Error('Delivery date cannot be in the past');
      }
      return true;
    }),
  handleValidationErrors
];

// Payment validation rules
const validatePayment = [
  body('amount')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Amount must be a valid decimal number')
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error('Amount must be positive');
      }
      return true;
    }),
  body('payment_method')
    .isIn(['credit_card', 'debit_card', 'pse', 'google_pay', 'cash', 'bank_transfer'])
    .withMessage('Invalid payment method'),
  handleValidationErrors
];

// Farmer validation rules
const validateFarmer = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Farmer name must be between 2 and 100 characters'),
  body('location')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Location must be between 2 and 255 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  body('years_experience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Years of experience must be a positive integer'),
  handleValidationErrors
];

// ID parameter validation
const validateId = (paramName = 'id') => [
  param(paramName)
    .isInt({ min: 1 })
    .withMessage(`Valid ${paramName} is required`),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateAddress,
  validateProduct,
  validateSubscription,
  validateOrder,
  validatePayment,
  validateFarmer,
  validateId,
  validatePagination
};
