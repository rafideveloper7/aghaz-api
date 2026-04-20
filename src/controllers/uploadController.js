const multer = require('multer');
const { uploadToImageKit, deleteFromImageKit } = require('../utils/imagekitUploader');
const ApiResponse = require('../utils/apiResponse');
const { MAX_FILE_SIZE } = require('../config/constants');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// Accept any image MIME type
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only images are allowed.`), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

const uploadSingleImage = (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json(
          ApiResponse.error(`Upload error: ${err.message}`, 400)
        );
      }
      return res.status(400).json(
        ApiResponse.error(err.message, 400)
      );
    }

    if (!req.file) {
      return res.status(400).json(
        ApiResponse.error('No file uploaded', 400)
      );
    }

    console.log('Processing upload for file:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    try {
      const folder = req.body.folder || 'aghaz/products';
      const result = await uploadToImageKit(req.file, folder);
      res.status(200).json(
        ApiResponse.success('Image uploaded successfully', result)
      );
    } catch (error) {
      console.error('ImageKit upload error:', error);
      const statusCode = error.response?.status || 500;
      res.status(statusCode).json(
        ApiResponse.error(error.message, statusCode)
      );
    }
  });
};

const uploadMultipleImages = (req, res) => {
  upload.array('images', 10)(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json(
          ApiResponse.error(`Upload error: ${err.message}`, 400)
        );
      }
      return res.status(400).json(
        ApiResponse.error(err.message, 400)
      );
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json(
        ApiResponse.error('No files uploaded', 400)
      );
    }

    try {
      const folder = req.body.folder || 'aghaz/products';
      const results = [];
      for (const file of req.files) {
        const result = await uploadToImageKit(file, folder);
        results.push(result);
      }
      res.status(200).json(
        ApiResponse.success('Images uploaded successfully', results)
      );
    } catch (error) {
      console.error('ImageKit bulk upload error:', error);
      const statusCode = error.response?.status || 500;
      res.status(statusCode).json(
        ApiResponse.error(error.message, statusCode)
      );
    }
  });
};

const deleteImage = async (req, res) => {
  const { fileId } = req.params;

  if (!fileId) {
    return res.status(400).json(
      ApiResponse.error('File ID is required', 400)
    );
  }

  try {
    await deleteFromImageKit(fileId);
    res.status(200).json(
      ApiResponse.success('Image deleted successfully')
    );
  } catch (error) {
    console.error('ImageKit delete error:', error);
    const statusCode = error.response?.status || 500;
    res.status(statusCode).json(
      ApiResponse.error(error.message, statusCode)
    );
  }
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage,
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage,
};
