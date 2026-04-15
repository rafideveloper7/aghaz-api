const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Announcement text is required'],
      trim: true,
    },
    bgColor: {
      type: String,
      default: '#10b981',
    },
    textColor: {
      type: String,
      default: '#ffffff',
    },
    link: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Announcement', announcementSchema);
