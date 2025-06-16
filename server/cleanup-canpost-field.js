#!/usr/bin/env node

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa-bilingual';

async function removeCanPostField() {
  console.log('🧹 Removing canPost field from all users...');
  
  let client;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Get current user count with canPost field
    const usersWithCanPost = await usersCollection.countDocuments({ canPost: { $exists: true } });
    console.log(`📊 Found ${usersWithCanPost} users with canPost field`);
    
    if (usersWithCanPost === 0) {
      console.log('✅ No users have canPost field - cleanup already complete!');
      return;
    }
    
    // Remove the canPost field from all users
    const result = await usersCollection.updateMany(
      { canPost: { $exists: true } },
      { $unset: { canPost: "" } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} users`);
    
    // Drop the canPost index if it exists
    try {
      await usersCollection.dropIndex('canPost_1');
      console.log('✅ Dropped canPost index');
    } catch (error) {
      console.log('ℹ️  canPost index was not found (already removed or never existed)');
    }
    
    // Verify cleanup
    const remainingUsersWithCanPost = await usersCollection.countDocuments({ canPost: { $exists: true } });
    
    if (remainingUsersWithCanPost === 0) {
      console.log('🎉 SUCCESS: All canPost fields have been removed!');
      console.log('📝 All users can now post without permission checks.');
    } else {
      console.log(`⚠️  WARNING: ${remainingUsersWithCanPost} users still have canPost field`);
    }
    
    // Show sample of users after cleanup
    const sampleUsers = await usersCollection.find({}, { 
      projection: { 
        _id: 1, 
        email: 1, 
        username: 1, 
        isAdmin: 1, 
        isVerified: 1,
        canPost: 1  // This should be undefined now
      } 
    }).limit(3).toArray();
    
    console.log('\n📋 Sample users after cleanup:');
    sampleUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username || user.email}`);
      console.log(`   isAdmin: ${user.isAdmin}`);
      console.log(`   isVerified: ${user.isVerified}`);
      console.log(`   canPost: ${user.canPost} (should be undefined)`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Connection closed');
    }
  }
}

removeCanPostField();
