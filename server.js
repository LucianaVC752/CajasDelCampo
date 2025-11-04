const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { sequelize } = require('./config/database-sqlite');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const subscriptionRoutes = require('./routes/subscriptions');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const farmerRoutes = require('./routes/farmers');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
// Content Security Policy with explicit directives and reporting
const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", 'https://js.stripe.com'],
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
  fontSrc: ["'self'", 'https://fonts.gstatic.com'],
  connectSrc: ["'self'", 'https://api.stripe.com'],
  frameSrc: ["'self'", 'https://js.stripe.com'],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  frameAncestors: ["'none'"],
  upgradeInsecureRequests: [],
  // CSP reporting: both legacy and modern for broader browser support
  reportUri: ['/api/security/csp-report'],
  reportTo: ['csp-endpoint']
};

app.use(helmet({
  contentSecurityPolicy: { useDefaults: false, directives: cspDirectives },
  crossOriginResourcePolicy: { policy: 'same-site' },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'no-referrer' }
}));

// Provide Report-To header for modern CSP reporting
app.use((req, res, next) => {
  try {
    const reportUrl = process.env.CSP_REPORT_URL || `${req.protocol}://${req.get('host')}/api/security/csp-report`;
    const reportToValue = {
      group: 'csp-endpoint',
      max_age: 10886400,
      endpoints: [{ url: reportUrl }],
      include_subdomains: true
    };
    res.setHeader('Report-To', JSON.stringify(reportToValue));
  } catch (e) {
    // ignore header setting errors
  }
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration (estricta)
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    // Allow non-browser clients without Origin
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','x-csrf-token'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Seguridad adicional: sanitización y CSRF
const { sanitizeRequest, csrfTokenRoute, csrfProtect } = require('./middleware/security');
app.use(sanitizeRequest);

// Endpoint para obtener CSRF token (double-submit cookie)
app.get('/api/csrf-token', csrfTokenRoute);

// Endpoint para reportes CSP (report-uri y report-to) - no requiere CSRF
app.post(
  '/api/security/csp-report',
  express.json({ type: ['application/csp-report', 'application/json'] }),
  (req, res) => {
    try {
      const { logCspReport } = require('./utils/securityLogger');
      const report = req.body['csp-report'] || req.body;
      logCspReport(req, report);
    } catch (e) {
      // no-op
    }
    // No content for report endpoints
    res.status(204).end();
  }
);

// Proteger métodos mutables en endpoints de negocio (excluye /api/security/*)
app.use('/api/auth', csrfProtect);
app.use('/api/users', csrfProtect);
app.use('/api/products', csrfProtect);
app.use('/api/subscriptions', csrfProtect);
app.use('/api/orders', csrfProtect);
app.use('/api/payments', csrfProtect);
app.use('/api/farmers', csrfProtect);
app.use('/api/admin', csrfProtect);

// Static files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Database connection and server start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Ensure subscriptions table has is_hidden column without altering other tables
    try {
      const [columns] = await sequelize.query("PRAGMA table_info('subscriptions');");
      const hasIsHidden = Array.isArray(columns) && columns.some((c) => c.name === 'is_hidden');
      if (!hasIsHidden) {
        await sequelize.query("ALTER TABLE subscriptions ADD COLUMN is_hidden TINYINT(1) NOT NULL DEFAULT 0;");
        console.log('Added is_hidden column to subscriptions table.');
      }
    } catch (migrationError) {
      console.warn('Skipping is_hidden migration check:', migrationError.message);
    }

    // Ensure products table has image_data column for storing images in SQLite
    try {
      const [productColumns] = await sequelize.query("PRAGMA table_info('products');");
      const hasImageData = Array.isArray(productColumns) && productColumns.some((c) => c.name === 'image_data');
      if (!hasImageData) {
        await sequelize.query("ALTER TABLE products ADD COLUMN image_data BLOB;");
        console.log('Added image_data column to products table.');
      }
    } catch (migrationError) {
      console.warn('Skipping image_data migration check:', migrationError.message);
    }

    // Ensure farmers table has image_data column for storing images in SQLite
    try {
      const [farmerColumns] = await sequelize.query("PRAGMA table_info('farmers');");
      const hasFarmerImageData = Array.isArray(farmerColumns) && farmerColumns.some((c) => c.name === 'image_data');
      if (!hasFarmerImageData) {
        await sequelize.query("ALTER TABLE farmers ADD COLUMN image_data BLOB;");
        console.log('Added image_data column to farmers table.');
      }
    } catch (migrationError) {
      console.warn('Skipping farmers image_data migration check:', migrationError.message);
    }

    // Sync database (create tables if they don't exist)
    await sequelize.sync({ force: false });
    console.log('Database synchronized successfully.');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

// Evitar arrancar el servidor cuando se ejecutan pruebas
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
