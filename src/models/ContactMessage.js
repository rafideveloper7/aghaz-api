const mongoose = require('mongoose');

const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;

const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    subject: {
      type: String,
      trim: true,
      default: '',
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + SEVEN_DAYS_IN_MS),
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
  }
);

contactMessageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
