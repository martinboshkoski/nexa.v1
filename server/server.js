require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const passport = require('passport');
const path = require('path');
const fs = require('fs').promises;

// Settings Manager - Load first to control feature availability
const settings = require('./config/settingsManager');

// Security middleware imports
const { 
  configureSecurityHeaders, 
  generalRateLimit, 
  authRateLimit,
  securityLogger,
  requestSizeLimiter
} = require('./middleware/security');
const { sanitizeRequest } = require('./middleware/validation');

// Conditional middleware imports based on settings
let setCSRFToken, verifyCSRFToken, getCSRFToken, exemptCSRF;
if (settings.isMiddlewareEnabled('csrf')) {
  const csrfModule = require('./middleware/csrf');
  setCSRFToken = csrfModule.setCSRFToken;
  verifyCSRFToken = csrfModule.verifyCSRFToken;
  getCSRFToken = csrfModule.getCSRFToken;
  exemptCSRF = csrfModule.exemptCSRF;
}

const cookieParser = require('cookie-parser');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;

console.log('🚀 Nexa Platform Server Starting...');
console.log(`📋 Current Environment: ${settings.getEnvironment()}`);
console.log(`🔧 Active Features: ${settings.getEnabledFeatures().map(f => f.name).join(', ')}`);

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
    'http://127.0.0.1:3004',
    'https://nexa-v1.vercel.app',
    'https://nexa-v1-git-main-martinboshkoskis-projects.vercel.app' // Alternative Vercel URL
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

// Mount auto-documents routes BEFORE CSRF middleware (no CSRF for JWT-protected API)
app.use('/api/auto-documents', require('./routes/autoDocuments'));

// CSRF Protection setup (conditional)
if (settings.isMiddlewareEnabled('csrf') && setCSRFToken) {
  app.use(setCSRFToken); // Set CSRF tokens for all requests
  console.log('✅ CSRF protection enabled');
} else {
  console.log('⚠️  CSRF protection disabled');
}

app.use(passport.initialize());

// API Routes
console.log('🔌 Wiring up API routes...');
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/documents', require('./routes/documents'));

// Create uploads directories if they don't exist
async function createUploadDirs() {
  const dirs = [
    'public/uploads',
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
    
    // Step 2: DISABLED - Remove duplicate documents (this was deleting users)
    console.log('⚠️ Duplicate cleanup DISABLED to prevent user deletion');
    
    // COMMENTED OUT: Remove duplicate usernames (keep first)
    /*
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
    */
    
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
    console.log('Initializing services and creating indexes...');
    
    // Import and initialize services
    const UserService = require('./services/userService');
    const SocialPostService = require('./services/socialPostService');
    const InvestmentService = require('./services/investmentService');
    
    new UserService(database);
    new SocialPostService(database);
    new InvestmentService(database);
    
    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Error initializing services:', error);
    // Don't exit, just log the error as services might still work
  }
}

async function connectToDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa';
    // Debug log (hide password for security)
    const safeUri = mongoUri.replace(/:([^:@]+)@/, ':****@');
    console.log('Attempting to connect to MongoDB with URI:', safeUri);
    console.log('MONGODB_URI environment variable is set:', !!process.env.MONGODB_URI);
    
    const client = new MongoClient(mongoUri);
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
    
    // In development with nodemon, don't exit immediately - allow for fixes
    if (process.env.NODE_ENV === 'development' && process.env.npm_lifecycle_event === 'dev') {
      console.log('💡 Development mode: Server will wait for file changes instead of exiting');
      console.log('💡 Fix the MongoDB connection issue and save a file to restart');
      return null; // Return null instead of exiting
    } else {
      process.exit(1);
    }
  }
}

// API Routes (registered after passport config)
function registerRoutes() {
  // CSRF token endpoint (only if CSRF is enabled)
  if (settings.isMiddlewareEnabled('csrf') && getCSRFToken) {
    app.get('/api/csrf-token', getCSRFToken);
    console.log('✅ CSRF token endpoint registered');
  }
  
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
    '/blogs',                   // Blog posts (JWT protected)
  ];
  
  // Apply CSRF exemptions only if CSRF is enabled
  if (settings.isMiddlewareEnabled('csrf') && exemptCSRF) {
    app.use('/api/', exemptCSRF(csrfExemptRoutes));
    console.log('✅ CSRF exemptions applied');
  }
  
  // Core authentication routes (always enabled)
  if (settings.isRouteEnabled('auth')) {
    app.use('/api/auth', require('./routes/auth'));
    console.log('✅ Auth routes loaded');
  }
  
  if (settings.isRouteEnabled('profile')) {
    app.use('/api/users', require('./routes/users'));
    console.log('✅ User/Profile routes loaded');
  }
  
  // Document automation routes (current focus)
  if (settings.isRouteEnabled('documents')) {
    app.use('/api/documents', require('./routes/documents'));
    console.log('✅ Document routes loaded');
  }
  
  // Contact/verification routes
  if (settings.isRouteEnabled('contact')) {
    app.use('/api/contact', require('./routes/contact'));
    console.log('✅ Contact routes loaded');
  }
  
  if (settings.isRouteEnabled('verification')) {
    app.use('/api/verification', require('./routes/verification'));
    console.log('✅ Verification routes loaded');
  }
  
  // Conditional feature routes (disabled by default in current settings)
  if (settings.isRouteEnabled('blog')) {
    try {
      app.use('/api/blogs', require('./routes/blogs'));
      console.log('✅ Blog routes loaded');
    } catch (error) {
      console.log('⚠️  Blog routes file not found - skipping');
    }
  }
  
  if (settings.isRouteEnabled('investments')) {
    try {
      app.use('/api/investments', require('./routes/investments'));
      console.log('✅ Investment routes loaded');
    } catch (error) {
      console.log('⚠️  Investment routes file not found - skipping');
    }
  }
  
  if (settings.isRouteEnabled('social')) {
    try {
      app.use('/api/social', require('./routes/social'));
      console.log('✅ Social media routes loaded');
    } catch (error) {
      console.log('⚠️  Social routes file not found - skipping');
    }
  }
  
  if (settings.isRouteEnabled('notifications')) {
    try {
      app.use('/api/notifications', require('./routes/notifications'));
      console.log('✅ Notification routes loaded');
    } catch (error) {
      console.log('⚠️  Notification routes file not found - skipping');
    }
  }
  
  if (settings.isRouteEnabled('analytics')) {
    try {
      app.use('/api/analytics', require('./routes/analytics'));
      console.log('✅ Analytics routes loaded');
    } catch (error) {
      console.log('⚠️  Analytics routes file not found - skipping');
    }
  }
  
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
    const database = await connectToDatabase();
    
    // Only proceed if database connection was successful
    if (database) {
      require('./config/passport')(database); // Register passport strategies with db
      registerRoutes();
      app.locals.initialized = true;
      console.log('✅ Server initialization complete');
    } else {
      console.log('❌ Server initialization failed - no database connection');
      return null;
    }
  }
  return app;
}

// Traditional server environment
async function startServer() {
  try {
    await initializeServer();
    
    // Only start the server if initialization was successful
    if (app.locals.initialized) {
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
    } else {
      console.log('🔄 Server not started due to initialization failure. Fix issues and save files to restart.');
    }
  } catch (error) {
    console.error('Server startup error:', error);
    if (process.env.NODE_ENV === 'development' && process.env.npm_lifecycle_event === 'dev') {
      console.log('🔄 Development mode: Fix errors and save files to restart');
    } else {
      process.exit(1);
    }
  }
}

startServer();
module.exports = app;