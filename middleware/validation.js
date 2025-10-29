const { body, param, query, validationResult } = require('express-validator');
const { logValidation } = require('../utils/securityLogger');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logValidation(req, errors.array());
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
    .escape()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 12, max: 128 })
    .withMessage('Password must be between 12 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).*$/)
    .withMessage('Password must include lowercase, uppercase, number and special char')
    .custom((value, { req }) => {
      if (/\s/.test(value)) throw new Error('Password must not contain spaces');
      if (req.body.email && value.includes(req.body.email)) throw new Error('Password must not include email');
      return true;
    }),
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
    .escape()
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
    .escape()
    .isLength({ min: 5, max: 255 })
    .withMessage('Address line 1 must be between 5 and 255 characters'),
  body('city')
    .trim()
    .escape()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  body('department')
    .trim()
    .escape()
    .isLength({ min: 2, max: 100 })
    .withMessage('Department must be between 2 and 100 characters'),
  body('postal_code')
    .optional()
    .isLength({ min: 4, max: 10 })
    .withMessage('Postal code must be between 4 and 10 characters'),
  body('contact_name')
    .optional()
    .trim()
    .escape()
    .isLength({ min: 2, max: 100 })
    .withMessage('Contact name must be between 2 and 100 characters'),
  body('contact_phone')
    .optional()
    .isLength({ min: 7, max: 20 })
    .withMessage('Contact phone must be between 7 and 20 characters'),
  handleValidationErrors
];

// Product validation rules
const validateProduct = [
  body('name')
    .trim()
    .escape()
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
    .optional({ checkFalsy: true })
    .isIn(['vegetales', 'frutas', 'hierbas', 'tubérculos', 'legumbres', 'otros'])
    .withMessage('Invalid category'),
  body('farmer_id')
    .isInt({ min: 1 })
    .withMessage('Valid farmer ID is required'),
  handleValidationErrors
];

// Product partial validation rules (for PATCH)
const validateProductPartial = [
  body('name')
    .optional({ checkFalsy: true })
    .trim()
    .escape()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('price')
    .optional({ checkFalsy: true })
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Price must be a valid decimal number')
    .custom((value) => {
      if (value !== undefined && value !== '' && parseFloat(value) < 0) {
        throw new Error('Price must be positive');
      }
      return true;
    }),
  body('unit')
    .optional({ checkFalsy: true })
    .isIn(['kg', 'g', 'lb', 'unidad', 'docena', 'manojo', 'atado'])
    .withMessage('Invalid unit'),
  body('category')
    .optional({ checkFalsy: true })
    .isIn(['vegetales', 'frutas', 'hierbas', 'tubérculos', 'legumbres', 'otros'])
    .withMessage('Invalid category'),
  body('farmer_id')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Valid farmer ID is required'),
  body('stock_quantity')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  body('is_available')
    .optional()
    .isBoolean()
    .withMessage('is_available must be a boolean'),
  handleValidationErrors
];

// Subscription validation rules
const validateSubscription = [
  body('plan_name')
    .trim()
    .escape()
    .isLength({ min: 2, max: 100 })
    .withMessage('Plan name must be between 2 and 100 characters'),
  body('frequency')
    .isIn(['weekly', 'biweekly', 'monthly', 'quarterly'])
    .withMessage('Frequency must be weekly, biweekly, monthly, or quarterly'),
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
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Amount must be a valid decimal number')
    .custom((value) => {
      if (value && parseFloat(value) <= 0) {
        throw new Error('Amount must be positive');
      }
      return true;
    }),
  body('payment_method')
    .isIn(['credit_card', 'debit_card', 'pse', 'google_pay', 'bank_transfer', 'cash_on_delivery'])
    .withMessage('Invalid payment method'),
  handleValidationErrors
];

// Farmer validation rules
const validateFarmer = [
  body('name')
    .trim()
    .escape()
    .isLength({ min: 2, max: 100 })
    .withMessage('Farmer name must be between 2 and 100 characters'),
  body('location')
    .trim()
    .escape()
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

// Farmer partial validation rules (for PATCH)
const validateFarmerPartial = [
  body('name')
    .optional({ checkFalsy: true })
    .trim()
    .escape()
    .isLength({ min: 2, max: 100 })
    .withMessage('Farmer name must be between 2 and 100 characters'),
  body('location')
    .optional({ checkFalsy: true })
    .trim()
    .escape()
    .isLength({ min: 2, max: 255 })
    .withMessage('Location must be between 2 and 255 characters'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('phone')
    .optional({ checkFalsy: true })
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  body('years_experience')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('Years of experience must be a positive integer'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
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

const validateUserAdminCreate = [
  body('name')
    .trim()
    .escape()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 12, max: 128 })
    .withMessage('Password must be between 12 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).*$/)
    .withMessage('Password must include lowercase, uppercase, number and special char')
    .custom((value, { req }) => {
      if (/\s/.test(value)) throw new Error('Password must not contain spaces');
      if (req.body.email && value.includes(req.body.email)) throw new Error('Password must not include email');
      return true;
    }),
  body('phone_number')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  body('role')
    .optional()
    .isIn(['customer', 'admin'])
    .withMessage('Invalid role'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
  handleValidationErrors
];

const validateUserAdminUpdate = [
  body('name')
    .optional()
    .trim()
    .escape()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('phone_number')
    .optional({ checkFalsy: true })
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  body('role')
    .optional({ checkFalsy: true })
    .isIn(['customer', 'admin'])
    .withMessage('Invalid role'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
  body('password')
    .optional({ checkFalsy: true })
    .isLength({ min: 12, max: 128 })
    .withMessage('Password must be between 12 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).*$/)
    .withMessage('Password must include lowercase, uppercase, number and special char')
    .custom((value, { req }) => {
      if (!value) return true;
      if (/\s/.test(value)) throw new Error('Password must not contain spaces');
      if (req.body.email && value.includes(req.body.email)) throw new Error('Password must not include email');
      return true;
    }),
  handleValidationErrors
];

const validateUserAdminPartial = [
  body('name')
    .optional({ checkFalsy: true })
    .trim()
    .escape()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('phone_number')
    .optional({ checkFalsy: true })
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  body('role')
    .optional({ checkFalsy: true })
    .isIn(['customer', 'admin'])
    .withMessage('Invalid role'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
  body('password')
    .optional({ checkFalsy: true })
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  handleValidationErrors
];

// Admin Order validation rules (create)
const validateOrderAdminCreate = [
  body('user_id')
    .isInt({ min: 1 })
    .withMessage('Valid user ID is required'),
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
  body('subscription_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid subscription ID is required'),
  body('items')
    .optional({ checkFalsy: true })
    .isArray({ min: 1 })
    .withMessage('Items must be a non-empty array when provided'),
  body('items.*.product_id')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Each item must have a valid product_id'),
  body('items.*.quantity')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Each item must have a quantity >= 1'),
  body('shipping_cost')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('shipping_cost must be a valid decimal'),
  handleValidationErrors
];

// Admin Order validation rules (update full)
const validateOrderAdminUpdate = [
  body('address_id')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Valid address ID is required'),
  body('delivery_date')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Valid delivery date is required')
    .custom((value) => {
      if (!value) return true;
      const deliveryDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deliveryDate < today) {
        throw new Error('Delivery date cannot be in the past');
      }
      return true;
    }),
  body('items')
    .optional({ checkFalsy: true })
    .isArray({ min: 1 })
    .withMessage('Items must be a non-empty array when provided'),
  body('items.*.product_id')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Each item must have a valid product_id'),
  body('items.*.quantity')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Each item must have a quantity >= 1'),
  body('shipping_cost')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('shipping_cost must be a valid decimal'),
  handleValidationErrors
];

// Admin Order validation rules (partial)
const validateOrderAdminPartial = [
  body('address_id')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Valid address ID is required'),
  body('delivery_date')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Valid delivery date is required')
    .custom((value) => {
      if (!value) return true;
      const deliveryDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deliveryDate < today) {
        throw new Error('Delivery date cannot be in the past');
      }
      return true;
    }),
  body('items')
    .optional({ checkFalsy: true })
    .isArray({ min: 1 })
    .withMessage('Items must be a non-empty array when provided'),
  body('items.*.product_id')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Each item must have a valid product_id'),
  body('items.*.quantity')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Each item must have a quantity >= 1'),
  body('shipping_cost')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('shipping_cost must be a valid decimal'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateUserAdminCreate,
  validateUserAdminUpdate,
  validateUserAdminPartial,
  validateAddress,
  validateProduct,
  validateProductPartial,
  validateSubscription,
  validateOrder,
  validateOrderAdminCreate,
  validateOrderAdminUpdate,
  validateOrderAdminPartial,
  validatePayment,
  validateFarmer,
  validateFarmerPartial,
  validateId,
  validatePagination
};
