const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { logAuthEvent } = require('../utils/securityLogger');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');

const router = express.Router();

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
  
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Register new user
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { name, email, password, phone_number } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password_hash: password, // Will be hashed by the model hook
      phone_number,
      role: 'customer'
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.user_id);

    res.status(201).json({
      message: 'User registered successfully',
      user: user.toJSON(),
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login user
// Rate limit general para /login
const loginRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logAuthEvent(req, 'rate_limit', 'Too many requests to /auth/login');
    return res.status(429).json({ message: 'Too many login requests. Try later.' });
  }
});

// Bloqueo temporal por intentos fallidos (IP + email)
const loginFailures = new Map();
const LOCK_THRESHOLD = 5;
const FAILURE_WINDOW_MS = 10 * 60 * 1000;
const LOCK_DURATION_MS = 15 * 60 * 1000;

function keyFor(req) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const email = (req.body && req.body.email) ? String(req.body.email).toLowerCase() : 'no-email';
  return `${ip}|${email}`;
}

function checkLoginLock(req, res, next) {
  const key = keyFor(req);
  const data = loginFailures.get(key);
  const now = Date.now();
  if (data && data.lockedUntil && data.lockedUntil > now) {
    const waitSecs = Math.ceil((data.lockedUntil - now) / 1000);
    logAuthEvent(req, 'lockout_active', `Login locked for ${waitSecs}s`);
    return res.status(429).json({ message: 'Account temporarily locked due to failed attempts', retry_after_seconds: waitSecs });
  }
  next();
}

function recordFailure(req) {
  const key = keyFor(req);
  const now = Date.now();
  const data = loginFailures.get(key) || { failures: [], lockedUntil: null };
  data.failures = data.failures.filter(ts => now - ts < FAILURE_WINDOW_MS);
  data.failures.push(now);
  if (data.failures.length >= LOCK_THRESHOLD) {
    data.lockedUntil = now + LOCK_DURATION_MS;
    logAuthEvent(req, 'lockout_set', `Lock set for ${LOCK_DURATION_MS/60000} minutes`);
  }
  loginFailures.set(key, data);
}

function resetFailures(req) {
  const key = keyFor(req);
  loginFailures.delete(key);
}

router.post('/login', loginRateLimiter, checkLoginLock, validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      recordFailure(req);
      logAuthEvent(req, 'login_failed', 'User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.is_active) {
      recordFailure(req);
      logAuthEvent(req, 'login_failed', 'Account deactivated');
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      recordFailure(req);
      logAuthEvent(req, 'login_failed', 'Wrong password');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    resetFailures(req);
    const { accessToken, refreshToken } = generateTokens(user.user_id);

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      accessToken,
      refreshToken
    });
  } catch (error) {
    logAuthEvent(req, 'login_error', error.message || 'Unexpected error');
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    // Check if user still exists and is active
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.user_id);

    res.json({
      message: 'Tokens refreshed successfully',
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Token refresh failed' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      message: 'User profile retrieved successfully',
      user: req.user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to retrieve profile' });
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Forgot password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { email } = req.body;
      const user = await User.findOne({ where: { email } });

      if (!user) {
        // Don't reveal if user exists or not
        return res.json({ message: 'If the email exists, a password reset link has been sent' });
      }

      // Generate password reset token
      const resetToken = jwt.sign(
        { userId: user.user_id, type: 'password-reset' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // TODO: Send email with reset link
      // For now, we'll just return the token (in production, send via email)
      console.log(`Password reset token for ${email}: ${resetToken}`);

      res.json({ 
        message: 'If the email exists, a password reset link has been sent',
        // Remove this in production
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Failed to process password reset request' });
    }
  }
]);

// Reset password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
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
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { token, password } = req.body;

      // Verify reset token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.type !== 'password-reset') {
        return res.status(400).json({ message: 'Invalid token type' });
      }

      // Find user
      const user = await User.findByPk(decoded.userId);
      if (!user) {
        return res.status(400).json({ message: 'Invalid token' });
      }

      // Update password
      user.password_hash = password; // Will be hashed by the model hook
      await user.save();

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  }
]);

module.exports = router;
