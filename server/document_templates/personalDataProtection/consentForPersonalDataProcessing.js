const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');

// Simple date formatting function
const formatDate = (date, format) => {
    const d = new Date(date);
    if (format === 'dd.MM.yyyy') {
        return d.toLocaleDateString('mk-MK');
    } else if (format === 'yyyyMMdd') {
        return d.toISOString().slice(0, 10).replace(/-/g, '');
    }
    return d.toLocaleDateString('mk-MK');
};

function generateConsentForPersonalDataProcessingDoc(formData, user, company) {
    const {
        dataSubjectName = '[Име и презиме на субјектот]',
        processingPurposes = '[Цели на обработка]',
        dataCategories = '[Категории на лични податоци]',
        consentDate = new Date(),
        // ... other relevant fields from formData
    } = formData;

    const companyName = company?.name || '[Име на компанија]';
    const companyAddress = company?.address || '[Адреса на компанија]';

    const doc = new Document({
        creator: "Nexa Platform",
        title: "Согласност за обработка на лични податоци",
        description: "Согласност за обработка на лични податоци генерирана од Nexa Platform",
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "СОГЛАСНОСТ ЗА ОБРАБОТКА НА ЛИЧНИ ПОДАТОЦИ",
                            bold: true,
                        }),
                    ],
                    heading: HeadingLevel.TITLE,
                    alignment: 'center',
                    spacing: { after: 200 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Контролор на збирката на лични податоци: ${companyName}, со седиште на ${companyAddress}.`,
                        }),
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Јас, долупотпишаниот(ата) ${dataSubjectName}, изјавувам дека сум согласен(а) моите лични податоци да се обработуваат од страна на ${companyName} за следните цели:`,
                        }),
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: processingPurposes,
                        }),
                    ],
                    bullet: { level: 0 },
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "За горенаведените цели, Контролорот ќе ги обработува следните категории на мои лични податоци:",
                        }),
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: dataCategories,
                        }),
                    ],
                    bullet: { level: 0 },
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Изјавувам дека сум запознаен(а) со моите права во однос на заштитата на личните податоци, вклучувајќи го правото на пристап, исправка, бришење, ограничување на обработката, право на преносливост на податоците и право на приговор, како и правото да ја повлечам оваа согласност во секое време.",
                        }),
                    ],
                    spacing: { after: 200 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Датум: ${formatDate(consentDate, 'dd.MM.yyyy')}`, // Assuming formatDate utility
                        }),
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Субјект на лични податоци,",
                        }),
                    ],
                    spacing: { after: 0 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "___________________________",
                        }),
                    ],
                    spacing: { after: 0 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `(${dataSubjectName})`,
                        }),
                    ],
                    spacing: { after: 200 },
                }),
            ],
        }],
    });

    return {
        doc,
        filenameSuffix: `Soglasnost_obrabotka_LP_${dataSubjectName.replace(/\s+/g, '_')}_${formatDate(consentDate, 'yyyyMMdd')}`
    };
}

module.exports = { generateConsentForPersonalDataProcessingDoc };
