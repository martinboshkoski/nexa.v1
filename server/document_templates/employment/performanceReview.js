const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

const generatePerformanceReview = (data) => {
  try {
    // Read the template file
    const templatePath = path.join(__dirname, 'templates', 'performance-review-template.docx');
    const content = fs.readFileSync(templatePath, 'binary');
    
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Prepare template data
    const templateData = {
      employeeName: data.employeeName || '',
      reviewPeriod: data.reviewPeriod || '',
      goals: data.goals || '',
      achievements: data.achievements || '',
      areasForImprovement: data.areasForImprovement || 'Нема специфични области за подобрување идентификувани во овој период.',
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
      filename: `Оценување_на_успешност_${data.employeeName?.replace(/\s+/g, '_') || 'документ'}.docx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

  } catch (error) {
    console.error('Error generating performance review:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = generatePerformanceReview;
