const connectDatabase = require('../config/database');

// Middleware to ensure database is connected before each request
const ensureDatabaseConnection = async (req, res, next) => {
  try {
    // Skip database connection for health check and root route
    if (req.path === '/health' || req.path === '/') {
      return next();
    }
    
    // Connect to database (uses cached connection)
    await connectDatabase();
    next();
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable. Database connection failed.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      statusCode: 503
    });
  }
};

module.exports = ensureDatabaseConnection;