const ImageKit = require('imagekit');

let imagekitInstance = null;

function getImageKit() {
  if (!imagekitInstance) {
    const publicKeyRaw = process.env.IMAGEKIT_PUBLIC_KEY;
    const privateKeyRaw = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

    if (!publicKeyRaw || !privateKeyRaw || !urlEndpoint) {
      throw new Error('ImageKit not configured. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT.');
    }

    // Strip 'public_' and 'private_' prefixes if present (ImageKit dashboard adds them for display)
    const publicKey = publicKeyRaw.replace(/^public_/, '');
    const privateKey = privateKeyRaw.replace(/^private_/, '');

    console.log('🔧 ImageKit initialized:', {
      urlEndpoint,
      publicKeyPrefix: publicKey.substring(0, 8) + '...',
    });

    imagekitInstance = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    });
  }
  return imagekitInstance;
}

/**
 * Upload a file buffer to ImageKit
 * @param {Buffer} file - The file buffer from multer
 * @param {string} folder - The folder path in ImageKit (default: 'aghaz/products')
 * @returns {Promise<{fileId, url, name, size, fileType, height, width, filePath}>}
 */
const uploadToImageKit = async (file, folder = 'aghaz/products') => {
  try {
    const fileName = `${Date.now()}-${file.originalname}`.replace(/\s+/g, '_');
    const base64 = file.buffer.toString('base64');

    console.log('📤 Uploading to ImageKit:', { fileName, folder, size: file.size, mimetype: file.mimetype });

    const result = await getImageKit().upload({
      file: base64,
      fileName,
      folder: folder,
    });

    console.log('✅ ImageKit upload success:', { fileId: result.fileId, url: result.url });

    return {
      fileId: result.fileId,
      url: result.url,
      name: result.name,
      size: result.size,
      fileType: result.fileType,
      height: result.height,
      width: result.width,
      filePath: result.filePath,
    };
  } catch (error) {
    console.error('❌ ImageKit upload failed:', {
      message: error.message,
      statusCode: error.statusCode,
      hint: 'Check if your IMAGEKIT_PUBLIC_KEY and IMAGEKIT_PRIVATE_KEY are correct (without public_/private_ prefix)',
    });
    throw new Error(`ImageKit upload failed: ${error.message}`);
  }
};

/**
 * Delete a file from ImageKit by file ID
 * @param {string} fileId - The ImageKit file ID
 * @returns {Promise<{success: boolean}>}
 */
const deleteFromImageKit = async (fileId) => {
  try {
    console.log('🗑️ Deleting from ImageKit:', fileId);
    await getImageKit().deleteFile(fileId);
    console.log('✅ ImageKit delete success:', fileId);
    return { success: true };
  } catch (error) {
    console.error('❌ ImageKit delete failed:', error.message);
    throw new Error(`ImageKit delete failed: ${error.message}`);
  }
};

module.exports = {
  uploadToImageKit,
  deleteFromImageKit,
};
