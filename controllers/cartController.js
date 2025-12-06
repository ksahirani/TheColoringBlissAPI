const Cart = require('../models/Cart');
const Product = require('../models/Product');

/**
 * @desc    Get user's cart
 * @route   GET /api/cart
 * @access  Private
 */
const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name slug price stock images size');

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    res.json({
      success: true,
      data: { cart }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Add item to cart
 * @route   POST /api/cart
 * @access  Private
 */
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, selectedColor } = req.body;

    // Find product
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Product is not available'
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Not enough stock available'
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Check if item already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId &&
        JSON.stringify(item.selectedColor) === JSON.stringify(selectedColor)
    );

    if (existingItemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: 'Not enough stock available'
        });
      }
      
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        selectedColor,
        price: product.price
      });
    }

    await cart.save();

    // Populate and return
    cart = await Cart.findById(cart._id)
      .populate('items.product', 'name slug price stock images size');

    res.json({
      success: true,
      message: 'Item added to cart',
      data: { cart }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/cart/:itemId
 * @access  Private
 */
const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item._id.toString() === req.params.itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // Check stock
    const product = await Product.findById(cart.items[itemIndex].product);
    
    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: 'Not enough stock available'
      });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    // Populate and return
    cart = await Cart.findById(cart._id)
      .populate('items.product', 'name slug price stock images size');

    res.json({
      success: true,
      message: 'Cart updated',
      data: { cart }
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/:itemId
 * @access  Private
 */
const removeFromCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = cart.items.filter(
      item => item._id.toString() !== req.params.itemId
    );

    await cart.save();

    // Populate and return
    cart = await Cart.findById(cart._id)
      .populate('items.product', 'name slug price stock images size');

    res.json({
      success: true,
      message: 'Item removed from cart',
      data: { cart }
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Clear cart
 * @route   DELETE /api/cart
 * @access  Private
 */
const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [], couponCode: null, discount: 0 }
    );

    res.json({
      success: true,
      message: 'Cart cleared'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Apply coupon code
 * @route   POST /api/cart/coupon
 * @access  Private
 */
const applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Simple coupon logic - in production, you'd have a Coupon model
    const validCoupons = {
      'SAVE10': { type: 'percentage', value: 10 },
      'SAVE20': { type: 'percentage', value: 20 },
      'FLAT5': { type: 'fixed', value: 5 },
      'PAPER10': { type: 'percentage', value: 10 }
    };

    const coupon = validCoupons[couponCode.toUpperCase()];

    if (!coupon) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coupon code'
      });
    }

    // Calculate discount
    await cart.populate('items.product', 'price');
    const subtotal = cart.items.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (subtotal * coupon.value) / 100;
    } else {
      discount = coupon.value;
    }

    cart.couponCode = couponCode.toUpperCase();
    cart.discount = Math.min(discount, subtotal); // Don't exceed subtotal
    await cart.save();

    cart = await Cart.findById(cart._id)
      .populate('items.product', 'name slug price stock images size');

    res.json({
      success: true,
      message: 'Coupon applied successfully',
      data: { cart }
    });
  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Remove coupon code
 * @route   DELETE /api/cart/coupon
 * @access  Private
 */
const removeCoupon = async (req, res) => {
  try {
    let cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { couponCode: null, discount: 0 },
      { new: true }
    ).populate('items.product', 'name slug price stock images size');

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    res.json({
      success: true,
      message: 'Coupon removed',
      data: { cart }
    });
  } catch (error) {
    console.error('Remove coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon
};