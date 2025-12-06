const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const productController = require('../controllers/productController');

/**
 * @route   GET /api/products
 * @desc    Get all products with filters, sorting, and pagination
 * @access  Public
 */
router.get('/', productController.getProducts);

/**
 * @route   GET /api/products/featured
 * @desc    Get featured products
 * @access  Public
 */
router.get('/featured', productController.getFeaturedProducts);

/**
 * @route   GET /api/products/new-arrivals
 * @desc    Get new arrival products
 * @access  Public
 */
router.get('/new-arrivals', productController.getNewArrivals);

/**
 * @route   GET /api/products/filters
 * @desc    Get available filter options
 * @access  Public
 */
router.get('/filters', productController.getFilters);

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Private/Admin
 */
router.post('/', protect, adminOnly, productController.createProduct);

/**
 * @route   GET /api/products/id/:id
 * @desc    Get single product by ID
 * @access  Public
 */
router.get('/id/:id', productController.getProductById);

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product
 * @access  Private/Admin
 */
router.put('/:id', protect, adminOnly, productController.updateProduct);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product (soft delete)
 * @access  Private/Admin
 */
router.delete('/:id', protect, adminOnly, productController.deleteProduct);

/**
 * @route   GET /api/products/:slug
 * @desc    Get single product by slug
 * @access  Public
 */
router.get('/:slug', productController.getProduct);

/**
 * @route   POST /api/products/:id/reviews
 * @desc    Add a review to a product
 * @access  Private
 */
router.post('/:id/reviews', protect, productController.addReview);

/**
 * @route   PUT /api/products/:id/reviews/:reviewId
 * @desc    Update a review
 * @access  Private
 */
router.put('/:id/reviews/:reviewId', protect, productController.updateReview);

/**
 * @route   DELETE /api/products/:id/reviews/:reviewId
 * @desc    Delete a review
 * @access  Private
 */
router.delete('/:id/reviews/:reviewId', protect, productController.deleteReview);

module.exports = router;