const express = require('express');
const router = express.Router();
const {
  getActiveCategories,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createCategoryValidation,
  updateCategoryValidation,
} = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Public route - active categories only
router.get('/', getActiveCategories);

// Admin only routes
router.get('/all', protect, getAllCategories);
router.post('/', protect, createCategoryValidation, validate, createCategory);
router.put('/:id', protect, updateCategoryValidation, validate, updateCategory);
router.delete('/:id', protect, deleteCategory);

module.exports = router;
