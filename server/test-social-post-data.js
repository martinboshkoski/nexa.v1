// Test script to verify social post data structure
const { MongoClient } = require('mongodb');

async function testSocialPostData() {
  let client;
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa';
    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const socialPostsCollection = db.collection('socialposts');
    
    // Find a recent post and show its structure
    console.log('📋 Sample social post structure:');
    
    // Simulate the aggregation pipeline used in the newsfeed
    const samplePost = await socialPostsCollection.aggregate([
      { $sort: { createdAt: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author',
          pipeline: [
            {
              $project: {
                companyInfo: 1,
                profileImage: 1,
                email: 1
              }
            }
          ]
        }
      },
      { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } }
    ]).toArray();
    
    if (samplePost.length > 0) {
      console.log(JSON.stringify(samplePost[0], null, 2));
      console.log('\n🔍 Company Info Structure:');
      console.log('- Company Name:', samplePost[0].author?.companyInfo?.companyName || 'Not available');
      console.log('- Address:', samplePost[0].author?.companyInfo?.address || 'Not available');
      console.log('- Contact Email:', samplePost[0].author?.companyInfo?.contactEmail || 'Not available');
      console.log('- Website:', samplePost[0].author?.companyInfo?.website || 'Not available');
      console.log('- Tax Number:', samplePost[0].author?.companyInfo?.taxNumber || 'Not available');
    } else {
      console.log('No posts found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the test
testSocialPostData();
