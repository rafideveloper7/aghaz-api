let imagekit = null;

function getImageKit() {
  if (!imagekit) {
    const ImageKit = require('imagekit');
    
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

    if (!publicKey || !privateKey || !urlEndpoint) {
      console.warn('⚠️  ImageKit credentials not configured. Upload features will be disabled.');
      console.warn('   Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT in your .env file.');
      return null;
    }

    imagekit = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    });
  }
  return imagekit;
}

module.exports = { getImageKit };
