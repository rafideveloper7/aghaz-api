const mongoose = require('mongoose');

const heroSlideSchema = new mongoose.Schema(
  {
    // Main/Fallback content
    title: {
      type: String,
      required: [true, 'Slide title is required'],
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
      default: '',
    },
    ctaText: {
      type: String,
      default: 'Shop Now',
    },
    ctaLink: {
      type: String,
      default: '/shop',
    },
    // Images
    image: {
      type: String,
      required: [true, 'Slide image is required'],
    },
    mobileBg: {
      type: String,
      default: '',
    },
    desktopBg: {
      type: String,
      default: '',
    },
    // Mobile-specific content
    mobileTitle: {
      type: String,
      trim: true,
      default: '',
    },
    mobileSubtitle: {
      type: String,
      trim: true,
      default: '',
    },
    mobileCtaText: {
      type: String,
      default: '',
    },
    mobileCtaLink: {
      type: String,
      default: '',
    },
    // Desktop-specific content
    desktopTitle: {
      type: String,
      trim: true,
      default: '',
    },
    desktopSubtitle: {
      type: String,
      trim: true,
      default: '',
    },
    desktopCtaText: {
      type: String,
      default: '',
    },
    desktopCtaLink: {
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

heroSlideSchema.index({ sortOrder: 1, isActive: 1 });

module.exports = mongoose.model('HeroSlide', heroSlideSchema);
