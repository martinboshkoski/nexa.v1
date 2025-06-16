const express = require('express');
const router = express.Router();
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const InvestmentController = require('../controllers/investmentController');

// Create instance of the InvestmentController
const investmentController = new InvestmentController();

// Get all investments with filtering and pagination
router.get('/', investmentController.getAllInvestments);

// Get single investment by ID
router.get('/:id', investmentController.getInvestmentById);

// Create new investment (admin only)
router.post('/', authenticateJWT, isAdmin, investmentController.upload.single('image'), investmentController.createInvestment);

// Update investment (admin only)
router.put('/:id', authenticateJWT, isAdmin, investmentController.upload.single('image'), investmentController.updateInvestment);

// Delete investment (admin only)
router.delete('/:id', authenticateJWT, isAdmin, investmentController.deleteInvestment);

// Upload image for investment
router.post('/upload', authenticateJWT, isAdmin, investmentController.upload.single('image'), investmentController.uploadImage);

// Get all sectors
router.get('/meta/sectors', investmentController.getSectors);

// Get all locations
router.get('/meta/locations', investmentController.getLocations);

module.exports = router;
