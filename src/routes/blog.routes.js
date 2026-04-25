const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/blogController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Public routes
router.get('/', getBlogs);
router.get('/featured', getFeaturedBlogs);
router.get('/recent', getRecentBlogs);
router.get('/:slug', getBlogBySlug);
router.post('/:id/like', incrementLike);

// Admin only routes
router.get('/id/:id', protect, getBlogById);
router.post('/', protect, createBlogValidation, validate, createBlog);
router.put('/:id', protect, updateBlogValidation, validate, updateBlog);
router.delete('/:id', protect, deleteBlog);

module.exports = router;
