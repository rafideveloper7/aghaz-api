const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .notEmpty()
    .withMessage('Email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json(
      ApiResponse.error('Invalid email or password', 401)
    );
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json(
      ApiResponse.error('Invalid email or password', 401)
    );
  }

  const token = generateToken(user._id);

  res.status(200).json(
    ApiResponse.success('Login successful', {
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    })
  );
});

// Validation for admin setup
const setupAdminValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .notEmpty()
    .withMessage('Email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

// Create initial admin user (only if none exists)
const setupAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if any admin already exists
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    return res.status(400).json(
      ApiResponse.error('Admin user already exists. Use the login endpoint.', 400)
    );
  }

  const user = await User.create({
    email: email.toLowerCase(),
    password,
    role: 'admin',
  });

  res.status(201).json(
    ApiResponse.success('Admin user created successfully', {
      id: user._id,
      email: user.email,
      role: user.role,
    })
  );
});

module.exports = {
  login,
  loginValidation,
  setupAdmin,
  setupAdminValidation,
  seedDatabase: async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json(ApiResponse.error('Seed is disabled in production', 403));
    }
    try {
      const { run } = require('../scripts/seed');
      const result = await run();
      res.status(200).json(ApiResponse.success('Database seeded successfully', result));
    } catch (err) {
      res.status(500).json(ApiResponse.error('Seeding failed: ' + err.message, 500));
    }
  },
};
