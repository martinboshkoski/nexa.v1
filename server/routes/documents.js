const express = require('express');
const router = express.Router();
const passport = require('passport');
const { validateInput, validateObjectId } = require('../middleware/validation');
const documentController = require('../controllers/documentController');
const consentController = require('../controllers/documents/consentForPersonalDataProcessingController');

// Authentication middleware
const auth = passport.authenticate('jwt', { session: false });

// Middleware to get DB instance
router.use((req, res, next) => {
    req.db = req.app.locals.db;
    next();
});

// --- Document Management Routes ---
router.get('/', auth, documentController.getAllDocuments);
router.get('/:id', auth, validateObjectId('id'), documentController.getDocumentById);
router.delete('/:id', auth, validateObjectId('id'), documentController.deleteDocument);

// --- Document Generation Routes ---
// Using proper authentication and validation
router.post('/generate/consent-for-personal-data', auth, validateInput('consentPersonalDataProcessing'), consentController.generateDocument);

module.exports = router;
