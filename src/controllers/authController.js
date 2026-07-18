const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ======================
//  SIMPLE DIRECT LOGIN
// ======================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find admin user
    const user = await User.findOne({ email }).select('+password');

    if (!user || user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // DIRECT plain text password comparison (no salt, no hash)
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

// ======================
//  Keep your existing middleware
// ======================
const protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login.',
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Token is invalid.',
        });
      }
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please login again.',
      });
    }
  } catch (error) {
    next(error);
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.',
    });
  }
};

// ======================
//  Stub the other functions your route expects
// ======================
const loginValidation = (req, res, next) => next(); // placeholder
const setupAdminValidation = (req, res, next) => next();

const setupAdmin = async (req, res) => {
  return res.status(400).json({
    success: false,
    message: 'Setup admin is disabled. Use your existing admin in DB.',
  });
};

const seedDatabase = async (req, res) => {
  return res.status(400).json({
    success: false,
    message: 'Seeding disabled in this simplified version.',
  });
};

module.exports = { 
  login, 
  loginValidation, 
  setupAdmin, 
  setupAdminValidation, 
  seedDatabase,
  protect, 
  adminOnly 
};
