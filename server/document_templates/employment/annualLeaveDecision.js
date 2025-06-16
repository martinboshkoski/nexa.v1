const { Document, Packer, Paragraph, TextRun, AlignmentType, PageOrientation, convertInchesToTwip } = require('docx');
const { createSectionHeader, createSignatureBlock } = require('../../utils/documentUtils');

function generateAnnualLeaveDecisionDoc(formData, user, company) {
    const {
        employeeName,
        jobPosition, // Added based on typical requirement for such documents
        annualLeaveYear,
        annualLeaveStart,
        annualLeaveEnd,
        // Company details are expected to be in the 'company' object or enriched formData
        companyName,
        companyAddress,
        companyIdNumber, // Should be EMBS
        // companyTaxNumber, // EDB - might not be directly on this form but good to have if available
        managerName,
        // managerPosition // Might not be on this specific form, can default or use from company
    } = formData;

    const today = new Date();
    const formattedDecisionDate = today.toLocaleDateString('mk-MK', { year: 'numeric', month: 'long', day: 'numeric' });
    const formattedStartDate = new Date(annualLeaveStart).toLocaleDateString('mk-MK', { day: 'numeric', month: 'long', year: 'numeric' });
    const formattedEndDate = new Date(annualLeaveEnd).toLocaleDateString('mk-MK', { day: 'numeric', month: 'long', year: 'numeric' });

    // Calculate duration of leave
    const startDate = new Date(annualLeaveStart);
    const endDate = new Date(annualLeaveEnd);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end date

    const doc = new Document({
        creator: companyName || "Nexa",
        title: `Решение за Годишен Одмор ${annualLeaveYear}`,
        description: `Решение за годишен одмор за ${employeeName} за ${annualLeaveYear} година`,
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
                        new TextRun({ text: `ЕМБС: ${companyIdNumber || '[ЕМБС на компанија]'}`, size: 24 }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 300 },
                }),

                new Paragraph({
                    children: [
                        new TextRun({ text: "РЕШЕНИЕ", bold: true, size: 32 }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `за користење на годишен одмор за ${annualLeaveYear} година`, bold: true, size: 28 }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400, before: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Врз основа на член 137 и член 141 од Законот за работните односи (Сл. Весник на РМ бр. 62/05 ... 120/18) и Општиот колективен договор за приватниот сектор од областа на стопанството, Управителот на ${companyName || '[Име на компанија]'} донесува:`, size: 24 }),
                    ],
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 300 },
                }),

                createSectionHeader("I. Одобрување на годишен одмор"),
                new Paragraph({
                    children: [
                        new TextRun({ text: `На работникот ${employeeName || '[Име на вработен]'}, кој работи на работно место ${jobPosition || '[Работно место]'} во ${companyName || '[Име на компанија]'}, му се одобрува користење на годишен одмор за ${annualLeaveYear} година.`, size: 24 }),
                    ],
                    spacing: { after: 200 },
                }),

                createSectionHeader("II. Времетраење и период на користење"),
                 new Paragraph({
                    children: [
                        new TextRun({ text: `Годишниот одмор е во траење од ${diffDays} работни дена.`, size: 24 }),
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Работникот ќе го користи годишниот одмор во периодот од ${formattedStartDate} до ${formattedEndDate} заклучно.`, size: 24 }),
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        // Calculate the day after the annual leave ends for return to work
                        new TextRun({ text: `Работникот е должен да се јави на работа на ${new Date(new Date(endDate).setDate(endDate.getDate() + 1)).toLocaleDateString('mk-MK', { day: 'numeric', month: 'long', year: 'numeric' })}.`, size: 24 }),
                    ],
                    spacing: { after: 300 },
                }),
                
                createSectionHeader("III. Права и обврски"),
                new Paragraph({
                    children: [
                        new TextRun({ text: "За време на користењето на годишниот одмор, работникот има право на надоместок на плата во висина утврдена со закон и колективен договор.", size: 24 }),
                    ],
                    spacing: { after: 100 },
                }),
                 new Paragraph({
                    children: [
                        new TextRun({ text: "Ова решение влегува во сила со денот на донесувањето.", size: 24 }),
                    ],
                    spacing: { after: 300 },
                }),

                new Paragraph({
                    children: [
                        new TextRun({ text: `Датум на донесување: ${formattedDecisionDate}`, size: 24 }),
                    ],
                    alignment: AlignmentType.LEFT,
                    spacing: { after: 50, top: 400 }, // Added top spacing for better layout before signature
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Место: ${company.city || '[Град]'}`, size: 24 }), // Assuming company object has a city field from DB
                    ],
                    alignment: AlignmentType.LEFT,
                    spacing: { after: 200 },
                }),

                ...createSignatureBlock(managerName || '[Име на Управител]', "Управител", "Управител:", "Потпис:", "Датум:"), // Using Macedonian default labels
            ],
        }],
    });

    const filenameSuffix = `Решение_Годишен_Одмор_${(employeeName || 'Вработен').replace(/\s+/g, '_')}_${annualLeaveYear}`;
    return { doc, filenameSuffix };
}

module.exports = { generateAnnualLeaveDecisionDoc };
