const express = require('express');
const router  = express.Router();
const cloudinary = require('cloudinary').v2;
const multer     = require('multer');
const Product    = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

// ─── Cloudinary config ────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Multer (memory storage → Cloudinary) ─────────────────
const storage = multer.memoryStorage();
const upload  = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'vaultpk/products' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });

// ─── GET /api/products ────────────────────────────────────
// Public | ?category=mens&search=slim&page=1&limit=12
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    const query = { isActive: true };

    if (category && category !== 'all') query.category = category;
    if (search) query.$text = { $search: search };

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      products,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/products/:id ────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/products ───────────────────────────────────
// Admin only | multipart/form-data with images[]
router.post('/', protect, adminOnly, upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, price, oldPrice, category, stock, badge } = req.body;

    // Upload images to Cloudinary
    const images = [];
    if (req.files?.length) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer);
        images.push({ url: result.secure_url, public_id: result.public_id });
      }
    }

    const product = await Product.create({
      name, description,
      price: Number(price),
      oldPrice: oldPrice ? Number(oldPrice) : null,
      category, stock: Number(stock), badge, images,
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/products/:id ────────────────────────────────
router.put('/:id', protect, adminOnly, upload.array('images', 5), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.files?.length) {
      const images = [];
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer);
        images.push({ url: result.secure_url, public_id: result.public_id });
      }
      updates.images = images;
    }
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/products/:id ─────────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ success: false, message: 'Product not found.' });

    // Delete images from Cloudinary
    for (const img of product.images) {
      if (img.public_id) await cloudinary.uploader.destroy(img.public_id);
    }

    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
