const express  = require('express');
const router   = express.Router();
const Order    = require('../models/Order');
const Product  = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

// ─── POST /api/orders ─────────────────────────────────────
// Public (guest checkout supported)
router.post('/', async (req, res) => {
  try {
    const { customerInfo, shippingAddress, items, paymentMethod, notes } = req.body;

    if (!items?.length)
      return res.status(400).json({ success: false, message: 'No items in order.' });

    // Validate stock + build snapshot items
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product)
        return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
      if (product.stock < item.quantity)
        return res.status(400).json({ success: false, message: `Insufficient stock for: ${product.name}` });

      orderItems.push({
        product:  product._id,
        name:     product.name,
        price:    product.price,
        quantity: item.quantity,
        image:    product.images[0]?.url || '',
      });

      subtotal += product.price * item.quantity;

      // Deduct stock
      product.stock -= item.quantity;
      await product.save();
    }

    const shippingCost = 200;
    const total = subtotal + shippingCost;

    const order = await Order.create({
      user:            req.user?._id || null,
      customerInfo,
      shippingAddress,
      items:           orderItems,
      subtotal,
      shippingCost,
      total,
      paymentMethod:   paymentMethod || 'cod',
      statusHistory:   [{ status: 'pending', note: 'Order placed by customer.' }],
      notes,
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/orders/my ───────────────────────────────────
// Logged-in customer's own orders
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/orders ──────────────────────────────────────
// Admin: all orders with filters
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip   = (Number(page) - 1) * Number(limit);
    const total  = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({ success: true, total, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/orders/:id ──────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');
    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found.' });

    // customers can only see their own orders
    if (req.user.role !== 'admin' && String(order.user) !== String(req.user._id))
      return res.status(403).json({ success: false, message: 'Access denied.' });

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/orders/:id/status ───────────────────────────
// Admin: update order status
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status, note, trackingNumber } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found.' });

    order.status = status;
    order.statusHistory.push({ status, note: note || '' });
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (status === 'delivered') order.paymentStatus = 'paid';

    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/orders/:id ───────────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Order deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
