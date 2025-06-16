const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

const generateJobDescription = (data) => {
  try {
    // Read the template file
    const templatePath = path.join(__dirname, 'templates', 'job-description-template.docx');
    const content = fs.readFileSync(templatePath, 'binary');
    
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Prepare template data
    const templateData = {
      jobTitle: data.jobTitle || '',
      department: data.department || '',
      responsibilities: data.responsibilities || '',
      requirements: data.requirements || '',
      currentDate: new Date().toLocaleDateString('mk-MK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
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
      filename: `Опис_на_работно_место_${data.jobTitle?.replace(/\s+/g, '_') || 'документ'}.docx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

  } catch (error) {
    console.error('Error generating job description:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = generateJobDescription;
