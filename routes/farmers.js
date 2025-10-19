const express = require('express');
const { Farmer, Product } = require('../models');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { validateFarmer, validateFarmerPartial, validateId, validatePagination } = require('../middleware/validation');
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

// Helper to normalize specialties input (array, JSON string, or comma-separated string)
const normalizeSpecialties = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }
    } catch (_) {}
    return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

// Public: list active farmers with optional search and location filter
router.get('/', optionalAuth, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;
    const { search, location } = req.query;

    const whereClause = { is_active: true };

    if (location) {
      whereClause.location = location;
    }

    if (search) {
      whereClause[require('sequelize').Op.or] = [
        { name: { [require('sequelize').Op.like]: `%${search}%` } },
        { location: { [require('sequelize').Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: farmers } = await Farmer.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Product,
          as: 'products',
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

// Public: get farmer by ID (with products)
router.get('/:id', optionalAuth, validateId('id'), async (req, res) => {
  try {
    const farmer = await Farmer.findByPk(req.params.id, {
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['product_id', 'name', 'category', 'is_available']
        }
      ]
    });

    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    res.json({ message: 'Farmer retrieved successfully', farmer });
  } catch (error) {
    console.error('Get farmer by id error:', error);
    res.status(500).json({ message: 'Failed to retrieve farmer' });
  }
});

// Public: serve farmer image (BLOB or redirect to URL)
router.get('/:id/image', validateId('id'), async (req, res) => {
  try {
    const farmer = await Farmer.findByPk(req.params.id);

    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    const blob = farmer.image_data;
    const url = farmer.image_url;

    if (blob && blob.length) {
      const mime = detectImageMimeType(blob) || 'application/octet-stream';
      res.set('Content-Type', mime);
      res.set('Content-Length', String(blob.length));
      res.set('Cache-Control', 'public, max-age=86400');
      return res.send(blob);
    }

    if (url) {
      return res.redirect(url);
    }

    return res.status(404).json({ message: 'Image not found' });
  } catch (error) {
    console.error('Get farmer image error:', error);
    res.status(500).json({ message: 'Failed to retrieve farmer image' });
  }
});

// Public: farmer stats
router.get('/:id/stats', optionalAuth, validateId('id'), async (req, res) => {
  try {
    const farmer = await Farmer.findByPk(req.params.id);
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }
    const products = await Product.findAll({ where: { farmer_id: farmer.farmer_id } });
    const total = products.length;
    const available = products.filter((p) => p.is_available).length;
    const organic = products.filter((p) => p.organic).length;
    const categoryDistribution = products.reduce((acc, p) => {
      const cat = p.category || 'otros';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    res.json({
      message: 'Farmer stats retrieved successfully',
      stats: { total, available, organic, categories: categoryDistribution }
    });
  } catch (error) {
    console.error('Get farmer stats error:', error);
    res.status(500).json({ message: 'Failed to retrieve farmer stats' });
  }
});

// Admin: create farmer
router.post('/', authenticateToken, requireAdmin, upload.single('image'), validateFarmer, async (req, res) => {
  try {
    const payload = { ...req.body };

    // Handle image
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

    // Normalize specialties and convert years_experience
    if (payload.specialties !== undefined) {
      payload.specialties = normalizeSpecialties(payload.specialties);
    }
    if (payload.years_experience !== undefined && payload.years_experience !== '') {
      payload.years_experience = Number(payload.years_experience);
    }

    const farmer = await Farmer.create(payload);

    const farmerWithProducts = await Farmer.findByPk(farmer.farmer_id, {
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['product_id', 'name', 'is_available']
        }
      ]
    });

    res.status(201).json({
      message: 'Farmer created successfully',
      farmer: farmerWithProducts
    });
  } catch (error) {
    console.error('Create farmer error:', error);
    res.status(500).json({ message: 'Failed to create farmer' });
  }
});

// Admin: update farmer (PUT)
router.put('/:id', authenticateToken, requireAdmin, validateId('id'), upload.single('image'), validateFarmer, async (req, res) => {
  try {
    const farmer = await Farmer.findByPk(req.params.id);
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
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

    if (payload.specialties !== undefined) {
      payload.specialties = normalizeSpecialties(payload.specialties);
    }
    if (payload.years_experience !== undefined && payload.years_experience !== '') {
      payload.years_experience = Number(payload.years_experience);
    }

    await farmer.update(payload);

    const updatedFarmer = await Farmer.findByPk(farmer.farmer_id, {
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['product_id', 'name', 'is_available']
        }
      ]
    });

    res.json({ message: 'Farmer updated successfully', farmer: updatedFarmer });
  } catch (error) {
    console.error('Update farmer error:', error);
    res.status(500).json({ message: 'Failed to update farmer' });
  }
});

// Admin: partial update farmer (PATCH)
router.patch('/:id', authenticateToken, requireAdmin, validateId('id'), upload.single('image'), validateFarmerPartial, async (req, res) => {
  try {
    const farmer = await Farmer.findByPk(req.params.id);
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
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

    if (payload.specialties !== undefined) {
      payload.specialties = normalizeSpecialties(payload.specialties);
    }
    if (payload.years_experience !== undefined && payload.years_experience !== '') {
      payload.years_experience = Number(payload.years_experience);
    }

    await farmer.update(payload);

    const updatedFarmer = await Farmer.findByPk(farmer.farmer_id, {
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['product_id', 'name', 'is_available']
        }
      ]
    });

    res.json({ message: 'Farmer updated successfully', farmer: updatedFarmer });
  } catch (error) {
    console.error('Patch farmer error:', error);
    res.status(500).json({ message: 'Failed to update farmer' });
  }
});

// Admin: update farmer image only (PATCH)
router.patch('/:id/image', authenticateToken, requireAdmin, validateId('id'), upload.single('image'), async (req, res) => {
  try {
    const farmer = await Farmer.findByPk(req.params.id);
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    const payload = {};

    if (req.file) {
      const { image_url } = buildImageFromFile(req.file);
      payload.image_url = image_url;
      payload.image_data = null;
    } else if (req.body.image_base64) {
      const result = buildImageFromBase64(String(req.body.image_base64));
      if (result.error) {
        return res.status(400).json({ message: result.error });
      }
      payload.image_data = result.image_data;
      payload.image_url = null;
    } else if (req.body.image_url) {
      payload.image_url = String(req.body.image_url);
      payload.image_data = null;
    } else {
      return res.status(400).json({ message: 'No image provided' });
    }

    await farmer.update(payload);

    res.json({ message: 'Farmer image updated successfully', farmer_id: farmer.farmer_id, image_url: farmer.image_url || null });
  } catch (error) {
    console.error('Update farmer image error:', error);
    res.status(500).json({ message: 'Failed to update farmer image' });
  }
});

// Admin: soft delete farmer (deactivate) and deactivate their products
router.delete('/:id', authenticateToken, requireAdmin, validateId('id'), async (req, res) => {
  try {
    const farmer = await Farmer.findByPk(req.params.id);
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    await farmer.update({ is_active: false });
    await Product.update({ is_available: false }, { where: { farmer_id: farmer.farmer_id } });

    res.json({ message: 'Farmer deactivated successfully' });
  } catch (error) {
    console.error('Delete farmer error:', error);
    res.status(500).json({ message: 'Failed to deactivate farmer' });
  }
});

// Admin: restore farmer (reactivate)
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

// Admin: list all farmers (active/inactive) with filters
router.get('/admin/all', authenticateToken, requireAdmin, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;
    const { search, location, is_active } = req.query;

    const whereClause = {};
    if (typeof is_active !== 'undefined') {
      whereClause.is_active = String(is_active) === 'true';
    }
    if (location) {
      whereClause.location = location;
    }
    if (search) {
      whereClause[require('sequelize').Op.or] = [
        { name: { [require('sequelize').Op.like]: `%${search}%` } },
        { location: { [require('sequelize').Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: farmers } = await Farmer.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Product,
          as: 'products',
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
    console.error('Admin list farmers error:', error);
    res.status(500).json({ message: 'Failed to retrieve farmers' });
  }
});

// Admin: get farmer by ID (with products)
router.get('/admin/:id', authenticateToken, requireAdmin, validateId('id'), async (req, res) => {
  try {
    const farmer = await Farmer.findByPk(req.params.id, {
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['product_id', 'name', 'category', 'is_available']
        }
      ]
    });

    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    res.json({ message: 'Farmer retrieved successfully', farmer });
  } catch (error) {
    console.error('Admin get farmer error:', error);
    res.status(500).json({ message: 'Failed to retrieve farmer' });
  }
});

// Admin: remove farmer image (DELETE)
router.delete('/:id/image', authenticateToken, requireAdmin, validateId('id'), async (req, res) => {
  try {
    const farmer = await Farmer.findByPk(req.params.id);
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    await farmer.update({ image_url: null, image_data: null });

    res.json({ message: 'Farmer image removed successfully' });
  } catch (error) {
    console.error('Delete farmer image error:', error);
    res.status(500).json({ message: 'Failed to remove farmer image' });
  }
});

module.exports = router;