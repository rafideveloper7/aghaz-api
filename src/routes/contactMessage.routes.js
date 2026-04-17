const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const {
  createContactMessage,
  getContactMessages,
  deleteContactMessage,
  createContactMessageValidation,
} = require('../controllers/contactMessageController');

router.post('/', createContactMessageValidation, validate, createContactMessage);
router.get('/', protect, getContactMessages);
router.delete('/:id', protect, deleteContactMessage);

module.exports = router;
