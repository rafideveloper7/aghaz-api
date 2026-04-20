const { body } = require('express-validator');
const HeroSlide = require('../models/HeroSlide');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createHeroSlideValidation = [
  body('title').notEmpty().withMessage('Title is required').trim(),
  body('mediaUrl').optional().trim(),
  body('image').optional().trim(),
  body('mediaType').optional().isIn(['image', 'video', 'gif']),
  body('rightSideMediaType').optional().isIn(['image', 'video', 'gif', 'card', 'none']),
];

const updateHeroSlideValidation = [
  body('title').optional().notEmpty().withMessage('Title cannot be empty').trim(),
  body('mediaUrl').optional().trim(),
  body('image').optional().trim(),
  body('mediaType').optional().isIn(['image', 'video', 'gif']),
  body('rightSideMediaType').optional().isIn(['image', 'video', 'gif', 'card', 'none']),
];

const getHeroSlides = asyncHandler(async (req, res) => {
  const slides = await HeroSlide.find({ isActive: true })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();

  res.status(200).json(
    ApiResponse.success('Hero slides retrieved successfully', slides)
  );
});

const getAllHeroSlides = asyncHandler(async (req, res) => {
  const slides = await HeroSlide.find()
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();

  res.status(200).json(
    ApiResponse.success('All hero slides retrieved successfully', slides)
  );
});

const createHeroSlide = asyncHandler(async (req, res) => {
  const slide = await HeroSlide.create(req.body);
  res.status(201).json(
    ApiResponse.success('Hero slide created successfully', slide)
  );
});

const updateHeroSlide = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const slide = await HeroSlide.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!slide) {
    return res.status(404).json(ApiResponse.error('Hero slide not found', 404));
  }

  res.status(200).json(
    ApiResponse.success('Hero slide updated successfully', slide)
  );
});

const deleteHeroSlide = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const slide = await HeroSlide.findByIdAndDelete(id);

  if (!slide) {
    return res.status(404).json(ApiResponse.error('Hero slide not found', 404));
  }

  res.status(200).json(ApiResponse.success('Hero slide deleted successfully'));
});

const reorderHeroSlides = asyncHandler(async (req, res) => {
  const { slides } = req.body; // Array of { id, sortOrder }

  if (!Array.isArray(slides)) {
    return res.status(400).json(ApiResponse.error('Slides array is required', 400));
  }

  const bulkOps = slides.map(slide => ({
    updateOne: {
      filter: { _id: slide.id },
      update: { sortOrder: slide.sortOrder },
    },
  }));

  await HeroSlide.bulkWrite(bulkOps);

  res.status(200).json(ApiResponse.success('Hero slides reordered successfully'));
});

module.exports = {
  getHeroSlides,
  getAllHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  reorderHeroSlides,
  createHeroSlideValidation,
  updateHeroSlideValidation,
};
