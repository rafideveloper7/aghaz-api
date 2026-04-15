const express = require('express');
const router = express.Router();
const { login, loginValidation, setupAdmin, setupAdminValidation, seedDatabase } = require('../controllers/authController');
const { validate } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

// Seed database with fake data (development only)
router.post('/seed', seedDatabase);

// Create initial admin (only works if no admin exists)
router.post('/setup', setupAdminValidation, validate, setupAdmin);

// Admin login
router.post('/login', authLimiter, loginValidation, validate, login);

module.exports = router;
