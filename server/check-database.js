#!/usr/bin/env node

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa';

async function viewDatabase() {
  console.log('📊 Database Status Checker');
  console.log('==========================');
  
  let client;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    console.log(`🔗 URI: ${MONGODB_URI.replace(/:[^:]*@/, ':***@')}`); // Hide password
    
    const db = client.db();
    
    // Check users
    console.log('\n👥 USERS:');
    const users = await db.collection('users').find({}).toArray();
    console.log(`📊 Total users: ${users.length}`);
    
    if (users.length > 0) {
      console.log('📋 User list:');
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.username || user.email || 'No username'} (${user._id})`);
        console.log(`     Created: ${user.createdAt || 'Unknown'}`);
        console.log(`     Profile Complete: ${user.profileComplete || false}`);
        console.log(`     Admin: ${user.isAdmin || false}`);
      });
    } else {
      console.log('❌ No users found');
    }
    
    // Check other collections
    console.log('\n📰 NEWS:');
    const newsCount = await db.collection('news').countDocuments();
    console.log(`📊 Total news items: ${newsCount}`);
    
    console.log('\n💰 INVESTMENTS:');
    const investmentsCount = await db.collection('investments').countDocuments();
    console.log(`📊 Total investments: ${investmentsCount}`);
    
    console.log('\n🏢 COMPANIES:');
    const companiesCount = await db.collection('companies').countDocuments();
    console.log(`📊 Total companies: ${companiesCount}`);
    
    console.log('\n🗂️  COLLECTIONS:');
    const collections = await db.listCollections().toArray();
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error connecting to database:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

viewDatabase();
