const { Document, Packer, Paragraph, TextRun, AlignmentType, PageOrientation, convertInchesToTwip } = require('docx');
const { createSectionHeader, createSignatureBlock } = require('../../utils/documentUtils'); // Assuming documentUtils.js is in server/utils

function generateAnnexEmploymentAgreementDoc(formData, user, company) {
    const { contractNumber, contractDate, employeeName, employeeId, position, newSalary, annexReason, effectiveDate, companyName, companyAddress, companyIdNumber, companyTaxNumber, companyBank, companyBankAccount, managerName, managerPosition } = formData;

    const today = new Date();
    const formattedContractDate = new Date(contractDate).toLocaleDateString('mk-MK', { year: 'numeric', month: 'long', day: 'numeric' });
    const formattedEffectiveDate = new Date(effectiveDate).toLocaleDateString('mk-MK', { year: 'numeric', month: 'long', day: 'numeric' });

    const doc = new Document({
        creator: companyName || "Nexa",
        title: "Анекс на Договор за Вработување",
        description: `Анекс на договор за вработување за ${employeeName}`,
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
                        new TextRun({ text: companyName.toUpperCase(), bold: true, size: 28 }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: companyAddress, size: 24 }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 50 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `ЕДБ: ${companyTaxNumber} / ЕМБС: ${companyIdNumber}`, size: 24 }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 300 },
                }),

                new Paragraph({
                    children: [
                        new TextRun({ text: "АНЕКС НА ДОГОВОР ЗА ВРАБОТУВАЊЕ", bold: true, size: 32 }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400, before: 200 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Број: ${contractNumber}-${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}`, size: 24 }),
                    ],
                    alignment: AlignmentType.LEFT,
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Датум: ${formattedContractDate}`, size: 24 }),
                    ],
                    alignment: AlignmentType.LEFT,
                    spacing: { after: 300 },
                }),

                createSectionHeader("Член 1: Страни на договорот"),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Работодавач: ${companyName}, со седиште на ${companyAddress}, ЕМБС: ${companyIdNumber}, ЕДБ: ${companyTaxNumber}, застапуван од ${managerName}, ${managerPosition} (во понатамошниот текст: Работодавач).`, size: 24 }),
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Работник: ${employeeName}, со ЕМБГ ${employeeId}, на работно место ${position} (во понатамошниот текст: Работник).`, size: 24 }),
                    ],
                    spacing: { after: 300 },
                }),

                createSectionHeader("Член 2: Предмет на анексот"),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Со овој анекс се врши измена на Договорот за вработување склучен помеѓу Работодавачот и Работникот на ден ${formattedContractDate}, во делот на платата на Работникот.`, size: 24 }),
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Причина за измена: ${annexReason}.`, size: 24 }),
                    ],
                    spacing: { after: 300 },
                }),

                createSectionHeader("Член 3: Измена на плата"),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Основната нето плата на Работникот се менува и изнесува ${newSalary} МКД.`, size: 24 }),
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Оваа измена на платата стапува на сила од ${formattedEffectiveDate}.`, size: 24 }),
                    ],
                    spacing: { after: 300 },
                }),

                createSectionHeader("Член 4: Останати одредби"),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Сите останати одредби од основниот Договор за вработување остануваат во сила и непроменети.", size: 24 }),
                    ],
                    spacing: { after: 300 },
                }),

                createSectionHeader("Член 5: Завршни одредби"),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Овој анекс е составен во 2 (два) истоветни примероци, од кои по еден за секоја од договорните страни.", size: 24 }),
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Договорните страни го прифаќаат овој анекс со добра волја и се обврзуваат да ги почитуваат неговите одредби.", size: 24 }),
                    ],
                    spacing: { after: 400 },
                }),

                ...createSignatureBlock(employeeName, "Работник"),
                ...createSignatureBlock(managerName, "Работодавач"),
            ],
        }],
    });

    const filenameSuffix = `Анекс_Договор_${employeeName.replace(/\s+/g, '_')}_${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    return { doc, filenameSuffix };
}

module.exports = { generateAnnexEmploymentAgreementDoc };
