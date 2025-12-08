const Category = require('../models/Category');
const Product = require('../models/Product');

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Public
 */
const getCategories = async (req, res) => {
  try {
    // Get all categories
    const categories = await Category.find({ isActive: true })
      .sort('displayOrder name')
      .lean();

    // Structure: return all categories, frontend will handle grouping
    // Also populate parent info for subcategories
    const categoriesWithParent = await Category.find({ isActive: true })
      .sort('displayOrder name')
      .populate('parent', 'name slug')
      .lean();

    res.json({
      success: true,
      data: { categories: categoriesWithParent }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get category by slug with product count
 * @route   GET /api/categories/:slug
 * @access  Public
 */
const getCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true })
      .populate('subcategories');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get product count
    const productCount = await Product.countDocuments({
      category: category._id,
      isActive: true
    });

    res.json({
      success: true,
      data: {
        category: {
          ...category.toObject(),
          productCount
        }
      }
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get category by ID
 * @route   GET /api/categories/id/:id
 * @access  Public
 */
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('subcategories');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get product count
    const productCount = await Product.countDocuments({
      category: category._id,
      isActive: true
    });

    res.json({
      success: true,
      data: {
        category: {
          ...category.toObject(),
          productCount
        }
      }
    });
  } catch (error) {
    console.error('Get category by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Create a new category
 * @route   POST /api/categories
 * @access  Private/Admin
 */
const createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category }
    });
  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Update a category
 * @route   PUT /api/categories/:id
 * @access  Private/Admin
 */
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: { category }
    });
  } catch (error) {
    console.error('Update category error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Delete a category
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
const deleteCategory = async (req, res) => {
  try {
    // Check if category has products
    const productCount = await Product.countDocuments({ category: req.params.id });
    
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${productCount} products. Reassign products first.`
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Reorder categories
 * @route   PUT /api/categories/reorder
 * @access  Private/Admin
 */
const reorderCategories = async (req, res) => {
  try {
    const { orderedIds } = req.body;

    // Update display order for each category
    const updatePromises = orderedIds.map((id, index) => 
      Category.findByIdAndUpdate(id, { displayOrder: index })
    );

    await Promise.all(updatePromises);

    const categories = await Category.find({ isActive: true })
      .sort('displayOrder name')
      .lean();

    res.json({
      success: true,
      message: 'Categories reordered successfully',
      data: { categories }
    });
  } catch (error) {
    console.error('Reorder categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getCategories,
  getCategory,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories
};