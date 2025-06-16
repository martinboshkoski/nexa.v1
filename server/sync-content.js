const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb+srv://terminalnexa:Dav1dBoshkosk1@nexacluster.ddjqk.mongodb.net/nexa';

async function syncContentToSocialFeed() {
  console.log('Starting content sync...');
  const client = new MongoClient(uri);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('nexa');
    const socialPostsCollection = db.collection('socialposts');
    
    // Get admin user
    const adminUser = await db.collection('users').findOne({ isAdmin: true });
    if (!adminUser) {
      throw new Error('No admin user found');
    }
    
    const adminUserId = adminUser._id;
    let createdPosts = 0;

    // Sync News
    const newsCollection = db.collection('news');
    const newsItems = await newsCollection.find({}).toArray();
    console.log(`Found ${newsItems.length} news items to sync`);
    
    for (const news of newsItems) {
      const existingPost = await socialPostsCollection.findOne({
        originalContentId: news._id.toString(),
        postType: 'admin_news'
      });

      if (!existingPost) {
        await socialPostsCollection.insertOne({
          content: `📰 ${news.title}\n\n${news.content ? news.content.substring(0, 200) + '...' : ''}`,
          author: adminUserId,
          companyName: 'Nexa Admin',
          companyMission: 'Business news and updates',
          companyWebsite: '',
          isApproved: true,
          postType: 'admin_news',
          originalContentId: news._id.toString(),
          originalContentModel: 'News',
          createdAt: news.createdAt || new Date(),
          updatedAt: new Date(),
          likes: [],
          comments: [],
          images: [],
          visibility: 'public'
        });
        createdPosts++;
      }
    }

    // Sync Investments
    const investmentsCollection = db.collection('investments');
    const investments = await investmentsCollection.find({}).toArray();
    console.log(`Found ${investments.length} investment items to sync`);
    
    for (const investment of investments) {
      const existingPost = await socialPostsCollection.findOne({
        originalContentId: investment._id.toString(),
        postType: 'admin_investment'
      });

      if (!existingPost) {
        await socialPostsCollection.insertOne({
          content: `💰 Investment Opportunity: ${investment.title}\n\n${investment.description ? investment.description.substring(0, 200) + '...' : ''}`,
          author: adminUserId,
          companyName: 'Nexa Capital',
          companyMission: 'Connecting investors with promising opportunities',
          companyWebsite: 'https://nexa.com/investments',
          companyEmail: 'investments@nexa.com',
          companyIndustry: 'Financial Services',
          companyDescription: 'Premier investment platform for growth opportunities',
          isApproved: true,
          postType: 'admin_investment',
          originalContentId: investment._id.toString(),
          originalContentModel: 'Investment',
          createdAt: investment.createdAt || new Date(),
          updatedAt: new Date(),
          likes: [],
          comments: [],
          images: [],
          visibility: 'public'
        });
        createdPosts++;
      }
    }

    console.log(`Successfully synced ${createdPosts} posts to social feed`);
    
    // Verify the sync
    const totalSocialPosts = await socialPostsCollection.countDocuments();
    console.log(`Total social posts in database: ${totalSocialPosts}`);
    
  } catch (error) {
    console.error('Error syncing content:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    console.log('Closing connection...');
    await client.close();
  }
}

syncContentToSocialFeed().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
