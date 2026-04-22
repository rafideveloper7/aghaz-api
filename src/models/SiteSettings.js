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
    // Page hero customizations
    newArrivalsHero: {
      title: { type: String, default: 'New Arrivals' },
      subtitle: { type: String, default: 'Be the first to discover our latest collection' },
      bgColor: { type: String, default: '#7c3aed' },
      bgGradient: { type: String, default: 'from-violet-600 via-purple-600 to-fuchsia-600' },
      image: { type: String, default: '' },
    },
    dealsHero: {
      title: { type: String, default: 'Flash Deals' },
      subtitle: { type: String, default: 'Grab these amazing deals before they are gone!' },
      bgColor: { type: String, default: '#ea580c' },
      bgGradient: { type: String, default: 'from-red-600 via-orange-500 to-yellow-500' },
      image: { type: String, default: '' },
      timerEndTime: { type: String, default: '' },
    },
    aboutHero: {
      title: { type: String, default: 'About Aghaz' },
      subtitle: { type: String, default: 'Your trusted destination for premium smart gadgets' },
      bgColor: { type: String, default: '#111827' },
      bgGradient: { type: String, default: 'from-gray-900 via-gray-800 to-emerald-900' },
      image: { type: String, default: '' },
    },
  },
   {
     timestamps: true,
   }
);

// Only one settings document should exist
siteSettingsSchema.index({ isDefault: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
