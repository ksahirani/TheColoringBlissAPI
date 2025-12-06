const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// PayMongo API configuration
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const PAYMONGO_API_URL = 'https://api.paymongo.com/v1';

// Helper function to make PayMongo API calls
const paymongoRequest = async (endpoint, method = 'GET', data = null) => {
  const options = {
    method,
    headers: {
      'Authorization': `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64')}`,
      'Content-Type': 'application/json'
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${PAYMONGO_API_URL}${endpoint}`, options);
  return response.json();
};

/**
 * @route   POST /api/payments/create-checkout
 * @desc    Create PayMongo checkout session
 * @access  Private
 */
router.post('/create-checkout', protect, async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Calculate totals
    const subtotal = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shipping = subtotal >= 1500 ? 0 : 99;
    const tax = Math.round(subtotal * 0.12 * 100) / 100;
    const discount = cart.discount || 0;
    const total = Math.round((subtotal + shipping + tax - discount) * 100) / 100;

    // Prepare line items for PayMongo
    const lineItems = cart.items.map(item => ({
      currency: 'PHP',
      amount: Math.round(item.price * 100), // PayMongo expects amount in centavos
      name: item.product.name,
      quantity: item.quantity,
      description: item.product.shortDescription || item.product.name
    }));

    // Add shipping as line item if not free
    if (shipping > 0) {
      lineItems.push({
        currency: 'PHP',
        amount: shipping * 100,
        name: 'Shipping Fee',
        quantity: 1
      });
    }

    // Add tax as line item
    if (tax > 0) {
      lineItems.push({
        currency: 'PHP',
        amount: Math.round(tax * 100),
        name: 'VAT (12%)',
        quantity: 1
      });
    }

    // Determine payment method types based on selected method
    let paymentMethodTypes = ['card', 'gcash', 'grab_pay', 'paymaya'];
    if (paymentMethod === 'gcash') {
      paymentMethodTypes = ['gcash'];
    } else if (paymentMethod === 'maya') {
      paymentMethodTypes = ['paymaya'];
    } else if (paymentMethod === 'card') {
      paymentMethodTypes = ['card'];
    }

    // Create order first (in pending state)
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      name: item.product.name,
      sku: item.product.sku,
      quantity: item.quantity,
      price: item.price,
      selectedColor: item.selectedColor,
      image: item.product.images[0]?.url
    }));

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      billingAddress: shippingAddress,
      paymentMethod,
      subtotal,
      shippingCost: shipping,
      tax,
      discount,
      couponCode: cart.couponCode,
      total,
      status: 'pending'
    });

    // Create PayMongo checkout session
    const checkoutData = {
      data: {
        attributes: {
          billing: {
            name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
            email: req.user.email,
            phone: shippingAddress.phone
          },
          line_items: lineItems,
          payment_method_types: paymentMethodTypes,
          success_url: `${process.env.FRONTEND_URL}/checkout/success?order_id=${order._id}`,
          cancel_url: `${process.env.FRONTEND_URL}/checkout?cancelled=true`,
          description: `Order #${order.orderNumber}`,
          reference_number: order.orderNumber
        }
      }
    };

    const checkoutSession = await paymongoRequest('/checkout_sessions', 'POST', checkoutData);

    if (checkoutSession.errors) {
      // Delete the pending order if checkout creation fails
      await Order.findByIdAndDelete(order._id);
      return res.status(400).json({
        success: false,
        message: checkoutSession.errors[0]?.detail || 'Failed to create checkout session'
      });
    }

    // Update order with checkout session ID
    order.paymentResult = {
      id: checkoutSession.data.id,
      status: 'pending'
    };
    await order.save();

    res.json({
      success: true,
      data: {
        checkoutUrl: checkoutSession.data.attributes.checkout_url,
        orderId: order._id,
        sessionId: checkoutSession.data.id
      }
    });

  } catch (error) {
    console.error('Create checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route   POST /api/payments/verify
 * @desc    Verify payment and update order
 * @access  Private
 */
router.post('/verify', protect, async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Get checkout session from PayMongo
    const sessionId = order.paymentResult?.id;
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'No payment session found'
      });
    }

    const session = await paymongoRequest(`/checkout_sessions/${sessionId}`);

    if (session.data?.attributes?.payment_intent?.attributes?.status === 'succeeded' ||
        session.data?.attributes?.payments?.[0]?.attributes?.status === 'paid') {
      
      // Payment successful - update order
      order.isPaid = true;
      order.paidAt = new Date();
      order.status = 'confirmed';
      order.paymentResult = {
        id: sessionId,
        status: 'paid',
        updateTime: new Date().toISOString()
      };
      order.statusHistory.push({
        status: 'confirmed',
        note: 'Payment received via PayMongo'
      });

      await order.save();

      // Update product stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity }
        });
      }

      // Clear user's cart
      await Cart.findOneAndUpdate(
        { user: req.user._id },
        { items: [], couponCode: null, discount: 0 }
      );

      return res.json({
        success: true,
        data: { order, paymentStatus: 'paid' }
      });
    }

    res.json({
      success: true,
      data: { 
        order, 
        paymentStatus: session.data?.attributes?.payment_intent?.attributes?.status || 'pending'
      }
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route   POST /api/payments/webhook
 * @desc    PayMongo webhook for payment events
 * @access  Public (verified by signature)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const event = req.body;

    // Handle different event types
    if (event.data?.attributes?.type === 'checkout_session.payment.paid') {
      const checkoutSessionId = event.data?.attributes?.data?.id;
      
      // Find order by checkout session ID
      const order = await Order.findOne({ 'paymentResult.id': checkoutSessionId });
      
      if (order && !order.isPaid) {
        order.isPaid = true;
        order.paidAt = new Date();
        order.status = 'confirmed';
        order.paymentResult.status = 'paid';
        order.statusHistory.push({
          status: 'confirmed',
          note: 'Payment confirmed via webhook'
        });

        await order.save();

        // Update product stock
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.quantity }
          });
        }

        // Clear user's cart
        await Cart.findOneAndUpdate(
          { user: order.user },
          { items: [], couponCode: null, discount: 0 }
        );
      }
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
});

/**
 * @route   POST /api/payments/cod
 * @desc    Create Cash on Delivery order
 * @access  Private
 */
router.post('/cod', protect, async (req, res) => {
  try {
    const { shippingAddress } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Verify stock and prepare order items
    const orderItems = [];
    for (const item of cart.items) {
      const product = item.product;

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is no longer available`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${product.name}`
        });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        quantity: item.quantity,
        price: item.price,
        selectedColor: item.selectedColor,
        image: product.images[0]?.url
      });
    }

    // Calculate totals
    const subtotal = orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shipping = subtotal >= 1500 ? 0 : 99;
    const tax = Math.round(subtotal * 0.12 * 100) / 100;
    const discount = cart.discount || 0;
    const total = Math.round((subtotal + shipping + tax - discount) * 100) / 100;

    // Generate order number
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await Order.countDocuments();
    const orderNumber = `CB${year}${month}-${(count + 1).toString().padStart(5, '0')}`;

    // Create order using new + save to trigger pre-save hooks
    const order = new Order({
      orderNumber,
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      billingAddress: shippingAddress,
      paymentMethod: 'cod',
      subtotal,
      shippingCost: shipping,
      tax,
      discount,
      couponCode: cart.couponCode,
      total,
      status: 'confirmed',
      statusHistory: [{
        status: 'confirmed',
        note: 'Cash on Delivery order placed'
      }]
    });

    await order.save();

    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    // Clear cart
    cart.items = [];
    cart.couponCode = null;
    cart.discount = 0;
    await cart.save();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: { order }
    });

  } catch (error) {
    console.error('COD order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;