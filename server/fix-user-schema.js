// Quick test to check what's actually in the database
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

async function checkDatabaseContent() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Check the specific user from the issue (andrea@andrea.com)
    console.log('\n🔍 Checking user: andrea@andrea.com');
    const andreaUser = await usersCollection.findOne({ username: 'andrea@andrea.com' });
    
    if (andreaUser) {
      console.log('📋 User found:');
      console.log('- ID:', andreaUser._id);
      console.log('- Username:', andreaUser.username);
      console.log('- Email:', andreaUser.email);
      console.log('- Profile Complete:', andreaUser.profileComplete);
      console.log('- Company Info:');
      console.log(JSON.stringify(andreaUser.companyInfo, null, 2));
      
      // Check if companyInfo has the required fields
      const hasRequiredFields = 
        andreaUser.companyInfo.hasOwnProperty('companySize') &&
        andreaUser.companyInfo.hasOwnProperty('role');
      
      console.log('\n📊 Field Analysis:');
      console.log('- Has companySize field:', andreaUser.companyInfo.hasOwnProperty('companySize'));
      console.log('- Has role field:', andreaUser.companyInfo.hasOwnProperty('role'));
      console.log('- All required fields present:', hasRequiredFields);
      
      if (!hasRequiredFields) {
        console.log('\n🔧 ISSUE FOUND: Missing companySize and/or role fields in existing user');
        console.log('This user was created before we added these fields to the schema');
        
        // Fix this user by adding the missing fields
        const updateResult = await usersCollection.updateOne(
          { _id: andreaUser._id },
          {
            $set: {
              'companyInfo.companySize': '',
              'companyInfo.role': '',
              'companyInfo.contactEmail': andreaUser.companyInfo.contactEmail || ''
            }
          }
        );
        
        console.log('✅ Fixed user schema. Modified count:', updateResult.modifiedCount);
        
        // Re-fetch to confirm
        const fixedUser = await usersCollection.findOne({ _id: andreaUser._id });
        console.log('\n📋 After fix:');
        console.log(JSON.stringify(fixedUser.companyInfo, null, 2));
      }
      
    } else {
      console.log('❌ User not found');
    }
    
    // Also check how many users are missing these fields
    console.log('\n🔍 Checking all users for schema compatibility...');
    const usersWithoutFields = await usersCollection.find({
      $or: [
        { 'companyInfo.companySize': { $exists: false } },
        { 'companyInfo.role': { $exists: false } },
        { 'companyInfo.contactEmail': { $exists: false } }
      ]
    }).toArray();
    
    console.log(`📊 Found ${usersWithoutFields.length} users with missing schema fields`);
    
    if (usersWithoutFields.length > 0) {
      console.log('\n🔧 Fixing all users with missing schema fields...');
      
      const bulkOps = usersWithoutFields.map(user => ({
        updateOne: {
          filter: { _id: user._id },
          update: {
            $set: {
              'companyInfo.companySize': user.companyInfo.companySize || '',
              'companyInfo.role': user.companyInfo.role || '',
              'companyInfo.contactEmail': user.companyInfo.contactEmail || ''
            }
          }
        }
      }));
      
      const bulkResult = await usersCollection.bulkWrite(bulkOps);
      console.log('✅ Bulk update completed. Modified count:', bulkResult.modifiedCount);
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

checkDatabaseContent();
