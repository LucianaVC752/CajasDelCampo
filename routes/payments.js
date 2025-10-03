const express = require('express');
const { Payment, Order, User } = require('../models');
const { authenticateToken, requireAdmin, requireOwnershipOrAdmin } = require('../middleware/auth');
const { validatePayment, validateId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Get user's payments
router.get('/my-payments', authenticateToken, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status } = req.query;

    const whereClause = { '$Order.user_id$': req.user.user_id };
    if (status) whereClause.status = status;

    const { count, rows: payments } = await Payment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['order_id', 'order_number', 'total_amount', 'status']
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

// Create payment
router.post('/', authenticateToken, validatePayment, async (req, res) => {
  try {
    const { order_id, amount, payment_method, gateway_response } = req.body;

    // Verify order belongs to user
    const order = await Order.findOne({
      where: {
        order_id,
        user_id: req.user.user_id
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order already has a payment
    const existingPayment = await Payment.findOne({
      where: { order_id }
    });

    if (existingPayment) {
      return res.status(400).json({ message: 'Order already has a payment' });
    }

    // Verify amount matches order total
    if (parseFloat(amount) !== parseFloat(order.total_amount)) {
      return res.status(400).json({ 
        message: 'Payment amount does not match order total',
        order_total: order.total_amount,
        payment_amount: amount
      });
    }

    // Generate transaction ID if not provided
    const transaction_id = gateway_response?.transaction_id || 
      `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const payment = await Payment.create({
      order_id,
      amount,
      payment_method,
      transaction_id,
      gateway_response: gateway_response || {},
      status: 'pending'
    });

    // Update order status to confirmed
    await order.update({ status: 'confirmed' });

    res.status(201).json({
      message: 'Payment created successfully',
      payment
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ message: 'Failed to create payment' });
  }
});

// Update payment status
router.patch('/:id/status', authenticateToken, validateId('id'), async (req, res) => {
  try {
    const { status, gateway_response, failure_reason } = req.body;

    const validStatuses = ['pending', 'completed', 'failed', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const payment = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: Order,
          as: 'order',
          where: { user_id: req.user.user_id }
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const updateData = { status };
    if (gateway_response) updateData.gateway_response = gateway_response;
    if (failure_reason) updateData.failure_reason = failure_reason;

    await payment.update(updateData);

    // Update order status based on payment status
    if (status === 'completed') {
      await payment.order.update({ status: 'confirmed' });
    } else if (status === 'failed') {
      await payment.order.update({ status: 'pending' });
    }

    res.json({
      message: 'Payment status updated successfully',
      payment
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ message: 'Failed to update payment status' });
  }
});

// Get payment by ID
router.get('/:id', authenticateToken, validateId('id'), async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: Order,
          as: 'order',
          where: { user_id: req.user.user_id },
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['user_id', 'name', 'email']
            }
          ]
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({
      message: 'Payment retrieved successfully',
      payment
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ message: 'Failed to retrieve payment' });
  }
});

// Process payment with Stripe
router.post('/stripe/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { order_id } = req.body;

    // Verify order belongs to user
    const order = await Order.findOne({
      where: {
        order_id,
        user_id: req.user.user_id
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order already has a payment
    const existingPayment = await Payment.findOne({
      where: { order_id }
    });

    if (existingPayment) {
      return res.status(400).json({ message: 'Order already has a payment' });
    }

    // Create Stripe payment intent
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total_amount * 100), // Convert to cents
      currency: 'cop',
      metadata: {
        order_id: order.order_id,
        user_id: req.user.user_id
      }
    });

    res.json({
      message: 'Payment intent created successfully',
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ message: 'Failed to create payment intent' });
  }
});

// Confirm Stripe payment
router.post('/stripe/confirm', authenticateToken, async (req, res) => {
  try {
    const { payment_intent_id, order_id } = req.body;

    // Verify order belongs to user
    const order = await Order.findOne({
      where: {
        order_id,
        user_id: req.user.user_id
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Retrieve payment intent from Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        message: 'Payment not successful',
        status: paymentIntent.status
      });
    }

    // Create payment record
    const payment = await Payment.create({
      order_id,
      amount: order.total_amount,
      payment_method: 'credit_card',
      transaction_id: paymentIntent.id,
      gateway_response: paymentIntent,
      status: 'completed'
    });

    // Update order status
    await order.update({ status: 'confirmed' });

    res.json({
      message: 'Payment confirmed successfully',
      payment
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Failed to confirm payment' });
  }
});

// Process refund
router.post('/:id/refund', authenticateToken, validateId('id'), async (req, res) => {
  try {
    const { refund_amount, refund_reason } = req.body;

    const payment = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: Order,
          as: 'order',
          where: { user_id: req.user.user_id }
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ message: 'Only completed payments can be refunded' });
    }

    const refundAmount = refund_amount || payment.amount;

    if (refundAmount > payment.amount) {
      return res.status(400).json({ message: 'Refund amount cannot exceed payment amount' });
    }

    // Process refund with Stripe if applicable
    if (payment.payment_method === 'credit_card' && payment.transaction_id) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const refund = await stripe.refunds.create({
          payment_intent: payment.transaction_id,
          amount: Math.round(refundAmount * 100), // Convert to cents
          reason: 'requested_by_customer'
        });

        await payment.update({
          status: 'refunded',
          refund_amount: refundAmount,
          refund_reason: refund_reason || 'Customer request',
          refund_date: new Date()
        });

        res.json({
          message: 'Refund processed successfully',
          refund_id: refund.id,
          refund_amount: refundAmount
        });
      } catch (stripeError) {
        console.error('Stripe refund error:', stripeError);
        return res.status(500).json({ message: 'Failed to process refund with payment gateway' });
      }
    } else {
      // Manual refund for other payment methods
      await payment.update({
        status: 'refunded',
        refund_amount: refundAmount,
        refund_reason: refund_reason || 'Manual refund',
        refund_date: new Date()
      });

      res.json({
        message: 'Refund processed successfully',
        refund_amount: refundAmount
      });
    }
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({ message: 'Failed to process refund' });
  }
});

// Admin routes - Get all payments
router.get('/', authenticateToken, requireAdmin, validatePagination, async (req, res) => {
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
      if (date_from) whereClause.payment_date[require('sequelize').Op.gte] = new Date(date_from);
      if (date_to) whereClause.payment_date[require('sequelize').Op.lte] = new Date(date_to);
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

// Admin routes - Get payment by ID
router.get('/admin/:id', authenticateToken, requireAdmin, validateId('id'), async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['user_id', 'name', 'email', 'phone_number']
            }
          ]
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({
      message: 'Payment retrieved successfully',
      payment
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ message: 'Failed to retrieve payment' });
  }
});

module.exports = router;
