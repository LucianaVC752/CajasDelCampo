const express = require('express');
const { User, Address, Subscription, Order } = require('../models');
const { authenticateToken, requireOwnershipOrAdmin, requireAdmin } = require('../middleware/auth');
const { validateUserUpdate, validateAddress, validateId, validatePagination, validateUserAdminCreate, validateUserAdminUpdate, validateUserAdminPartial } = require('../middleware/validation');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id, {
      include: [
        {
          model: Address,
          as: 'addresses',
          where: { is_default: true },
          required: false
        }
      ]
    });

    res.json({
      message: 'Profile retrieved successfully',
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to retrieve profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, validateUserUpdate, async (req, res) => {
  try {
    const { name, phone_number } = req.body;
    const user = await User.findByPk(req.user.user_id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user fields
    if (name) user.name = name;
    if (phone_number) user.phone_number = phone_number;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Get user addresses
router.get('/addresses', authenticateToken, async (req, res) => {
  try {
    const addresses = await Address.findAll({
      where: { user_id: req.user.user_id },
      order: [['is_default', 'DESC'], ['created_at', 'DESC']]
    });

    res.json({
      message: 'Addresses retrieved successfully',
      addresses
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ message: 'Failed to retrieve addresses' });
  }
});

// Create new address
router.post('/addresses', authenticateToken, validateAddress, async (req, res) => {
  try {
    const addressData = {
      ...req.body,
      user_id: req.user.user_id
    };

    // If this is set as default, unset other default addresses
    if (addressData.is_default) {
      await Address.update(
        { is_default: false },
        { where: { user_id: req.user.user_id } }
      );
    }

    const address = await Address.create(addressData);

    res.status(201).json({
      message: 'Address created successfully',
      address
    });
  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({ message: 'Failed to create address' });
  }
});

// Update address
router.put('/addresses/:id', authenticateToken, validateId('id'), validateAddress, async (req, res) => {
  try {
    const address = await Address.findOne({
      where: {
        address_id: req.params.id,
        user_id: req.user.user_id
      }
    });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // If this is set as default, unset other default addresses
    if (req.body.is_default) {
      await Address.update(
        { is_default: false },
        { where: { user_id: req.user.user_id } }
      );
    }

    await address.update(req.body);

    res.json({
      message: 'Address updated successfully',
      address
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ message: 'Failed to update address' });
  }
});

// Delete address
router.delete('/addresses/:id', authenticateToken, validateId('id'), async (req, res) => {
  try {
    const address = await Address.findOne({
      where: {
        address_id: req.params.id,
        user_id: req.user.user_id
      }
    });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    await address.destroy();

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ message: 'Failed to delete address' });
  }
});

// Set default address
router.patch('/addresses/:id/default', authenticateToken, validateId('id'), async (req, res) => {
  try {
    const address = await Address.findOne({
      where: {
        address_id: req.params.id,
        user_id: req.user.user_id
      }
    });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Unset other default addresses
    await Address.update(
      { is_default: false },
      { where: { user_id: req.user.user_id } }
    );

    // Set this address as default
    await address.update({ is_default: true });

    res.json({
      message: 'Default address updated successfully',
      address
    });
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({ message: 'Failed to set default address' });
  }
});

// Get user subscriptions
router.get('/subscriptions', authenticateToken, async (req, res) => {
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

// Get user orders
router.get('/orders', authenticateToken, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: orders } = await Order.findAndCountAll({
      where: { user_id: req.user.user_id },
      include: [
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

// Get specific order
router.get('/orders/:id', authenticateToken, validateId('id'), async (req, res) => {
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
          model: require('../models').OrderItem, 
          as: 'orderItems',
          include: [
            { model: require('../models').Product, as: 'product' }
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

// Admin routes - Get all users
router.get('/', authenticateToken, requireAdmin, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { search, role, is_active } = req.query;

    const whereClause = {};
    if (typeof is_active !== 'undefined') {
      whereClause.is_active = String(is_active) === 'true';
    }
    if (role) {
      whereClause.role = role;
    }
    if (search) {
      whereClause[require('sequelize').Op.or] = [
        { name: { [require('sequelize').Op.like]: `%${search}%` } },
        { email: { [require('sequelize').Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password_hash'] },
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
// Admin routes - Get specific user
router.get('/:id', authenticateToken, requireOwnershipOrAdmin(), validateId('id'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password_hash'] },
      include: [
        { model: Address, as: 'addresses' },
        { model: Subscription, as: 'subscriptions' },
        { model: Order, as: 'orders' }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User retrieved successfully',
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to retrieve user' });
  }
});

// Admin routes - Update user status
router.patch('/:id/status', authenticateToken, requireOwnershipOrAdmin(), validateId('id'), async (req, res) => {
  try {
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ message: 'is_active must be a boolean' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ is_active });

    res.json({
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

// Admin routes - Create user
router.post('/', authenticateToken, requireAdmin, validateUserAdminCreate, async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.password) {
      payload.password_hash = payload.password;
      delete payload.password;
    }

    const user = await User.create(payload);
    const created = await User.findByPk(user.user_id, {
      attributes: { exclude: ['password_hash'] }
    });

    res.status(201).json({
      message: 'User created successfully',
      user: created
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// Admin routes - Update user
router.put('/:id', authenticateToken, requireAdmin, validateId('id'), validateUserAdminUpdate, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const payload = { ...req.body };
    if (payload.password) {
      payload.password_hash = payload.password;
      delete payload.password;
    }

    await user.update(payload);

    const updated = await User.findByPk(user.user_id, {
      attributes: { exclude: ['password_hash'] }
    });

    res.json({ message: 'User updated successfully', user: updated });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Admin routes - Update user partial
router.patch('/:id', authenticateToken, requireAdmin, validateId('id'), validateUserAdminPartial, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const payload = { ...req.body };
    if (payload.password) {
      payload.password_hash = payload.password;
      delete payload.password;
    }

    await user.update(payload);

    const updated = await User.findByPk(user.user_id, {
      attributes: { exclude: ['password_hash'] }
    });

    res.json({ message: 'User updated successfully', user: updated });
  } catch (error) {
    console.error('Patch user error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Admin routes - Deactivate user
router.delete('/:id', authenticateToken, requireAdmin, validateId('id'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ is_active: false });

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to deactivate user' });
  }
});

// Admin routes - Restore user
router.patch('/:id/restore', authenticateToken, requireAdmin, validateId('id'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ is_active: true });

    res.json({ message: 'User restored successfully' });
  } catch (error) {
    console.error('Restore user error:', error);
    res.status(500).json({ message: 'Failed to restore user' });
  }
});


// Admin routes - Create address for user
router.post('/:id/addresses', authenticateToken, requireAdmin, validateId('id'), validateAddress, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const addressData = { ...req.body, user_id: req.params.id };

    if (addressData.is_default) {
      await Address.update({ is_default: false }, { where: { user_id: req.params.id } });
    }

    const address = await Address.create(addressData);

    res.status(201).json({ message: 'Address created successfully', address });
  } catch (error) {
    console.error('Admin create address error:', error);
    res.status(500).json({ message: 'Failed to create address' });
  }
});

module.exports = router;
