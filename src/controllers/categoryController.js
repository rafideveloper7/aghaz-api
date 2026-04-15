const { body } = require('express-validator');
const Category = require('../models/Category');
const Product = require('../models/Product');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createCategoryValidation = [
  body('name').notEmpty().withMessage('Category name is required').trim(),
  body('description').optional().trim(),
];

const updateCategoryValidation = [
  body('name').optional().notEmpty().withMessage('Category name cannot be empty').trim(),
  body('description').optional().trim(),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

const getActiveCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .sort({ name: 1 })
    .lean();

  // Add product count to each category
  const categoriesWithCount = await Promise.all(
    categories.map(async (category) => {
      const productCount = await Product.countDocuments({ category: category._id });
      return { ...category, productCount };
    })
  );

  res.status(200).json(
    ApiResponse.success('Categories retrieved successfully', categoriesWithCount)
  );
});

const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find()
    .sort({ name: 1 })
    .lean();

  // Add product count to each category
  const categoriesWithCount = await Promise.all(
    categories.map(async (category) => {
      const productCount = await Product.countDocuments({ category: category._id });
      return { ...category, productCount };
    })
  );

  res.status(200).json(
    ApiResponse.success('Categories retrieved successfully', categoriesWithCount)
  );
});

const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    return res.status(400).json(
      ApiResponse.error('A category with this name already exists', 400)
    );
  }

  const category = await Category.create(req.body);

  res.status(201).json(
    ApiResponse.success('Category created successfully', category)
  );
});

const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // If name is being updated, check for duplicates
  if (req.body.name) {
    const existingCategory = await Category.findOne({ name: req.body.name, _id: { $ne: id } });
    if (existingCategory) {
      return res.status(400).json(
        ApiResponse.error('A category with this name already exists', 400)
      );
    }
  }

  const category = await Category.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    return res.status(404).json(
      ApiResponse.error('Category not found', 404)
    );
  }

  res.status(200).json(
    ApiResponse.success('Category updated successfully', category)
  );
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if category has products
  const productCount = await Product.countDocuments({ category: id });
  if (productCount > 0) {
    return res.status(400).json(
      ApiResponse.error('Cannot delete category with existing products', 400)
    );
  }

  const category = await Category.findByIdAndDelete(id);

  if (!category) {
    return res.status(404).json(
      ApiResponse.error('Category not found', 404)
    );
  }

  res.status(200).json(
    ApiResponse.success('Category deleted successfully')
  );
});

module.exports = {
  getActiveCategories,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createCategoryValidation,
  updateCategoryValidation,
};
