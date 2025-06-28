const { Packer } = require('docx');
const { generateConsentForPersonalDataProcessingDoc } = require('../../document_templates/personalDataProtection/consentForPersonalDataProcessing');

exports.generateDocument = async (req, res) => {
    try {
        const { formData } = req.body;
        const user = req.user; // User data from JWT

        // Check if user and companyInfo are available
        if (!user || !user.companyInfo) {
            return res.status(400).json({ 
                message: 'User or company information is missing. Please ensure the user profile is complete.' 
            });
        }

        // Map frontend data to template expected format
        const templateData = {
            // Controller and Data Subject Info
            controllerName: user.companyInfo.companyName || '[Име на компанија]',
            controllerAddress: user.companyInfo.address || '[Адреса на компанија]',
            controllerContact: user.companyInfo.email || user.email || '[Контакт на компанија]',
            dataSubjectName: formData.employeeName || '[Име и презиме на субјектот]',
            dataSubjectAddress: formData.employeeAddress || '[Адреса на субјектот]',
            
            // Processing details
            processingPurposes: formData.processingPurposes || '[Цели на обработка]',
            dataTypes: formData.dataTypes || '[Видови на лични податоци]', // Fix: use dataTypes not dataCategories
            legalBasis: formData.legalBasis || '[Правен основ за обработка]',
            retentionPeriod: formData.retentionPeriod || '[Рок на чување на податоците]',
            dataSubjectRights: formData.dataSubjectRights || '[Права на субјектот на лични податоци]',
            consentDate: new Date(),
        };

        // Generate the document
        const { doc, filenameSuffix } = generateConsentForPersonalDataProcessingDoc(
            templateData, 
            user, 
            user.companyInfo
        );

        // Convert document to buffer
        const buffer = await Packer.toBuffer(doc);
        
        // Set response headers for file download
        // Use ASCII-safe filename to avoid header issues
        const safeFilename = `consent_personal_data_${Date.now()}.docx`;
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Length', buffer.length);

        // Send the document
        res.send(buffer);

        console.log(`Document generated successfully: ${safeFilename}`);

    } catch (error) {
        console.error('Error generating consent document:', error);
        res.status(500).json({ 
            message: 'Error generating document', 
            error: error.message 
        });
    }
};