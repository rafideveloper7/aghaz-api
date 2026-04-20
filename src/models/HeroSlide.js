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
    // Media (supports images, videos, gifs)
    mediaType: {
      type: String,
      enum: ['image', 'video', 'gif'],
      default: 'image',
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    // Legacy image support
    image: {
      type: String,
      default: '',
    },
    mobileBg: {
      type: String,
      default: '',
    },
    desktopBg: {
      type: String,
      default: '',
    },
    // Right side hero content
    rightSideMediaType: {
      type: String,
      enum: ['image', 'video', 'gif', 'card', 'none'],
      default: 'image',
    },
    rightSideMediaUrl: {
      type: String,
      default: '',
    },
    rightSideCardTitle: {
      type: String,
      default: '',
    },
    rightSideCardSubtitle: {
      type: String,
      default: '',
    },
    // Custom text styling
    titleColor: {
      type: String,
      default: '#ffffff',
    },
    subtitleColor: {
      type: String,
      default: '#ffffffc4',
    },
    titleFontSize: {
      type: Number,
      default: 64,
    },
    subtitleFontSize: {
      type: Number,
      default: 18,
    },
    // Hero height control
    heroHeight: {
      type: Number,
      default: 720,
    },
    mobileHeroHeight: {
      type: Number,
      default: 560,
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
