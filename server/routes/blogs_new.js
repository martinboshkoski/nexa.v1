const express = require('express');
const router = express.Router();
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const BlogController = require('../controllers/blogController');

// Get all blog posts
router.get('/', BlogController.getAllBlogs);

// Get single blog post by ID
router.get('/:id', BlogController.getBlogById);

// Create new blog post (admin only)
router.post('/', authenticateJWT, isAdmin, BlogController.upload.single('image'), BlogController.createBlog);

// Update blog post (admin only)
router.put('/:id', authenticateJWT, isAdmin, BlogController.upload.single('image'), BlogController.updateBlog);

// Delete blog post (admin only)
router.delete('/:id', authenticateJWT, isAdmin, BlogController.deleteBlog);

// Upload image for blog
router.post('/upload', authenticateJWT, isAdmin, BlogController.upload.single('image'), BlogController.uploadImage);

// Get all categories
router.get('/meta/categories', BlogController.getCategories);

// Get all tags
router.get('/meta/tags', BlogController.getTags);

module.exports = router;
