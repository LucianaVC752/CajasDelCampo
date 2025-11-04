const express = require('express');
const { Product, Farmer } = require('../models');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { validateProduct, validateProductPartial, validateId, validatePagination } = require('../middleware/validation');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { buildImageFromFile, buildImageFromBase64, detectImageMimeType } = require('../utils/image');

// Configure multer storage for image uploads
const uploadDir = path.join(process.cwd(), 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
    } catch (e) {}
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]+/g, '_');
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${safeName}-${unique}${ext}`);
  }
});

const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
const fileFilter = (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB

const router = express.Router();

// Using detectImageMimeType from utils/image.js
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

// Serve product image (BLOB or redirect to URL)
router.get('/:id/image', validateId('id'), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const blob = product.image_data;
    const url = product.image_url;

    if (blob && blob.length) {
      const mime = detectImageMimeType(blob) || 'application/octet-stream';
      res.set('Content-Type', mime);
      res.set('Content-Length', String(blob.length));
      res.set('Cache-Control', 'public, max-age=86400');
      return res.send(blob);
    }

    if (url) {
      // If the image URL exists, redirect to it (supports local and external URLs)
      return res.redirect(url);
    }

    return res.status(404).json({ message: 'Image not found' });
  } catch (error) {
    console.error('Get product image error:', error);
    res.status(500).json({ message: 'Failed to retrieve product image' });
  }
});

// Admin routes - Create product
router.post('/', authenticateToken, requireAdmin, upload.single('image'), validateProduct, async (req, res) => {
  try {
    const payload = { ...req.body };

    // Handle image via multipart file or base64 using helper
    if (req.file) {
      const { image_url } = buildImageFromFile(req.file);
      payload.image_url = image_url;
      payload.image_data = null;
    } else if (payload.image_base64) {
      const result = buildImageFromBase64(String(payload.image_base64));
      if (result.error) {
        return res.status(400).json({ message: result.error });
      }
      payload.image_data = result.image_data;
    }

    // Clean helper field if present
    delete payload.image_base64;

    const product = await Product.create(payload);

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
router.put('/:id', authenticateToken, requireAdmin, validateId('id'), upload.single('image'), validateProduct, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const payload = { ...req.body };

    if (req.file) {
      const { image_url } = buildImageFromFile(req.file);
      payload.image_url = image_url;
      payload.image_data = null;
    } else if (payload.image_base64) {
      const result = buildImageFromBase64(String(payload.image_base64));
      if (result.error) {
        return res.status(400).json({ message: result.error });
      }
      payload.image_data = result.image_data;
    }

    delete payload.image_base64;

    await product.update(payload);

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

// Admin routes - Partial update product (PATCH)
router.patch('/:id', authenticateToken, requireAdmin, validateId('id'), upload.single('image'), validateProductPartial, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const payload = { ...req.body };

    // Handle image via multipart file or base64 using helper
    if (req.file) {
      const { image_url } = buildImageFromFile(req.file);
      payload.image_url = image_url;
      payload.image_data = null;
    } else if (payload.image_base64) {
      const result = buildImageFromBase64(String(payload.image_base64));
      if (result.error) {
        return res.status(400).json({ message: result.error });
      }
      payload.image_data = result.image_data;
    }

    // Clean helper field if present
    delete payload.image_base64;

    await product.update(payload);

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
    console.error('Patch product error:', error);
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

    const restoredProduct = await Product.findByPk(product.product_id, {
      include: [
        {
          model: Farmer,
          as: 'farmer',
          attributes: ['farmer_id', 'name', 'location']
        }
      ]
    });

    res.json({ message: 'Product restored successfully', product: restoredProduct });
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
