const ImageKit = require('imagekit');

let imagekitInstance = null;

function getImageKit() {
  if (!imagekitInstance) {
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

    if (!publicKey || !privateKey || !urlEndpoint) {
      throw new Error('ImageKit not configured. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT.');
    }

    console.log('🔧 ImageKit initialized:');
    console.log('   Endpoint:', urlEndpoint);
    console.log('   Public Key:', publicKey.substring(0, 12) + '...');

    imagekitInstance = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    });
  }
  return imagekitInstance;
}

/**
 * Generate a clean public URL for an ImageKit file
 * @param {string} filePath - The filePath from ImageKit upload response (e.g., "/aghaz/products/filename.jpg")
 * @param {Object} transformations - Optional transformations { width, height, crop, etc. }
 * @returns {string} Clean public URL without signed params
 */
function getPublicUrl(filePath, transformations = {}) {
  const ik = getImageKit();
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
  
  // Generate URL without any signed/expiry parameters
  const urlOptions = {
    src: filePath,
    ...transformations,
  };
  let publicUrl = ik.url(urlOptions);
  
  // Ensure URL is always absolute (handle relative paths)
  if (publicUrl && !publicUrl.startsWith('http')) {
    publicUrl = urlEndpoint + (publicUrl.startsWith('/') ? '' : '/') + publicUrl;
  }
  
  return publicUrl;
}

const uploadToImageKit = async (file, folder = 'aghaz/products') => {
  try {
    const fileName = `${Date.now()}-${file.originalname}`.replace(/\s+/g, '_');
    const base64 = file.buffer.toString('base64');

    console.log('📤 Uploading:', { fileName, folder, size: file.size });

    const result = await getImageKit().upload({
      file: base64,
      fileName,
      folder,
    });

    console.log('✅ Uploaded. filePath:', result.filePath);

    // Generate clean public URL (no ?updatedAt= or ?ik-s= params)
    const publicUrl = getPublicUrl(result.filePath);

    console.log('🔗 Public URL:', publicUrl);

    return {
      fileId: result.fileId,
      url: publicUrl, // Clean, permanent URL
      name: result.name,
      size: result.size,
      fileType: result.fileType,
      height: result.height,
      width: result.width,
      filePath: result.filePath,
    };
  } catch (error) {
    console.error('❌ ImageKit upload error:', {
      message: error.message,
      statusCode: error.statusCode,
    });
    throw new Error(`ImageKit upload failed: ${error.message}`);
  }
};

const deleteFromImageKit = async (fileId) => {
  try {
    console.log('🗑️ Deleting:', fileId);
    await getImageKit().deleteFile(fileId);
    console.log('✅ Deleted:', fileId);
    return { success: true };
  } catch (error) {
    console.error('❌ ImageKit delete error:', error.message);
    throw new Error(`ImageKit delete failed: ${error.message}`);
  }
};

module.exports = {
  uploadToImageKit,
  deleteFromImageKit,
  getPublicUrl, // Export for other modules if needed
};