#!/usr/bin/env node

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa';

async function monitorUsers() {
  let client;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('🔍 User Monitor Started');
    
    const db = client.db();
    
    // Check every 30 seconds
    setInterval(async () => {
      try {
        const users = await db.collection('users').find({}).toArray();
        const timestamp = new Date().toISOString();
        const logEntry = `${timestamp}: Found ${users.length} users\n`;
        
        console.log(`${timestamp}: 👥 ${users.length} users in database`);
        
        // Log to file
        fs.appendFileSync('user-monitor.log', logEntry);
        
        // List usernames
        if (users.length > 0) {
          const usernames = users.map(u => u.username || u.email).join(', ');
          console.log(`   Users: ${usernames}`);
          fs.appendFileSync('user-monitor.log', `   Users: ${usernames}\n`);
        }
        
      } catch (error) {
        console.error('Monitor error:', error);
      }
    }, 30000); // Check every 30 seconds
    
  } catch (error) {
    console.error('❌ Monitor setup error:', error);
  }
}

console.log('Starting user monitoring...');
console.log('Press Ctrl+C to stop');
monitorUsers();
