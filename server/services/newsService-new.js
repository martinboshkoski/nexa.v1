// Native MongoDB News Service
// Replaces Mongoose News model with native MongoDB operations

const { ObjectId } = require('mongodb');
const { NewsIndexes, validateNews, sanitizeNews } = require('../models/News');

class NewsService {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('news');
    this.setupIndexes();
  }

  // Setup database indexes for efficient querying
  async setupIndexes() {
    try {
      // Create indexes based on News model definition
      for (const index of NewsIndexes) {
        await this.collection.createIndex(index.key, { name: index.name });
      }
      console.log('News indexes created successfully');
    } catch (error) {
      console.log('News indexes already exist or error creating them:', error.message);
    }
  }

  // Create a new news article
  async createNews(newsData) {
    // Validate news data
    const validation = validateNews(newsData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Sanitize and prepare news data
    const sanitizedNews = sanitizeNews(newsData);

    const result = await this.collection.insertOne(sanitizedNews);
    return { ...sanitizedNews, _id: result.insertedId };
  }

  // Find news by ID
  async findById(id) {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    return await this.collection.findOne({ _id: new ObjectId(id) });
  }

  // Get all news with filtering and pagination
  async getAllNews(options = {}) {
    const {
      page = 1,
      limit = 20,
      filter = {},
      sort = { createdAt: -1 },
      populateAuthor = false
    } = options;

    const skip = (page - 1) * limit;
    const query = { ...filter };

    let news;
    if (populateAuthor) {
      news = await this.collection.aggregate([
        { $match: query },
        { $sort: sort },
        { $skip: skip },
        { $limit: parseInt(limit) },
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'author',
            pipeline: [
              {
                $project: {
                  email: 1,
                  isVerified: 1
                }
              }
            ]
          }
        },
        {
          $unwind: {
            path: '$author',
            preserveNullAndEmptyArrays: true
          }
        }
      ]).toArray();
    } else {
      news = await this.collection.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .toArray();
    }

    return news;
  }

  // Get news by category
  async getNewsByCategory(category, options = {}) {
    return await this.getAllNews({
      ...options,
      filter: { category }
    });
  }

  // Get news by author
  async getNewsByAuthor(authorId, options = {}) {
    return await this.getAllNews({
      ...options,
      filter: { author: new ObjectId(authorId) }
    });
  }

  // Update news
  async updateNews(id, updateData) {
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid news ID');
    }

    // Sanitize update data
    const sanitizedUpdate = sanitizeNews(updateData);
    delete sanitizedUpdate._id; // Remove _id from update data

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: sanitizedUpdate },
      { returnDocument: 'after' }
    );

    return result.value;
  }

  // Delete news
  async deleteNews(id) {
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid news ID');
    }

    const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  // Search news
  async searchNews(searchTerm, options = {}) {
    const searchQuery = {
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { content: { $regex: searchTerm, $options: 'i' } }
      ]
    };

    return await this.getAllNews({
      ...options,
      filter: searchQuery
    });
  }

  // Count documents (for compatibility)
  async countDocuments(filter = {}) {
    return await this.collection.countDocuments(filter);
  }

  // Get distinct values (for compatibility)
  async distinct(field, filter = {}) {
    return await this.collection.distinct(field, filter);
  }

  // Aggregate (for compatibility)
  async aggregate(pipeline) {
    return await this.collection.aggregate(pipeline).toArray();
  }
}

module.exports = NewsService;
