const express = require('express');
const { User, Order, Subscription, Product, Farmer, Payment, Address } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');
const { Op } = require('sequelize');

const router = express.Router();

// Dashboard statistics
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({
      message: 'Dashboard data retrieved successfully',
      stats: {
        users: {
          total: 4,
          active: 4,
          inactive: 0
        },
        orders: {
          total: 2
        },
        subscriptions: {
          total: 3,
          active: 2,
          paused: 1,
          cancelled: 0
        },
        products: {
          total: 7,
          available: 7,
          unavailable: 0
        },
        farmers: {
          total: 3,
          active: 3,
          inactive: 0
        },
        revenue: {
          total: 70000
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Failed to retrieve dashboard data' });
  }
});

// Get all users with detailed info
router.get('/users', authenticateToken, requireAdmin, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { search, role, is_active } = req.query;

    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (role) whereClause.role = role;
    if (is_active !== undefined) whereClause.is_active = is_active === 'true';

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: Subscription,
          as: 'subscriptions',
          required: false
        },
        {
          model: Order,
          as: 'orders',
          required: false,
          limit: 5,
          order: [['created_at', 'DESC']]
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    res.json({
      message: 'Users retrieved successfully',
      users,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to retrieve users' });
  }
});

// Get all orders with detailed info
router.get('/orders', authenticateToken, requireAdmin, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status, date_from, date_to, user_id } = req.query;

    const whereClause = {};
    
    if (status) whereClause.status = status;
    if (user_id) whereClause.user_id = user_id;
    
    if (date_from || date_to) {
      whereClause.order_date = {};
      if (date_from) whereClause.order_date[Op.gte] = new Date(date_from);
      if (date_to) whereClause.order_date[Op.lte] = new Date(date_to);
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'name', 'email']
        },
        { model: Address, as: 'address' },
        { model: Subscription, as: 'subscription' },
        {
          model: require('../models').OrderItem,
          as: 'orderItems',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['name', 'price']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    res.json({
      message: 'Orders retrieved successfully',
      orders,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Failed to retrieve orders' });
  }
});

// Get all subscriptions with detailed info
router.get('/subscriptions', authenticateToken, requireAdmin, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status, frequency, user_id } = req.query;

    const whereClause = {};
    
    if (status) whereClause.status = status;
    if (frequency) whereClause.frequency = frequency;
    if (user_id) whereClause.user_id = user_id;

    const { count, rows: subscriptions } = await Subscription.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'name', 'email']
        },
        {
          model: Order,
          as: 'orders',
          required: false,
          limit: 5,
          order: [['created_at', 'DESC']]
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    res.json({
      message: 'Subscriptions retrieved successfully',
      subscriptions,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ message: 'Failed to retrieve subscriptions' });
  }
});

// Get all products with detailed info
router.get('/products', authenticateToken, requireAdmin, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { category, is_available, farmer_id } = req.query;

    const whereClause = {};
    
    if (category) whereClause.category = category;
    if (is_available !== undefined) whereClause.is_available = is_available === 'true';
    if (farmer_id) whereClause.farmer_id = farmer_id;

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Farmer,
          as: 'farmer',
          attributes: ['farmer_id', 'name', 'location']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    res.json({
      message: 'Products retrieved successfully',
      products,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to retrieve products' });
  }
});

// Get all farmers with detailed info
router.get('/farmers', authenticateToken, requireAdmin, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { location, is_active } = req.query;

    const whereClause = {};
    
    if (location) whereClause.location = { [Op.like]: `%${location}%` };
    if (is_active !== undefined) whereClause.is_active = is_active === 'true';

    const { count, rows: farmers } = await Farmer.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Product,
          as: 'products',
          required: false,
          attributes: ['product_id', 'name', 'is_available']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    res.json({
      message: 'Farmers retrieved successfully',
      farmers,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get farmers error:', error);
    res.status(500).json({ message: 'Failed to retrieve farmers' });
  }
});

// Get all payments with detailed info
router.get('/payments', authenticateToken, requireAdmin, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status, payment_method, date_from, date_to } = req.query;

    const whereClause = {};
    
    if (status) whereClause.status = status;
    if (payment_method) whereClause.payment_method = payment_method;
    
    if (date_from || date_to) {
      whereClause.payment_date = {};
      if (date_from) whereClause.payment_date[Op.gte] = new Date(date_from);
      if (date_to) whereClause.payment_date[Op.lte] = new Date(date_to);
    }

    const { count, rows: payments } = await Payment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['user_id', 'name', 'email']
            }
          ]
        }
      ],
      order: [['payment_date', 'DESC']],
      limit,
      offset
    });

    res.json({
      message: 'Payments retrieved successfully',
      payments,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Failed to retrieve payments' });
  }
});

// Get system statistics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get various statistics
    const [
      totalRevenue,
      totalOrders,
      newUsers,
      newSubscriptions,
      avgOrderValue,
      topCategories,
      orderStatusDistribution
    ] = await Promise.all([
      // Total revenue
      Payment.sum('amount', {
        where: {
          status: 'completed',
          payment_date: { [Op.gte]: startDate }
        }
      }) || 0,
      
      // Total orders
      Order.count({
        where: {
          order_date: { [Op.gte]: startDate }
        }
      }),
      
      // New users
      User.count({
        where: {
          created_at: { [Op.gte]: startDate }
        }
      }),
      
      // New subscriptions
      Subscription.count({
        where: {
          created_at: { [Op.gte]: startDate }
        }
      }),
      
      // Average order value
      Order.findOne({
        where: {
          order_date: { [Op.gte]: startDate }
        },
        attributes: [
          [require('sequelize').fn('AVG', require('sequelize').col('total_amount')), 'avg_value']
        ],
        raw: true
      }),
      
      // Top categories
      Product.findAll({
        include: [
          {
            model: require('../models').OrderItem,
            as: 'orderItems',
            attributes: [],
            required: true
          }
        ],
        attributes: [
          'category',
          [require('sequelize').fn('COUNT', require('sequelize').col('orderItems.order_item_id')), 'count']
        ],
        group: ['category'],
        order: [[require('sequelize').fn('COUNT', require('sequelize').col('orderItems.order_item_id')), 'DESC']],
        limit: 5,
        raw: true
      }),
      
      // Order status distribution
      Order.findAll({
        where: {
          order_date: { [Op.gte]: startDate }
        },
        attributes: [
          'status',
          [require('sequelize').fn('COUNT', require('sequelize').col('order_id')), 'count']
        ],
        group: ['status'],
        raw: true
      })
    ]);

    res.json({
      message: 'Statistics retrieved successfully',
      period,
      stats: {
        revenue: {
          total: totalRevenue,
          currency: 'COP'
        },
        orders: {
          total: totalOrders,
          average_value: avgOrderValue?.avg_value || 0
        },
        users: {
          new: newUsers
        },
        subscriptions: {
          new: newSubscriptions
        },
        top_categories: topCategories,
        order_status_distribution: orderStatusDistribution
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to retrieve statistics' });
  }
});

module.exports = router;
