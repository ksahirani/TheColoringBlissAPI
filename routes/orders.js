const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const orderController = require('../controllers/orderController');

/**
 * @route   GET /api/orders
 * @desc    Get user's orders
 * @access  Private
 */
router.get('/', protect, orderController.getOrders);

/**
 * @route   GET /api/orders/admin
 * @desc    Get all orders (admin)
 * @access  Private/Admin
 */
router.get('/admin', protect, adminOnly, orderController.getAllOrders);

/**
 * @route   GET /api/orders/admin/stats
 * @desc    Get order statistics (admin)
 * @access  Private/Admin
 */
router.get('/admin/stats', protect, adminOnly, orderController.getOrderStats);

/**
 * @route   GET /api/orders/:id
 * @desc    Get single order
 * @access  Private
 */
router.get('/:id', protect, orderController.getOrder);

/**
 * @route   POST /api/orders
 * @desc    Create new order from cart
 * @access  Private
 */
router.post('/', protect, orderController.createOrder);

/**
 * @route   PUT /api/orders/:id/pay
 * @desc    Update order to paid
 * @access  Private
 */
router.put('/:id/pay', protect, orderController.payOrder);

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status (admin)
 * @access  Private/Admin
 */
router.put('/:id/status', protect, adminOnly, orderController.updateOrderStatus);

/**
 * @route   PUT /api/orders/:id/cancel
 * @desc    Cancel order
 * @access  Private
 */
router.put('/:id/cancel', protect, orderController.cancelOrder);

module.exports = router;