const { MongoClient } = require('mongodb');

async function checkUserCompanyInfo() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa_bilingual_db';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    
    console.log('🔍 Checking user company information...');
    
    // Find all users with companyInfo
    const users = await db.collection('users').find({
      companyInfo: { $exists: true }
    }).toArray();
    
    console.log(`📊 Found ${users.length} users with company info:`);
    
    users.forEach((user, index) => {
      console.log(`\n👤 User ${index + 1}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Company Info:`, JSON.stringify(user.companyInfo, null, 2));
      
      if (user.companyInfo?.logoUrl) {
        console.log(`  ✅ Logo URL present: ${user.companyInfo.logoUrl}`);
      } else {
        console.log(`  ❌ No logo URL found`);
      }
    });
    
    // Check recent social posts to see if they have author companyInfo
    console.log('\n🔍 Checking recent social posts...');
    const posts = await db.collection('socialposts').aggregate([
      { $sort: { createdAt: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'authorInfo'
        }
      },
      { $unwind: '$authorInfo' }
    ]).toArray();
    
    posts.forEach((post, index) => {
      console.log(`\n📝 Post ${index + 1}:`);
      console.log(`  Content: ${post.content.substring(0, 50)}...`);
      console.log(`  Author: ${post.authorInfo.email}`);
      console.log(`  Company Info:`, post.authorInfo.companyInfo ? 'Present' : 'Missing');
      if (post.authorInfo.companyInfo?.logoUrl) {
        console.log(`  ✅ Logo URL in post: ${post.authorInfo.companyInfo.logoUrl}`);
      } else {
        console.log(`  ❌ No logo URL in post data`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkUserCompanyInfo();
