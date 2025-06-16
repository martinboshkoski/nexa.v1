const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

const generateDisciplinaryAction = (data) => {
  try {
    // Read the template file
    const templatePath = path.join(__dirname, 'templates', 'disciplinary-action-template.docx');
    const content = fs.readFileSync(templatePath, 'binary');
    
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Format dates
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('mk-MK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Prepare template data
    const templateData = {
      employeeName: data.employeeName || '',
      incidentDate: formatDate(data.incidentDate),
      incidentDescription: data.incidentDescription || '',
      actionTaken: data.actionTaken || '',
      effectiveDate: formatDate(data.effectiveDate),
      currentDate: formatDate(new Date()),
      companyName: 'Нексa Македонија', // Default company name
    };

    // Render the document
    doc.render(templateData);

    // Generate buffer
    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    return {
      success: true,
      buffer: buf,
      filename: `Дисциплинска_мерка_${data.employeeName?.replace(/\s+/g, '_') || 'документ'}.docx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

  } catch (error) {
    console.error('Error generating disciplinary action:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = generateDisciplinaryAction;
