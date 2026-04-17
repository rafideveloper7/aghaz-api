const express = require('express');
const router = express.Router();
const {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage,
} = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

// Public route for review image uploads (no auth required)
router.post('/review-image', uploadSingleImage);

// All other upload routes require authentication
router.use(protect);

router.post('/image', uploadSingleImage);
router.post('/images', uploadMultipleImages);
router.delete('/:fileId', deleteImage);

module.exports = router;
