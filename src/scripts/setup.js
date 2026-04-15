/**
 * Setup Script - Creates ONLY the initial admin user
 * Everything else (products, categories, hero slides, announcements)
 * must be added via the Admin Panel.
 * 
 * Run: npm run setup
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

async function setup() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('\n✅ Admin user already exists: ' + existingAdmin.email);
      console.log('   Login at: http://localhost:3001/login');
      process.exit(0);
      return;
    }

    console.log('\n👤 Creating admin user...');
    await User.create({
      email: 'admin@aghaz.com',
      password: 'admin123',
      role: 'admin',
    });
    console.log('✅ Admin user created:');
    console.log('   Email: admin@aghaz.com');
    console.log('   Password: admin123');
    console.log('\n⚠️  Change the password after first login!');
    console.log('\n📌 Next steps:');
    console.log('   1. Login to admin panel: http://localhost:3001/login');
    console.log('   2. Add categories → products → hero slides → announcements');
    console.log('   3. Configure ImageKit in .env for image uploads');

    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setup();
