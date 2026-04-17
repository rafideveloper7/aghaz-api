const axios = require('axios');

const uploadToImageKit = async (file, folder = 'aghaz') => {
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  if (!publicKey || !privateKey || !urlEndpoint) {
    throw new Error('ImageKit is not configured. Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT in your .env file.');
  }

  try {
    const fileName = `${Date.now()}-${file.originalname}`;
    const base64 = file.buffer.toString('base64');
    const mimeType = file.mimetype || 'image/jpeg';
    
    const auth = Buffer.from(`${privateKey}:`).toString('base64');
    
    const response = await axios.post(
      'https://api.imagekit.io/v1/files/upload',
      {
        file: `data:${mimeType};base64,${base64}`,
        fileName: fileName,
        folder: folder,
      },
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return {
      fileId: response.data.fileId,
      url: response.data.url,
      name: response.data.name,
      size: response.data.size,
      fileType: response.data.fileType,
      height: response.data.height,
      width: response.data.width,
    };
  } catch (error) {
    console.error('ImageKit upload error:', error.response?.data || error.message);
    throw new Error(`ImageKit upload failed: ${error.response?.data?.message || error.message}`);
  }
};

const deleteFromImageKit = async (fileId) => {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('ImageKit is not configured.');
  }

  try {
    const auth = Buffer.from(`${privateKey}:`).toString('base64');
    
    await axios.delete(`https://api.imagekit.io/v1/files/${fileId}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });
    
    return { success: true };
  } catch (error) {
    throw new Error(`ImageKit delete failed: ${error.message}`);
  }
};

module.exports = {
  uploadToImageKit,
  deleteFromImageKit,
};
