require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

async function grantPostingToAllUsers() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Find all regular users (non-admin)
    const users = await db.collection('users').find({ 
      isAdmin: { $ne: true },
      canPost: { $ne: true }
    }).toArray();
    
    console.log(`Found ${users.length} users without posting permissions`);
    
    if (users.length === 0) {
      console.log('No users need posting permissions updated');
      return;
    }
    
    // Update all users to allow posting
    const result = await db.collection('users').updateMany(
      { 
        isAdmin: { $ne: true },
        canPost: { $ne: true }
      },
      { 
        $set: { 
          canPost: true,
          isVerified: true,
          verificationStatus: 'approved',
          profileComplete: true,
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} users with posting permissions`);
    
    // Show updated users
    const updatedUsers = await db.collection('users').find({
      isAdmin: { $ne: true },
      canPost: true
    }).toArray();
    
    console.log('\n📋 Users with posting permissions:');
    updatedUsers.forEach(user => {
      console.log(`- ${user.username || user.email || user._id} (canPost: ${user.canPost}, isVerified: ${user.isVerified})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

grantPostingToAllUsers();
