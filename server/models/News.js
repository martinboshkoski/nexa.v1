
/**
 * News Model Schema Definition
 * Used for managing news articles
 */

const { ObjectId } = require('mongodb');

const NewsSchema = {
  title: {
    type: 'string',
    required: true
  },
  content: {
    type: 'string',
    required: true
  },
  category: {
    type: 'string',
    required: true,
    enum: ['general', 'business', 'technology', 'economy'],
    default: 'general'
  },
  image: {
    type: 'string',
    required: false
  },
  author: {
    type: 'objectId',
    required: true
  },
  createdAt: {
    type: 'date',
    default: () => new Date()
  },
  updatedAt: {
    type: 'date',
    default: () => new Date()
  }
};

// Index definitions for MongoDB
const NewsIndexes = [
  { key: { createdAt: -1 }, name: 'createdAt_desc' },
  { key: { author: 1 }, name: 'author_asc' },
  { key: { category: 1 }, name: 'category_asc' },
  { key: { title: 'text', content: 'text' }, name: 'news_text_search' }
];

// Validation function
function validateNews(news) {
  const errors = [];
  
  if (!news.title || news.title.trim().length === 0) {
    errors.push('Title is required');
  }
  if (!news.content || news.content.trim().length === 0) {
    errors.push('Content is required');
  }
  if (!news.author) {
    errors.push('Author is required');
  }
  
  // Validate category
  const validCategories = ['general', 'business', 'technology', 'economy'];
  if (news.category && !validCategories.includes(news.category)) {
    errors.push('Invalid category');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Sanitization function
function sanitizeNews(news) {
  const sanitized = { ...news };
  
  // Trim string fields
  if (sanitized.title) sanitized.title = sanitized.title.trim();
  if (sanitized.content) sanitized.content = sanitized.content.trim();
  if (sanitized.category) sanitized.category = sanitized.category.trim();
  if (sanitized.image) sanitized.image = sanitized.image.trim();
  
  // Convert author to ObjectId if it's a string
  if (sanitized.author && typeof sanitized.author === 'string') {
    try {
      sanitized.author = new ObjectId(sanitized.author);
    } catch (error) {
      // Keep as string if conversion fails
    }
  }
  
  // Set defaults
  sanitized.category = sanitized.category || 'general';
  
  // Set timestamps
  const now = new Date();
  if (!sanitized.createdAt) sanitized.createdAt = now;
  sanitized.updatedAt = now;
  
  return sanitized;
}

module.exports = {
  NewsSchema,
  NewsIndexes,
  validateNews,
  sanitizeNews,
  collectionName: 'news'
};
