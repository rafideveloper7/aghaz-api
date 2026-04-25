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
const contactMessageRoutes = require('./routes/contactMessage.routes');
const reviewRoutes = require('./routes/review.routes');
const imageRoutes = require('./routes/image.routes');
const blogRoutes = require('./routes/blog.routes');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.cloudinary.com", "https://*"],
      mediaSrc: ["'self'", "blob:", "https://*.cloudinary.com", "https://*"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://*.cloudinary.com"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// CORS configuration
const corsOptions = {
  // Reflect the request origin so browsers accept credentialed requests
  // from any origin.
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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
      footerSocial: '/api/footer-social',
      contactMessages: '/api/contact-messages',
      reviews: '/api/reviews',
      images: '/api/images',
      blogs: '/api/blogs',
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
app.use('/api/contact-messages', contactMessageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/blogs', blogRoutes);

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
