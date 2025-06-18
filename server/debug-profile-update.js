// Debug script to test profile completion update
const { MongoClient } = require('mongodb');

async function testProfileUpdate() {
  let client;
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa';
    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Find the user mentioned in the issue
    const user = await usersCollection.findOne({ username: 'gavril' });
    if (!user) {
      console.log('❌ User "gavril" not found');
      return;
    }
    
    console.log('📋 Current user data:');
    console.log(JSON.stringify(user, null, 2));
    
    // Simulate the exact update that should happen from the form
    const formData = {
      companyName: 'Test Company Name',
      companyAddress: 'Test Address 123',
      taxNumber: '123456789',
      email: 'test@company.com',
      website: 'https://testcompany.com'
    };
    
    // This mimics what happens in userController.createOrUpdateCompany
    const userCompanyInfoUpdate = {
      companyName: formData.companyName,
      address: formData.companyAddress, // Note: maps to 'address' not 'companyAddress'
      taxNumber: formData.taxNumber,
      contactEmail: formData.email,     // Note: maps to 'contactEmail' not 'email'
      website: formData.website
    };
    
    const userUpdatePayload = {
      profileComplete: true,
      companyInfo: userCompanyInfoUpdate,
      updatedAt: new Date()
    };
    
    console.log('🔄 Attempting to update with payload:');
    console.log(JSON.stringify(userUpdatePayload, null, 2));
    
    // Get current user to merge with existing companyInfo (mimicking userService logic)
    const currentUser = await usersCollection.findOne({ _id: user._id });
    const mergedCompanyInfo = {
      ...currentUser.companyInfo,
      ...userUpdatePayload.companyInfo
    };
    
    const finalUpdateDoc = {
      profileComplete: userUpdatePayload.profileComplete,
      companyInfo: mergedCompanyInfo,
      updatedAt: userUpdatePayload.updatedAt
    };
    
    console.log('📝 Final update document:');
    console.log(JSON.stringify(finalUpdateDoc, null, 2));
    
    // Perform the update
    const result = await usersCollection.findOneAndUpdate(
      { _id: user._id },
      { $set: finalUpdateDoc },
      { returnDocument: 'after' }
    );
    
    console.log('✅ Update successful!');
    console.log('📋 Updated user data:');
    console.log(JSON.stringify(result.value, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the test
testProfileUpdate();
