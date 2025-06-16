const { Document, Packer, Paragraph, TextRun, AlignmentType, PageOrientation, convertInchesToTwip } = require('docx');
const { createSectionHeader, createSignatureBlock } = require('../../utils/documentUtils');

/**
 * Generates an Employment Contract document
 * @param {Object} formData - Data submitted through the form
 * @param {Object} user - User data from the database
 * @param {Object} company - Company data from the database
 * @returns {Buffer} - The generated document as a buffer
 */
const generateEmploymentContractDoc = (formData, user, company) => {
    const { 
        contractNumber, 
        employeeName, 
        employeeId, 
        employeeAddress,
        position, 
        salary, 
        startDate,
        contractType, // "indefinite" or "fixed"
        contractDuration, // for fixed-term contracts, in months
        probationPeriod, // in months
        workingHours,
        vacationDays,
        companyName, 
        companyAddress, 
        companyIdNumber, 
        companyTaxNumber, 
        managerName, 
        managerPosition 
    } = formData;

    const today = new Date();
    const formattedToday = today.toLocaleDateString('mk-MK', { year: 'numeric', month: 'long', day: 'numeric' });
    const formattedStartDate = new Date(startDate).toLocaleDateString('mk-MK', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Calculate end date for fixed-term contracts
    let endDateText = '';
    if (contractType === 'fixed' && contractDuration) {
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + parseInt(contractDuration));
        endDateText = endDate.toLocaleDateString('mk-MK', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    const doc = new Document({
        creator: companyName || "Nexa",
        title: "Договор за Вработување",
        description: `Договор за вработување за ${employeeName}`,
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
                        new TextRun({ text: "ДОГОВОР ЗА ВРАБОТУВАЊЕ", bold: true, size: 32 }),
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
                        new TextRun({ text: `Датум: ${formattedToday}`, size: 24 }),
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
                        new TextRun({ text: `Работник: ${employeeName}, со ЕМБГ ${employeeId}, со адреса ${employeeAddress} (во понатамошниот текст: Работник).`, size: 24 }),
                    ],
                    spacing: { after: 300 },
                }),

                createSectionHeader("Член 2: Предмет на договорот"),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Со овој договор, Работодавачот и Работникот засноваат работен однос и ги уредуваат меѓусебните права, обврски и одговорности од работниот однос, во согласност со Законот за работни односи и Колективниот договор.`, size: 24 }),
                    ],
                    spacing: { after: 300 },
                }),

                createSectionHeader("Член 3: Датум на стапување на работа"),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Работникот започнува со работа на ден ${formattedStartDate}.`, size: 24 }),
                    ],
                    spacing: { after: 100 },
                }),
                contractType === 'fixed' ? new Paragraph({
                    children: [
                        new TextRun({ text: `Овој договор е склучен на определено време и важи до ${endDateText}.`, size: 24 }),
                    ],
                    spacing: { after: 300 },
                }) : new Paragraph({
                    children: [
                        new TextRun({ text: `Овој договор е склучен на неопределено време.`, size: 24 }),
                    ],
                    spacing: { after: 300 },
                }),

                createSectionHeader("Член 4: Работно место и опис на работата"),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Работникот заснова работен однос за работно место ${position}, со следниве работни задачи:`, size: 24 }),
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `- Извршување на работи и задачи предвидени со систематизацијата за работното место;`, size: 24 }),
                    ],
                    spacing: { after: 50 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `- Почитување на работниот ред и дисциплина;`, size: 24 }),
                    ],
                    spacing: { after: 50 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `- Други работни задачи доделени од страна на Работодавачот.`, size: 24 }),
                    ],
                    spacing: { after: 300 },
                }),

                createSectionHeader("Член 5: Пробна работа"),
                probationPeriod ? new Paragraph({
                    children: [
                        new TextRun({ text: `На работникот му се определува пробна работа во траење од ${probationPeriod} месеци. За време на пробната работа, работникот и работодавачот може да го откажат договорот со отказен рок од 7 работни дена.`, size: 24 }),
                    ],
                    spacing: { after: 300 },
                }) : new Paragraph({
                    children: [
                        new TextRun({ text: `Не се утврдува пробна работа.`, size: 24 }),
                    ],
                    spacing: { after: 300 },
                }),

                createSectionHeader("Член 6: Плата, надоместоци и други примања"),
                new Paragraph({
                    children: [
                        new TextRun({ text: `На работникот му припаѓа основна месечна плата во износ од ${salary} денари (бруто/нето).`, size: 24 }),
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Платата се исплаќа еднаш месечно, најдоцна до 15-ти во тековниот месец за претходниот месец.`, size: 24 }),
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `На работникот му припаѓаат и други надоместоци согласно Законот за работни односи и општите акти на Работодавачот.`, size: 24 }),
                    ],
                    spacing: { after: 300 },
                }),

                createSectionHeader("Член 7: Работно време"),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Работникот заснова работен однос со полно работно време од ${workingHours || 40} часа неделно, распоредени во 5 работни дена.`, size: 24 }),
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Работното време започнува во 9:00 часот и завршува во 17:00 часот, од понеделник до петок.`, size: 24 }),
                    ],
                    spacing: { after: 300 },
                }),

                createSectionHeader("Член 8: Годишен одмор"),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Работникот има право на годишен одмор во траење од ${vacationDays || 20} работни дена во календарската година.`, size: 24 }),
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Годишниот одмор се користи според план утврден од Работодавачот, земајќи ги предвид потребите на работниот процес и барањата на работникот.`, size: 24 }),
                    ],
                    spacing: { after: 300 },
                }),

                createSectionHeader("Член 9: Престанок на работниот однос"),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Овој договор за вработување може да престане во случаите предвидени со Закон.`, size: 24 }),
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Отказниот рок изнесува 1 месец ако отказот го дава работникот, односно 2 месеци ако отказот го дава работодавачот.`, size: 24 }),
                    ],
                    spacing: { after: 300 },
                }),

                createSectionHeader("Член 10: Други права и обврски"),
                new Paragraph({
                    children: [
                        new TextRun({ text: `За правата, обврските и одговорностите кои не се опфатени со овој договор ќе се применуваат одредбите од Законот за работни односи и Колективниот договор.`, size: 24 }),
                    ],
                    spacing: { after: 300 },
                }),

                createSectionHeader("Член 11: Завршни одредби"),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Овој договор е составен во 4 (четири) еднакви примероци, од кои по два примерока за секоја од договорните страни.`, size: 24 }),
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Договорот влегува во сила од денот на неговото потпишување од двете страни.`, size: 24 }),
                    ],
                    spacing: { after: 400 },
                }),

                new Paragraph({
                    children: [
                        new TextRun({ text: "ПОТПИСНИЦИ:", size: 24, bold: true }),
                    ],
                    spacing: { after: 200 },
                }),

                ...createSignatureBlock(`${managerName}`, "За работодавачот"),
                ...createSignatureBlock(`${employeeName}`, "Работник"),
            ]
        }]
    });

    return doc;
};

module.exports = { generateEmploymentContractDoc };
