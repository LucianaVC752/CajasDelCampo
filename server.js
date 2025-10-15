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
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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

startServer();

module.exports = app;
