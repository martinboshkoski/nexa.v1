const { MongoClient } = require('mongodb');

async function checkAllUsers() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa_bilingual_db';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    
    console.log('🔍 Checking ALL users...');
    
    // Find all users
    const users = await db.collection('users').find({}).toArray();
    
    console.log(`📊 Found ${users.length} total users:`);
    
    users.forEach((user, index) => {
      console.log(`\n👤 User ${index + 1}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Profile Complete: ${user.profileComplete || false}`);
      console.log(`  Has Company Info: ${user.companyInfo ? 'Yes' : 'No'}`);
      
      if (user.companyInfo) {
        console.log(`  Company Info:`, JSON.stringify(user.companyInfo, null, 2));
      }
    });
    
    // Also check companies collection
    console.log('\n🔍 Checking companies collection...');
    const companies = await db.collection('companies').find({}).toArray();
    console.log(`📊 Found ${companies.length} companies in companies collection`);
    
    companies.forEach((company, index) => {
      console.log(`\n🏢 Company ${index + 1}:`);
      console.log(`  Name: ${company.companyName}`);
      console.log(`  Logo URL: ${company.logoUrl || 'Not set'}`);
      console.log(`  Mission: ${company.mission || 'Not set'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkAllUsers();
