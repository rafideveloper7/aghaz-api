const mongoose = require('mongoose');

// Cache the connection globally so warm serverless invocations reuse both
// the resolved connection and any in-flight connection promise.
const globalCache = global.__mongooseCache || {
  conn: null,
  promise: null,
  listenersAttached: false,
};

global.__mongooseCache = globalCache;

const attachConnectionListeners = () => {
  if (globalCache.listenersAttached) {
    return;
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
    globalCache.conn = null;
    globalCache.promise = null;
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
    globalCache.conn = null;
    globalCache.promise = null;
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
    globalCache.conn = mongoose.connection;
  });

  globalCache.listenersAttached = true;
};

const connectDatabase = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined');
  }

  if (globalCache.conn && mongoose.connection.readyState === 1) {
    return globalCache.conn;
  }

  if (!globalCache.promise) {
    // Set custom DNS servers globally before connecting
    const dns = require('dns');
    dns.setServers(['8.8.8.8', '1.1.1.1']); 

    const options = {
      bufferCommands: false,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      maxPoolSize: 5,
      family: 4,
    };

    globalCache.promise = mongoose.connect(process.env.MONGODB_URI, options);
  }

  try {
    const mongooseInstance = await globalCache.promise;
    globalCache.conn = mongooseInstance.connection;
    attachConnectionListeners();
    console.log(`MongoDB connected: ${globalCache.conn.host}/${globalCache.conn.name}`);
    return globalCache.conn;
  } catch (error) {
    globalCache.promise = null;
    globalCache.conn = null;
    throw error;
  }
};

const isDatabaseConnected = () =>
  Boolean(globalCache.conn) && mongoose.connection.readyState === 1;

const disconnectDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  globalCache.conn = null;
  globalCache.promise = null;
};

module.exports = connectDatabase;
module.exports.isConnected = isDatabaseConnected;
module.exports.disconnect = disconnectDatabase;
