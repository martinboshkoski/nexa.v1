const express = require('express');
const router = express.Router();
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const NewsController = require('../controllers/newsController');

// Create instance of the NewsController
const newsController = new NewsController();

// Get all news with filtering and pagination
router.get('/', newsController.getAllNews);

// Get single news article by ID
router.get('/:id', newsController.getNewsById);

// Create new news article (admin only)
router.post('/', authenticateJWT, isAdmin, newsController.upload.single('image'), newsController.createNews);

// Update news article (admin only)
router.put('/:id', authenticateJWT, isAdmin, newsController.upload.single('image'), newsController.updateNews);

// Delete news article (admin only)
router.delete('/:id', authenticateJWT, isAdmin, newsController.deleteNews);

// Upload image for news
router.post('/upload', authenticateJWT, isAdmin, newsController.upload.single('image'), newsController.uploadImage);

// Get all categories
router.get('/meta/categories', newsController.getCategories);

module.exports = router;
