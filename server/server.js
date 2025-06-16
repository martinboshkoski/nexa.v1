require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const passport = require('passport');
const path = require('path');
const fs = require('fs').promises;

// Security middleware imports
const { 
  configureSecurityHeaders, 
  generalRateLimit, 
  authRateLimit,
  securityLogger,
  requestSizeLimiter
} = require('./middleware/security');
const { sanitizeRequest } = require('./middleware/validation');
const { setCSRFToken, verifyCSRFToken, getCSRFToken, exemptCSRF } = require('./middleware/csrf');
const cookieParser = require('cookie-parser');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;

if (!process.env.JWT_SECRET) {
  console.error('WARNING: JWT_SECRET is not set in environment variables');
  process.exit(1);
}

// Security Configuration
app.set('trust proxy', 1); // Trust first proxy for rate limiting

// Security Middleware (order matters!)
app.use(configureSecurityHeaders()); // Security headers
app.use(securityLogger); // Log suspicious activities
app.use(requestSizeLimiter('10mb')); // Limit request size

// CORS Configuration
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3003', 
    'http://localhost:3004',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3003',
    'http://127.0.0.1:3004'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'X-XSRF-Token']
}));

// Rate Limiting
app.use('/api/', generalRateLimit); // General API rate limiting
app.use('/api/auth/', authRateLimit); // Stricter rate limiting for auth

// Body parsing with security
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser()); // For CSRF token cookies

// Input sanitization
app.use(sanitizeRequest); // Sanitize all incoming requests

// CSRF Protection setup
app.use(setCSRFToken); // Set CSRF tokens for all requests

app.use(passport.initialize());

// Create uploads directories if they don't exist
async function createUploadDirs() {
  const dirs = [
    'public/uploads',
    'public/uploads/news',
    'public/uploads/investments',
    'public/uploads/verification'
  ];
  
  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  }
}

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Simple health check endpoint (no DB required)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Nexa Terminal API',
    status: 'Running',
    version: '1.0.0'
  });
});

// MongoDB Connection
let db;

// Database index cleanup function to fix authentication issues
async function fixDatabaseIndexes(database) {
  try {
    console.log('🔧 Checking and fixing database indexes...');
    const collection = database.collection('users');
    
    // Step 1: Drop problematic indexes (keep only _id)
    const indexes = await collection.indexes();
    const indexesToDrop = indexes.filter(index => 
      index.name !== '_id_' && 
      (index.name.includes('email') || index.name.includes('username'))
    );
    
    for (const index of indexesToDrop) {
      try {
        await collection.dropIndex(index.name);
        console.log(`✅ Dropped problematic index: ${index.name}`);
      } catch (error) {
        console.log(`⚠️ Could not drop index ${index.name}: ${error.message}`);
      }
    }
    
    // Step 2: Remove duplicate documents
    console.log('🧹 Cleaning duplicate documents...');
    
    // Remove duplicate usernames (keep first)
    const duplicateUsernames = await collection.aggregate([
      { $group: { _id: "$username", ids: { $push: "$_id" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    for (const duplicate of duplicateUsernames) {
      const idsToRemove = duplicate.ids.slice(1);
      await collection.deleteMany({ _id: { $in: idsToRemove } });
      console.log(`✅ Removed ${idsToRemove.length} duplicate username(s): ${duplicate._id}`);
    }
    
    // Remove duplicate emails (keep first)
    const duplicateEmails = await collection.aggregate([
      { $match: { email: { $ne: null, $ne: "" } } },
      { $group: { _id: "$email", ids: { $push: "$_id" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    for (const duplicate of duplicateEmails) {
      const idsToRemove = duplicate.ids.slice(1);
      await collection.deleteMany({ _id: { $in: idsToRemove } });
      console.log(`✅ Removed ${idsToRemove.length} duplicate email(s): ${duplicate._id}`);
    }
    
    // Step 3: Create proper sparse unique indexes
    try {
      await collection.createIndex(
        { email: 1 }, 
        { unique: true, sparse: true, name: 'email_unique_sparse' }
      );
      console.log('✅ Created email unique sparse index');
    } catch (error) {
      console.log('⚠️ Email index creation:', error.message);
    }
    
    try {
      await collection.createIndex(
        { username: 1 }, 
        { unique: true, sparse: true, name: 'username_unique_sparse' }
      );
      console.log('✅ Created username unique sparse index');
    } catch (error) {
      console.log('⚠️ Username index creation:', error.message);
    }
    
    console.log('🎉 Database index cleanup completed successfully');
  } catch (error) {
    console.error('❌ Database index fix failed:', error.message);
    // Don't exit - continue with normal startup
  }
}

// Service initialization function
async function initializeServices(database) {
  try {
    // Import all services
    const UserService = require('./services/userService');
    const SocialPostService = require('./services/socialPostService');
    const NewsService = require('./services/newsService');
    const InvestmentService = require('./services/investmentService');
    const CompanyVerificationService = require('./services/companyVerificationService');

    // Initialize services (this will create indexes)
    console.log('Initializing services and creating indexes...');
    
    new UserService(database);
    new SocialPostService(database);
    new NewsService(database);
    new InvestmentService(database);
    new CompanyVerificationService(database);
    
    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Error initializing services:', error);
    // Don't exit, just log the error as services might still work
  }
}

async function connectToDatabase() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa');
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db();
    app.locals.db = db;
    
    // Fix database indexes FIRST to resolve authentication issues
    await fixDatabaseIndexes(db);
    
    // Initialize all services and create indexes
    await initializeServices(db);
    
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// API Routes (registered after passport config)
function registerRoutes() {
  // CSRF token endpoint (before CSRF protection)
  app.get('/api/csrf-token', getCSRFToken);
  
  // Apply CSRF protection to all routes except exempted ones
  const csrfExemptRoutes = [
    '/csrf-token',              // CSRF token endpoint
    '/auth/register',           // User registration
    '/auth/login',              // Email/password login
    '/auth/login-username',     // Username/password login
    '/auth/direct-login',       // Direct login for testing
    '/auth/validate',           // Token validation
    '/auth/create-admin',       // Admin creation
    '/auth/logout',             // User logout
    /^\/contact\/public$/,      // Allow public contact form
    /^\/uploads\//,             // Static file uploads
    '/users/company',           // Exempt company profile update
    '/users/profile',           // Exempt user profile update (mark complete)
    '/social/posts',            // Social media posts
    '/social/newsfeed',         // Social media newsfeed
    /^\/social\/posts\/[^\/]+\/like$/,      // Like/unlike posts
    /^\/social\/posts\/[^\/]+\/comments$/,    // Comment on posts
    /^\/social\/posts\/[^\/]+$/,             // Individual post operations
  ];
  app.use('/api/', exemptCSRF(csrfExemptRoutes));
  
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/users', require('./routes/users'));
  app.use('/api/documents', require('./routes/documents'));
  app.use('/api/news', require('./routes/news'));
  app.use('/api/investments', require('./routes/investments'));
  app.use('/api/contact', require('./routes/contact'));
  app.use('/api/social', require('./routes/social'));
  app.use('/api/verification', require('./routes/verification'));
  
  // New enhanced routes
  app.use('/api/notifications', require('./routes/notifications'));
  app.use('/api/analytics', require('./routes/analytics'));
  
  // Error handling for multer file upload errors
  app.use((err, req, res, next) => {
    if (err.name === 'MulterError') {
      return res.status(400).json({
        message: err.message || 'File upload error'
      });
    }
    next(err);
  });

  // General error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message || 'Something went wrong!' });
  });
}

// Initialize server function for Vercel serverless
async function initializeServer() {
  // Only initialize if not already done
  if (!app.locals.initialized) {
    await createUploadDirs();
    await connectToDatabase();
    require('./config/passport')(db); // Register passport strategies with db
    registerRoutes();
    app.locals.initialized = true;
  }
  return app;
}

// Traditional server environment
async function startServer() {
  await initializeServer();
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Handle EADDRINUSE error gracefully
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${PORT} is already in use. Nodemon will attempt to restart.`);
      process.exit(1); // Exit the process so nodemon can restart
    } else {
      console.error('Server error:', err);
      process.exit(1); // Exit on other server errors too
    }
  });
}

startServer();
module.exports = app;