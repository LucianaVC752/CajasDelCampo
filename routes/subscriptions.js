const express = require('express');
const { Subscription, User, Order, Product, Farmer } = require('../models');
const { authenticateToken, requireAdmin, requireOwnershipOrAdmin } = require('../middleware/auth');
const { validateSubscription, validateId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Get user's subscriptions
router.get('/my-subscriptions', authenticateToken, async (req, res) => {
  try {
    const subscriptions = await Subscription.findAll({
      where: { user_id: req.user.user_id },
      order: [['created_at', 'DESC']]
    });

    res.json({
      message: 'Subscriptions retrieved successfully',
      subscriptions
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ message: 'Failed to retrieve subscriptions' });
  }
});

// Create new subscription
router.post('/', authenticateToken, validateSubscription, async (req, res) => {
  try {
    const { plan_name, frequency, price, box_size, custom_preferences } = req.body;

    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({
      where: {
        user_id: req.user.user_id,
        status: 'active'
      }
    });

    if (existingSubscription) {
      return res.status(400).json({ 
        message: 'User already has an active subscription. Please cancel the current one before creating a new one.' 
      });
    }

    const subscription = await Subscription.create({
      user_id: req.user.user_id,
      plan_name,
      frequency,
      price,
      box_size,
      custom_preferences: custom_preferences || {}
    });

    res.status(201).json({
      message: 'Subscription created successfully',
      subscription
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ message: 'Failed to create subscription' });
  }
});

// Update subscription
router.put('/:id', authenticateToken, validateId('id'), validateSubscription, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: {
        subscription_id: req.params.id,
        user_id: req.user.user_id
      }
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Don't allow updating cancelled subscriptions
    if (subscription.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot update cancelled subscription' });
    }

    await subscription.update(req.body);

    res.json({
      message: 'Subscription updated successfully',
      subscription
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ message: 'Failed to update subscription' });
  }
});

// Pause subscription
router.patch('/:id/pause', authenticateToken, validateId('id'), async (req, res) => {
  try {
    const { pause_until } = req.body;
    const subscription = await Subscription.findOne({
      where: {
        subscription_id: req.params.id,
        user_id: req.user.user_id
      }
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({ message: 'Only active subscriptions can be paused' });
    }

    await subscription.update({
      status: 'paused',
      pause_until: pause_until ? new Date(pause_until) : null
    });

    res.json({
      message: 'Subscription paused successfully',
      subscription
    });
  } catch (error) {
    console.error('Pause subscription error:', error);
    res.status(500).json({ message: 'Failed to pause subscription' });
  }
});

// Resume subscription
router.patch('/:id/resume', authenticateToken, validateId('id'), async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: {
        subscription_id: req.params.id,
        user_id: req.user.user_id
      }
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (subscription.status !== 'paused') {
      return res.status(400).json({ message: 'Only paused subscriptions can be resumed' });
    }

    // Calculate next delivery date
    const nextDelivery = new Date();
    switch (subscription.frequency) {
      case 'weekly':
        nextDelivery.setDate(nextDelivery.getDate() + 7);
        break;
      case 'biweekly':
        nextDelivery.setDate(nextDelivery.getDate() + 14);
        break;
      case 'monthly':
        nextDelivery.setMonth(nextDelivery.getMonth() + 1);
        break;
    }

    await subscription.update({
      status: 'active',
      pause_until: null,
      next_delivery_date: nextDelivery
    });

    res.json({
      message: 'Subscription resumed successfully',
      subscription
    });
  } catch (error) {
    console.error('Resume subscription error:', error);
    res.status(500).json({ message: 'Failed to resume subscription' });
  }
});

// Cancel subscription
router.patch('/:id/cancel', authenticateToken, validateId('id'), async (req, res) => {
  try {
    const { cancellation_reason } = req.body;
    const subscription = await Subscription.findOne({
      where: {
        subscription_id: req.params.id,
        user_id: req.user.user_id
      }
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (subscription.status === 'cancelled') {
      return res.status(400).json({ message: 'Subscription is already cancelled' });
    }

    await subscription.update({
      status: 'cancelled',
      cancellation_reason,
      cancelled_at: new Date()
    });

    res.json({
      message: 'Subscription cancelled successfully',
      subscription
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Failed to cancel subscription' });
  }
});

// Get subscription details
router.get('/:id', authenticateToken, validateId('id'), async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: {
        subscription_id: req.params.id,
        user_id: req.user.user_id
      },
      include: [
        {
          model: Order,
          as: 'orders',
          order: [['created_at', 'DESC']],
          limit: 5
        }
      ]
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    res.json({
      message: 'Subscription retrieved successfully',
      subscription
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ message: 'Failed to retrieve subscription' });
  }
});

// Admin routes - Get all subscriptions
router.get('/', authenticateToken, requireAdmin, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status, frequency } = req.query;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (frequency) whereClause.frequency = frequency;

    const { count, rows: subscriptions } = await Subscription.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'name', 'email']
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

// Admin routes - Get subscription by ID
router.get('/admin/:id', authenticateToken, requireAdmin, validateId('id'), async (req, res) => {
  try {
    const subscription = await Subscription.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'name', 'email', 'phone_number']
        },
        {
          model: Order,
          as: 'orders',
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    res.json({
      message: 'Subscription retrieved successfully',
      subscription
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ message: 'Failed to retrieve subscription' });
  }
});

// Admin routes - Update subscription
router.put('/admin/:id', authenticateToken, requireAdmin, validateId('id'), validateSubscription, async (req, res) => {
  try {
    const subscription = await Subscription.findByPk(req.params.id);

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    await subscription.update(req.body);

    res.json({
      message: 'Subscription updated successfully',
      subscription
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ message: 'Failed to update subscription' });
  }
});

// Admin routes - Cancel subscription
router.patch('/admin/:id/cancel', authenticateToken, requireAdmin, validateId('id'), async (req, res) => {
  try {
    const { cancellation_reason } = req.body;
    const subscription = await Subscription.findByPk(req.params.id);

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (subscription.status === 'cancelled') {
      return res.status(400).json({ message: 'Subscription is already cancelled' });
    }

    await subscription.update({
      status: 'cancelled',
      cancellation_reason,
      cancelled_at: new Date()
    });

    res.json({
      message: 'Subscription cancelled successfully',
      subscription
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Failed to cancel subscription' });
  }
});

// Get subscription plans (public)
router.get('/plans/available', async (req, res) => {
  try {
    const plans = [
      {
        name: 'Caja Pequeña',
        box_size: 'small',
        price: 25000,
        description: 'Perfecta para 1-2 personas',
        products: '4-6 productos frescos',
        frequency_options: ['weekly', 'biweekly', 'monthly']
      },
      {
        name: 'Caja Mediana',
        box_size: 'medium',
        price: 40000,
        description: 'Ideal para 2-4 personas',
        products: '6-8 productos frescos',
        frequency_options: ['weekly', 'biweekly', 'monthly']
      },
      {
        name: 'Caja Grande',
        box_size: 'large',
        price: 60000,
        description: 'Perfecta para familias grandes',
        products: '8-12 productos frescos',
        frequency_options: ['weekly', 'biweekly', 'monthly']
      }
    ];

    res.json({
      message: 'Subscription plans retrieved successfully',
      plans
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ message: 'Failed to retrieve subscription plans' });
  }
});

module.exports = router;
