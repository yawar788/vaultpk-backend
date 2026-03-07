const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    oldPrice: {
      type: Number,   // original / crossed-out price
      default: null,
    },
    category: {
      type: String,
      enum: ['mens', 'womens', 'slim', 'rfid', 'gift'],
      required: true,
    },
    images: [
      {
        url:       { type: String, required: true },
        public_id: { type: String },          // Cloudinary public ID
      },
    ],
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    badge: {
      type: String,   // e.g. "Best Seller", "New", "Sale"
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    ratings: {
      average: { type: Number, default: 0 },
      count:   { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// ─── Only return active products by default ────────────────
productSchema.index({ isActive: 1, category: 1 });
productSchema.index({ name: 'text', description: 'text' }); // text search

module.exports = mongoose.model('Product', productSchema);
