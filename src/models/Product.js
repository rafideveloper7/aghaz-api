const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    comparePrice: {
      type: Number,
      min: [0, 'Compare price cannot be negative'],
    },
    images: {
      type: [String],
      default: [],
    },
    videoUrl: {
      type: String,
      default: '',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    tags: {
      type: [String],
      default: [],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    sales: {
      type: Number,
      default: 0,
    },
    faqs: [
      {
        question: {
          type: String,
          required: true,
        },
        answer: {
          type: String,
          required: true,
        },
      },
    ],
    benefits: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

productSchema.pre('validate', function (next) {
  if (this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

productSchema.index({ title: 'text', description: 'text', tags: 'text' });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
