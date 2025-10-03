const express = require('express');
const { Farmer, Product } = require('../models');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { validateFarmer, validateId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Get all farmers (public)
router.get('/', optionalAuth, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { search, location } = req.query;

    const whereClause = { is_active: true };
    
    if (search) {
      whereClause[require('sequelize').Op.or] = [
        { name: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { story: { [require('sequelize').Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (location) {
      whereClause.location = { [require('sequelize').Op.iLike]: `%${location}%` };
    }

    const { count, rows: farmers } = await Farmer.findAndCountAll({
      where: whereClause,
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

// Get farmer by ID (public)
router.get('/:id', optionalAuth, validateId('id'), async (req, res) => {
  try {
    const farmer = await Farmer.findByPk(req.params.id, {
      include: [
        {
          model: Product,
          as: 'products',
          where: { is_available: true },
          required: false,
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    res.json({
      message: 'Farmer retrieved successfully',
      farmer
    });
  } catch (error) {
    console.error('Get farmer error:', error);
    res.status(500).json({ message: 'Failed to retrieve farmer' });
  }
});

// Get farmer's products
router.get('/:id/products', optionalAuth, validateId('id'), validatePagination, async (req, res) => {
  try {
    const farmerId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;
    const { category, organic } = req.query;

    // Verify farmer exists
    const farmer = await Farmer.findByPk(farmerId);
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    const whereClause = { 
      farmer_id: farmerId,
      is_available: true 
    };
    
    if (category) {
      whereClause.category = category;
    }
    
    if (organic !== undefined) {
      whereClause.organic = organic === 'true';
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    res.json({
      message: 'Farmer products retrieved successfully',
      farmer: {
        farmer_id: farmer.farmer_id,
        name: farmer.name,
        location: farmer.location
      },
      products,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get farmer products error:', error);
    res.status(500).json({ message: 'Failed to retrieve farmer products' });
  }
});

// Admin routes - Create farmer
router.post('/', authenticateToken, requireAdmin, validateFarmer, async (req, res) => {
  try {
    const farmer = await Farmer.create(req.body);

    res.status(201).json({
      message: 'Farmer created successfully',
      farmer
    });
  } catch (error) {
    console.error('Create farmer error:', error);
    res.status(500).json({ message: 'Failed to create farmer' });
  }
});

// Admin routes - Update farmer
router.put('/:id', authenticateToken, requireAdmin, validateId('id'), validateFarmer, async (req, res) => {
  try {
    const farmer = await Farmer.findByPk(req.params.id);

    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    await farmer.update(req.body);

    res.json({
      message: 'Farmer updated successfully',
      farmer
    });
  } catch (error) {
    console.error('Update farmer error:', error);
    res.status(500).json({ message: 'Failed to update farmer' });
  }
});

// Admin routes - Delete farmer (soft delete)
router.delete('/:id', authenticateToken, requireAdmin, validateId('id'), async (req, res) => {
  try {
    const farmer = await Farmer.findByPk(req.params.id);

    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    // Soft delete by setting is_active to false
    await farmer.update({ is_active: false });

    // Also deactivate all farmer's products
    await Product.update(
      { is_available: false },
      { where: { farmer_id: farmer.farmer_id } }
    );

    res.json({ message: 'Farmer deleted successfully' });
  } catch (error) {
    console.error('Delete farmer error:', error);
    res.status(500).json({ message: 'Failed to delete farmer' });
  }
});

// Admin routes - Restore farmer
router.patch('/:id/restore', authenticateToken, requireAdmin, validateId('id'), async (req, res) => {
  try {
    const farmer = await Farmer.findByPk(req.params.id);

    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    await farmer.update({ is_active: true });

    res.json({ message: 'Farmer restored successfully' });
  } catch (error) {
    console.error('Restore farmer error:', error);
    res.status(500).json({ message: 'Failed to restore farmer' });
  }
});

// Admin routes - Get all farmers (including inactive)
router.get('/admin/all', authenticateToken, requireAdmin, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { search, location, is_active } = req.query;

    const whereClause = {};
    
    if (search) {
      whereClause[require('sequelize').Op.or] = [
        { name: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { story: { [require('sequelize').Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (location) {
      whereClause.location = { [require('sequelize').Op.iLike]: `%${location}%` };
    }
    
    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }

    const { count, rows: farmers } = await Farmer.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['product_id', 'name', 'is_available'],
          required: false
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

// Admin routes - Get farmer by ID
router.get('/admin/:id', authenticateToken, requireAdmin, validateId('id'), async (req, res) => {
  try {
    const farmer = await Farmer.findByPk(req.params.id, {
      include: [
        {
          model: Product,
          as: 'products',
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    res.json({
      message: 'Farmer retrieved successfully',
      farmer
    });
  } catch (error) {
    console.error('Get farmer error:', error);
    res.status(500).json({ message: 'Failed to retrieve farmer' });
  }
});

// Get farmer statistics
router.get('/:id/stats', optionalAuth, validateId('id'), async (req, res) => {
  try {
    const farmerId = req.params.id;

    // Verify farmer exists
    const farmer = await Farmer.findByPk(farmerId);
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    // Get product counts
    const totalProducts = await Product.count({
      where: { farmer_id: farmerId }
    });

    const availableProducts = await Product.count({
      where: { farmer_id: farmerId, is_available: true }
    });

    const organicProducts = await Product.count({
      where: { farmer_id: farmerId, organic: true, is_available: true }
    });

    // Get category distribution
    const categoryStats = await Product.findAll({
      where: { farmer_id: farmerId, is_available: true },
      attributes: [
        'category',
        [require('sequelize').fn('COUNT', require('sequelize').col('product_id')), 'count']
      ],
      group: ['category'],
      raw: true
    });

    res.json({
      message: 'Farmer statistics retrieved successfully',
      farmer: {
        farmer_id: farmer.farmer_id,
        name: farmer.name,
        location: farmer.location
      },
      stats: {
        total_products: totalProducts,
        available_products: availableProducts,
        organic_products: organicProducts,
        category_distribution: categoryStats
      }
    });
  } catch (error) {
    console.error('Get farmer stats error:', error);
    res.status(500).json({ message: 'Failed to retrieve farmer statistics' });
  }
});

module.exports = router;
