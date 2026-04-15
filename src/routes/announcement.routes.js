const express = require('express');
const router = express.Router();
const {
  getAnnouncement,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncement,
  validation,
} = require('../controllers/announcementController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Public
router.get('/', getAnnouncement);

// Admin
router.get('/all', protect, getAllAnnouncements);
router.post('/', protect, validation, validate, createAnnouncement);
router.put('/:id', protect, updateAnnouncement);
router.put('/:id/toggle', protect, toggleAnnouncement);
router.delete('/:id', protect, deleteAnnouncement);

module.exports = router;
