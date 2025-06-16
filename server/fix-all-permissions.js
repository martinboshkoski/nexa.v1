require('dotenv').config();
const { MongoClient } = require('mongodb');

async function fixAllUserPermissions() {
  console.log('🔧 Fixing user permissions...');
  
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    
    // Update ALL users to have posting permissions
    const result = await db.collection('users').updateMany(
      {}, // Empty filter = all users
      { 
        $set: { 
          canPost: true,
          isVerified: true,
          profileComplete: true,
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} users with posting permissions`);
    
    // Verify the fix
    const totalUsers = await db.collection('users').countDocuments();
    const usersWithPosting = await db.collection('users').countDocuments({ canPost: true });
    
    console.log(`📊 Total users: ${totalUsers}`);
    console.log(`✅ Users with posting permissions: ${usersWithPosting}`);
    
    if (usersWithPosting === totalUsers) {
      console.log('🎉 SUCCESS: All users now have posting permissions!');
    } else {
      console.log('⚠️  Some users still don't have posting permissions');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('🔌 Connection closed');
  }
}

fixAllUserPermissions();
