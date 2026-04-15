const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');

// Public
router.get('/', getSettings);

// Admin
router.put('/', protect, updateSettings);

module.exports = router;
