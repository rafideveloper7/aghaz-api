const express = require('express');
const router = express.Router();
const {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage,
} = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

// Public routes for customer uploads (no auth required)
router.post('/review-image', uploadSingleImage);
router.post('/payment-proof', uploadSingleImage);

// All other upload routes require authentication
router.use(protect);

router.post('/image', uploadSingleImage);
router.post('/images', uploadMultipleImages);
router.delete('/:fileId', deleteImage);

module.exports = router;
