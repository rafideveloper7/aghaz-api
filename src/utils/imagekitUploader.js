const { getImageKit } = require('../config/imagekit');

const uploadToImageKit = async (file, folder = 'aghaz') => {
  const imagekit = getImageKit();
  if (!imagekit) {
    throw new Error('ImageKit is not configured. Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT in your .env file.');
  }

  try {
    const fileName = `${Date.now()}-${file.originalname}`;

    const response = await imagekit.upload({
      file: file.buffer,
      fileName: fileName,
      folder: folder,
    });

    return {
      fileId: response.fileId,
      url: response.url,
      name: response.name,
      size: response.size,
      fileType: response.fileType,
      height: response.height,
      width: response.width,
    };
  } catch (error) {
    throw new Error(`ImageKit upload failed: ${error.message}`);
  }
};

const deleteFromImageKit = async (fileId) => {
  const imagekit = getImageKit();
  if (!imagekit) {
    throw new Error('ImageKit is not configured.');
  }

  try {
    const response = await imagekit.deleteFile(fileId);
    return response;
  } catch (error) {
    throw new Error(`ImageKit delete failed: ${error.message}`);
  }
};

module.exports = {
  uploadToImageKit,
  deleteFromImageKit,
};
