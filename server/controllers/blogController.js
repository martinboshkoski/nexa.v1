const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;

class BlogController {
  constructor() {
    // Configure multer for image uploads
    this.upload = multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, 'public/uploads/blogs');
        },
        filename: (req, file, cb) => {
          const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
          cb(null, uniqueName);
        }
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only JPEG, PNG and WebP images are allowed.'));
        }
      }
    });

    // Bind methods to preserve 'this' context
    this.getAllBlogs = this.getAllBlogs.bind(this);
    this.getBlogById = this.getBlogById.bind(this);
    this.createBlog = this.createBlog.bind(this);
    this.updateBlog = this.updateBlog.bind(this);
    this.deleteBlog = this.deleteBlog.bind(this);
    this.uploadImage = this.uploadImage.bind(this);
    this.getCategories = this.getCategories.bind(this);
    this.getTags = this.getTags.bind(this);
  }

  // Get all blog posts
  async getAllBlogs(req, res) {
    try {
      console.log('\n=== BLOG FETCH DEBUG ===');
      console.log('Request query parameters:', req.query);
      
      const db = req.app.locals.db;
      const blogsCollection = db.collection('blogs');
      
      // Query parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const category = req.query.category;
      const tag = req.query.tag;
      const search = req.query.search;
      // Handle both 'language' and 'lang' parameters for compatibility
      const language = req.query.language || req.query.lang || 'en'; // Default to English
      
      console.log('Processing blog request with language:', language);
      
      // Build query
      const query = {};
      
      // Language filter
      if (language) {
        query.language = language;
      }
      
      // Category filter
      if (category && category !== 'all') {
        query.category = category;
      }
      
      // Tag filter
      if (tag) {
        query.tags = { $in: [tag] };
      }
      
      // Search filter
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { excerpt: { $regex: search, $options: 'i' } }
        ];
      }
      
      console.log('MongoDB query:', JSON.stringify(query, null, 2));
      
      // Get total count for pagination
      const totalBlogs = await blogsCollection.countDocuments(query);
      console.log('Total blogs found:', totalBlogs);
      
      // Calculate pagination
      const skip = (page - 1) * limit;
      const totalPages = Math.ceil(totalBlogs / limit);
      
      // Fetch blogs
      const blogs = await blogsCollection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      
      console.log(`Fetched ${blogs.length} blogs for page ${page}`);
      console.log('First blog:', blogs[0] ? { 
        id: blogs[0]._id, 
        title: blogs[0].title, 
        language: blogs[0].language,
        category: blogs[0].category 
      } : 'None');
      
      res.json({
        blogs,
        pagination: {
          currentPage: page,
          totalPages,
          totalBlogs,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });
      
      console.log('=== BLOG FETCH COMPLETE ===\n');
    } catch (error) {
      console.error('Error fetching blogs:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get single blog post by ID
  async getBlogById(req, res) {
    try {
      const { id } = req.params;
      const db = req.app.locals.db;
      const blogsCollection = db.collection('blogs');
      
      const blog = await blogsCollection.findOne({ _id: id });
      
      if (!blog) {
        return res.status(404).json({ message: 'Blog post not found' });
      }
      
      res.json(blog);
    } catch (error) {
      console.error('Error fetching blog:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Create new blog post
  async createBlog(req, res) {
    try {
      const {
        title,
        content,
        excerpt,
        category,
        tags,
        language,
        featuredImage,
        status = 'published'
      } = req.body;

      // Validation
      if (!title || !content || !category || !language) {
        return res.status(400).json({ 
          message: 'Title, content, category, and language are required' 
        });
      }

      const db = req.app.locals.db;
      const blogsCollection = db.collection('blogs');

      // Get user ID - handle both req.user.id (from JWT payload) and req.user._id (from database object)
      const userId = req.user.id || req.user._id;

      // Create blog object
      const newBlog = {
        _id: uuidv4(),
        title: title.trim(),
        content,
        excerpt: excerpt || content.substring(0, 200) + '...',
        category,
        tags: tags || [],
        language,
        featuredImage: featuredImage || null,
        status,
        author: {
          id: userId,
          name: req.user.email || req.user.username
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        views: 0,
        likes: 0
      };

      // Insert blog
      await blogsCollection.insertOne(newBlog);

      res.status(201).json({
        message: 'Blog post created successfully',
        blog: newBlog
      });
    } catch (error) {
      console.error('Error creating blog:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Update blog post
  async updateBlog(req, res) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      
      // Remove fields that shouldn't be updated directly
      delete updateData._id;
      delete updateData.author;
      delete updateData.createdAt;
      
      // Add updated timestamp
      updateData.updatedAt = new Date();

      const db = req.app.locals.db;
      const blogsCollection = db.collection('blogs');

      const result = await blogsCollection.findOneAndUpdate(
        { _id: id },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!result.value) {
        return res.status(404).json({ message: 'Blog post not found' });
      }

      res.json({
        message: 'Blog post updated successfully',
        blog: result.value
      });
    } catch (error) {
      console.error('Error updating blog:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Delete blog post
  async deleteBlog(req, res) {
    try {
      const { id } = req.params;
      const db = req.app.locals.db;
      const blogsCollection = db.collection('blogs');

      // Find and delete the blog
      const result = await blogsCollection.findOneAndDelete({ _id: id });

      if (!result.value) {
        return res.status(404).json({ message: 'Blog post not found' });
      }

      // Delete associated image if it exists
      if (result.value.featuredImage) {
        try {
          const imagePath = path.join(__dirname, '..', 'public', result.value.featuredImage);
          await fs.unlink(imagePath);
        } catch (imageError) {
          console.log('Could not delete image file:', imageError.message);
        }
      }

      res.json({ message: 'Blog post deleted successfully' });
    } catch (error) {
      console.error('Error deleting blog:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Upload image for blog
  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const imageUrl = `/uploads/blogs/${req.file.filename}`;
      res.json({
        message: 'Image uploaded successfully',
        imageUrl
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get all categories
  async getCategories(req, res) {
    try {
      const db = req.app.locals.db;
      const blogsCollection = db.collection('blogs');

      const categories = await blogsCollection.distinct('category');
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get all tags
  async getTags(req, res) {
    try {
      const db = req.app.locals.db;
      const blogsCollection = db.collection('blogs');

      const tags = await blogsCollection.distinct('tags');
      res.json(tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = new BlogController();
