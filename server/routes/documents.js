const express = require('express');
const router = express.Router();
const passport = require('passport');
const { ObjectId } = require('mongodb');
const { Packer } = require('docx');
const { validateInput, validateObjectId } = require('../middleware/validation');
const { getUserAndCompanyForDocument, saveDocumentRecord } = require('../utils/documentUtils');
const { generateAnnexEmploymentAgreementDoc } = require('../document_templates/employment/annexEmploymentAgreement');
const { generateAnnualLeaveDecisionDoc } = require('../document_templates/employment/annualLeaveDecision');
const { generateConfirmationOfEmploymentDoc } = require('../document_templates/employment/confirmationOfEmployment');
const { generateEmploymentContractDoc } = require('../document_templates/employment/employmentContract');
const { generateHealthAndSafetyPolicyDoc } = require('../document_templates/healthAndSafety/healthAndSafetyPolicy');
const { generateWorkplaceHarassmentPolicyDoc } = require('../document_templates/healthAndSafety/workplaceHarassmentPolicy');
const { generateConsentForPersonalDataProcessingDoc } = require('../document_templates/personalDataProtection/consentForPersonalDataProcessing');
const { generatePrivacyPolicyDoc } = require('../document_templates/personalDataProtection/privacyPolicy');

// Authentication middleware
const auth = passport.authenticate('jwt', { session: false });

// Middleware to get DB instance
router.use((req, res, next) => {
    req.db = req.app.locals.db;
    next();
});

// Get all documents for current user
router.get('/', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const documentsCollection = db.collection('documents');
    
    const documents = await documentsCollection
      .find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json(documents);
  } catch (error) {
    console.error('Documents fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single document by ID
router.get('/:id', auth, validateObjectId('id'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const documentsCollection = db.collection('documents');
    
    const document = await documentsCollection.findOne({ 
      _id: req.params.id,
      userId: req.user._id 
    });
    
    if (!document) {
      return res.status(404).json({ 
        success: false,
        message: 'Document not found' 
      });
    }
    
    res.json({
      success: true,
      document
    });
  } catch (error) {
    console.error('Document fetch error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Generate new document
router.post('/generate', auth, validateInput('documentGeneration'), async (req, res) => {
  try {
    const { documentType, templateName, category, ...formData } = req.body;
    const db = req.app.locals.db;
    const documentsCollection = db.collection('documents');
    const usersCollection = db.collection('users');
    
    // Get user information
    const user = await usersCollection.findOne({ _id: req.user._id });
    
    if (!user || !user.profileComplete) {
      return res.status(400).json({ message: 'User profile not found or incomplete. Please complete your profile first.' });
    }
    
    // Generate document content based on type
    let documentContent = '';
    let documentTitle = templateName || 'Generated Document';
    
    try {
      documentContent = generateDocumentContent(documentType, templateName, user, formData);
    } catch (error) {
      return res.status(400).json({ message: `Error generating document: ${error.message}` });
    }
    
    // Save document to database
    const newDocument = {
      userId: req.user._id,
      documentType,
      templateName,
      category,
      title: documentTitle,
      content: documentContent,
      formData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await documentsCollection.insertOne(newDocument);
    newDocument._id = result.insertedId;
    
    res.status(201).json({
      message: 'Document generated successfully',
      document: newDocument
    });
  } catch (error) {
    console.error('Document generation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete document
router.delete('/:id', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const documentsCollection = db.collection('documents');
    
    const result = await documentsCollection.deleteOne({ 
      _id: req.params.id,
      userId: req.user._id 
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Document deletion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate Employment Annex Agreement DOCX
router.post('/generate/employment-annex', async (req, res) => {
    const { userId, formData } = req.body;
    const db = req.db;

    if (!userId || !formData) {
        return res.status(400).json({ message: 'Недостасуваат ID на корисник или податоци од форма.' });
    }

    try {
        const { user, company } = await getUserAndCompanyForDocument(db, new ObjectId(userId));

        // Enrich formData with company details from the database if they are not already present
        // This ensures that the document always uses the latest company info from the DB
        const enrichedFormData = {
            ...formData,
            companyName: company.name || formData.companyName,
            companyAddress: company.address || formData.companyAddress,
            companyIdNumber: company.idNumber || formData.companyIdNumber,
            companyTaxNumber: company.taxNumber || formData.companyTaxNumber,
            companyBank: company.bankName || formData.companyBank, // Assuming bankName in DB maps to companyBank
            companyBankAccount: company.bankAccount || formData.companyBankAccount,
            // managerName and managerPosition might still come from form if they are specific to the document instance
            // or could be fetched if there's a primary contact/manager in company info
            managerName: formData.managerName || user.fullName, // Default to user if no specific manager
            managerPosition: formData.managerPosition || 'Управител', // Default if not provided
        };

        const { doc, filenameSuffix } = generateAnnexEmploymentAgreementDoc(enrichedFormData, user, company);

        const buffer = await Packer.toBuffer(doc);
        const filename = `${filenameSuffix}.docx`;

        await saveDocumentRecord(db, {
            userId: new ObjectId(userId),
            documentType: 'annexEmploymentAgreement',
            fileName: filename,
            formData: enrichedFormData, // Save the data used for generation
            generatedAt: new Date(),
            companyId: company._id, // Assuming company object has an _id
        });

        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.send(buffer);

    } catch (error) {
        console.error("Грешка при генерирање на документ:", error);
        if (error.message === 'User not found.') {
            return res.status(404).json({ message: 'Корисникот не е пронајден.' });
        }
        if (error.message === 'User profile is not complete. Please complete your profile first.') {
            return res.status(400).json({ message: 'Профилот на корисникот не е комплетен. Ве молиме прво комплетирајте го вашиот профил.'});
        }
        if (error.message === 'Company information is missing from user profile.') {
            return res.status(400).json({ message: 'Информациите за компанијата недостасуваат во профилот на корисникот.' });
        }
        return res.status(500).json({ message: 'Настана грешка при генерирање на документот. Ве молиме обидете се повторно.' });
    }
});

// Generate Annual Leave Decision DOCX
router.post('/generate/annual-leave-decision', async (req, res) => {
    const { userId, formData } = req.body;
    const db = req.db;

    if (!userId || !formData) {
        return res.status(400).json({ message: 'Недостасуваат ID на корисник или податоци од форма.' });
    }

    try {
        const { user, company } = await getUserAndCompanyForDocument(db, new ObjectId(userId));

        // Enrich formData with company details from the database
        const enrichedFormData = {
            ...formData,
            companyName: company.name || formData.companyName,
            companyAddress: company.address || formData.companyAddress,
            companyIdNumber: company.idNumber || formData.companyIdNumber, // EMBS
            companyTaxNumber: company.taxNumber || formData.companyTaxNumber, // EDB
            managerName: company.managerName || user.fullName, // Or a specific manager field from company if available
            // jobPosition should be part of the formData from the client for this specific document
        };

        const { doc, filenameSuffix } = generateAnnualLeaveDecisionDoc(enrichedFormData, user, company);

        const buffer = await Packer.toBuffer(doc);
        const filename = `${filenameSuffix}.docx`;

        await saveDocumentRecord(db, {
            userId: new ObjectId(userId),
            documentType: 'annualLeaveDecision',
            fileName: filename,
            formData: enrichedFormData,
            generatedAt: new Date(),
            companyId: company._id, // Assuming company object has an _id
        });

        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.send(buffer);

    } catch (error) {
        console.error("Грешка при генерирање на Решение за годишен одмор:", error);
        if (error.message.includes('User not found')) {
            return res.status(404).json({ message: 'Корисникот не е пронајден.' });
        }
        if (error.message.includes('profile is not complete')) {
            return res.status(400).json({ message: 'Профилот на корисникот не е комплетен.'});
        }
        if (error.message.includes('Company information is missing')) {
            return res.status(400).json({ message: 'Информациите за компанијата недостасуваат.' });
        }
        return res.status(500).json({ message: 'Настана грешка при генерирање на документот.' });
    }
});

// Generate Confirmation of Employment DOCX
router.post('/generate/confirmation-of-employment', async (req, res) => {
    const { userId, formData } = req.body;
    const db = req.db;

    if (!userId || !formData) {
        return res.status(400).json({ message: 'Недостасуваат ID на корисник или податоци од форма.' });
    }

    try {
        const { user, company } = await getUserAndCompanyForDocument(db, new ObjectId(userId));

        const enrichedFormData = {
            ...formData,
            companyName: company.name || formData.companyName,
            companyAddress: company.address || formData.companyAddress,
            companyIdNumber: company.idNumber || formData.companyIdNumber,
            companyTaxNumber: company.taxNumber || formData.companyTaxNumber,
            managerName: company.managerName || user.fullName, // Default or specific manager from company
        };

        const { doc, filenameSuffix } = generateConfirmationOfEmploymentDoc(enrichedFormData, user, company);

        const buffer = await Packer.toBuffer(doc);
        const filename = `${filenameSuffix}.docx`;

        await saveDocumentRecord(db, {
            userId: new ObjectId(userId),
            documentType: 'confirmationOfEmployment',
            fileName: filename,
            formData: enrichedFormData,
            generatedAt: new Date(),
            companyId: company._id,
        });

        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.send(buffer);

    } catch (error) {
        console.error("Грешка при генерирање на Потврда за вработување:", error);
        // Consolidate error handling as it's repetitive
        if (error.message.includes('User not found')) {
            return res.status(404).json({ message: 'Корисникот не е пронајден.' });
        }
        if (error.message.includes('profile is not complete')) {
            return res.status(400).json({ message: 'Профилот на корисникот не е комплетен.'});
        }
        if (error.message.includes('Company information is missing')) {
            return res.status(400).json({ message: 'Информациите за компанијата недостасуваат.' });
        }
        return res.status(500).json({ message: 'Настана грешка при генерирање на документот.' });
    }
});

// Generate Health and Safety Policy DOCX
router.post('/generate/health-safety-policy', async (req, res) => {
    const { userId, formData } = req.body;
    const db = req.db;

    if (!userId || !formData) {
        return res.status(400).json({ message: 'Недостасуваат ID на корисник или податоци од форма.' });
    }

    try {
        const { user, company } = await getUserAndCompanyForDocument(db, new ObjectId(userId));

        const enrichedFormData = {
            ...formData,
            companyName: company.name || formData.companyName,
            companyAddress: company.address || formData.companyAddress,
            companyIdNumber: company.idNumber || formData.companyIdNumber,
            companyTaxNumber: company.taxNumber || formData.companyTaxNumber,
            managerName: company.managerName || user.fullName, // Or a specific manager field from company
        };

        const { doc, filenameSuffix } = generateHealthAndSafetyPolicyDoc(enrichedFormData, user, company);

        const buffer = await Packer.toBuffer(doc);
        const filename = `${filenameSuffix}.docx`;

        await saveDocumentRecord(db, {
            userId: new ObjectId(userId),
            documentType: 'healthAndSafetyPolicy',
            fileName: filename,
            formData: enrichedFormData,
            generatedAt: new Date(),
            companyId: company._id,
        });

        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.send(buffer);

    } catch (error) {
        console.error("Грешка при генерирање на Политика за безбедност и здравје при работа:", error);
        if (error.message.includes('User not found')) {
            return res.status(404).json({ message: 'Корисникот не е пронајден.' });
        }
        if (error.message.includes('profile is not complete')) {
            return res.status(400).json({ message: 'Профилот на корисникот не е комплетен.'});
        }
        if (error.message.includes('Company information is missing')) {
            return res.status(400).json({ message: 'Информациите за компанијата недостасуваат.' });
        }
        return res.status(500).json({ message: 'Настана грешка при генерирање на документот.' });
    }
});

// Generate Workplace Harassment Policy DOCX
router.post('/generate/workplace-harassment-policy', async (req, res) => {
    const { userId, formData } = req.body;
    const db = req.db;

    if (!userId || !formData) {
        return res.status(400).json({ message: 'Недостасуваат ID на корисник или податоци од форма.' });
    }

    try {
        const { user, company } = await getUserAndCompanyForDocument(db, new ObjectId(userId));

        const enrichedFormData = {
            ...formData,
            companyName: company.name || formData.companyName,
            companyAddress: company.address || formData.companyAddress,
            companyIdNumber: company.idNumber || formData.companyIdNumber,
            companyTaxNumber: company.taxNumber || formData.companyTaxNumber,
            managerName: company.managerName || user.fullName, // Or a specific manager field from company
        };

        const { doc, filenameSuffix } = generateWorkplaceHarassmentPolicyDoc(enrichedFormData, user, company);

        const buffer = await Packer.toBuffer(doc);
        const filename = `${filenameSuffix}.docx`;

        await saveDocumentRecord(db, {
            userId: new ObjectId(userId),
            documentType: 'workplaceHarassmentPolicy',
            fileName: filename,
            formData: enrichedFormData,
            generatedAt: new Date(),
            companyId: company._id,
        });

        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.send(buffer);

    } catch (error) {
        console.error("Грешка при генерирање на Политика за вознемирување на работно место:", error);
        if (error.message.includes('User not found')) {
            return res.status(404).json({ message: 'Корисникот не е пронајден.' });
        }
        if (error.message.includes('profile is not complete')) {
            return res.status(400).json({ message: 'Профилот на корисникот не е комплетен.'});
        }
        if (error.message.includes('Company information is missing')) {
            return res.status(400).json({ message: 'Информациите за компанијата недостасуваат.' });
        }
        return res.status(500).json({ message: 'Настана грешка при генерирање на документот.' });
    }
});

// Generate Consent for Personal Data Processing DOCX
router.post('/generate/consent-personal-data', async (req, res) => {
    const { userId, formData } = req.body;
    const db = req.db;

    if (!userId || !formData) {
        return res.status(400).json({ message: 'Недостасуваат ID на корисник или податоци од форма.' });
    }

    try {
        const { user, company } = await getUserAndCompanyForDocument(db, new ObjectId(userId));

        const enrichedFormData = {
            ...formData,
            companyName: company.name || formData.companyName,
            companyAddress: company.address || formData.companyAddress,
            companyIdNumber: company.idNumber || formData.companyIdNumber,
            companyTaxNumber: company.taxNumber || formData.companyTaxNumber,
            managerName: company.managerName || user.fullName,
        };

        const { doc, filenameSuffix } = generateConsentForPersonalDataProcessingDoc(enrichedFormData, user, company);

        const buffer = await Packer.toBuffer(doc);
        const filename = `${filenameSuffix}.docx`;

        await saveDocumentRecord(db, {
            userId: new ObjectId(userId),
            documentType: 'consentForPersonalDataProcessing',
            fileName: filename,
            formData: enrichedFormData,
            generatedAt: new Date(),
            companyId: company._id,
        });

        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.send(buffer);

    } catch (error) {
        console.error("Грешка при генерирање на Согласност за обработка на лични податоци:", error);
        if (error.message.includes('User not found')) {
            return res.status(404).json({ message: 'Корисникот не е пронајден.' });
        }
        if (error.message.includes('profile is not complete')) {
            return res.status(400).json({ message: 'Профилот на корисникот не е комплетен.'});
        }
        if (error.message.includes('Company information is missing')) {
            return res.status(400).json({ message: 'Информациите за компанијата недостасуваат.' });
        }
        return res.status(500).json({ message: 'Настана грешка при генерирање на документот.' });
    }
});

// Generate Privacy Policy DOCX
router.post('/generate/privacy-policy', async (req, res) => {
    const { userId, formData } = req.body;
    const db = req.db;

    if (!userId || !formData) {
        return res.status(400).json({ message: 'Недостасуваат ID на корисник или податоци од форма.' });
    }

    try {
        const { user, company } = await getUserAndCompanyForDocument(db, new ObjectId(userId));

        const enrichedFormData = {
            ...formData,
            companyName: company.name || formData.companyName,
            companyAddress: company.address || formData.companyAddress,
            companyIdNumber: company.idNumber || formData.companyIdNumber,
            companyTaxNumber: company.taxNumber || formData.companyTaxNumber,
            managerName: company.managerName || user.fullName, 
        };

        const { doc, filenameSuffix } = generatePrivacyPolicyDoc(enrichedFormData, user, company);

        const buffer = await Packer.toBuffer(doc);
        const filename = `${filenameSuffix}.docx`;

        await saveDocumentRecord(db, {
            userId: new ObjectId(userId),
            documentType: 'privacyPolicy',
            fileName: filename,
            formData: enrichedFormData,
            generatedAt: new Date(),
            companyId: company._id,
        });

        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.send(buffer);

    } catch (error) {
        console.error("Грешка при генерирање на Политика за приватност:", error);
        if (error.message.includes('User not found')) {
            return res.status(404).json({ message: 'Корисникот не е пронајден.' });
        }
        if (error.message.includes('profile is not complete')) {
            return res.status(400).json({ message: 'Профилот на корисникот не е комплетен.'});
        }
        if (error.message.includes('Company information is missing')) {
            return res.status(400).json({ message: 'Информациите за компанијата недостасуваат.' });
        }
        return res.status(500).json({ message: 'Настана грешка при генерирање на документот.' });
    }
});

// Generate Employment Contract DOCX
router.post('/generate/employment-contract', async (req, res) => {
    const { userId, formData } = req.body;
    const db = req.db;

    if (!userId || !formData) {
        return res.status(400).json({ message: 'Недостасуваат ID на корисник или податоци од форма.' });
    }

    try {
        const { user, company } = await getUserAndCompanyForDocument(userId, db);

        // Enrich formData with company details from the database
        const enrichedFormData = {
            ...formData,
            companyName: company.name || formData.companyName,
            companyAddress: company.address || formData.companyAddress,
            companyIdNumber: company.idNumber || formData.companyIdNumber,
            companyTaxNumber: company.taxNumber || formData.companyTaxNumber,
            managerName: formData.managerName || user.fullName,
            managerPosition: formData.managerPosition || 'Управител',
        };

        const doc = generateEmploymentContractDoc(enrichedFormData, user, company);

        const buffer = await Packer.toBuffer(doc);
        const filename = `Договор_за_вработување_${enrichedFormData.employeeName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.docx`;

        await saveDocumentRecord(db, {
            userId: new ObjectId(userId),
            documentType: 'employmentContract',
            fileName: filename,
            formData: enrichedFormData,
            generatedAt: new Date(),
            companyId: company._id,
        });

        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.send(buffer);

    } catch (error) {
        console.error("Грешка при генерирање на Договор за вработување:", error);
        if (error.message.includes('User not found')) {
            return res.status(404).json({ message: 'Корисникот не е пронајден.' });
        }
        if (error.message.includes('profile is not complete')) {
            return res.status(400).json({ message: 'Профилот на корисникот не е комплетен.'});
        }
        if (error.message.includes('Company information is missing')) {
            return res.status(400).json({ message: 'Информациите за компанијата недостасуваат.' });
        }
        return res.status(500).json({ message: 'Настана грешка при генерирање на документот.' });
    }
});

// Generate Termination Letter
router.post('/generate/termination-letter', async (req, res) => {
    const { userId, formData } = req.body;
    const db = req.db;

    if (!userId || !formData) {
        return res.status(400).json({ message: 'Недостасуваат ID на корисник или податоци од форма.' });
    }

    try {
        const generateTerminationLetter = require('../document_templates/employment/terminationLetter');
        const result = generateTerminationLetter(formData);

        if (!result.success) {
            return res.status(500).json({ message: 'Грешка при генерирање на документот: ' + result.error });
        }

        await saveDocumentRecord(db, {
            userId: new ObjectId(userId),
            documentType: 'terminationLetter',
            fileName: result.filename,
            formData: formData,
            generatedAt: new Date(),
        });

        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(result.filename)}`);
        res.setHeader('Content-Type', result.mimeType);
        res.send(result.buffer);

    } catch (error) {
        console.error("Грешка при генерирање на Изјава за отказ:", error);
        return res.status(500).json({ message: 'Настана грешка при генерирање на документот.' });
    }
});

// Generate Job Description
router.post('/generate/job-description', async (req, res) => {
    const { userId, formData } = req.body;
    const db = req.db;

    if (!userId || !formData) {
        return res.status(400).json({ message: 'Недостасуваат ID на корисник или податоци од форма.' });
    }

    try {
        const generateJobDescription = require('../document_templates/employment/jobDescription');
        const result = generateJobDescription(formData);

        if (!result.success) {
            return res.status(500).json({ message: 'Грешка при генерирање на документот: ' + result.error });
        }

        await saveDocumentRecord(db, {
            userId: new ObjectId(userId),
            documentType: 'jobDescription',
            fileName: result.filename,
            formData: formData,
            generatedAt: new Date(),
        });

        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(result.filename)}`);
        res.setHeader('Content-Type', result.mimeType);
        res.send(result.buffer);

    } catch (error) {
        console.error("Грешка при генерирање на Опис на работно место:", error);
        return res.status(500).json({ message: 'Настана грешка при генерирање на документот.' });
    }
});

// Generate Performance Review
router.post('/generate/performance-review', async (req, res) => {
    const { userId, formData } = req.body;
    const db = req.db;

    if (!userId || !formData) {
        return res.status(400).json({ message: 'Недостасуваат ID на корисник или податоци од форма.' });
    }

    try {
        const generatePerformanceReview = require('../document_templates/employment/performanceReview');
        const result = generatePerformanceReview(formData);

        if (!result.success) {
            return res.status(500).json({ message: 'Грешка при генерирање на документот: ' + result.error });
        }

        await saveDocumentRecord(db, {
            userId: new ObjectId(userId),
            documentType: 'performanceReview',
            fileName: result.filename,
            formData: formData,
            generatedAt: new Date(),
        });

        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(result.filename)}`);
        res.setHeader('Content-Type', result.mimeType);
        res.send(result.buffer);

    } catch (error) {
        console.error("Грешка при генерирање на Оценување на успешност:", error);
        return res.status(500).json({ message: 'Настана грешка при генерирање на документот.' });
    }
});

// Generate Disciplinary Action
router.post('/generate/disciplinary-action', async (req, res) => {
    const { userId, formData } = req.body;
    const db = req.db;

    if (!userId || !formData) {
        return res.status(400).json({ message: 'Недостасуваат ID на корисник или податоци од форма.' });
    }

    try {
        const generateDisciplinaryAction = require('../document_templates/employment/disciplinaryAction');
        const result = generateDisciplinaryAction(formData);

        if (!result.success) {
            return res.status(500).json({ message: 'Грешка при генерирање на документот: ' + result.error });
        }

        await saveDocumentRecord(db, {
            userId: new ObjectId(userId),
            documentType: 'disciplinaryAction',
            fileName: result.filename,
            formData: formData,
            generatedAt: new Date(),
        });

        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(result.filename)}`);
        res.setHeader('Content-Type', result.mimeType);
        res.send(result.buffer);

    } catch (error) {
        console.error("Грешка при генерирање на Дисциплинска мерка:", error);
        return res.status(500).json({ message: 'Настана грешка при генерирање на документот.' });
    }
});

// Comprehensive document generation function
function generateDocumentContent(documentType, templateName, user, formData) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const company = user.companyInfo || {};
  
  switch (documentType) {
    case 'employment_contract':
      return generateEmploymentContract(user, company, formData, currentDate);
    
    case 'termination_letter':
      return generateTerminationLetter(user, company, formData, currentDate);
    
    case 'job_description':
      return generateJobDescription(user, company, formData, currentDate);
    
    case 'performance_review':
      return generatePerformanceReview(user, company, formData, currentDate);
    
    case 'disciplinary_action':
      return generateDisciplinaryAction(user, company, formData, currentDate);
    
    case 'board_resolution':
      return generateBoardResolution(user, company, formData, currentDate);
    
    case 'shareholders_agreement':
      return generateShareholdersAgreement(user, company, formData, currentDate);
    
    case 'articles_incorporation':
      return generateArticlesIncorporation(user, company, formData, currentDate);
    
    case 'corporate_bylaws':
      return generateCorporateBylaws(user, company, formData, currentDate);
    
    case 'compliance_policy':
      return generateCompliancePolicy(user, company, formData, currentDate);
    
    case 'nda':
      return generateNDA(user, company, formData, currentDate);
    
    case 'service_agreement':
      return generateServiceAgreement(user, company, formData, currentDate);
    
    case 'vendor_contract':
      return generateVendorContract(user, company, formData, currentDate);
    
    case 'partnership_agreement':
      return generatePartnershipAgreement(user, company, formData, currentDate);
    
    case 'licensing_agreement':
      return generateLicensingAgreement(user, company, formData, currentDate);
    
    case 'privacy_policy':
      return generatePrivacyPolicy(user, company, formData, currentDate);
    
    case 'consent_form':
      return generateConsentForm(user, company, formData, currentDate);
    
    case 'data_breach_notice':
      return generateDataBreachNotice(user, company, formData, currentDate);
    
    case 'dpia_template':
      return generateDPIA(user, company, formData, currentDate);
    
    case 'data_retention_policy':
      return generateDataRetentionPolicy(user, company, formData, currentDate);
    
    case 'safety_policy':
      return generateSafetyPolicy(user, company, formData, currentDate);
    
    case 'incident_report':
      return generateIncidentReport(user, company, formData, currentDate);
    
    case 'risk_assessment':
      return generateRiskAssessment(user, company, formData, currentDate);
    
    case 'safety_training':
      return generateSafetyTraining(user, company, formData, currentDate);
    
    case 'emergency_procedure':
      return generateEmergencyProcedure(user, company, formData, currentDate);
    
    case 'meeting_minutes':
      return generateMeetingMinutes(user, company, formData, currentDate);
    
    case 'business_letter':
      return generateBusinessLetter(user, company, formData, currentDate);
    
    case 'invoice_template':
      return generateInvoice(user, company, formData, currentDate);
    
    case 'memo':
      return generateMemo(user, company, formData, currentDate);
    
    case 'press_release':
      return generatePressRelease(user, company, formData, currentDate);
    
    default:
      throw new Error(`Unsupported document type: ${documentType}`);
  }
}

// Template generation functions
function generateEmploymentContract(user, company, formData, currentDate) {
  return `
EMPLOYMENT CONTRACT

This Employment Contract (the "Agreement") is entered into on ${currentDate} between:

${company.companyName || '[Company Name]'}, a company incorporated under the laws of [Jurisdiction]
(hereinafter referred to as the "Company")

and

${formData.employeeName || '[Employee Name]'}
(hereinafter referred to as the "Employee")

1. POSITION AND DUTIES
   The Employee is hereby employed in the position of ${formData.position || '[Position]'} and shall perform duties as assigned by the Company.

2. COMPENSATION
   The Employee shall receive a gross salary of ${formData.salary || '[Salary]'} per ${formData.payPeriod || 'month'}.

3. WORKING HOURS
   The Employee's working hours shall be ${formData.workingHours || '[Working Hours]'} per week.

4. START DATE
   This employment shall commence on ${formData.startDate || '[Start Date]'}.

5. TERMS AND CONDITIONS
   This contract is subject to the Company's employee handbook and applicable labor laws.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

COMPANY:                          EMPLOYEE:
${company.companyName || '[Company Name]'}           ${formData.employeeName || '[Employee Name]'}

By: ${user.email || '[Name]'}      Signature: ______________________
Title: [Title]                   Date: ______________________
Date: ${currentDate}
`;
}

function generateNDA(user, company, formData, currentDate) {
  return `
NON-DISCLOSURE AGREEMENT

This Non-D Disclosure Agreement (the "Agreement") is entered into on ${currentDate} between:

${company.companyName || '[Company Name]'} (the "Disclosing Party")

and

${formData.partyName || '[Party Name]'} (the "Receiving Party")

WHEREAS, the parties wish to discuss ${formData.purpose || '[Purpose]'};

NOW, THEREFORE, the parties agree as follows:

1. CONFIDENTIAL INFORMATION
   Any information disclosed shall be considered confidential and proprietary.

2. OBLIGATIONS
   The Receiving Party shall maintain strict confidentiality and not disclose information to third parties.

3. DURATION
   This agreement shall remain in effect for ${formData.duration || '2 years'}.

4. GOVERNING LAW
   This Agreement shall be governed by applicable laws.

IN WITNESS WHEREOF, the parties have executed this Agreement.

DISCLOSING PARTY:                 RECEIVING PARTY:
${company.companyName || '[Company Name]'}           ${formData.partyName || '[Party Name]'}

By: ${user.email || '[Name]'}      By: ______________________
Date: ${currentDate}             Date: ______________________
`;
}

function generateServiceAgreement(user, company, formData, currentDate) {
  return `
SERVICE AGREEMENT

This Service Agreement (the "Agreement") is entered into on ${currentDate} between:

${company.companyName || '[Company Name]'} (the "Service Provider")

and

${formData.clientName || '[Client Name]'} (the "Client")

1. SERVICES
   The Service Provider shall provide the following services: ${formData.serviceDescription || '[Service Description]'}

2. TIMELINE
   Services shall be completed by: ${formData.timeline || '[Timeline]'}

3. PAYMENT
   Total payment: ${formData.payment || '[Payment Amount]'}
   Payment terms: [As agreed]

4. TERMS
   This agreement is subject to the terms and conditions outlined herein.

IN WITNESS WHEREOF, the parties have executed this Agreement.

SERVICE PROVIDER:                 CLIENT:
${company.companyName || '[Company Name]'}           ${formData.clientName || '[Client Name]'}

By: ${user.email || '[Name]'}      By: ______________________
Date: ${currentDate}             Date: ______________________
`;
}

// Add more basic templates for other document types
function generateTerminationLetter(user, company, formData, currentDate) {
  return `
EMPLOYMENT TERMINATION LETTER

Date: ${currentDate}

To: ${formData.employeeName || '[Employee Name]'}

Dear ${formData.employeeName || '[Employee Name]'},

This letter serves as formal notification that your employment with ${company.companyName || '[Company Name]'} will be terminated effective ${formData.terminationDate || '[Termination Date]'}.

Reason for termination: ${formData.reason || '[Reason]'}

Your final working day will be ${formData.finalWorkingDay || '[Final Working Day]'}.

Please ensure all company property is returned and outstanding matters are resolved.

Sincerely,

${user.email || '[Name]'}
${company.companyName || '[Company Name]'}
`;
}

function generateJobDescription(user, company, formData, currentDate) {
  return `
JOB DESCRIPTION

Position: ${formData.jobTitle || '[Job Title]'}
Department: ${formData.department || '[Department]'}
Company: ${company.companyName || '[Company Name]'}
Date: ${currentDate}

RESPONSIBILITIES:
${formData.responsibilities || '[List of responsibilities]'}

REQUIREMENTS:
${formData.requirements || '[List of requirements]'}

This job description may be updated as needed to reflect changes in responsibilities.

Prepared by: ${user.email || '[Name]'}
`;
}

// Placeholder functions for other templates (can be expanded later)
function generatePerformanceReview(user, company, formData, currentDate) {
  return `PERFORMANCE REVIEW\n\nEmployee: ${formData.employeeName || '[Employee Name]'}\nReview Period: ${formData.reviewPeriod || '[Review Period]'}\nGoals: ${formData.goals || '[Goals]'}\nAchievements: ${formData.achievements || '[Achievements]'}\n\nDate: ${currentDate}\nReviewer: ${user.email || '[Name]'}`;
}

function generateDisciplinaryAction(user, company, formData, currentDate) {
  return `DISCIPLINARY ACTION FORM\n\nEmployee: ${formData.employeeName || '[Employee Name]'}\nIncident: ${formData.incident || '[Incident]'}\nAction Taken: ${formData.actionTaken || '[Action Taken]'}\nDate: ${formData.date || currentDate}\n\nAuthorized by: ${user.email || '[Name]'}`;
}

function generateBoardResolution(user, company, formData, currentDate) {
  return `BOARD RESOLUTION\n\nTitle: ${formData.resolutionTitle || '[Resolution Title]'}\nMeeting Date: ${formData.meetingDate || '[Meeting Date]'}\nBoard Members: ${formData.boardMembers || '[Board Members]'}\nDecision: ${formData.decision || '[Decision]'}\n\nDate: ${currentDate}`;
}

function generateShareholdersAgreement(user, company, formData, currentDate) {
  return `SHAREHOLDERS AGREEMENT\n\nCompany: ${formData.companyName || company.companyName || '[Company Name]'}\nShareholders: ${formData.shareholders || '[Shareholders]'}\nShare Distribution: ${formData.shareDistribution || '[Share Distribution]'}\nGovernance Rules: ${formData.governanceRules || '[Governance Rules]'}\n\nDate: ${currentDate}`;
}

function generateArticlesIncorporation(user, company, formData, currentDate) {
  return `ARTICLES OF INCORPORATION\n\nCompany Name: ${formData.companyName || '[Company Name]'}\nBusiness Purpose: ${formData.businessPurpose || '[Business Purpose]'}\nRegistered Address: ${formData.registeredAddress || '[Registered Address]'}\nAuthorized Shares: ${formData.authorizedShares || '[Authorized Shares]'}\n\nDate: ${currentDate}`;
}

function generateCorporateBylaws(user, company, formData, currentDate) {
  return `CORPORATE BYLAWS\n\nCompany: ${formData.companyName || company.companyName || '[Company Name]'}\nBoard Structure: ${formData.boardStructure || '[Board Structure]'}\nMeeting Rules: ${formData.meetingRules || '[Meeting Rules]'}\nVoting Procedures: ${formData.votingProcedures || '[Voting Procedures]'}\n\nDate: ${currentDate}`;
}

function generateCompliancePolicy(user, company, formData, currentDate) {
  return `COMPLIANCE POLICY\n\nPolicy Title: ${formData.policyTitle || '[Policy Title]'}\nApplicable Area: ${formData.applicableArea || '[Applicable Area]'}\nRequirements: ${formData.requirements || '[Requirements]'}\nConsequences: ${formData.consequences || '[Consequences]'}\n\nEffective Date: ${currentDate}`;
}

function generateVendorContract(user, company, formData, currentDate) {
  return `VENDOR CONTRACT\n\nVendor: ${formData.vendorName || '[Vendor Name]'}\nServices: ${formData.services || '[Services]'}\nDeliverables: ${formData.deliverables || '[Deliverables]'}\nTerms: ${formData.terms || '[Terms]'}\n\nDate: ${currentDate}`;
}

function generatePartnershipAgreement(user, company, formData, currentDate) {
  return `PARTNERSHIP AGREEMENT\n\nPartners: ${formData.partnerNames || '[Partner Names]'}\nBusiness Purpose: ${formData.businessPurpose || '[Business Purpose]'}\nResponsibilities: ${formData.responsibilities || '[Responsibilities]'}\nProfit Sharing: ${formData.profitSharing || '[Profit Sharing]'}\n\nDate: ${currentDate}`;
}

function generateLicensingAgreement(user, company, formData, currentDate) {
  return `LICENSING AGREEMENT\n\nLicensor: ${formData.licensor || '[Licensor]'}\nLicensee: ${formData.licensee || '[Licensee]'}\nLicensed Property: ${formData.licensedProperty || '[Licensed Property]'}\nRoyalties: ${formData.royalties || '[Royalties]'}\n\nDate: ${currentDate}`;
}

function generatePrivacyPolicy(user, company, formData, currentDate) {
  return `PRIVACY POLICY\n\nCompany: ${formData.companyName || company.companyName || '[Company Name]'}\nData Types: ${formData.dataTypes || '[Data Types]'}\nProcessing Purpose: ${formData.processingPurpose || '[Processing Purpose]'}\nRetention Period: ${formData.retentionPeriod || '[Retention Period]'}\n\nEffective Date: ${currentDate}`;
}

function generateConsentForm(user, company, formData, currentDate) {
  return `DATA CONSENT FORM\n\nData Subject: ${formData.dataSubject || '[Data Subject]'}\nData Types: ${formData.dataTypes || '[Data Types]'}\nPurposes: ${formData.purposes || '[Purposes]'}\nRights: ${formData.rights || '[Rights]'}\n\nDate: ${currentDate}`;
}

function generateDataBreachNotice(user, company, formData, currentDate) {
  return `DATA BREACH NOTIFICATION\n\nIncident Date: ${formData.incidentDate || '[Incident Date]'}\nAffected Data: ${formData.affectedData || '[Affected Data]'}\nImpact: ${formData.impact || '[Impact]'}\nMeasures: ${formData.measures || '[Measures]'}\n\nNotification Date: ${currentDate}`;
}

function generateDPIA(user, company, formData, currentDate) {
  return `DATA PROTECTION IMPACT ASSESSMENT\n\nProcessing Activity: ${formData.processingActivity || '[Processing Activity]'}\nRisks: ${formData.risks || '[Risks]'}\nSafeguards: ${formData.safeguards || '[Safeguards]'}\nConclusion: ${formData.conclusion || '[Conclusion]'}\n\nDate: ${currentDate}`;
}

function generateDataRetentionPolicy(user, company, formData, currentDate) {
  return `DATA RETENTION POLICY\n\nData Categories: ${formData.dataCategories || '[Data Categories]'}\nRetention Periods: ${formData.retentionPeriods || '[Retention Periods]'}\nDisposal Methods: ${formData.disposalMethods || '[Disposal Methods]'}\nResponsibilities: ${formData.responsibilities || '[Responsibilities]'}\n\nEffective Date: ${currentDate}`;
}

function generateSafetyPolicy(user, company, formData, currentDate) {
  return `WORKPLACE SAFETY POLICY\n\nPolicy Scope: ${formData.policyScope || '[Policy Scope]'}\nSafety Rules: ${formData.safetyRules || '[Safety Rules]'}\nResponsibilities: ${formData.responsibilities || '[Responsibilities]'}\nProcedures: ${formData.procedures || '[Procedures]'}\n\nEffective Date: ${currentDate}`;
}

function generateIncidentReport(user, company, formData, currentDate) {
  return `INCIDENT REPORT\n\nIncident Date: ${formData.incidentDate || '[Incident Date]'}\nLocation: ${formData.location || '[Location]'}\nDescription: ${formData.description || '[Description]'}\nWitnesses: ${formData.witnesses || '[Witnesses]'}\n\nReport Date: ${currentDate}`;
}

function generateRiskAssessment(user, company, formData, currentDate) {
  return `RISK ASSESSMENT\n\nActivity: ${formData.activityDescription || '[Activity Description]'}\nHazards: ${formData.hazards || '[Hazards]'}\nRisk Level: ${formData.riskLevel || '[Risk Level]'}\nControl Measures: ${formData.controlMeasures || '[Control Measures]'}\n\nAssessment Date: ${currentDate}`;
}

function generateSafetyTraining(user, company, formData, currentDate) {
  return `SAFETY TRAINING RECORD\n\nEmployee: ${formData.employeeName || '[Employee Name]'}\nTraining Type: ${formData.trainingType || '[Training Type]'}\nDate: ${formData.date || currentDate}\nTrainer: ${formData.trainer || '[Trainer]'}\n\nRecord Date: ${currentDate}`;
}

function generateEmergencyProcedure(user, company, formData, currentDate) {
  return `EMERGENCY PROCEDURE\n\nEmergency Type: ${formData.emergencyType || '[Emergency Type]'}\nSteps: ${formData.steps || '[Steps]'}\nContacts: ${formData.contacts || '[Contacts]'}\nEquipment: ${formData.equipment || '[Equipment]'}\n\nProcedure Date: ${currentDate}`;
}

function generateMeetingMinutes(user, company, formData, currentDate) {
  return `MEETING MINUTES\n\nMeeting Date: ${formData.meetingDate || '[Meeting Date]'}\nAttendees: ${formData.attendees || '[Attendees]'}\nAgenda: ${formData.agenda || '[Agenda]'}\nDecisions: ${formData.decisions || '[Decisions]'}\n\nRecorded by: ${user.email || '[Name]'}\nDate: ${currentDate}`;
}

function generateBusinessLetter(user, company, formData, currentDate) {
  return `${company.companyName || '[Company Name]'}\n\n${currentDate}\n\n${formData.recipient || '[Recipient]'}\n\nSubject: ${formData.subject || '[Subject]'}\n\nDear Sir/Madam,\n\n${formData.content || '[Letter Content]'}\n\nSincerely,\n\n${formData.sender || user.email || '[Sender Name]'}`;
}

function generateInvoice(user, company, formData, currentDate) {
  return `INVOICE\n\nInvoice Date: ${currentDate}\nBill To: ${formData.clientName || '[Client Name]'}\n\nServices/Products: ${formData.services || '[Services]'}\nAmount: ${formData.amount || '[Amount]'}\nDue Date: ${formData.dueDate || '[Due Date]'}\n\nFrom: ${company.companyName || '[Company Name]'}`;
}

function generateMemo(user, company, formData, currentDate) {
  return `MEMORANDUM\n\nTO: ${formData.recipient || '[Recipient]'}\nFROM: ${user.email || '[Sender]'}\nDATE: ${currentDate}\nSUBJECT: ${formData.subject || '[Subject]'}\n\n${formData.message || '[Message]'}\n\nUrgency: ${formData.urgency || 'Normal'}`;
}

function generatePressRelease(user, company, formData, currentDate) {
  return `PRESS RELEASE\n\nFOR IMMEDIATE RELEASE\n\n${formData.headline || '[Headline]'}\n\n${formData.content || '[Press Release Content]'}\n\nFor more information, contact:\n${formData.contactInfo || '[Contact Information]'}\n\nRelease Date: ${formData.releaseDate || currentDate}`;
}

module.exports = router;
