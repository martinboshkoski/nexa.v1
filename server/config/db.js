const { MongoClient } = require('mongodb');

// MongoDB Connection
const connectDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa');
    await client.connect();
    console.log('MongoDB connected successfully');
    return client.db();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = { connectDB };
