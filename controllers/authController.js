const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      populate: { path: 'category', select: 'name slug' }
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          addresses: user.addresses,
          wishlist: user.wishlist,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/auth/me
 * @access  Private
 */
const updateMe = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, phone },
      { new: true, runValidators: true }
    ).populate({
      path: 'wishlist',
      populate: { path: 'category', select: 'name slug' }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          addresses: user.addresses,
          wishlist: user.wishlist,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Update password
 * @route   PUT /api/auth/password
 * @access  Private
 */
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Add new address
 * @route   POST /api/auth/address
 * @access  Private
 */
const addAddress = async (req, res) => {
  try {
    const { label, firstName, lastName, street, city, state, zipCode, country, phone, isDefault } = req.body;

    const user = await User.findById(req.user._id);

    // If this is default, remove default from other addresses
    if (isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    user.addresses.push({
      label: label || 'Home',
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      street,
      city,
      state,
      zipCode,
      country: country || 'Philippines',
      phone: phone || user.phone,
      isDefault: isDefault || user.addresses.length === 0
    });

    await user.save();

    // Populate wishlist before returning
    await user.populate('wishlist');

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: { 
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          addresses: user.addresses,
          wishlist: user.wishlist,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Update an address
 * @route   PUT /api/auth/address/:addressId
 * @access  Private
 */
const updateAddress = async (req, res) => {
  try {
    const { label, firstName, lastName, street, city, state, zipCode, country, phone, isDefault } = req.body;
    const { addressId } = req.params;

    const user = await User.findById(req.user._id);

    const addressIndex = user.addresses.findIndex(
      addr => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // If setting as default, remove default from others
    if (isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // Update the address
    const currentAddr = user.addresses[addressIndex];
    user.addresses[addressIndex] = {
      ...currentAddr.toObject(),
      label: label !== undefined ? label : currentAddr.label,
      firstName: firstName !== undefined ? firstName : currentAddr.firstName,
      lastName: lastName !== undefined ? lastName : currentAddr.lastName,
      street: street !== undefined ? street : currentAddr.street,
      city: city !== undefined ? city : currentAddr.city,
      state: state !== undefined ? state : currentAddr.state,
      zipCode: zipCode !== undefined ? zipCode : currentAddr.zipCode,
      country: country !== undefined ? country : currentAddr.country,
      phone: phone !== undefined ? phone : currentAddr.phone,
      isDefault: isDefault !== undefined ? isDefault : currentAddr.isDefault
    };

    await user.save();

    // Populate wishlist before returning
    await user.populate('wishlist');

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: { 
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          addresses: user.addresses,
          wishlist: user.wishlist,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Delete address
 * @route   DELETE /api/auth/address/:addressId
 * @access  Private
 */
const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    user.addresses = user.addresses.filter(
      addr => addr._id.toString() !== req.params.addressId
    );

    await user.save();

    // Populate wishlist before returning
    await user.populate('wishlist');

    res.json({
      success: true,
      message: 'Address deleted successfully',
      data: { 
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          addresses: user.addresses,
          wishlist: user.wishlist,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get user's wishlist
 * @route   GET /api/auth/wishlist
 * @access  Private
 */
const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      populate: { path: 'category', select: 'name slug' }
    });

    res.json({
      success: true,
      data: { wishlist: user.wishlist }
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Add product to wishlist
 * @route   POST /api/auth/wishlist
 * @access  Private
 */
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.user._id);

    if (user.wishlist.includes(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Product already in wishlist'
      });
    }

    user.wishlist.push(productId);
    await user.save();

    // Populate wishlist with product details
    await user.populate({
      path: 'wishlist',
      populate: { path: 'category', select: 'name slug' }
    });

    res.json({
      success: true,
      message: 'Product added to wishlist',
      data: { wishlist: user.wishlist }
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Remove product from wishlist
 * @route   DELETE /api/auth/wishlist/:productId
 * @access  Private
 */
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);

    user.wishlist = user.wishlist.filter(
      id => id.toString() !== productId
    );
    await user.save();

    // Populate wishlist with product details
    await user.populate({
      path: 'wishlist',
      populate: { path: 'category', select: 'name slug' }
    });

    res.json({
      success: true,
      message: 'Product removed from wishlist',
      data: { wishlist: user.wishlist }
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateMe,
  updatePassword,
  addAddress,
  updateAddress,
  deleteAddress,
  getWishlist,
  addToWishlist,
  removeFromWishlist
};