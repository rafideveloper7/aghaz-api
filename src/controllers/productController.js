const { body } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { SORT_OPTIONS } = require('../config/constants');

const createProductValidation = [
  body('title').notEmpty().withMessage('Product title is required').trim(),
  body('description').notEmpty().withMessage('Product description is required').trim(),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('comparePrice').optional().isFloat({ min: 0 }).withMessage('Compare price must be a positive number'),
  body('category').isMongoId().withMessage('Valid category ID is required'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a positive integer'),
  body('images').optional().isArray().withMessage('Images must be an array'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('benefits').optional().isArray().withMessage('Benefits must be an array'),
  body('faqs').optional().isArray().withMessage('FAQs must be an array'),
];

const updateProductValidation = [
  body('title').optional().notEmpty().withMessage('Title cannot be empty').trim(),
  body('description').optional().notEmpty().withMessage('Description cannot be empty').trim(),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('comparePrice').optional().isFloat({ min: 0 }).withMessage('Compare price must be a positive number'),
  body('category').optional().isMongoId().withMessage('Valid category ID is required'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a positive integer'),
  body('images').optional().isArray().withMessage('Images must be an array'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('benefits').optional().isArray().withMessage('Benefits must be an array'),
  body('faqs').optional().isArray().withMessage('FAQs must be an array'),
];

const getProducts = asyncHandler(async (req, res) => {
  const {
    category,
    search,
    sort = 'newest',
    page = 1,
    limit = 10,
    featured,
    status,
  } = req.query;

  const query = {};

  // Status filter - only filter by isActive if status is explicitly set
  if (status === 'active') {
    query.isActive = true;
  } else if (status === 'inactive') {
    query.isActive = false;
  }
  // If no status filter provided, return all products (admin needs to see both active and inactive)

  if (category) {
    // Support both category ID and slug
    const categoryDoc = await Category.findOne({ 
      $or: [
        { slug: category },
        { _id: category.match(/^[0-9a-fA-F]{24}$/) ? category : 'invalid' }
      ]
    });
    if (categoryDoc) {
      query.category = categoryDoc._id;
    } else if (category.match(/^[0-9a-fA-F]{24}$/)) {
      // If it's a valid MongoDB ObjectId but not found by slug, use it directly
      query.category = category;
    } else {
      return res.status(200).json(
        ApiResponse.success('Products retrieved successfully', [], {
          currentPage: parseInt(page),
          totalPages: 0,
          totalProducts: 0,
        })
      );
    }
  }

  if (search) {
    // Use regex search as fallback if text index is not available
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  if (featured === 'true') {
    query.isFeatured = true;
  }

  const sortOption = SORT_OPTIONS[sort.toUpperCase()] || SORT_OPTIONS.NEWEST;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const products = await Product.find(query)
    .populate('category', 'name slug')
    .sort(sortOption)
    .limit(parseInt(limit))
    .skip(skip)
    .lean();

  const totalProducts = await Product.countDocuments(query);
  const totalPages = Math.ceil(totalProducts / parseInt(limit));

  res.status(200).json(
    ApiResponse.success('Products retrieved successfully', products, {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalProducts,
      totalPages,
    })
  );
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const product = await Product.findOne({ slug })
    .populate('category', 'name slug')
    .lean();

  if (!product) {
    return res.status(404).json(
      ApiResponse.error('Product not found', 404)
    );
  }

  // Increment views
  await Product.findByIdAndUpdate(product._id, { $inc: { views: 1 } });

  res.status(200).json(
    ApiResponse.success('Product retrieved successfully', product)
  );
});

const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id)
    .populate('category', 'name slug')
    .lean();

  if (!product) {
    return res.status(404).json(
      ApiResponse.error('Product not found', 404)
    );
  }

  res.status(200).json(
    ApiResponse.success('Product retrieved successfully', product)
  );
});

const createProduct = asyncHandler(async (req, res) => {
  const { title } = req.body;

  // Check if product with same slug already exists
  const slugify = require('slugify');
  const slug = slugify(title, { lower: true, strict: true });
  const existingProduct = await Product.findOne({ slug });

  if (existingProduct) {
    return res.status(400).json(
      ApiResponse.error('A product with this title already exists', 400)
    );
  }

  const product = await Product.create(req.body);

  res.status(201).json(
    ApiResponse.success('Product created successfully', product)
  );
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // If title is being updated, check for slug conflicts
  if (req.body.title) {
    const slugify = require('slugify');
    const newSlug = slugify(req.body.title, { lower: true, strict: true });
    const existingProduct = await Product.findOne({ slug: newSlug, _id: { $ne: id } });

    if (existingProduct) {
      return res.status(400).json(
        ApiResponse.error('A product with this title already exists', 400)
      );
    }
  }

  const product = await Product.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    return res.status(404).json(
      ApiResponse.error('Product not found', 404)
    );
  }

  res.status(200).json(
    ApiResponse.success('Product updated successfully', product)
  );
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findByIdAndDelete(id);

  if (!product) {
    return res.status(404).json(
      ApiResponse.error('Product not found', 404)
    );
  }

  res.status(200).json(
    ApiResponse.success('Product deleted successfully')
  );
});

module.exports = {
  getProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductValidation,
  updateProductValidation,
};
