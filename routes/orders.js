const express = require('express');
const { Order, OrderItem, Product, Farmer, User, Address, Subscription } = require('../models');
const { authenticateToken, requireAdmin, requireOwnershipOrAdmin } = require('../middleware/auth');
const { validateOrder, validateId, validatePagination, validateOrderAdminCreate, validateOrderAdminUpdate, validateOrderAdminPartial } = require('../middleware/validation');

const router = express.Router();

// Get user's orders
router.get('/my-orders', authenticateToken, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status } = req.query;

    const whereClause = { user_id: req.user.user_id };
    if (status) whereClause.status = status;

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        { model: Address, as: 'address' },
        { model: Subscription, as: 'subscription' },
        {
          model: OrderItem,
          as: 'orderItems',
          include: [
            {
              model: Product,
              as: 'product',
              include: [
                {
                  model: Farmer,
                  as: 'farmer',
                  attributes: ['farmer_id', 'name', 'location']
                }
              ]
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

// Get specific order
router.get('/:id', authenticateToken, validateId('id'), async (req, res) => {
  try {
    const order = await Order.findOne({
      where: {
        order_id: req.params.id,
        user_id: req.user.user_id
      },
      include: [
        { model: Address, as: 'address' },
        { model: Subscription, as: 'subscription' },
        {
          model: OrderItem,
          as: 'orderItems',
          include: [
            {
              model: Product,
              as: 'product',
              include: [
                {
                  model: Farmer,
                  as: 'farmer',
                  attributes: ['farmer_id', 'name', 'location', 'contact_info']
                }
              ]
            }
          ]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      message: 'Order retrieved successfully',
      order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Failed to retrieve order' });
  }
});

// Create order from subscription
router.post('/from-subscription/:subscriptionId', authenticateToken, validateId('subscriptionId'), async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { address_id, special_instructions } = req.body;

    // Get subscription
    const subscription = await Subscription.findOne({
      where: {
        subscription_id: subscriptionId,
        user_id: req.user.user_id,
        status: 'active'
      }
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Active subscription not found' });
    }

    // Get address - use provided address_id or find default address
    let address;
    if (address_id) {
      address = await Address.findOne({
        where: {
          address_id: address_id,
          user_id: req.user.user_id
        }
      });
    } else {
      // Find default address
      address = await Address.findOne({
        where: {
          user_id: req.user.user_id,
          is_default: true
        }
      });
    }

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Get products for the box based on size and preferences
    const products = await getProductsForBox(subscription.box_size, subscription.custom_preferences);

    if (products.length === 0) {
      return res.status(400).json({ message: 'No products available for this box size' });
    }

    // Calculate total amount
    const subtotal = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    const taxAmount = subtotal * 0.19; // 19% IVA
    const shippingCost = 0; // Free shipping for subscriptions
    // Use the subscription price directly instead of calculating from products
    const totalAmount = subscription.price;

    // Create order
    const order = await Order.create({
      user_id: req.user.user_id,
      subscription_id: subscriptionId,
      address_id: address.address_id,
      delivery_date: subscription.next_delivery_date,
      subtotal,
      tax_amount: taxAmount,
      shipping_cost: shippingCost,
      total_amount: totalAmount,
      special_instructions,
      status: 'pending'
    });

    // Create order items
    const orderItems = await Promise.all(
      products.map(product =>
        OrderItem.create({
          order_id: order.order_id,
          product_id: product.product_id,
          quantity: product.quantity,
          price_at_purchase: product.price,
          product_name: product.name,
          product_unit: product.unit,
          farmer_name: product.farmer.name
        })
      )
    );

    // Update subscription next delivery date
    const nextDelivery = new Date(subscription.next_delivery_date);
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
    await subscription.update({ next_delivery_date: nextDelivery });

    // Fetch complete order with relations
    const completeOrder = await Order.findByPk(order.order_id, {
      include: [
        { model: Address, as: 'address' },
        { model: Subscription, as: 'subscription' },
        {
          model: OrderItem,
          as: 'orderItems',
          include: [
            {
              model: Product,
              as: 'product',
              include: [
                {
                  model: Farmer,
                  as: 'farmer',
                  attributes: ['farmer_id', 'name', 'location']
                }
              ]
            }
          ]
        }
      ]
    });

    res.status(201).json({
      message: 'Order created successfully',
      order: completeOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// Cancel order
router.patch('/:id/cancel', authenticateToken, validateId('id'), async (req, res) => {
  try {
    const { cancellation_reason } = req.body;
    const order = await Order.findOne({
      where: {
        order_id: req.params.id,
        user_id: req.user.user_id
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (['delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be cancelled' });
    }

    await order.update({
      status: 'cancelled',
      cancellation_reason,
      cancelled_at: new Date()
    });

    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Failed to cancel order' });
  }
});

// Admin routes - Get all orders
router.get('/', authenticateToken, requireAdmin, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status, user_id, date_from, date_to } = req.query;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (user_id) whereClause.user_id = user_id;
    
    if (date_from || date_to) {
      whereClause.order_date = {};
      if (date_from) whereClause.order_date[require('sequelize').Op.gte] = new Date(date_from);
      if (date_to) whereClause.order_date[require('sequelize').Op.lte] = new Date(date_to);
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
        { model: Subscription, as: 'subscription' }
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

// Admin routes - Get order by ID
router.get('/admin/:id', authenticateToken, requireAdmin, validateId('id'), async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'name', 'email', 'phone_number']
        },
        { model: Address, as: 'address' },
        { model: Subscription, as: 'subscription' },
        {
          model: OrderItem,
          as: 'orderItems',
          include: [
            {
              model: Product,
              as: 'product',
              include: [
                {
                  model: Farmer,
                  as: 'farmer',
                  attributes: ['farmer_id', 'name', 'location', 'contact_info']
                }
              ]
            }
          ]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      message: 'Order retrieved successfully',
      order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Failed to retrieve order' });
  }
});

// Admin routes - Update order status
router.patch('/admin/:id/status', authenticateToken, requireAdmin, validateId('id'), async (req, res) => {
  try {
    const { status, tracking_number, delivery_notes } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled', 'returned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const updateData = { status };
    if (tracking_number) updateData.tracking_number = tracking_number;
    if (delivery_notes) updateData.delivery_notes = delivery_notes;
    
    if (status === 'delivered') {
      updateData.delivered_at = new Date();
    }

    await order.update(updateData);

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

// Helper function to get products for box
async function getProductsForBox(boxSize, preferences = {}) {
  const productCounts = {
    small: 4,
    medium: 6,
    large: 8
  };

  const count = productCounts[boxSize] || 6;
  
  // Get available products based on preferences
  const whereClause = { is_available: true };
  
  if (preferences.categories && preferences.categories.length > 0) {
    whereClause.category = { [require('sequelize').Op.in]: preferences.categories };
  }
  
  if (preferences.organic !== undefined) {
    whereClause.organic = preferences.organic;
  }

  const products = await Product.findAll({
    where: whereClause,
    include: [
      {
        model: Farmer,
        as: 'farmer',
        attributes: ['farmer_id', 'name', 'location']
      }
    ],
    order: require('sequelize').literal('RANDOM()'),
    limit: count
  });

  // Add quantity (1 for each product in the box)
  return products.map(product => ({
    ...product.toJSON(),
    quantity: 1
  }));
}

module.exports = router;

// Admin routes - Create order
router.post('/admin', authenticateToken, requireAdmin, validateOrderAdminCreate, async (req, res) => {
  try {
    const { user_id, address_id, delivery_date, items, special_instructions, shipping_cost = 0, subscription_id } = req.body;

    // Validate user
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate address belongs to user
    const address = await Address.findOne({ where: { address_id, user_id } });
    if (!address) {
      return res.status(404).json({ message: 'Address not found for user' });
    }

    let subtotal = 0;
    let orderItemsPayload = [];
    let taxAmount = 0;
    const shippingCost = parseFloat(shipping_cost) || 0;
    let totalAmount = 0;

    if (subscription_id) {
      // Build order from subscription configuration
      const subscription = await Subscription.findByPk(subscription_id);
      if (!subscription || subscription.user_id !== user_id || subscription.status !== 'active') {
        return res.status(404).json({ message: 'Active subscription not found for user' });
      }

      const productsForBox = await getProductsForBox(subscription.box_size, subscription.custom_preferences);
      if (!productsForBox || productsForBox.length === 0) {
        return res.status(400).json({ message: 'No products available for this box size' });
      }

      subtotal = productsForBox.reduce((sum, product) => sum + (parseFloat(product.price) * (product.quantity || 1)), 0);
      taxAmount = subtotal * 0.19; // IVA 19%
      // Use the subscription price directly instead of calculating from products
      totalAmount = parseFloat(subscription.price);

      orderItemsPayload = productsForBox.map(product => ({
        product_id: product.product_id,
        quantity: product.quantity || 1,
        price_at_purchase: parseFloat(product.price),
        product_name: product.name,
        product_unit: product.unit,
        farmer_name: product.farmer?.name || 'N/A'
      }));

      // Update subscription next delivery date based on frequency
      if (subscription.next_delivery_date) {
        const nextDelivery = new Date(subscription.next_delivery_date);
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
          default:
            break;
        }
        await subscription.update({ next_delivery_date: nextDelivery });
      }
    } else {
      // Build order from explicit items
      if (!items || items.length === 0) {
        return res.status(400).json({ message: 'Items are required when no subscription_id is provided' });
      }

      orderItemsPayload = [];
      for (const item of items) {
        const product = await Product.findByPk(item.product_id, {
          include: [{ model: Farmer, as: 'farmer', attributes: ['name'] }]
        });
        if (!product) {
          return res.status(404).json({ message: `Product ${item.product_id} not found` });
        }
        if (product.is_available === false) {
          return res.status(400).json({ message: `Product ${product.name} is not available` });
        }

        const price = parseFloat(product.price);
        const lineTotal = price * item.quantity;
        subtotal += lineTotal;

        orderItemsPayload.push({
          product_id: product.product_id,
          quantity: item.quantity,
          price_at_purchase: price,
          product_name: product.name,
          product_unit: product.unit,
          farmer_name: product.farmer?.name || 'N/A'
        });
      }

      taxAmount = subtotal * 0.19; // IVA 19%
      totalAmount = subtotal + taxAmount + shippingCost;
    }

    // Create order
    const order = await Order.create({
      user_id,
      address_id,
      delivery_date,
      subscription_id: subscription_id || null,
      subtotal,
      tax_amount: taxAmount,
      shipping_cost: shippingCost,
      total_amount: totalAmount,
      special_instructions,
      status: 'pending'
    });

    // Create items
    await Promise.all(
      orderItemsPayload.map(oi => OrderItem.create({ ...oi, order_id: order.order_id }))
    );

    // Fetch full order
    const completeOrder = await Order.findByPk(order.order_id, {
      include: [
        { model: User, as: 'user', attributes: ['user_id', 'name', 'email'] },
        { model: Address, as: 'address' },
        { model: Subscription, as: 'subscription' },
        { model: OrderItem, as: 'orderItems', include: [{ model: Product, as: 'product' }] }
      ]
    });

    res.status(201).json({ message: 'Order created successfully', order: completeOrder });
  } catch (error) {
    console.error('Admin create order error:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// Admin routes - Update order (PUT)
router.put('/admin/:id', authenticateToken, requireAdmin, validateId('id'), validateOrderAdminUpdate, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (['delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ message: 'Cannot update a delivered or cancelled order' });
    }

    const { address_id, delivery_date, items, special_instructions, shipping_cost } = req.body;

    // Validate address if provided
    if (address_id) {
      const address = await Address.findOne({ where: { address_id, user_id: order.user_id } });
      if (!address) {
        return res.status(404).json({ message: 'Address not found for user' });
      }
      order.address_id = address_id;
    }

    if (delivery_date) order.delivery_date = delivery_date;
    if (typeof special_instructions !== 'undefined') order.special_instructions = special_instructions;
    if (typeof shipping_cost !== 'undefined') order.shipping_cost = parseFloat(shipping_cost) || 0;

    // Handle items replacement if provided
    if (items && items.length > 0) {
      await OrderItem.destroy({ where: { order_id: order.order_id } });

      let subtotal = 0;
      const orderItemsPayload = [];

      for (const item of items) {
        const product = await Product.findByPk(item.product_id, {
          include: [{ model: Farmer, as: 'farmer', attributes: ['name'] }]
        });
        if (!product) {
          return res.status(404).json({ message: `Product ${item.product_id} not found` });
        }
        if (product.is_available === false) {
          return res.status(400).json({ message: `Product ${product.name} is not available` });
        }

        const price = parseFloat(product.price);
        const lineTotal = price * item.quantity;
        subtotal += lineTotal;

        orderItemsPayload.push({
          order_id: order.order_id,
          product_id: product.product_id,
          quantity: item.quantity,
          price_at_purchase: price,
          product_name: product.name,
          product_unit: product.unit,
          farmer_name: product.farmer?.name || 'N/A'
        });
      }

      const taxAmount = subtotal * 0.19;
      const shippingCost = order.shipping_cost || 0;
      const totalAmount = subtotal + taxAmount + shippingCost;

      order.subtotal = subtotal;
      order.tax_amount = taxAmount;
      order.total_amount = totalAmount;

      await OrderItem.bulkCreate(orderItemsPayload);
    }

    await order.save();

    const updatedOrder = await Order.findByPk(order.order_id, {
      include: [
        { model: User, as: 'user', attributes: ['user_id', 'name', 'email'] },
        { model: Address, as: 'address' },
        { model: Subscription, as: 'subscription' },
        { model: OrderItem, as: 'orderItems', include: [{ model: Product, as: 'product' }] }
      ]
    });

    res.json({ message: 'Order updated successfully', order: updatedOrder });
  } catch (error) {
    console.error('Admin update order error:', error);
    res.status(500).json({ message: 'Failed to update order' });
  }
});

// Admin routes - Partial update (PATCH)
router.patch('/admin/:id', authenticateToken, requireAdmin, validateId('id'), validateOrderAdminPartial, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (['delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ message: 'Cannot update a delivered or cancelled order' });
    }

    const { address_id, delivery_date, items, special_instructions, shipping_cost } = req.body;

    // Apply same logic as PUT for provided fields
    if (address_id) {
      const address = await Address.findOne({ where: { address_id, user_id: order.user_id } });
      if (!address) {
        return res.status(404).json({ message: 'Address not found for user' });
      }
      order.address_id = address_id;
    }

    if (delivery_date) order.delivery_date = delivery_date;
    if (typeof special_instructions !== 'undefined') order.special_instructions = special_instructions;
    if (typeof shipping_cost !== 'undefined') order.shipping_cost = parseFloat(shipping_cost) || 0;

    if (items && items.length > 0) {
      await OrderItem.destroy({ where: { order_id: order.order_id } });

      let subtotal = 0;
      const orderItemsPayload = [];

      for (const item of items) {
        const product = await Product.findByPk(item.product_id, {
          include: [{ model: Farmer, as: 'farmer', attributes: ['name'] }]
        });
        if (!product) {
          return res.status(404).json({ message: `Product ${item.product_id} not found` });
        }
        if (product.is_available === false) {
          return res.status(400).json({ message: `Product ${product.name} is not available` });
        }

        const price = parseFloat(product.price);
        const lineTotal = price * item.quantity;
        subtotal += lineTotal;

        orderItemsPayload.push({
          order_id: order.order_id,
          product_id: product.product_id,
          quantity: item.quantity,
          price_at_purchase: price,
          product_name: product.name,
          product_unit: product.unit,
          farmer_name: product.farmer?.name || 'N/A'
        });
      }

      const taxAmount = subtotal * 0.19;
      const shippingCost = order.shipping_cost || 0;
      const totalAmount = subtotal + taxAmount + shippingCost;

      order.subtotal = subtotal;
      order.tax_amount = taxAmount;
      order.total_amount = totalAmount;

      await OrderItem.bulkCreate(orderItemsPayload);
    }

    await order.save();

    const updatedOrder = await Order.findByPk(order.order_id, {
      include: [
        { model: User, as: 'user', attributes: ['user_id', 'name', 'email'] },
        { model: Address, as: 'address' },
        { model: Subscription, as: 'subscription' },
        { model: OrderItem, as: 'orderItems', include: [{ model: Product, as: 'product' }] }
      ]
    });

    res.json({ message: 'Order updated successfully', order: updatedOrder });
  } catch (error) {
    console.error('Admin patch order error:', error);
    res.status(500).json({ message: 'Failed to update order' });
  }
});

// Admin routes - Cancel (soft delete)
router.delete('/admin/:id', authenticateToken, requireAdmin, validateId('id'), async (req, res) => {
  try {
    const { cancellation_reason } = req.body || {};
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (['delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be cancelled' });
    }

    await order.update({
      status: 'cancelled',
      cancellation_reason,
      cancelled_at: new Date()
    });

    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    console.error('Admin cancel order error:', error);
    res.status(500).json({ message: 'Failed to cancel order' });
  }
});

// Admin routes - Restore
router.patch('/admin/:id/restore', authenticateToken, requireAdmin, validateId('id'), async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'cancelled') {
      return res.status(400).json({ message: 'Only cancelled orders can be restored' });
    }

    await order.update({ status: 'pending', cancelled_at: null, cancellation_reason: null });

    res.json({ message: 'Order restored successfully', order });
  } catch (error) {
    console.error('Admin restore order error:', error);
    res.status(500).json({ message: 'Failed to restore order' });
  }
});
