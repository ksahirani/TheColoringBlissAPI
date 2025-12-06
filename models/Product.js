const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    trim: true,
    maxlength: 100
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: 2000
  },
  shortDescription: {
    type: String,
    maxlength: 300
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  compareAtPrice: {
    type: Number,
    min: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  productType: {
    type: String,
    enum: ['notebook', 'notepad', 'journal', 'sketchbook', 'planner'],
    required: true
  },
  // Size specifications
  size: {
    name: {
      type: String,
      enum: ['pocket', 'small', 'medium', 'large', 'extra-large', 'custom'],
      required: true
    },
    dimensions: {
      width: { type: Number, required: true }, // in inches
      height: { type: Number, required: true }, // in inches
      depth: { type: Number } // spine thickness in inches
    },
    displayName: String // e.g., "A5", "Letter", "5x8"
  },
  // Paper specifications
  paper: {
    type: {
      type: String,
      enum: ['lined', 'dotted', 'grid', 'blank', 'mixed'],
      required: true
    },
    weight: { type: Number }, // GSM
    color: { type: String, default: 'white' },
    pageCount: { type: Number, required: true }
  },
  // Cover specifications
  cover: {
    type: {
      type: String,
      enum: ['hardcover', 'softcover', 'leather', 'spiral', 'stitched'],
      required: true
    },
    material: String,
    color: String,
    finish: {
      type: String,
      enum: ['matte', 'glossy', 'textured', 'embossed']
    }
  },
  // Binding
  binding: {
    type: String,
    enum: ['perfect', 'spiral', 'wire-o', 'sewn', 'stapled', 'disc'],
    required: true
  },
  // Product images
  images: [{
    url: { type: String, required: true },
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  // Inventory
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  sku: {
    type: String,
    unique: true,
    required: true
  },
  // Additional features
  features: [String],
  tags: [String],
  colors: [{
    name: String,
    hex: String,
    stock: Number
  }],
  // Reviews
  reviews: [reviewSchema],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  // SEO
  metaTitle: String,
  metaDescription: String,
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isNewArrival: {
    type: Boolean,
    default: false
  },
  // Weight for shipping
  weight: {
    type: Number, // in ounces
    required: true
  }
}, {
  timestamps: true
});

// Create slug from name before saving
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Calculate average rating
productSchema.methods.calculateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.averageRating = 0;
    this.reviewCount = 0;
  } else {
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.averageRating = Math.round((sum / this.reviews.length) * 10) / 10;
    this.reviewCount = this.reviews.length;
  }
  return this.save();
};

// Virtual for checking if in stock
productSchema.virtual('inStock').get(function() {
  return this.stock > 0;
});

// Virtual for checking low stock
productSchema.virtual('isLowStock').get(function() {
  return this.stock > 0 && this.stock <= this.lowStockThreshold;
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.compareAtPrice && this.compareAtPrice > this.price) {
    return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
  }
  return 0;
});

// Index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, productType: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'size.name': 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });

// Ensure virtuals are included in JSON output
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);