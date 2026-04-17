const express = require('express');
const router = express.Router();
const { getImages, getImageStats, deleteImage, bulkDeleteImages } = require('../controllers/imageController');
const { protect, adminOnly } = require('../middleware/auth');

// All routes require admin authentication
router.use(protect);
router.use(adminOnly);

router.get('/', getImages);
router.get('/stats', getImageStats);
router.delete('/:fileId', deleteImage);
router.delete('/bulk', bulkDeleteImages);

module.exports = router;
