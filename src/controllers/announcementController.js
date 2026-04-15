const { body } = require('express-validator');
const Announcement = require('../models/Announcement');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const validation = [
  body('text').notEmpty().withMessage('Text is required').trim(),
];

const getAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findOne({ isActive: true }).lean();
  res.status(200).json(
    ApiResponse.success('Announcement retrieved', announcement || null)
  );
});

const getAllAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await Announcement.find().sort({ createdAt: -1 }).lean();
  res.status(200).json(
    ApiResponse.success('All announcements retrieved', announcements)
  );
});

const createAnnouncement = asyncHandler(async (req, res) => {
  // Deactivate existing
  await Announcement.updateMany({ isActive: true }, { isActive: false });
  const announcement = await Announcement.create(req.body);
  res.status(201).json(
    ApiResponse.success('Announcement created', announcement)
  );
});

const updateAnnouncement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const announcement = await Announcement.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!announcement) {
    return res.status(404).json(ApiResponse.error('Not found', 404));
  }
  res.status(200).json(
    ApiResponse.success('Announcement updated', announcement)
  );
});

const deleteAnnouncement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const announcement = await Announcement.findByIdAndDelete(id);
  if (!announcement) {
    return res.status(404).json(ApiResponse.error('Not found', 404));
  }
  res.status(200).json(ApiResponse.success('Deleted'));
});

const toggleAnnouncement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const announcement = await Announcement.findById(id);
  if (!announcement) {
    return res.status(404).json(ApiResponse.error('Not found', 404));
  }
  announcement.isActive = !announcement.isActive;
  await announcement.save();
  res.status(200).json(
    ApiResponse.success('Toggled', announcement)
  );
});

module.exports = {
  getAnnouncement,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncement,
  validation,
};
