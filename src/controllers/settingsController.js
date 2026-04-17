const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const SiteSettings = require('../models/SiteSettings');

const normalizePaymentMethods = (methods = []) => {
  const cleanedMethods = Array.isArray(methods)
    ? methods
        .map((method, index) => ({
          code: String(method.code || method.label || `method-${index + 1}`)
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, ''),
          label: String(method.label || '').trim(),
          type: ['cod', 'wallet', 'bank', 'other'].includes(method.type) ? method.type : 'other',
          accountTitle: String(method.accountTitle || '').trim(),
          accountNumber: String(method.accountNumber || '').trim(),
          iban: String(method.iban || '').trim(),
          instructions: String(method.instructions || '').trim(),
          isActive: method.isActive !== false,
          sortOrder: Number.isFinite(Number(method.sortOrder)) ? Number(method.sortOrder) : index,
        }))
        .filter((method) => method.code && method.label)
    : [];

  if (!cleanedMethods.some((method) => method.type === 'cod')) {
    cleanedMethods.unshift({
      code: 'cod',
      label: 'Cash on Delivery',
      type: 'cod',
      accountTitle: '',
      accountNumber: '',
      iban: '',
      instructions: 'Pay when you receive your order.',
      isActive: true,
      sortOrder: 0,
    });
  }

  return cleanedMethods
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((method, index) => ({
      ...method,
      sortOrder: index,
    }));
};

const getSettings = asyncHandler(async (req, res) => {
  let settings = await SiteSettings.findOne();
  if (!settings) {
    settings = await SiteSettings.create({});
  }
  res.status(200).json(ApiResponse.success('Settings retrieved', settings));
});

const updateSettings = asyncHandler(async (req, res) => {
  const payload = { ...req.body };

  if ('paymentMethods' in payload) {
    payload.paymentMethods = normalizePaymentMethods(payload.paymentMethods);
  }

  let settings = await SiteSettings.findOne();
  if (!settings) {
    settings = await SiteSettings.create(payload);
  } else {
    settings = await SiteSettings.findOneAndUpdate({}, payload, { new: true, runValidators: true });
  }
  res.status(200).json(ApiResponse.success('Settings updated', settings));
});

module.exports = {
  getSettings,
  updateSettings,
};
