const mongoose = require('mongoose');

// Cache the connection for serverless
let isConnected = false;

const connectDatabase = async () => {
  // Return if already connected
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('📦 Using existing database connection');
    return;
  }

  if (!process.env.MONGODB_URI) {
    console.error('⚠️ MONGODB_URI is not set in environment variables');
    throw new Error('MONGODB_URI is not defined');
  }

  try {
    // For serverless, use optimized options
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      bufferCommands: false,
      bufferMaxEntries: 0,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 1, // Important for serverless
      serverSelectionTimeoutMS: 10000,
      family: 4, // Use IPv4, skip trying IPv6
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, opts);
    isConnected = conn.connection.readyState === 1;
    
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    
    // Handle connection errors after initial connection
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('📴 MongoDB disconnected');
      isConnected = false;
    });
    
    // Handle reconnection
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
      isConnected = true;
    });
    
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    isConnected = false;
    throw error; // Don't exit process, throw error instead
  }
};

// Helper to check connection status
const isDatabaseConnected = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

// Helper to disconnect (useful for testing)
const disconnectDatabase = async () => {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('📴 Database disconnected');
  }
};

module.exports = connectDatabase;
module.exports.isConnected = isDatabaseConnected;
module.exports.disconnect = disconnectDatabase;