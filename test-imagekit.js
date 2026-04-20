#!/usr/bin/env node
// Test ImageKit connectivity
require('dotenv').config({ path: '.env' });

const ImageKit = require('imagekit');

console.log('Testing ImageKit connection...');
console.log('Environment variables:');
console.log('  IMAGEKIT_PUBLIC_KEY:', process.env.IMAGEKIT_PUBLIC_KEY ? 'SET' : 'MISSING');
console.log('  IMAGEKIT_PRIVATE_KEY:', process.env.IMAGEKIT_PRIVATE_KEY ? 'SET' : 'MISSING');
console.log('  IMAGEKIT_URL_ENDPOINT:', process.env.IMAGEKIT_URL_ENDPOINT);

const publicKey = process.env.IMAGEKIT_PUBLIC_KEY.replace(/^public_/, '');
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY.replace(/^private_/, '');
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

console.log('\nUsing credentials:');
console.log('  Public Key (no prefix):', publicKey.substring(0, 10) + '...');
console.log('  URL Endpoint:', urlEndpoint);

try {
  const ik = new ImageKit({
    publicKey,
    privateKey,
    urlEndpoint,
  });

  console.log('\n✅ ImageKit SDK initialized successfully');

  // Test: list files (requires auth)
  ik.listFiles({ type: 'file', limit: 1 })
    .then(res => {
      console.log('✅ Authentication successful! Found', res.result?.totalCount || 0, 'files');
      console.log('First few files:', res.result?.files?.map(f => f.name) || []);
    })
    .catch(err => {
      console.error('❌ Authentication failed:', err.message);
      console.error('Status Code:', err.statusCode);
      console.error('Full error:', err);
      process.exit(1);
    });

} catch (err) {
  console.error('❌ Failed to initialize ImageKit:', err.message);
  process.exit(1);
}
