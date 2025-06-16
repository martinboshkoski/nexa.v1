const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://terminalnexa:Dav1dBoshkosk1@nexacluster.ddjqk.mongodb.net/nexa';

async function fixIndexes() {
  const client = new MongoClient(uri);
  
  try {
    console.log('🔄 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('nexa');
    const collection = db.collection('users');
    
    console.log('📊 Current state:');
    const userCount = await collection.countDocuments();
    console.log(`Total users: ${userCount}`);
    
    // Step 1: Drop all indexes except _id (as per troubleshooting guide)
    console.log('\n🧹 Dropping problematic indexes...');
    const indexes = await collection.indexes();
    
    for (const index of indexes) {
      if (index.name !== '_id_') {
        try {
          await collection.dropIndex(index.name);
          console.log(`✅ Dropped index: ${index.name}`);
        } catch (error) {
          console.log(`⚠️ Could not drop index ${index.name}: ${error.message}`);
        }
      }
    }
    
    // Step 2: Remove duplicate documents before creating unique indexes
    console.log('\n🔍 Removing duplicate usernames...');
    
    // Find and remove duplicate usernames (keep the first one)
    const duplicateUsernames = await collection.aggregate([
      { $group: { _id: "$username", ids: { $push: "$_id" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    for (const duplicate of duplicateUsernames) {
      // Keep the first document, remove the rest
      const idsToRemove = duplicate.ids.slice(1);
      await collection.deleteMany({ _id: { $in: idsToRemove } });
      console.log(`✅ Removed ${idsToRemove.length} duplicate username documents for: ${duplicate._id}`);
    }
    
    // Find and remove duplicate emails
    console.log('\n🔍 Removing duplicate emails...');
    const duplicateEmails = await collection.aggregate([
      { $match: { email: { $ne: null, $ne: "" } } },
      { $group: { _id: "$email", ids: { $push: "$_id" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    for (const duplicate of duplicateEmails) {
      // Keep the first document, remove the rest
      const idsToRemove = duplicate.ids.slice(1);
      await collection.deleteMany({ _id: { $in: idsToRemove } });
      console.log(`✅ Removed ${idsToRemove.length} duplicate email documents for: ${duplicate._id}`);
    }
    
    // Step 3: Recreate proper sparse indexes (as per troubleshooting guide)
    console.log('\n🔧 Creating proper unique sparse indexes...');
    
    try {
      await collection.createIndex(
        { email: 1 }, 
        { unique: true, sparse: true, name: 'email_unique_sparse' }
      );
      console.log('✅ Created email unique sparse index');
    } catch (error) {
      console.log('⚠️ Email index creation failed:', error.message);
    }
    
    try {
      await collection.createIndex(
        { username: 1 }, 
        { unique: true, sparse: true, name: 'username_unique_sparse' }
      );
      console.log('✅ Created username unique sparse index');
    } catch (error) {
      console.log('⚠️ Username index creation failed:', error.message);
    }
    
    console.log('\n🎉 Index cleanup completed successfully');
    
    // Verify final state
    const finalUserCount = await collection.countDocuments();
    const finalIndexes = await collection.indexes();
    
    console.log('\n📊 Final state:');
    console.log(`Total users: ${finalUserCount}`);
    console.log('Indexes:', finalIndexes.map(i => i.name));
    
  } catch (error) {
    console.error('❌ Index fix failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the fix
console.log('🚀 Starting database index fix...');
fixIndexes().then(() => {
  console.log('✨ Database fix completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});
