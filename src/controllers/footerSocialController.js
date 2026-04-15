const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const FooterSocial = require('../models/FooterSocial');

const getSocialLinks = asyncHandler(async (req, res) => {
  const links = await FooterSocial.find({ isActive: true }).sort({ sortOrder: 1 });
  res.status(200).json(ApiResponse.success('Social links retrieved', links));
});

const getAllSocialLinks = asyncHandler(async (req, res) => {
  const links = await FooterSocial.find().sort({ sortOrder: 1 });
  res.status(200).json(ApiResponse.success('All social links retrieved', links));
});

const createSocialLink = asyncHandler(async (req, res) => {
  const link = await FooterSocial.create(req.body);
  res.status(201).json(ApiResponse.success('Social link created', link));
});

const updateSocialLink = asyncHandler(async (req, res) => {
  const link = await FooterSocial.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!link) {
    return res.status(404).json(ApiResponse.error('Social link not found', 404));
  }
  res.status(200).json(ApiResponse.success('Social link updated', link));
});

const deleteSocialLink = asyncHandler(async (req, res) => {
  const link = await FooterSocial.findByIdAndDelete(req.params.id);
  if (!link) {
    return res.status(404).json(ApiResponse.error('Social link not found', 404));
  }
  res.status(200).json(ApiResponse.success('Social link deleted'));
});

module.exports = {
  getSocialLinks,
  getAllSocialLinks,
  createSocialLink,
  updateSocialLink,
  deleteSocialLink,
};
