const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const { cacheMiddleware, clearCache } = require('../middleware/cache');
const SocialController = require('../controllers/socialController');

// Create instance of the SocialController
const socialController = new SocialController();

// Get all posts for newsfeed with caching (cache for 2 minutes for better UX)
router.get('/newsfeed', authenticateJWT, cacheMiddleware(120), socialController.getNewsfeed);

// Create a new post
router.post('/posts', authenticateJWT, (req, res, next) => {
  socialController.createPost(req, res).then(() => {
    // Clear newsfeed cache after successful post creation
    clearCache('newsfeed');
  }).catch(next);
});

// Get single post by ID
router.get('/posts/:id', authenticateJWT, socialController.getPostById);

// Update a post
router.put('/posts/:id', authenticateJWT, (req, res, next) => {
  socialController.updatePost(req, res).then(() => {
    // Clear newsfeed cache after successful post update
    clearCache('newsfeed');
  }).catch(next);
});

// Delete a post
router.delete('/posts/:id', authenticateJWT, (req, res, next) => {
  socialController.deletePost(req, res).then(() => {
    // Clear newsfeed cache after successful post deletion
    clearCache('newsfeed');
  }).catch(next);
});

// Like/unlike a post
router.post('/posts/:id/like', authenticateJWT, (req, res, next) => {
  socialController.likePost(req, res).then(() => {
    // Clear newsfeed cache after like/unlike
    clearCache('newsfeed');
  }).catch(next);
});

// Comment on a post
router.post('/posts/:id/comment', authenticateJWT, (req, res, next) => {
  socialController.commentOnPost(req, res).then(() => {
    // Clear newsfeed cache after new comment
    clearCache('newsfeed');
  }).catch(next);
});

// Get user's posts
router.get('/users/:userId/posts', authenticateJWT, socialController.getUserPosts);

module.exports = router;
