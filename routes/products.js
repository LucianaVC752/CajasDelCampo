const express = require('express');
const { Product, Farmer } = require('../models');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { validateProduct, validateId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Get all products (public)
router.get('/', optionalAuth, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;
    const { category, farmer_id, organic, search } = req.query;

    // Build where clause
    const whereClause = { is_available: true };
    
    if (category) {
      whereClause.category = category;
    }
    
    if (farmer_id) {
      whereClause.farmer_id = farmer_id;
    }
    
    if (organic !== undefined) {
      whereClause.organic = organic === 'true';
    }
    
    if (search) {
      whereClause[require('sequelize').Op.or] = [
        { name: { [require('sequelize').Op.like]: `%${search}%` } },
        { description: { [require('sequelize').Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Farmer,
          as: 'farmer',
          attributes: ['farmer_id', 'name', 'location', 'image_url']
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

// Get product by ID (public)
router.get('/:id', optionalAuth, validateId('id'), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        {
          model: Farmer,
          as: 'farmer',
          attributes: ['farmer_id', 'name', 'story', 'location', 'contact_info', 'image_url', 'years_experience', 'specialties']
        }
      ]
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      message: 'Product retrieved successfully',
      product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Failed to retrieve product' });
  }
});

// Admin routes - Create product
router.post('/', authenticateToken, requireAdmin, validateProduct, async (req, res) => {
  try {
    const product = await Product.create(req.body);

    // Fetch the product with farmer information
    const productWithFarmer = await Product.findByPk(product.product_id, {
      include: [
        {
          model: Farmer,
          as: 'farmer',
          attributes: ['farmer_id', 'name', 'location']
        }
      ]
    });

    res.status(201).json({
      message: 'Product created successfully',
      product: productWithFarmer
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Failed to create product' });
  }
});

// Admin routes - Update product
router.put('/:id', authenticateToken, requireAdmin, validateId('id'), validateProduct, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.update(req.body);

    // Fetch the updated product with farmer information
    const updatedProduct = await Product.findByPk(product.product_id, {
      include: [
        {
          model: Farmer,
          as: 'farmer',
          attributes: ['farmer_id', 'name', 'location']
        }
      ]
    });

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// Admin routes - Delete product (soft delete)
router.delete('/:id', authenticateToken, requireAdmin, validateId('id'), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Soft delete by setting is_available to false
    await product.update({ is_available: false });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

// Admin routes - Restore product
router.patch('/:id/restore', authenticateToken, requireAdmin, validateId('id'), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.update({ is_available: true });

    res.json({ message: 'Product restored successfully' });
  } catch (error) {
    console.error('Restore product error:', error);
    res.status(500).json({ message: 'Failed to restore product' });
  }
});

// Admin routes - Update product stock
router.patch('/:id/stock', authenticateToken, requireAdmin, validateId('id'), async (req, res) => {
  try {
    const { stock_quantity } = req.body;

    if (typeof stock_quantity !== 'number' || stock_quantity < 0) {
      return res.status(400).json({ message: 'Stock quantity must be a non-negative number' });
    }

    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.update({ stock_quantity });

    res.json({
      message: 'Product stock updated successfully',
      product: {
        product_id: product.product_id,
        name: product.name,
        stock_quantity: product.stock_quantity
      }
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ message: 'Failed to update product stock' });
  }
});

// Get product categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = ['vegetales', 'frutas', 'hierbas', 'tubérculos', 'legumbres', 'otros'];
    
    res.json({
      message: 'Categories retrieved successfully',
      categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Failed to retrieve categories' });
  }
});

// Get products by category
router.get('/category/:category', optionalAuth, validatePagination, async (req, res) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    const validCategories = ['vegetales', 'frutas', 'hierbas', 'tubérculos', 'legumbres', 'otros'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: { 
        category,
        is_available: true 
      },
      include: [
        {
          model: Farmer,
          as: 'farmer',
          attributes: ['farmer_id', 'name', 'location', 'image_url']
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
    console.error('Get products by category error:', error);
    res.status(500).json({ message: 'Failed to retrieve products' });
  }
});

module.exports = router;
