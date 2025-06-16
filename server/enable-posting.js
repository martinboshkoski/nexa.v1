require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

async function enablePosting() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Update the most recent test user to allow posting
    const result = await db.collection('users').updateOne(
      { username: 'testuser3' },
      { 
        $set: { 
          canPost: true,
          isVerified: true,
          verificationStatus: 'approved',
          profileComplete: true
        }
      }
    );
    
    console.log('Update result:', result);
    
    // Verify the update
    const user = await db.collection('users').findOne({ username: 'testuser3' });
    console.log('Updated user:', {
      username: user.username,
      canPost: user.canPost,
      isVerified: user.isVerified,
      verificationStatus: user.verificationStatus
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

enablePosting();
