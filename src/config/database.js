const mongoose = require('mongoose');

const connectDatabase = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('⚠️  MONGODB_URI is not set in your .env file. Please add it and restart.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDatabase;
