const express = require('express');
const router = express.Router();
const {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage,
} = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

// All upload routes require authentication
router.use(protect);

router.post('/image', uploadSingleImage);
router.post('/images', uploadMultipleImages);
router.delete('/:fileId', deleteImage);

module.exports = router;
