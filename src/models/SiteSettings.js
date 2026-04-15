const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema(
  {
    logo: {
      type: String,
      default: '',
    },
    logoWidth: {
      type: Number,
      default: 32,
    },
    contactEmail: {
      type: String,
      default: 'support@aghaz.com',
    },
    contactPhone: {
      type: String,
      default: '+92 300 1234567',
    },
    contactAddress: {
      type: String,
      default: 'Lahore, Pakistan',
    },
    whatsappNumber: {
      type: String,
      default: '923001234567',
    },
  },
  {
    timestamps: true,
  }
);

// Only one settings document should exist
siteSettingsSchema.index({ isDefault: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
