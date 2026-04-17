const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const { getImageKit } = require('../config/imagekit');
const Product = require('../models/Product');
const Category = require('../models/Category');
const HeroSlide = require('../models/HeroSlide');

// @desc    Get all images from ImageKit with usage status
// @route   GET /api/images
// @access  Private/Admin
const getImages = asyncHandler(async (req, res) => {
  const imagekit = getImageKit();
  if (!imagekit) {
    return res.status(500).json(ApiResponse.error('ImageKit is not configured'));
  }

  const { folder = 'aghaz', page = 1, limit = 20, usage = 'all' } = req.query;

  try {
    const response = await imagekit.listFiles({
      path: String(folder),
      type: 'file',
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
    });

    const files = response.result?.files || [];

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

    // Collect product images (there might be more in other models)
    // Add more models here if needed

    // Mark usage status
    const filesWithUsage = files.map((file) => ({
      ...file,
      isUsed: usedImages.has(file.url),
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
          total: usage === 'all' ? response.result?.totalCount || 0 : filteredFiles.length,
        },
      })
    );
  } catch (error) {
    res.status(500).json(ApiResponse.error(`Failed to list images: ${error.message}`));
  }
});

// @desc    Get ImageKit storage stats
// @route   GET /api/images/stats
// @access  Private/Admin
const getImageStats = asyncHandler(async (req, res) => {
  const imagekit = getImageKit();
  if (!imagekit) {
    return res.status(500).json(ApiResponse.error('ImageKit is not configured'));
  }

  try {
    // Get all files from all folders
    const allFiles = await imagekit.listFiles({
      type: 'file',
      limit: 500, // Max allowed
    });

    const files = allFiles.result?.files || [];

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
    const usedImagesCount = files.filter((f) => usedImages.has(f.url)).length;
    const unusedImagesCount = totalImages - usedImagesCount;
    const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
    const usedSize = files.filter((f) => usedImages.has(f.url)).reduce((sum, f) => sum + (f.size || 0), 0);
    const unusedSize = totalSize - usedSize;

    // By folder
    const folderStats = {};
    files.forEach((file) => {
      const folderPath = file.filePath?.split('/').slice(0, -1).join('/') || 'root';
      if (!folderStats[folderPath]) {
        folderStats[folderPath] = { count: 0, size: 0 };
      }
      folderStats[folderPath].count++;
      folderStats[folderPath].size += file.size || 0;
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

// @desc    Delete image from ImageKit
// @route   DELETE /api/images/:fileId
// @access  Private/Admin
const deleteImage = asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  if (!fileId) {
    return res.status(400).json(ApiResponse.error('File ID is required'));
  }

  const imagekit = getImageKit();
  if (!imagekit) {
    return res.status(500).json(ApiResponse.error('ImageKit is not configured'));
  }

  try {
    await imagekit.deleteFile(fileId);
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

  const imagekit = getImageKit();
  if (!imagekit) {
    return res.status(500).json(ApiResponse.error('ImageKit is not configured'));
  }

  try {
    const result = await imagekit.bulkDeleteFiles(fileIds);
    res.status(200).json(ApiResponse.success('Images deleted successfully', result));
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
