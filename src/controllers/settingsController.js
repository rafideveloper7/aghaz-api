const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const SiteSettings = require('../models/SiteSettings');

const getSettings = asyncHandler(async (req, res) => {
  let settings = await SiteSettings.findOne();
  if (!settings) {
    settings = await SiteSettings.create({});
  }
  res.status(200).json(ApiResponse.success('Settings retrieved', settings));
});

const updateSettings = asyncHandler(async (req, res) => {
  let settings = await SiteSettings.findOne();
  if (!settings) {
    settings = await SiteSettings.create(req.body);
  } else {
    settings = await SiteSettings.findOneAndUpdate({}, req.body, { new: true, runValidators: true });
  }
  res.status(200).json(ApiResponse.success('Settings updated', settings));
});

module.exports = {
  getSettings,
  updateSettings,
};
