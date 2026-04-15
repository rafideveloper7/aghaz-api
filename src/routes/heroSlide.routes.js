const express = require('express');
const router = express.Router();
const {
  getHeroSlides,
  getAllHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  reorderHeroSlides,
  createHeroSlideValidation,
  updateHeroSlideValidation,
} = require('../controllers/heroSlideController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Public route
router.get('/', getHeroSlides);

// Admin only routes
router.get('/all', protect, getAllHeroSlides);
router.post('/', protect, createHeroSlideValidation, validate, createHeroSlide);
router.put('/:id', protect, updateHeroSlideValidation, validate, updateHeroSlide);
router.put('/reorder', protect, reorderHeroSlides);
router.delete('/:id', protect, deleteHeroSlide);

module.exports = router;
