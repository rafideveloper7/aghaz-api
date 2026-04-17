const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const Review = require('../models/Review');
const Product = require('../models/Product');

// @desc    Get approved reviews for a product (public)
// @route   GET /api/reviews/product/:productId
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const query = { product: productId, approved: true };

  const reviews = await Review.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await Review.countDocuments(query);

  // Calculate average rating
  const avgResult = await Review.aggregate([
    { $match: { product: productId, approved: true } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const averageRating = avgResult.length > 0 ? avgResult[0].avgRating : 0;
  const totalReviews = avgResult.length > 0 ? avgResult[0].count : 0;

  res.status(200).json(
    ApiResponse.success('Reviews retrieved', {
      reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
    })
  );
});

// @desc    Create a review
// @route   POST /api/reviews
// @access  Public (no authentication required)
const createReview = asyncHandler(async (req, res) => {
  const { product, name, rating, comment, image, verified } = req.body;

  if (!product || !name || !rating || !comment) {
    return res.status(400).json(ApiResponse.error('Product, name, rating, and comment are required'));
  }

  // Validate product exists
  const productExists = await Product.findById(product);
  if (!productExists) {
    return res.status(404).json(ApiResponse.error('Product not found'));
  }

  // Check if user already reviewed this product (simple check by name - could be improved)
  // For now, we'll allow multiple reviews from same name

  const reviewData = {
    product,
    name: name.trim(),
    rating: Number(rating),
    comment: comment.trim(),
    image: image || '',
    verified: verified || false,
  };

  const review = await Review.create(reviewData);

  // Update product's rating and review count (only for approved reviews)
  await updateProductRating(product);

  res.status(201).json(ApiResponse.success('Review submitted successfully', review));
});

// Helper function to update product rating
const updateProductRating = async (productId) => {
  const result = await Review.aggregate([
    { $match: { product: productId, approved: true } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(result[0].avgRating * 10) / 10,
      reviewCount: result[0].count,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      rating: 0,
      reviewCount: 0,
    });
  }
};

// @desc    Get all reviews (admin)
// @route   GET /api/admin/reviews
// @access  Private/Admin
const getAllReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, product, approved } = req.query;
  const query = {};

  if (product) query.product = product;
  if (approved !== undefined) query.approved = approved === 'true';

  const reviews = await Review.find(query)
    .populate('product', 'title slug')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await Review.countDocuments(query);

  res.status(200).json(
    ApiResponse.success('Reviews retrieved', {
      reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    })
  );
});

// @desc    Update review approval status
// @route   PUT /api/admin/reviews/:id/approve
// @access  Private/Admin
const approveReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { approved } = req.body;

  const review = await Review.findById(id);
  if (!review) {
    return res.status(404).json(ApiResponse.error('Review not found'));
  }

  review.approved = approved !== undefined ? approved : true;
  await review.save();

  // Update product rating
  await updateProductRating(review.product);

  res.status(200).json(ApiResponse.success('Review updated', review));
});

// @desc    Delete review
// @route   DELETE /api/admin/reviews/:id
// @access  Private/Admin
const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findById(id);
  if (!review) {
    return res.status(404).json(ApiResponse.error('Review not found'));
  }

  await Review.findByIdAndDelete(id);

  // Update product rating
  await updateProductRating(review.product);

  res.status(200).json(ApiResponse.success('Review deleted'));
});

// @desc    Get review stats
// @route   GET /api/admin/reviews/stats
// @access  Private/Admin
const getReviewStats = asyncHandler(async (req, res) => {
  const total = await Review.countDocuments();
  const pending = await Review.countDocuments({ approved: false });
  const approved = await Review.countDocuments({ approved: true });

  const ratingStats = await Review.aggregate([
    { $match: { approved: true } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratingStats.forEach((stat) => {
    ratingDistribution[stat._id] = stat.count;
  });

  res.status(200).json(
    ApiResponse.success('Stats retrieved', {
      total,
      pending,
      approved,
      ratingDistribution,
    })
  );
});

module.exports = {
  getProductReviews,
  createReview,
  getAllReviews,
  approveReview,
  deleteReview,
  getReviewStats,
};
