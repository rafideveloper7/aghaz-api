const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductValidation,
  updateProductValidation,
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Public routes
router.get('/', getProducts);
router.get('/:slug', getProductBySlug);

// Admin only routes
router.get('/id/:id', protect, getProductById);
router.post('/', protect, createProductValidation, validate, createProduct);
router.put('/:id', protect, updateProductValidation, validate, updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
