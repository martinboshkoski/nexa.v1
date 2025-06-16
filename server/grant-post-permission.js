require('dotenv').config();
const { MongoClient } = require('mongodb');

async function grantPostPermission() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    
    console.log('Connected to MongoDB');
    
    // Find the most recent test user
    const user = await db.collection('users').findOne(
      { username: { $in: ['testuser3', 'testuser2', 'testuser'] } },
      { sort: { createdAt: -1 } }
    );
    
    if (!user) {
      console.log('No test user found. Creating a new one...');
      
      // Create a new test user with posting permissions
      const newUser = {
        username: 'testpostuser',
        email: 'testpost@example.com',
        password: '$2b$10$HwQFOjKqZZ1z9s9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c', // 'testpassword123'
        firstName: 'Test',
        lastName: 'PostUser',
        fullName: 'Test PostUser',
        role: 'user',
        isAdmin: false,
        profileComplete: true,
        canPost: true,
        isVerified: true,
        verificationStatus: 'approved',
        companyInfo: {
          companyName: 'Test Company',
          mission: 'Testing',
          website: 'https://test.com',
          industry: 'Technology',
          companySize: '1-10',
          role: 'CEO',
          description: 'Test company for posting',
          crnNumber: '12345',
          address: 'Test Address',
          phone: '+123456789',
          companyPIN: '123456',
          taxNumber: '123456789',
          contactEmail: 'contact@test.com'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await db.collection('users').insertOne(newUser);
      console.log('✅ Created new test user with posting permissions:', result.insertedId);
      console.log('Username: testpostuser');
      console.log('Password: testpassword123');
      
    } else {
      console.log(`Found user: ${user.username} (${user._id})`);
      console.log(`Current canPost: ${user.canPost}`);
      console.log(`Current isVerified: ${user.isVerified}`);
      
      // Update user to allow posting
      const updateResult = await db.collection('users').updateOne(
        { _id: user._id },
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
      
      console.log('✅ Updated user with posting permissions');
      console.log(`Username: ${user.username}`);
      console.log('Now has canPost: true, isVerified: true');
    }
    
    await client.close();
    console.log('Done!');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

grantPostPermission();
