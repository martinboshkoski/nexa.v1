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
      console.log('getAllBlogs called');
      console.log('Request headers:', req.headers);
      console.log('Request query:', req.query);
      
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
      
      console.log('Query parameters:', { page, limit, category, tag, search, language });
      
      // Build query - handle both old and new blog structures
      const query = {};
      
      // For now, just get all blogs without filters to debug
      console.log('Fetching all blogs without filters');
      
      // Language filter - check both contentLanguage and old structure
      if (language && language !== 'en') {
        query.$or = [
          { contentLanguage: language },
          { language: language }
        ];
      }
      
      // Category filter - check both category and old structure
      if (category && category !== 'all') {
        query.$or = [
          { category: category },
          { category: { $exists: false } } // Include old blogs without category
        ];
      }
      
      // Tag filter - only for new structure
      if (tag) {
        query.tags = { $in: [tag] };
      }
      
      // Search filter - check both old and new fields
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { excerpt: { $regex: search, $options: 'i' } },
          { summary: { $regex: search, $options: 'i' } } // Old structure
        ];
      }
      
      // Get total count for pagination
      const totalBlogs = await blogsCollection.countDocuments(query);
      console.log('Total blogs found:', totalBlogs);
      console.log('Query used:', JSON.stringify(query));
      
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
      
      console.log('Blogs fetched:', blogs.length);
      if (blogs.length > 0) {
        console.log('Sample blog structure:', JSON.stringify(blogs[0], null, 2));
      }
      
      // Transform old blog structure to new format
      const transformedBlogs = blogs.map(blog => {
        // Check if this is an old blog structure
        if (blog.summary && !blog.excerpt) {
          return {
            _id: blog._id,
            title: blog.title,
            content: blog.content,
            excerpt: blog.summary, // Map summary to excerpt
            category: blog.category || 'General', // Default category
            tags: blog.tags || [],
            contentLanguage: blog.language || 'en', // Map language to contentLanguage
            featuredImage: blog.featuredImage || null,
            status: blog.status || 'published',
            author: blog.author ? {
              id: blog.author,
              name: blog.author
            } : {
              id: 'unknown',
              name: 'Unknown Author'
            },
            createdAt: blog.createdAt,
            updatedAt: blog.updatedAt || blog.createdAt,
            views: blog.views || 0,
            likes: blog.likes || 0
          };
        }
        return blog; // Return as-is if it's already in new format
      });
      
      console.log('Sending response with', transformedBlogs.length, 'blogs');
      res.json({
        blogs: transformedBlogs,
        pagination: {
          currentPage: page,
          totalPages,
          totalBlogs,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });
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
      
      // Transform old blog structure to new format
      let transformedBlog = blog;
      if (blog.summary && !blog.excerpt) {
        transformedBlog = {
          _id: blog._id,
          title: blog.title,
          content: blog.content,
          excerpt: blog.summary, // Map summary to excerpt
          category: blog.category || 'General', // Default category
          tags: blog.tags || [],
          contentLanguage: blog.language || 'en', // Map language to contentLanguage
          featuredImage: blog.featuredImage || null,
          status: blog.status || 'published',
          author: blog.author ? {
            id: blog.author,
            name: blog.author
          } : {
            id: 'unknown',
            name: 'Unknown Author'
          },
          createdAt: blog.createdAt,
          updatedAt: blog.updatedAt || blog.createdAt,
          views: blog.views || 0,
          likes: blog.likes || 0
        };
      }
      
      res.json(transformedBlog);
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

      // Create blog object - use contentLanguage instead of language to avoid MongoDB text index conflicts
      const newBlog = {
        _id: uuidv4(),
        title: title.trim(),
        content,
        excerpt: excerpt || content.substring(0, 200) + '...',
        category,
        tags: tags || [],
        contentLanguage: language, // Changed from 'language' to 'contentLanguage'
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

      // Create social post for the blog
      try {
        const socialPostsCollection = db.collection('socialPosts');
        const socialPost = {
          _id: uuidv4(),
          content: `Нов блог: ${newBlog.title}`,
          postType: 'admin_blog',
          blogId: newBlog._id,
          author: {
            _id: userId,
            email: req.user.email,
            username: req.user.username,
            companyInfo: req.user.companyInfo
          },
          createdAt: new Date(),
          comments: [],
          likes: []
        };
        
        await socialPostsCollection.insertOne(socialPost);
      } catch (socialError) {
        console.error('Error creating social post for blog:', socialError);
        // Don't fail the blog creation if social post fails
      }

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
      
      // Handle language field conversion
      if (updateData.language) {
        updateData.contentLanguage = updateData.language;
        delete updateData.language;
      }
      
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
