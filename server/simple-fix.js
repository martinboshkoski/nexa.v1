require('dotenv').config();
const { MongoClient } = require('mongodb');

async function fixPermissions() {
  try {
    console.log('Starting permission fix...');
    const client = new MongoClient(process.env.MONGODB_URI);
    
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Check current state
    const totalUsers = await db.collection('users').countDocuments();
    const usersWithoutPosting = await db.collection('users').countDocuments({
      canPost: { $ne: true }
    });
    
    console.log(`Total users: ${totalUsers}`);
    console.log(`Users without posting: ${usersWithoutPosting}`);
    
    if (usersWithoutPosting > 0) {
      // Update users
      const result = await db.collection('users').updateMany(
        { canPost: { $ne: true } },
        { 
          $set: { 
            canPost: true,
            isVerified: true,
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`Updated ${result.modifiedCount} users`);
    } else {
      console.log('All users already have posting permissions');
    }
    
    await client.close();
    console.log('Done!');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixPermissions();
