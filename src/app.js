const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const errorHandler = require('./middleware/error');
const { generalLimiter } = require('./middleware/rateLimiter');
const ensureDatabaseConnection = require('./middleware/database');

// Import routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const orderRoutes = require('./routes/order.routes');
const uploadRoutes = require('./routes/upload.routes');
const heroSlideRoutes = require('./routes/heroSlide.routes');
const announcementRoutes = require('./routes/announcement.routes');
const settingsRoutes = require('./routes/settings.routes');
const footerSocialRoutes = require('./routes/footerSocial.routes');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [];

// Add production origins from environment variable
if (process.env.CLIENT_URL) {
  // Support comma-separated list of URLs
  const urls = process.env.CLIENT_URL.split(',').map(url => url.trim());
  allowedOrigins.push(...urls);
}

// Add Vercel preview deployments (dynamic)
if (process.env.VERCEL_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
}

// Allow localhost patterns in development
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:3000');
  allowedOrigins.push('http://localhost:3001');
  allowedOrigins.push('http://127.0.0.1:3000');
  allowedOrigins.push('http://127.0.0.1:3001');
  allowedOrigins.push('http://localhost:5000');
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }
      
      // Check if origin is allowed
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // In development, log the blocked origin for debugging
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`CORS blocked origin: ${origin}`);
        }
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  })
);

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Logging middleware (disable in production or use minimal logging)
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
} else if (process.env.NODE_ENV === 'production') {
  // Minimal logging for production
  app.use(morgan('tiny'));
}

// Apply database connection middleware BEFORE routes
// This ensures DB is connected before handling any API request
app.use(ensureDatabaseConnection);

// Rate limiting (apply after DB connection check)
app.use(generalLimiter);

// Health check route (no DB connection required)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Aghaz API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Aghaz API',
    documentation: '/api/docs',
    endpoints: {
      admin: '/api/admin',
      products: '/api/products',
      categories: '/api/categories',
      orders: '/api/orders',
      upload: '/api/upload',
      heroSlides: '/api/hero-slides',
      announcement: '/api/announcement',
      settings: '/api/settings',
      footerSocial: '/api/footer-social'
    },
    health: '/health'
  });
});

// API routes
app.use('/api/admin', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/hero-slides', heroSlideRoutes);
app.use('/api/announcement', announcementRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/footer-social', footerSocialRoutes);

// 404 handler - for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    statusCode: 404
  });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;