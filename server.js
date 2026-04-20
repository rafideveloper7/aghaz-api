// Load environment variables FIRST — before any other imports
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const app = require('./src/app');

// For Vercel serverless environment
if (process.env.VERCEL) {
  // Just export the app for serverless
  module.exports = app;
} else {
  // Local development
  const connectDatabase = require('./src/config/database');
  
  const startServer = async () => {
    try {
      // Connect to database
      await connectDatabase();
      
      const PORT = process.env.PORT || 5000;
      
      const server = app.listen(PORT, () => {
        console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
        console.log(`📍 http://localhost:${PORT}`);
        console.log(`📝 Health check: http://localhost:${PORT}/health`);
      });
      
      // Handle unhandled promise rejections
      process.on('unhandledRejection', (err) => {
        console.error('❌ Unhandled Rejection:', err);
        server.close(() => process.exit(1));
      });
      
      // Handle uncaught exceptions
      process.on('uncaughtException', (err) => {
        console.error('❌ Uncaught Exception:', err);
        process.exit(1);
      });
      
      // Graceful shutdown
      process.on('SIGTERM', () => {
        console.log('🛑 SIGTERM received. Shutting down gracefully...');
        server.close(() => {
          console.log('Process terminated');
          process.exit(0);
        });
      });
      
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  };
  
  startServer();
}