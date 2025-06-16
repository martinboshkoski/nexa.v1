const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;

class NewsController {
  constructor() {
    // Configure multer for image uploads
    this.upload = multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, 'public/uploads/news');
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
    this.getAllNews = this.getAllNews.bind(this);
    this.getNewsById = this.getNewsById.bind(this);
    this.createNews = this.createNews.bind(this);
    this.updateNews = this.updateNews.bind(this);
    this.deleteNews = this.deleteNews.bind(this);
    this.uploadImage = this.uploadImage.bind(this);
    this.getCategories = this.getCategories.bind(this);
  }

  // Get all news with filtering and pagination
  async getAllNews(req, res) {
    try {
      const db = req.app.locals.db;
      const newsCollection = db.collection('news');
      
      // Query parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const category = req.query.category;
      const search = req.query.search;
      const language = req.query.language || req.query.lang || 'en';
      
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
      
      // Search filter
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { excerpt: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Get total count for pagination
      const totalNews = await newsCollection.countDocuments(query);
      
      // Calculate pagination
      const skip = (page - 1) * limit;
      const totalPages = Math.ceil(totalNews / limit);
      
      // Fetch news
      const news = await newsCollection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      
      res.json({
        news,
        pagination: {
          currentPage: page,
          totalPages,
          totalNews,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });
    } catch (error) {
      console.error('Error fetching news:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get single news article by ID
  async getNewsById(req, res) {
    try {
      const { id } = req.params;
      const db = req.app.locals.db;
      const newsCollection = db.collection('news');
      
      const news = await newsCollection.findOne({ _id: id });
      
      if (!news) {
        return res.status(404).json({ message: 'News article not found' });
      }
      
      // Increment views
      await newsCollection.updateOne(
        { _id: id },
        { $inc: { views: 1 } }
      );
      
      res.json(news);
    } catch (error) {
      console.error('Error fetching news:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Create new news article (admin only)
  async createNews(req, res) {
    try {
      const {
        title,
        content,
        excerpt,
        category,
        language,
        featuredImage,
        status = 'published',
        priority = 'normal'
      } = req.body;

      // Validation
      if (!title || !content || !category || !language) {
        return res.status(400).json({ 
          message: 'Title, content, category, and language are required' 
        });
      }

      const db = req.app.locals.db;
      const newsCollection = db.collection('news');

      // Get user ID - handle both req.user.id (from JWT payload) and req.user._id (from database object)
      const userId = req.user.id || req.user._id;

      // Create news object
      const newNews = {
        _id: uuidv4(),
        title: title.trim(),
        content,
        excerpt: excerpt || content.substring(0, 200) + '...',
        category,
        language,
        featuredImage: featuredImage || null,
        status,
        priority,
        author: {
          id: userId,
          name: req.user.email || req.user.username
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        views: 0
      };

      // Insert news
      await newsCollection.insertOne(newNews);

      res.status(201).json({
        message: 'News article created successfully',
        news: newNews
      });
    } catch (error) {
      console.error('Error creating news:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Update news article (admin only)
  async updateNews(req, res) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      
      // Remove fields that shouldn't be updated directly
      delete updateData._id;
      delete updateData.author;
      delete updateData.createdAt;
      delete updateData.views;
      
      // Add updated timestamp
      updateData.updatedAt = new Date();

      const db = req.app.locals.db;
      const newsCollection = db.collection('news');

      const result = await newsCollection.findOneAndUpdate(
        { _id: id },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!result.value) {
        return res.status(404).json({ message: 'News article not found' });
      }

      res.json({
        message: 'News article updated successfully',
        news: result.value
      });
    } catch (error) {
      console.error('Error updating news:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Delete news article (admin only)
  async deleteNews(req, res) {
    try {
      const { id } = req.params;
      const db = req.app.locals.db;
      const newsCollection = db.collection('news');

      // Find and delete the news
      const result = await newsCollection.findOneAndDelete({ _id: id });

      if (!result.value) {
        return res.status(404).json({ message: 'News article not found' });
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

      res.json({ message: 'News article deleted successfully' });
    } catch (error) {
      console.error('Error deleting news:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Upload image for news
  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const imageUrl = `/uploads/news/${req.file.filename}`;
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
      const newsCollection = db.collection('news');

      const categories = await newsCollection.distinct('category');
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = new NewsController();
