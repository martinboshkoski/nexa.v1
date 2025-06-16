const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const VerificationController = require('../controllers/verificationController');

// Create instance of the VerificationController
const verificationController = new VerificationController();

// Submit verification request
router.post('/submit', authenticateJWT, verificationController.upload.fields([
  { name: 'businessRegistration', maxCount: 1 },
  { name: 'taxCertificate', maxCount: 1 },
  { name: 'bankStatement', maxCount: 1 },
  { name: 'additionalDocuments', maxCount: 5 }
]), verificationController.submitVerification);

// Get verification status
router.get('/status', authenticateJWT, verificationController.getVerificationStatus);

// Admin routes for managing verifications
router.get('/admin/pending', authenticateJWT, verificationController.getPendingVerifications);
router.post('/admin/approve/:id', authenticateJWT, verificationController.approveVerification);
router.post('/admin/reject/:id', authenticateJWT, verificationController.rejectVerification);
router.get('/admin/:id', authenticateJWT, verificationController.getVerificationDetails);

module.exports = router;
