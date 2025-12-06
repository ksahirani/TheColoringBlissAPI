const Product = require('../models/Product');

/**
 * @desc    Get all products with filters, sorting, and pagination
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      sort = '-createdAt',
      category,
      productType,
      size,
      paperType,
      coverType,
      binding,
      minPrice,
      maxPrice,
      search,
      featured,
      newArrivals,
      inStock
    } = req.query;

    // Build query
    const query = { isActive: true };

    // Category filter
    if (category) {
      query.category = category;
    }

    // Product type filter
    if (productType) {
      query.productType = { $in: productType.split(',') };
    }

    // Size filter
    if (size) {
      query['size.name'] = { $in: size.split(',') };
    }

    // Paper type filter
    if (paperType) {
      query['paper.type'] = { $in: paperType.split(',') };
    }

    // Cover type filter
    if (coverType) {
      query['cover.type'] = { $in: coverType.split(',') };
    }

    // Binding filter
    if (binding) {
      query.binding = { $in: binding.split(',') };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Search filter
    if (search) {
      query.$text = { $search: search };
    }

    // Featured filter
    if (featured === 'true') {
      query.isFeatured = true;
    }

    // New arrivals filter
    if (newArrivals === 'true') {
      query.isNewArrival = true;
    }

    // In stock filter
    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get featured products
 * @route   GET /api/products/featured
 * @access  Public
 */
const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true, isFeatured: true })
      .populate('category', 'name slug')
      .limit(8)
      .lean();

    res.json({
      success: true,
      data: { products }
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get new arrival products
 * @route   GET /api/products/new-arrivals
 * @access  Public
 */
const getNewArrivals = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true, isNewArrival: true })
      .populate('category', 'name slug')
      .sort('-createdAt')
      .limit(8)
      .lean();

    res.json({
      success: true,
      data: { products }
    });
  } catch (error) {
    console.error('Get new arrivals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get available filter options
 * @route   GET /api/products/filters
 * @access  Public
 */
const getFilters = async (req, res) => {
  try {
    const [
      productTypes,
      sizes,
      paperTypes,
      coverTypes,
      bindings,
      priceRange
    ] = await Promise.all([
      Product.distinct('productType', { isActive: true }),
      Product.distinct('size.name', { isActive: true }),
      Product.distinct('paper.type', { isActive: true }),
      Product.distinct('cover.type', { isActive: true }),
      Product.distinct('binding', { isActive: true }),
      Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        productTypes,
        sizes,
        paperTypes,
        coverTypes,
        bindings,
        priceRange: priceRange[0] || { minPrice: 0, maxPrice: 100 }
      }
    });
  } catch (error) {
    console.error('Get filters error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get single product by slug
 * @route   GET /api/products/:slug
 * @access  Public
 */
const getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
      .populate('category', 'name slug')
      .populate('reviews.user', 'firstName lastName');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get related products
    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      isActive: true,
      $or: [
        { category: product.category._id },
        { productType: product.productType }
      ]
    })
      .limit(4)
      .lean();

    res.json({
      success: true,
      data: {
        product,
        relatedProducts
      }
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/id/:id
 * @access  Public
 */
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('reviews.user', 'firstName lastName');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private/Admin
 */
const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Update a product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Delete a product (soft delete)
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Add a review to a product
 * @route   POST /api/products/:id/reviews
 * @access  Private
 */
const addReview = async (req, res) => {
  try {
    const { rating, title, comment } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user already reviewed
    const alreadyReviewed = product.reviews.find(
      review => review.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Add review
    product.reviews.push({
      user: req.user._id,
      rating,
      title,
      comment
    });

    // Recalculate average rating
    await product.calculateAverageRating();

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Update a review
 * @route   PUT /api/products/:id/reviews/:reviewId
 * @access  Private
 */
const updateReview = async (req, res) => {
  try {
    const { rating, title, comment } = req.body;
    const { id, reviewId } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const review = product.reviews.id(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns this review
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    // Update review
    review.rating = rating || review.rating;
    review.title = title || review.title;
    review.comment = comment || review.comment;

    await product.calculateAverageRating();

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/products/:id/reviews/:reviewId
 * @access  Private
 */
const deleteReview = async (req, res) => {
  try {
    const { id, reviewId } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const review = product.reviews.id(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns this review or is admin
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    // Remove review
    product.reviews.pull(reviewId);
    await product.calculateAverageRating();

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Upload product images
 * @route   POST /api/products/:id/images
 * @access  Private/Admin
 */
const uploadImages = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Add new images
    const newImages = req.files.map((file, index) => ({
      url: `/uploads/${file.filename}`,
      alt: product.name,
      isPrimary: product.images.length === 0 && index === 0
    }));

    product.images.push(...newImages);
    await product.save();

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      data: { images: product.images }
    });
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Delete a product image
 * @route   DELETE /api/products/:id/images/:imageId
 * @access  Private/Admin
 */
const deleteImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.images = product.images.filter(
      img => img._id.toString() !== imageId
    );

    await product.save();

    res.json({
      success: true,
      message: 'Image deleted successfully',
      data: { images: product.images }
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getProducts,
  getFeaturedProducts,
  getNewArrivals,
  getFilters,
  getProduct,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
  updateReview,
  deleteReview,
  uploadImages,
  deleteImage
};