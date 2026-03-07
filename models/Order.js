const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    // ── Customer ───────────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,    // null = guest checkout
    },
    customerInfo: {
      name:    { type: String, required: true },
      phone:   { type: String, required: true },
      email:   { type: String },
    },

    // ── Delivery ───────────────────────────────────────────
    shippingAddress: {
      street:   { type: String, required: true },
      city:     { type: String, required: true },
      province: { type: String, default: 'Sindh' },
    },

    // ── Items ──────────────────────────────────────────────
    items: [
      {
        product:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name:      { type: String, required: true },   // snapshot at time of order
        price:     { type: Number, required: true },
        quantity:  { type: Number, required: true, min: 1 },
        image:     { type: String },
      },
    ],

    // ── Pricing ────────────────────────────────────────────
    subtotal:      { type: Number, required: true },
    shippingCost:  { type: Number, default: 200 },
    discount:      { type: Number, default: 0 },
    total:         { type: Number, required: true },

    // ── Payment ────────────────────────────────────────────
    paymentMethod: {
      type: String,
      enum: ['cod', 'easypaisa', 'jazzcash', 'bank'],
      default: 'cod',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },

    // ── Order Status ───────────────────────────────────────
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    statusHistory: [
      {
        status:    String,
        note:      String,
        updatedAt: { type: Date, default: Date.now },
      },
    ],

    trackingNumber: { type: String, default: '' },
    notes:          { type: String, default: '' },
  },
  { timestamps: true }
);

// ─── Auto-generate order number ───────────────────────────
orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `VPK-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

orderSchema.add({ orderNumber: { type: String, unique: true } });

module.exports = mongoose.model('Order', orderSchema);
