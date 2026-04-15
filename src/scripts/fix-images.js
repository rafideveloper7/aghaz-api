/**
 * Fix Script - Updates all product images to working Unsplash URLs
 * Run: node src/scripts/fix-images.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Product = require('../models/Product');

const WORKING_IMAGES = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
];

async function fixImages() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected');

    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products`);

    let updated = 0;
    for (const product of products) {
      const hasBrokenImages = product.images.some(img => img.includes('ik.imagekit.io'));
      if (hasBrokenImages || product.images.length === 0) {
        const idx = products.indexOf(product);
        product.images = [
          WORKING_IMAGES[idx % WORKING_IMAGES.length],
          WORKING_IMAGES[(idx + 1) % WORKING_IMAGES.length],
        ];
        await product.save();
        updated++;
        console.log(`   ✓ Updated: ${product.title}`);
      }
    }

    console.log(`\n✅ Updated ${updated} products with working images`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

fixImages();
