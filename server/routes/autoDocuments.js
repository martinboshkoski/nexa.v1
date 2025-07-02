const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const generate = require('../controllers/autoDocuments/consentForPersonalDataProcessingController');

// Consent for Personal Data Processing
router.post('/consent-for-personal-data', authenticateJWT, generate);

// Add more document routes here as needed

module.exports = router; 