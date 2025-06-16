require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkUserPermissions() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const users = await db.collection('users').find({}).toArray();
    
    console.log('\n📋 All users and their permissions:');
    console.log('==========================================');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. User: ${user.username || user.email || 'No username/email'}`);
      console.log(`   ID: ${user._id}`);
      console.log(`   canPost: ${user.canPost}`);
      console.log(`   isAdmin: ${user.isAdmin}`);
      console.log(`   isVerified: ${user.isVerified}`);
      console.log(`   verificationStatus: ${user.verificationStatus}`);
      console.log(`   profileComplete: ${user.profileComplete}`);
      console.log('   ---');
    });
    
    const usersWithoutPosting = users.filter(user => !user.canPost && !user.isAdmin);
    console.log(`\n🚫 Users without posting permissions: ${usersWithoutPosting.length}`);
    
    if (usersWithoutPosting.length > 0) {
      console.log('\nUsers who cannot post:');
      usersWithoutPosting.forEach(user => {
        console.log(`- ${user.username || user.email || user._id}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkUserPermissions();
