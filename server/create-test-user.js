#!/usr/bin/env node

require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa';

async function createTestUser() {
  console.log('👤 Creating test user n@n.com...');
  
  let client;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ username: 'n@n.com' });
    if (existingUser) {
      console.log('⚠️  User n@n.com already exists!');
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('n@n.com', 10);
    
    // Create user
    const newUser = {
      username: 'n@n.com',
      email: 'n@n.com',
      password: hashedPassword,
      fullName: 'Test User N',
      profileComplete: false,
      isAdmin: false,
      companyInfo: {
        companyName: '',
        mission: '',
        website: '',
        industry: '',
        companySize: '',
        role: '',
        description: '',
        crnNumber: '',
        address: '',
        phone: '',
        companyPIN: '',
        taxNumber: '',
        contactEmail: ''
      },
      isVerified: false,
      verificationStatus: 'pending',
      profileImage: '',
      googleId: null,
      facebookId: null,
      linkedinId: null,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await usersCollection.insertOne(newUser);
    console.log('✅ User created successfully!');
    console.log(`🆔 User ID: ${result.insertedId}`);
    console.log('🔑 Username: n@n.com');
    console.log('🔑 Password: n@n.com');
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

createTestUser();
