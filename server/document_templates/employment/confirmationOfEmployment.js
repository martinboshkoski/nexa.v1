const { Document, Packer, Paragraph, TextRun, AlignmentType, PageOrientation, convertInchesToTwip } = require('docx');
const { createSignatureBlock } = require('../../utils/documentUtils'); // Assuming documentUtils.js is in server/utils

function generateConfirmationOfEmploymentDoc(formData, user, company) {
    const {
        employeeName,
        employeeId, // ЕМБГ на работник
        jobPosition,
        employmentStartDate,
        // Company details from 'company' object or enriched formData
        companyName,
        companyAddress,
        companyIdNumber, // ЕМБС на компанија
        companyTaxNumber, // ЕДБ на компанија
        managerName,
        // confirmationReason - can be added if needed, e.g., "за потребите на банка", "за потребите на амбасада"
    } = formData;

    const today = new Date();
    const formattedConfirmationDate = today.toLocaleDateString('mk-MK', { year: 'numeric', month: 'long', day: 'numeric' });
    const formattedEmploymentStartDate = new Date(employmentStartDate).toLocaleDateString('mk-MK', { day: 'numeric', month: 'long', year: 'numeric' });

    const doc = new Document({
        creator: companyName || "Nexa",
        title: "Потврда за Вработување",
        description: `Потврда за вработување за ${employeeName}`,
        sections: [{
            properties: {
                page: {
                    size: {
                        orientation: PageOrientation.PORTRAIT,
                        width: convertInchesToTwip(8.27), // A4 width
                        height: convertInchesToTwip(11.69), // A4 height
                    },
                    margin: {
                        top: convertInchesToTwip(1),
                        right: convertInchesToTwip(1),
                        bottom: convertInchesToTwip(1),
                        left: convertInchesToTwip(1),
                    },
                },
            },
            children: [
                new Paragraph({
                    children: [
                        new TextRun({ text: (companyName || '[Име на компанија]').toUpperCase(), bold: true, size: 28 }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: companyAddress || '[Адреса на компанија]', size: 24 }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 50 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `ЕМБС: ${companyIdNumber || '[ЕМБС]'} / ЕДБ: ${companyTaxNumber || '[ЕДБ]'}`, size: 24 }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 300 },
                }),

                new Paragraph({
                    children: [
                        new TextRun({ text: "ПОТВРДА ЗА ВРАБОТУВАЊЕ", bold: true, size: 32 }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400, before: 200 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Број: _______ / ${today.getFullYear()}`, size: 24 }), // Placeholder for a sequential number
                    ],
                    alignment: AlignmentType.LEFT,
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Датум: ${formattedConfirmationDate}`, size: 24 }),
                    ],
                    alignment: AlignmentType.LEFT,
                    spacing: { after: 300 },
                }),

                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Се потврдува дека ${employeeName || '[Име и Презиме на работник]'}, со ЕМБГ ${employeeId || '[ЕМБГ на работник]'}, е во редовен работен однос во ${companyName || '[Име на компанија]'} на неопределено време, почнувајќи од ${formattedEmploymentStartDate}.`,
                            size: 24 
                        }),
                    ],
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 150 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Работникот е распореден на работно место: ${jobPosition || '[Работно место]'}.`,
                            size: 24 
                        }),
                    ],
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 150 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Месечните примања на работникот се редовни.`,
                            size: 24 
                        }),
                    ],
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 150 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Оваа потврда се издава на барање на работникот и може да се употреби за регулирање на права во банка, институции или за други потреби.`,
                            size: 24 
                        }),
                    ],
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 400 },
                }),
                
                ...createSignatureBlock(managerName || '[Име на Управител]', "Управител", "Управител:", "Потпис:", "Датум:"),
            ],
        }],
    });

    const filenameSuffix = `Потврда_Вработување_${(employeeName || 'Вработен').replace(/\s+/g, '_')}_${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    return { doc, filenameSuffix };
}

module.exports = { generateConfirmationOfEmploymentDoc };
