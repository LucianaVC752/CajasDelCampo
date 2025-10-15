const express = require('express');
const { Subscription, User, Order, Product, Farmer } = require('../models');
const { sequelize } = require('../config/database-sqlite');
const { authenticateToken, requireAdmin, requireOwnershipOrAdmin } = require('../middleware/auth');
const { validateSubscription, validateId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Get user's subscriptions
router.get('/my-subscriptions', authenticateToken, async (req, res) => {
  try {
    const subscriptions = await Subscription.findAll({
      where: { 
        user_id: req.user.user_id,
        is_hidden: false
      },
      order: [['created_at', 'DESC']]
    });

    // Verificar si hay pagos para cada suscripción
    const Payment = require('../models/Payment');
    const Order = require('../models/Order');
    
    // Procesar cada suscripción para añadir el campo paid
    const subscriptionsWithPaid = await Promise.all(subscriptions.map(async subscription => {
      const subscriptionData = subscription.toJSON();
      
      // Buscar órdenes asociadas a esta suscripción
      const orders = await Order.findAll({
        where: { 
          subscription_id: subscription.subscription_id 
        }
      });
      
      // Verificar si alguna orden tiene pagos
      let isPaid = false;
      if (orders.length > 0) {
        const orderIds = orders.map(order => order.order_id);
        const payments = await Payment.findAll({
          where: {
            order_id: orderIds,
            status: 'completed'
          }
        });
        
        isPaid = payments.length > 0;
      }
      
      subscriptionData.paid = isPaid;
      return subscriptionData;
    }));

    res.json({
      message: 'Subscriptions retrieved successfully',
      subscriptions: subscriptionsWithPaid
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

    // Check if user already has an active subscription that is not paid (dynamic check without DB field)
    const activeSubscriptions = await Subscription.findAll({
      where: {
        user_id: req.user.user_id,
        status: 'active'
      }
    });

    if (activeSubscriptions && activeSubscriptions.length > 0) {
      const { Payment, Order } = require('../models');
      for (const sub of activeSubscriptions) {
        // Find orders for this subscription
        const orders = await Order.findAll({ where: { subscription_id: sub.subscription_id } });
        if (orders.length === 0) {
          // No orders created yet for this active subscription => treat as unpaid
          return res.status(400).json({
            message: 'Ya tienes una suscripción activa sin pago. Por favor paga o cancela la actual antes de crear una nueva.'
          });
        }
        const orderIds = orders.map(o => o.order_id);
        const completedPayment = await Payment.findOne({
          where: { order_id: orderIds, status: 'completed' }
        });
        if (!completedPayment) {
          // Active subscription exists without any completed payment
          return res.status(400).json({
            message: 'Ya tienes una suscripción activa sin pago. Por favor paga o cancela la actual antes de crear una nueva.'
          });
        }
      }
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

// Mark subscription as paid
router.patch('/:id/mark-as-paid', authenticateToken, validateId('id'), async (req, res) => {
  try {
    const subscriptionId = req.params.id;

    // Find the subscription
    const subscription = await Subscription.findOne({
      where: {
        subscription_id: subscriptionId,
        user_id: req.user.user_id
      }
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Buscar órdenes asociadas a esta suscripción
    const Order = require('../models/Order');
    const Payment = require('../models/Payment');

    const orders = await Order.findAll({
      where: { subscription_id: subscriptionId }
    });

    if (orders.length === 0) {
      return res.status(400).json({ message: 'No existing order found to mark as paid' });
    }

    const orderIds = orders.map(o => o.order_id);
    // Validar que exista algún pago completado asociado
    const completedPayment = await Payment.findOne({
      where: { order_id: orderIds, status: 'completed' }
    });

    if (!completedPayment) {
      return res.status(400).json({ message: 'No completed payment found for this subscription' });
    }

    // Crear una respuesta con los datos de la suscripción y paid=true
    const subscriptionData = subscription.toJSON();
    subscriptionData.paid = true;

    res.json({
      message: 'Subscription marked as paid successfully',
      subscription: subscriptionData
    });
  } catch (error) {
    console.error('Mark subscription as paid error:', error);
    res.status(500).json({ message: 'Failed to mark subscription as paid' });
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
      case 'quarterly':
        nextDelivery.setMonth(nextDelivery.getMonth() + 3);
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

    // Verificar si ya está pagada: existe algún Payment 'completed' en sus órdenes
    const orders = await Order.findAll({ where: { subscription_id: subscription.subscription_id } });
    const orderIds = orders.map(o => o.order_id);
    const paidPayment = orderIds.length > 0 ? await require('../models/Payment').findOne({
      where: { order_id: orderIds, status: 'completed' }
    }) : null;

    if (paidPayment) {
      return res.status(400).json({ message: 'No se puede cancelar: la suscripción ya está pagada' });
    }

    // Cancelar pagos pendientes relacionados para evitar bloqueos futuros
    if (orderIds.length > 0) {
      const Payment = require('../models/Payment');
      await Payment.update(
        { status: 'cancelled' },
        { where: { order_id: orderIds, status: 'pending' } }
      );

      // Opcional: marcar órdenes como canceladas
      await Order.update(
        { status: 'cancelled', cancelled_at: new Date(), cancellation_reason },
        { where: { order_id: orderIds, status: ['pending', 'confirmed'] } }
      );
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

// Hide subscription (only for cancelled subscriptions)
router.patch('/:id/hide', authenticateToken, validateId('id'), async (req, res) => {
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

    if (subscription.status !== 'cancelled') {
      return res.status(400).json({ message: 'Only cancelled subscriptions can be hidden' });
    }

    if (subscription.is_hidden) {
      return res.status(400).json({ message: 'Subscription is already hidden' });
    }

    await subscription.update({ is_hidden: true });

    res.json({
      message: 'Subscription hidden successfully',
      subscription
    });
  } catch (error) {
    console.error('Hide subscription error:', error);
    res.status(500).json({ message: 'Failed to hide subscription' });
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
        frequency_options: ['weekly', 'biweekly', 'monthly', 'quarterly']
      },
      {
        name: 'Caja Mediana',
        box_size: 'medium',
        price: 40000,
        description: 'Ideal para 2-4 personas',
        products: '6-8 productos frescos',
        frequency_options: ['weekly', 'biweekly', 'monthly', 'quarterly']
      },
      {
        name: 'Caja Grande',
        box_size: 'large',
        price: 60000,
        description: 'Perfecta para familias grandes',
        products: '8-12 productos frescos',
        frequency_options: ['weekly', 'biweekly', 'monthly', 'quarterly']
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
