const { body } = require('express-validator');
const Blog = require('../models/Blog');
const Category = require('../models/Category');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createBlogValidation = [
  body('title').notEmpty().withMessage('Blog title is required').trim(),
  body('excerpt').notEmpty().withMessage('Blog excerpt is required').trim(),
  body('content').notEmpty().withMessage('Blog content is required'),
  body('featuredImage').notEmpty().withMessage('Featured image is required'),
  body('category').optional().isMongoId().withMessage('Valid category ID'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('gallery').optional().isArray().withMessage('Gallery must be an array'),
  body('customLinks').optional().isArray().withMessage('Custom links must be an array'),
  body('isPublished').optional().isBoolean().withMessage('isPublished must be boolean'),
  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be boolean'),
];

const updateBlogValidation = [
  body('title').optional().notEmpty().withMessage('Title cannot be empty').trim(),
  body('excerpt').optional().notEmpty().withMessage('Excerpt cannot be empty').trim(),
  body('content').optional().notEmpty().withMessage('Content cannot be empty'),
  body('featuredImage').optional().notEmpty().withMessage('Featured image cannot be empty'),
  body('category').optional().isMongoId().withMessage('Valid category ID'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('gallery').optional().isArray().withMessage('Gallery must be an array'),
  body('customLinks').optional().isArray().withMessage('Custom links must be an array'),
  body('isPublished').optional().isBoolean().withMessage('isPublished must be boolean'),
  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be boolean'),
];

const getBlogs = asyncHandler(async (req, res) => {
  const {
    category,
    search,
    tag,
    sort = 'newest',
    page = 1,
    limit = 10,
    featured,
    isFeatured,
    published,
    isPublished,
    status,
  } = req.query;

  const query = {};

  // Filter by published status
  // Admin sees all, public only sees published
  if (published !== undefined || isPublished !== undefined) {
    query.isPublished = published === 'true' || isPublished === 'true';
  } else if (!req.headers.authorization) {
    // Public endpoint - only show published
    query.isPublished = true;
  }

  // Filter by category (ID or slug)
  if (category) {
    const categoryDoc = await Category.findOne({
      $or: [
        { slug: category },
        { _id: category.match(/^[0-9a-fA-F]{24}$/) ? category : 'invalid' }
      ]
    });
    if (categoryDoc) {
      query.category = categoryDoc._id;
    } else if (category.match(/^[0-9a-fA-F]{24}$/)) {
      query.category = category;
    }
  }

  // Filter by tag
  if (tag) {
    query.tags = { $in: [tag] };
  }

  // Search in title, excerpt, content, tags
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { excerpt: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
  }

  if (featured === 'true' || isFeatured === 'true') {
    query.isFeatured = true;
  }

  // Status filter (for admin)
  if (status === 'active') {
    query.isPublished = true;
  } else if (status === 'inactive') {
    query.isPublished = false;
  }

  // Sort options
  const sortOption = {
    newest: { publishedAt: -1, createdAt: -1 },
    oldest: { publishedAt: 1, createdAt: 1 },
    popular: { viewCount: -1 },
    mostLiked: { likeCount: -1 },
    titleAsc: { title: 1 },
    titleDesc: { title: -1 },
  }[sort.toLowerCase()] || sortOption.newest;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const blogs = await Blog.find(query)
    .populate('category', 'name slug')
    .populate('author.adminId', 'name email')
    .sort(sortOption)
    .limit(parseInt(limit))
    .skip(skip)
    .lean();

  const totalBlogs = await Blog.countDocuments(query);
  const totalPages = Math.ceil(totalBlogs / parseInt(limit));

  res.status(200).json(
    ApiResponse.success('Blogs retrieved successfully', blogs, {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalBlogs,
      totalPages,
    })
  );
});

const getBlogBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const blog = await Blog.findOne({ slug })
    .populate('category', 'name slug')
    .populate('author.adminId', 'name')
    .lean();

  if (!blog) {
    return res.status(404).json(
      ApiResponse.error('Blog not found', 404)
    );
  }

  // Increment views
  await Blog.findByIdAndUpdate(blog._id, { $inc: { viewCount: 1 } });

  res.status(200).json(
    ApiResponse.success('Blog retrieved successfully', blog)
  );
});

const getBlogById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const blog = await Blog.findById(id)
    .populate('category', 'name slug')
    .populate('author.adminId', 'name')
    .lean();

  if (!blog) {
    return res.status(404).json(
      ApiResponse.error('Blog not found', 404)
    );
  }

  res.status(200).json(
    ApiResponse.success('Blog retrieved successfully', blog)
  );
});

const createBlog = asyncHandler(async (req, res) => {
  const { title, featuredImage, author } = req.body;

  // Check if blog with same slug already exists
  const slugify = require('slugify');
  const slug = slugify(title, { lower: true, strict: true });
  const existingBlog = await Blog.findOne({ slug });

  if (existingBlog) {
    return res.status(400).json(
      ApiResponse.error('A blog with this title already exists', 400)
    );
  }

  // Prepare author data
  const blogData = {
    ...req.body,
    author: {
      name: author?.name || 'Admin',
      adminId: req.user?._id || null,
    },
  };

  const blog = await Blog.create(blogData);

  res.status(201).json(
    ApiResponse.success('Blog created successfully', blog)
  );
});

const updateBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // If title is being updated, check for slug conflicts
  if (req.body.title) {
    const slugify = require('slugify');
    const newSlug = slugify(req.body.title, { lower: true, strict: true });
    const existingBlog = await Blog.findOne({ slug: newSlug, _id: { $ne: id } });

    if (existingBlog) {
      return res.status(400).json(
        ApiResponse.error('A blog with this title already exists', 400)
      );
    }
  }

  const blog = await Blog.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!blog) {
    return res.status(404).json(
      ApiResponse.error('Blog not found', 404)
    );
  }

  res.status(200).json(
    ApiResponse.success('Blog updated successfully', blog)
  );
});

const deleteBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const blog = await Blog.findByIdAndDelete(id);

  if (!blog) {
    return res.status(404).json(
      ApiResponse.error('Blog not found', 404)
    );
  }

  res.status(200).json(
    ApiResponse.success('Blog deleted successfully')
  );
});

const getFeaturedBlogs = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  const blogs = await Blog.find({ isPublished: true, isFeatured: true })
    .populate('category', 'name slug')
    .sort({ publishedAt: -1 })
    .limit(parseInt(limit))
    .lean();

  res.status(200).json(
    ApiResponse.success('Featured blogs retrieved successfully', blogs)
  );
});

const getRecentBlogs = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const blogs = await Blog.find({ isPublished: true })
    .populate('category', 'name slug')
    .sort({ publishedAt: -1 })
    .limit(parseInt(limit))
    .lean();

  res.status(200).json(
    ApiResponse.success('Recent blogs retrieved successfully', blogs)
  );
});

const incrementLike = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const blog = await Blog.findByIdAndUpdate(
    id,
    { $inc: { likeCount: 1 } },
    { new: true }
  );

  if (!blog) {
    return res.status(404).json(
      ApiResponse.error('Blog not found', 404)
    );
  }

  res.status(200).json(
    ApiResponse.success('Like incremented', { likeCount: blog.likeCount })
  );
});

module.exports = {
  getBlogs,
  getBlogBySlug,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  getFeaturedBlogs,
  getRecentBlogs,
  incrementLike,
  createBlogValidation,
  updateBlogValidation,
};
