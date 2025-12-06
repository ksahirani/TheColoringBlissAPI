const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const authController = require('../controllers/authController');

// Validation middleware
const validateRegistration = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const validatePassword = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

// Validation error handler middleware
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// Public routes
router.post('/register', validateRegistration, handleValidation, authController.register);
router.post('/login', validateLogin, handleValidation, authController.login);

// Protected routes - Profile
router.get('/me', protect, authController.getMe);
router.put('/me', protect, authController.updateMe);
router.put('/password', protect, validatePassword, handleValidation, authController.updatePassword);

// Protected routes - Addresses
router.post('/address', protect, authController.addAddress);
router.put('/address/:addressId', protect, authController.updateAddress);
router.delete('/address/:addressId', protect, authController.deleteAddress);

// Protected routes - Wishlist
router.post('/wishlist/:productId', protect, authController.addToWishlist);
router.delete('/wishlist/:productId', protect, authController.removeFromWishlist);

module.exports = router;