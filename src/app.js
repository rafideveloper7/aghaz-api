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
if (process.env.CLIENT_URL) {
  // Support comma-separated list of URLs
  const urls = process.env.CLIENT_URL.split(',').map(url => url.trim());
  allowedOrigins.push(...urls);
}

// Allow localhost patterns in development
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:3000');
  allowedOrigins.push('http://localhost:3001');
  allowedOrigins.push('http://127.0.0.1:3000');
  allowedOrigins.push('http://127.0.0.1:3001');
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use(generalLimiter);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Aghaz API is running',
    timestamp: new Date().toISOString(),
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
