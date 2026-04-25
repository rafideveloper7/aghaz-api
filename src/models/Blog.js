const mongoose = require('mongoose');
const slugify = require('slugify');

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    excerpt: {
      type: String,
      required: [true, 'Blog excerpt is required'],
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
    },
    content: {
      type: String,
      required: [true, 'Blog content is required'],
    },
    featuredImage: {
      type: String,
      required: [true, 'Featured image is required'],
    },
    gallery: {
      type: [String],
      default: [],
    },
    author: {
      name: {
        type: String,
        required: [true, 'Author name is required'],
        trim: true,
      },
      image: {
        type: String,
        default: '',
      },
      adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    tags: {
      type: [String],
      default: [],
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
    metaTitle: {
      type: String,
      maxlength: [60, 'Meta title cannot exceed 60 characters'],
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description cannot exceed 160 characters'],
    },
    customLinks: [
      {
        text: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        style: {
          type: String,
          enum: ['primary', 'secondary', 'outline', 'link'],
          default: 'primary',
        },
        isButton: {
          type: Boolean,
          default: true,
        },
      },
    ],
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Generate slug from title
blogSchema.pre('validate', function (next) {
  if (this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  // Set publishedAt when isPublished changes to true
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Text search index
blogSchema.index({ title: 'text', excerpt: 'text', content: 'text', tags: 'text' });

// Index for published blogs
blogSchema.index({ isPublished: 1, publishedAt: -1 });
blogSchema.index({ isFeatured: 1, isPublished: 1 });
blogSchema.index({ category: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ sortOrder: 1 });

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
