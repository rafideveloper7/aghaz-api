const mongoose = require('mongoose');

const footerSocialSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      required: true,
      enum: ['facebook', 'instagram', 'twitter', 'youtube', 'tiktok', 'pinterest', 'linkedin', 'whatsapp'],
    },
    label: {
      type: String,
      default: '',
    },
    url: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

footerSocialSchema.index({ sortOrder: 1 });

module.exports = mongoose.model('FooterSocial', footerSocialSchema);
