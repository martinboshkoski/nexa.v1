// Script to check and update user profiles with logo URLs and mission statements
const { MongoClient, ObjectId } = require('mongodb');

async function checkAndFixUserProfiles() {
  let client;
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa_bilingual_db';
    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    const companiesCollection = db.collection('companies');
    
    // 1. Check users with companyInfo
    console.log('\n🔍 Checking users with companyInfo...');
    const usersWithCompanyInfo = await usersCollection.find({
      companyInfo: { $exists: true }
    }).toArray();
    
    console.log(`Found ${usersWithCompanyInfo.length} users with companyInfo`);
    
    if (usersWithCompanyInfo.length > 0) {
      // Check if they have logoUrl and mission fields
      const usersNeedingUpdate = usersWithCompanyInfo.filter(user => 
        !user.companyInfo.logoUrl || !user.companyInfo.mission
      );
      
      console.log(`Found ${usersNeedingUpdate.length} users needing logoUrl or mission updates`);
      
      // Update users needing logoUrl and mission
      for (const user of usersNeedingUpdate) {
        console.log(`\n🔄 Updating user: ${user.email}`);
        
        // Generate a placeholder logo URL based on company name
        const companyName = user.companyInfo.companyName || '';
        const firstLetter = companyName.charAt(0).toUpperCase() || 'C';
        const logoUrl = `https://via.placeholder.com/80x80/4F46E5/FFFFFF?text=${firstLetter}`;
        
        // Generate a generic mission if needed
        const mission = user.companyInfo.mission || 'Our mission is to provide excellent services to our clients.';
        
        // Update the user's companyInfo
        await usersCollection.updateOne(
          { _id: user._id },
          { 
            $set: { 
              'companyInfo.logoUrl': logoUrl,
              'companyInfo.mission': mission
            } 
          }
        );
        
        console.log('✅ User updated with logoUrl and mission');
        
        // Also update the company collection if it exists
        const company = await companiesCollection.findOne({ userId: user._id });
        if (company) {
          await companiesCollection.updateOne(
            { userId: user._id },
            {
              $set: {
                logoUrl: logoUrl,
                mission: mission
              }
            }
          );
          console.log('✅ Company entry updated with logoUrl and mission');
        }
      }
    } else {
      console.log('No users with companyInfo found - creating a test user');
      
      // Create a test user with company info
      const testUser = {
        email: 'test@gvrl.mk',
        password: 'hashed_password',  // Would be hashed in a real scenario
        isActive: true,
        role: 'user',
        profileComplete: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        companyInfo: {
          companyName: 'GVRL',
          address: 'ул. Никола Парапунов бр. 5, Скопје - Карпош',
          taxNumber: '40453289423',
          contactEmail: 'gvrl@gvrl.mk',
          website: 'https://gvrl.mk',
          industry: 'Правни услуги',
          mission: 'Професионални правни услуги за сите клиенти.',
          logoUrl: 'https://via.placeholder.com/80x80/4F46E5/FFFFFF?text=G'
        }
      };
      
      const result = await usersCollection.insertOne(testUser);
      console.log(`✅ Created test user with ID: ${result.insertedId}`);
      
      // Create corresponding company entry
      await companiesCollection.insertOne({
        userId: result.insertedId,
        companyName: testUser.companyInfo.companyName,
        companyAddress: testUser.companyInfo.address,
        taxNumber: testUser.companyInfo.taxNumber,
        email: testUser.companyInfo.contactEmail,
        website: testUser.companyInfo.website,
        mission: testUser.companyInfo.mission,
        logoUrl: testUser.companyInfo.logoUrl,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ Created company entry for test user');
      
      // Create a test post
      const socialPostsCollection = db.collection('socialposts');
      await socialPostsCollection.insertOne({
        content: 'This is a test post to verify company logo display.',
        author: result.insertedId,
        postType: 'user_post',
        likes: [],
        comments: [],
        isApproved: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ Created test post for test user');
    }
    
    // Verify all users now have logo URLs and missions
    const updatedUsers = await usersCollection.find({
      companyInfo: { $exists: true }
    }).toArray();
    
    console.log(`\n🔍 Verification: Found ${updatedUsers.length} users with companyInfo`);
    
    for (const user of updatedUsers) {
      console.log(`\n👤 User: ${user.email}`);
      console.log(`- Company Name: ${user.companyInfo.companyName || 'Not set'}`);
      console.log(`- Logo URL: ${user.companyInfo.logoUrl || 'Not set'}`);
      console.log(`- Mission: ${user.companyInfo.mission || 'Not set'}`);
    }
    
    console.log('\n✅ User profile check and update completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('📄 MongoDB connection closed');
    }
  }
}

checkAndFixUserProfiles();
