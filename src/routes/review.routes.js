const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  createReview,
  getAllReviews,
  approveReview,
  deleteReview,
  getReviewStats,
} = require('../controllers/reviewController');
const { protect, adminOnly } = require('../middleware/auth');

// Public routes
router.get('/product/:productId', getProductReviews);
router.post('/', createReview);

// Admin routes
router.use(protect);
router.use(adminOnly);
router.get('/', getAllReviews);
router.get('/stats', getReviewStats);
router.put('/:id/approve', approveReview);
router.delete('/:id', deleteReview);

module.exports = router;
