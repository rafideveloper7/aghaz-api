const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['cod', 'wallet', 'bank', 'other'],
      default: 'other',
    },
    accountTitle: {
      type: String,
      default: '',
      trim: true,
    },
    accountNumber: {
      type: String,
      default: '',
      trim: true,
    },
    iban: {
      type: String,
      default: '',
      trim: true,
    },
    instructions: {
      type: String,
      default: '',
      trim: true,
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
  { _id: false }
);

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
    workingHours: {
      type: String,
      default: 'Mon - Sat: 9AM - 9PM',
    },
    formSubmitEmail: {
      type: String,
      default: 'support@aghaz.com',
    },
    orderSuccessMessage: {
      type: String,
      default: 'Thank you for your order! We will contact you shortly to confirm your order details.',
    },
     paymentMethods: {
       type: [paymentMethodSchema],
       default: [
         {
           code: 'cod',
           label: 'Cash on Delivery',
           type: 'cod',
           instructions: 'Pay when you receive your order.',
           isActive: true,
           sortOrder: 0,
         },
       ],
     },
     reviewsEnabled: {
       type: Boolean,
       default: true,
     },
     reviewsRequireApproval: {
       type: Boolean,
       default: true,
     },
   },
   {
     timestamps: true,
   }
);

// Only one settings document should exist
siteSettingsSchema.index({ isDefault: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
