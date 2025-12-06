const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const cartController = require('../controllers/cartController');

/**
 * @route   GET /api/cart
 * @desc    Get user's cart
 * @access  Private
 */
router.get('/', protect, cartController.getCart);

/**
 * @route   POST /api/cart
 * @desc    Add item to cart
 * @access  Private
 */
router.post('/', protect, cartController.addToCart);

/**
 * @route   PUT /api/cart/:itemId
 * @desc    Update cart item quantity
 * @access  Private
 */
router.put('/:itemId', protect, cartController.updateCartItem);

/**
 * @route   DELETE /api/cart/:itemId
 * @desc    Remove item from cart
 * @access  Private
 */
router.delete('/:itemId', protect, cartController.removeFromCart);

/**
 * @route   DELETE /api/cart
 * @desc    Clear cart
 * @access  Private
 */
router.delete('/', protect, cartController.clearCart);

/**
 * @route   POST /api/cart/coupon
 * @desc    Apply coupon code
 * @access  Private
 */
router.post('/coupon', protect, cartController.applyCoupon);

/**
 * @route   DELETE /api/cart/coupon
 * @desc    Remove coupon code
 * @access  Private
 */
router.delete('/coupon', protect, cartController.removeCoupon);

module.exports = router;