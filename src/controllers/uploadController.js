const multer = require('multer');
const { uploadToImageKit, deleteFromImageKit } = require('../utils/imagekitUploader');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES } = require('../config/constants');

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

const uploadSingleImage = asyncHandler(async (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json(
        ApiResponse.error(`Upload error: ${err.message}`, 400)
      );
    }

    if (err) {
      return res.status(400).json(
        ApiResponse.error(err.message, 400)
      );
    }

    if (!req.file) {
      return res.status(400).json(
        ApiResponse.error('No file uploaded', 400)
      );
    }

    const folder = req.body.folder || 'aghaz/products';
    const result = await uploadToImageKit(req.file, folder);

    res.status(200).json(
      ApiResponse.success('Image uploaded successfully', result)
    );
  });
});

const uploadMultipleImages = asyncHandler(async (req, res) => {
  upload.array('images', 10)(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json(
        ApiResponse.error(`Upload error: ${err.message}`, 400)
      );
    }

    if (err) {
      return res.status(400).json(
        ApiResponse.error(err.message, 400)
      );
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json(
        ApiResponse.error('No files uploaded', 400)
      );
    }

    const folder = req.body.folder || 'aghaz/products';
    const results = [];

    for (const file of req.files) {
      const result = await uploadToImageKit(file, folder);
      results.push(result);
    }

    res.status(200).json(
      ApiResponse.success('Images uploaded successfully', results)
    );
  });
});

const deleteImage = asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  if (!fileId) {
    return res.status(400).json(
      ApiResponse.error('File ID is required', 400)
    );
  }

  await deleteFromImageKit(fileId);

  res.status(200).json(
    ApiResponse.success('Image deleted successfully')
  );
});

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage,
};
