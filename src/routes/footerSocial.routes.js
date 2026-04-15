const express = require('express');
const router = express.Router();
const {
  getSocialLinks,
  getAllSocialLinks,
  createSocialLink,
  updateSocialLink,
  deleteSocialLink,
} = require('../controllers/footerSocialController');
const { protect } = require('../middleware/auth');

// Public
router.get('/', getSocialLinks);

// Admin
router.get('/all', protect, getAllSocialLinks);
router.post('/', protect, createSocialLink);
router.put('/:id', protect, updateSocialLink);
router.delete('/:id', protect, deleteSocialLink);

module.exports = router;
