const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const categoryController = require('../controllers/categoryController');

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/', categoryController.getCategories);

/**
 * @route   GET /api/categories/id/:id
 * @desc    Get category by ID
 * @access  Public
 */
router.get('/id/:id', categoryController.getCategoryById);

/**
 * @route   GET /api/categories/:slug
 * @desc    Get category by slug with product count
 * @access  Public
 */
router.get('/:slug', categoryController.getCategory);

/**
 * @route   POST /api/categories
 * @desc    Create a new category
 * @access  Private/Admin
 */
router.post('/', protect, adminOnly, categoryController.createCategory);

/**
 * @route   PUT /api/categories/reorder
 * @desc    Reorder categories
 * @access  Private/Admin
 */
router.put('/reorder', protect, adminOnly, categoryController.reorderCategories);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update a category
 * @access  Private/Admin
 */
router.put('/:id', protect, adminOnly, categoryController.updateCategory);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete a category
 * @access  Private/Admin
 */
router.delete('/:id', protect, adminOnly, categoryController.deleteCategory);

module.exports = router;