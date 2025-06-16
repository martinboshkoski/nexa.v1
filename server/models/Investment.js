
/**
 * Investment Model Schema Definition
 * Used for managing investment opportunities
 */

const { ObjectId } = require('mongodb');

const InvestmentSchema = {
  title: {
    type: 'string',
    required: true
  },
  description: {
    type: 'string',
    required: true
  },
  amount: {
    type: 'number',
    required: true,
    min: 0
  },
  type: {
    type: 'string',
    required: true,
    enum: ['startup', 'real-estate', 'business', 'other'],
    default: 'other'
  },
  location: {
    type: 'string',
    required: true
  },
  images: {
    type: 'array',
    items: {
      type: 'string'
    },
    default: []
  },
  contactInfo: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      email: { type: 'string' },
      phone: { type: 'string' }
    },
    default: {}
  },
  author: {
    type: 'objectId',
    required: true
  },
  status: {
    type: 'string',
    enum: ['open', 'closed', 'pending'],
    default: 'open'
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
const InvestmentIndexes = [
  { key: { createdAt: -1 }, name: 'createdAt_desc' },
  { key: { author: 1 }, name: 'author_asc' },
  { key: { type: 1 }, name: 'type_asc' },
  { key: { status: 1 }, name: 'status_asc' },
  { key: { location: 1 }, name: 'location_asc' },
  { key: { title: 'text', description: 'text' }, name: 'investment_text_search' }
];

// Validation function
function validateInvestment(investment) {
  const errors = [];
  
  if (!investment.title || investment.title.trim().length === 0) {
    errors.push('Title is required');
  }
  if (!investment.description || investment.description.trim().length === 0) {
    errors.push('Description is required');
  }
  if (investment.amount === undefined || investment.amount === null) {
    errors.push('Investment amount is required');
  }
  if (investment.amount < 0) {
    errors.push('Investment amount must be non-negative');
  }
  if (!investment.location || investment.location.trim().length === 0) {
    errors.push('Location is required');
  }
  if (!investment.author) {
    errors.push('Author is required');
  }
  
  // Validate type
  const validTypes = ['startup', 'real-estate', 'business', 'other'];
  if (investment.type && !validTypes.includes(investment.type)) {
    errors.push('Invalid investment type');
  }
  
  // Validate status
  const validStatuses = ['open', 'closed', 'pending'];
  if (investment.status && !validStatuses.includes(investment.status)) {
    errors.push('Invalid status');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Sanitization function
function sanitizeInvestment(investment) {
  const sanitized = { ...investment };
  
  // Trim string fields
  if (sanitized.title) sanitized.title = sanitized.title.trim();
  if (sanitized.description) sanitized.description = sanitized.description.trim();
  if (sanitized.location) sanitized.location = sanitized.location.trim();
  if (sanitized.type) sanitized.type = sanitized.type.trim();
  if (sanitized.status) sanitized.status = sanitized.status.trim();
  
  // Convert author to ObjectId if it's a string
  if (sanitized.author && typeof sanitized.author === 'string') {
    try {
      sanitized.author = new ObjectId(sanitized.author);
    } catch (error) {
      // Keep as string if conversion fails
    }
  }
  
  // Ensure amount is a number
  if (sanitized.amount && typeof sanitized.amount === 'string') {
    sanitized.amount = parseFloat(sanitized.amount);
  }
  
  // Set defaults
  sanitized.type = sanitized.type || 'other';
  sanitized.status = sanitized.status || 'open';
  sanitized.images = sanitized.images || [];
  sanitized.contactInfo = sanitized.contactInfo || {};
  
  // Set timestamps
  const now = new Date();
  if (!sanitized.createdAt) sanitized.createdAt = now;
  sanitized.updatedAt = now;
  
  return sanitized;
}

module.exports = {
  InvestmentSchema,
  InvestmentIndexes,
  validateInvestment,
  sanitizeInvestment,
  collectionName: 'investments'
};
