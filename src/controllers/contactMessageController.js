const { body } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const ContactMessage = require('../models/ContactMessage');
const { sendFormSubmitEmail } = require('../utils/formSubmitNotifier');

const createContactMessageValidation = [
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('phone').optional().trim(),
  body('subject').optional().trim(),
  body('message').notEmpty().withMessage('Message is required').trim(),
];

const createContactMessage = asyncHandler(async (req, res) => {
  const contactMessage = await ContactMessage.create({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone || '',
    subject: req.body.subject || '',
    message: req.body.message,
  });

  try {
    await sendFormSubmitEmail({
      subject: `New contact message from ${contactMessage.name}`,
      replyTo: contactMessage.email,
      message: contactMessage.message,
      payload: {
        name: contactMessage.name,
        email: contactMessage.email,
        phone: contactMessage.phone || 'N/A',
        subjectLine: contactMessage.subject || 'General inquiry',
        receivedAt: contactMessage.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to send contact FormSubmit email:', error.message);
  }

  res.status(201).json(ApiResponse.success('Message sent successfully', contactMessage));
});

const getContactMessages = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const query = {
    expiresAt: { $gt: new Date() },
  };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { message: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
  const limitNumber = Math.max(parseInt(limit, 10) || 20, 1);
  const skip = (pageNumber - 1) * limitNumber;

  const messages = await ContactMessage.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNumber)
    .lean();

  const total = await ContactMessage.countDocuments(query);

  res.status(200).json(
    ApiResponse.success('Contact messages retrieved successfully', messages, {
      page: pageNumber,
      limit: limitNumber,
      total,
      pages: Math.ceil(total / limitNumber) || 1,
    })
  );
});

const deleteContactMessage = asyncHandler(async (req, res) => {
  const deletedMessage = await ContactMessage.findByIdAndDelete(req.params.id);

  if (!deletedMessage) {
    return res.status(404).json(ApiResponse.error('Message not found', 404));
  }

  res.status(200).json(ApiResponse.success('Message deleted successfully'));
});

module.exports = {
  createContactMessage,
  getContactMessages,
  deleteContactMessage,
  createContactMessageValidation,
};
