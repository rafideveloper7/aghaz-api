const cloudinary = require('cloudinary').v2;

let cloudinaryInstance = null;

function getCloudinary() {
  if (!cloudinaryInstance) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    cloudinaryInstance = cloudinary;
    console.log('☁️ Cloudinary initialized:', process.env.CLOUDINARY_CLOUD_NAME);
  }
  return cloudinaryInstance;
}

const uploadToCloudinary = async (file, folder = 'aghaz/products') => {
  try {
    const fileName = `${Date.now()}-${file.originalname}`.replace(/\s+/g, '_');
    
    console.log('📤 Uploading:', { fileName, folder, size: file.size, mimetype: file.mimetype });

    // Convert buffer to base64 data URI
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    
    const result = await getCloudinary().uploader.upload(dataUri, {
      public_id: fileName,
      folder: folder,
      resource_type: 'auto',
    });

    console.log('✅ Uploaded. public_id:', result.public_id, 'url:', result.secure_url);

    return {
      fileId: result.public_id,
      url: result.secure_url,
      name: result.original_filename,
      size: result.bytes,
      format: result.format,
      width: result.width,
      height: result.height,
      resourceType: result.resource_type,
    };
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error.message);
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    console.log('🗑️ Deleting:', publicId);
    const result = await getCloudinary().uploader.destroy(publicId);
    console.log('✅ Deleted:', result);
    return { success: true };
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error.message);
    throw new Error(`Cloudinary delete failed: ${error.message}`);
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  getCloudinary,
};