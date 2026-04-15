const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getDashboardStats,
  createOrderValidation,
  updateOrderStatusValidation,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Public route - customers can create orders
router.post('/', createOrderValidation, validate, createOrder);

// Admin only routes
router.get('/', protect, getOrders);
router.get('/stats', protect, getDashboardStats);
router.get('/:id', protect, getOrderById);
router.put('/:id', protect, updateOrderStatusValidation, validate, updateOrderStatus);
router.delete('/:id', protect, deleteOrder);

module.exports = router;
