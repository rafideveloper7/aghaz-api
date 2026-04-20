const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const { getCloudinary } = require('../utils/cloudinaryUploader');
const Product = require('../models/Product');
const Category = require('../models/Category');
const HeroSlide = require('../models/HeroSlide');

// @desc    Get all images from Cloudinary with usage status
// @route   GET /api/images
// @access  Private/Admin
const getImages = asyncHandler(async (req, res) => {
  const cloudinary = getCloudinary();
  
  const { folder = 'aghaz', page = 1, limit = 20, usage = 'all' } = req.query;

  try {
    const response = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      resource_type: 'image',
      max_results: Number(limit),
      next_cursor: (Number(page) > 1) ? String(page) : undefined,
    });

    const files = response.resources || [];

    // Get all used image URLs from database
    const usedImages = new Set();

    // Collect all product images
    const products = await Product.find({}, 'images');
    products.forEach((product) => {
      product.images.forEach((img) => usedImages.add(img));
    });

    // Collect category images
    const categories = await Category.find({}, 'image');
    categories.forEach((category) => {
      if (category.image) usedImages.add(category.image);
    });

    // Collect hero slide images
    const heroSlides = await HeroSlide.find({}, 'image desktopBg mobileBg');
    heroSlides.forEach((slide) => {
      if (slide.image) usedImages.add(slide.image);
      if (slide.desktopBg) usedImages.add(slide.desktopBg);
      if (slide.mobileBg) usedImages.add(slide.mobileBg);
    });

    // Mark usage status
    const filesWithUsage = files.map((file) => ({
      ...file,
      url: file.secure_url,
      isUsed: usedImages.has(file.secure_url),
    }));

    // Filter by usage if requested
    let filteredFiles = filesWithUsage;
    if (usage === 'used') {
      filteredFiles = filesWithUsage.filter((f) => f.isUsed);
    } else if (usage === 'unused') {
      filteredFiles = filesWithUsage.filter((f) => !f.isUsed);
    }

    res.status(200).json(
      ApiResponse.success('Images retrieved', {
        files: filteredFiles,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: response.total_count || filteredFiles.length,
        },
      })
    );
  } catch (error) {
    res.status(500).json(ApiResponse.error(`Failed to list images: ${error.message}`));
  }
});

// @desc    Get Cloudinary storage stats
// @route   GET /api/images/stats
// @access  Private/Admin
const getImageStats = asyncHandler(async (req, res) => {
  const cloudinary = getCloudinary();

  try {
    const response = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'image',
      max_results: 500,
    });

    const files = response.resources || [];

    // Get all used image URLs from database
    const usedImages = new Set();

    const products = await Product.find({}, 'images');
    products.forEach((product) => {
      product.images.forEach((img) => usedImages.add(img));
    });

    const categories = await Category.find({}, 'image');
    categories.forEach((category) => {
      if (category.image) usedImages.add(category.image);
    });

    const heroSlides = await HeroSlide.find({}, 'image desktopBg mobileBg');
    heroSlides.forEach((slide) => {
      if (slide.image) usedImages.add(slide.image);
      if (slide.desktopBg) usedImages.add(slide.desktopBg);
      if (slide.mobileBg) usedImages.add(slide.mobileBg);
    });

    // Calculate stats
    const totalImages = files.length;
    const usedImagesCount = files.filter((f) => usedImages.has(f.secure_url)).length;
    const unusedImagesCount = totalImages - usedImagesCount;
    const totalSize = files.reduce((sum, f) => sum + (f.bytes || 0), 0);
    const usedSize = files.filter((f) => usedImages.has(f.secure_url)).reduce((sum, f) => sum + (f.bytes || 0), 0);
    const unusedSize = totalSize - usedSize;

    // By folder
    const folderStats = {};
    files.forEach((file) => {
      const folderPath = file.folder || 'root';
      if (!folderStats[folderPath]) {
        folderStats[folderPath] = { count: 0, size: 0 };
      }
      folderStats[folderPath].count++;
      folderStats[folderPath].size += file.bytes || 0;
    });

    res.status(200).json(
      ApiResponse.success('Stats retrieved', {
        totalImages,
        usedImages: usedImagesCount,
        unusedImages: unusedImagesCount,
        totalSize,
        usedSize,
        unusedSize,
        folderStats,
      })
    );
  } catch (error) {
    res.status(500).json(ApiResponse.error(`Failed to get stats: ${error.message}`));
  }
});

// @desc    Delete image from Cloudinary
// @route   DELETE /api/images/:publicId
// @access  Private/Admin
const deleteImage = asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  if (!fileId) {
    return res.status(400).json(ApiResponse.error('File ID is required'));
  }

  try {
    const cloudinary = getCloudinary();
    await cloudinary.uploader.destroy(fileId);
    res.status(200).json(ApiResponse.success('Image deleted successfully'));
  } catch (error) {
    res.status(500).json(ApiResponse.error(`Failed to delete image: ${error.message}`));
  }
});

// @desc    Bulk delete images
// @route   DELETE /api/images/bulk
// @access  Private/Admin
const bulkDeleteImages = asyncHandler(async (req, res) => {
  const { fileIds } = req.body;

  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json(ApiResponse.error('File IDs array is required'));
  }

  try {
    const results = [];
    const cloudinary = getCloudinary();
    for (const publicId of fileIds) {
      try {
        await cloudinary.uploader.destroy(publicId);
        results.push({ publicId, success: true });
      } catch (e) {
        results.push({ publicId, success: false, error: e.message });
      }
    }
    res.status(200).json(ApiResponse.success('Images deleted', results));
  } catch (error) {
    res.status(500).json(ApiResponse.error(`Failed to delete images: ${error.message}`));
  }
});

module.exports = {
  getImages,
  getImageStats,
  deleteImage,
  bulkDeleteImages,
};