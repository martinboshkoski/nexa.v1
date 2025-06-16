const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const { createSectionHeader, createSignatureBlock } = require('../../utils/documentUtils');

function generateHealthAndSafetyPolicyDoc(formData, user, company) {
    const {
        policyEffectiveDate,
        companyMissionStatementHS, // Company's mission regarding H&S
        managementResponsibilities, // Array or string
        employeeResponsibilities, // Array or string
        hazardIdentificationProcedures,
        emergencyProcedures, // Array or string
        trainingCommitment,
        reviewFrequency // e.g., Annually, Biannually
    } = formData;

    const sections = [
        new Paragraph({
            children: [
                new TextRun({
                    text: `ПОЛИТИКА ЗА БЕЗБЕДНОСТ И ЗДРАВЈЕ ПРИ РАБОТА`,
                    bold: true,
                    size: 32,
                }),
            ],
            heading: HeadingLevel.TITLE,
            alignment: 'center',
            spacing: { after: 400 },
        }),
        new Paragraph({
            children: [
                new TextRun({
                    text: `Датум на стапување на сила: ${new Date(policyEffectiveDate).toLocaleDateString('mk-MK') || '[Датум на стапување на сила]'}`,
                    size: 24,
                }),
            ],
            alignment: 'left',
            spacing: { after: 200 },
        }),
        createSectionHeader('1. Вовед и изјава за мисија'),
        new Paragraph({
            children: [
                new TextRun({
                    text: `Оваа Политика за безбедност и здравје при работа (во понатамошниот текст: "Политика") ја утврдува посветеноста на ${company.name || '[Име на компанија]'} (во понатамошниот текст: "Компанијата") за обезбедување безбедна и здрава работна средина за сите свои вработени, соработници, посетители и други засегнати страни.`,
                    size: 22,
                }),
            ],
            spacing: { after: 100 },
        }),
        new Paragraph({
            children: [
                new TextRun({
                    text: `Изјава за мисија за БЗР: ${companyMissionStatementHS || '[Изјава за мисија на компанијата во врска со БЗР]'}`,
                    size: 22,
                }),
            ],
            spacing: { after: 200 },
        }),

        createSectionHeader('2. Одговорности'),
        new Paragraph({
            children: [
                new TextRun({ text: '2.1. Одговорности на раководството:', bold: true, size: 24 }),
            ],
            spacing: { after: 100 },
        }),
        // Assuming managementResponsibilities is a string with points separated by newlines, or an array
        ...(typeof managementResponsibilities === 'string' ? managementResponsibilities.split('\n') : Array.isArray(managementResponsibilities) ? managementResponsibilities : ['[Наведете ги одговорностите на раководството]']).map(item => new Paragraph({ text: `- ${item.trim()}`, bullet: { level: 0 }, style: "ListParagraph", spacing: { after: 50 } })),
        
        new Paragraph({
            children: [
                new TextRun({ text: '2.2. Одговорности на вработените:', bold: true, size: 24 }),
            ],
            spacing: { after: 100, before: 200 },
        }),
        ...(typeof employeeResponsibilities === 'string' ? employeeResponsibilities.split('\n') : Array.isArray(employeeResponsibilities) ? employeeResponsibilities : ['[Наведете ги одговорностите на вработените]']).map(item => new Paragraph({ text: `- ${item.trim()}`, bullet: { level: 0 }, style: "ListParagraph", spacing: { after: 50 } })),

        createSectionHeader('3. Идентификација на опасности и проценка на ризик'),
        new Paragraph({
            children: [
                new TextRun({
                    text: `Компанијата ќе спроведува редовна идентификација на опасности и проценка на ризици со цел да ги идентификува потенцијалните опасности и да ги имплементира соодветните контролни мерки. Процедури: ${hazardIdentificationProcedures || '[Опишете ги процедурите за идентификација на опасности и проценка на ризик]'}`,
                    size: 22,
                }),
            ],
            spacing: { after: 200 },
        }),

        createSectionHeader('4. Процедури за итни случаи'),
        new Paragraph({
            children: [
                new TextRun({
                    text: `Компанијата има воспоставено процедури за итни случаи за да обезбеди ефикасен одговор во случај на пожар, природни катастрофи, повреди на работа и други итни ситуации. Овие процедури вклучуваат:`,
                    size: 22,
                }),
            ],
            spacing: { after: 100 },
        }),
        ...(typeof emergencyProcedures === 'string' ? emergencyProcedures.split('\n') : Array.isArray(emergencyProcedures) ? emergencyProcedures : ['[Наведете ги процедурите за итни случаи]']).map(item => new Paragraph({ text: `- ${item.trim()}`, bullet: { level: 0 }, style: "ListParagraph", spacing: { after: 50 } })),

        createSectionHeader('5. Обука и информирање'),
        new Paragraph({
            children: [
                new TextRun({
                    text: `Компанијата е посветена на обезбедување соодветна обука и информации за сите вработени во врска со безбедноста и здравјето при работа. ${trainingCommitment || '[Опишете ја посветеноста за обука]'}`,
                    size: 22,
                }),
            ],
            spacing: { after: 200 },
        }),
        
        createSectionHeader('6. Преглед и ревизија на политиката'),
        new Paragraph({
            children: [
                new TextRun({
                    text: `Оваа Политика ќе биде ревидирана ${reviewFrequency || 'годишно'} или по потреба, за да се обезбеди нејзината континуирана релевантност и ефикасност.`,
                    size: 22,
                }),
            ],
            spacing: { after: 400 },
        }),
        
        createSignatureBlock(company.name, user.fullName, 'Управител', new Date().toLocaleDateString('mk-MK')),
    ];

    const doc = new Document({
        creator: company.name || "Nexa App",
        title: "Политика за безбедност и здравје при работа",
        description: "Политика за безбедност и здравје при работа генерирана преку Nexa апликацијата.",
        styles: {
            paragraphStyles: [
                {
                    id: "ListParagraph",
                    name: "List Paragraph",
                    basedOn: "Normal",
                    quickFormat: true,
                    paragraph: {
                        indent: { left: 720 }, // 0.5 inch indent
                        spacing: { after: 100 },
                    },
                },
            ],
        },
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: 1440, // 1 inch
                        right: 1440,
                        bottom: 1440,
                        left: 1440,
                    },
                },
            },
            children: sections,
        }],
    });

    return { doc, filenameSuffix: `Политика_БЗР_${company.name.replace(/\s+/g, '_')}` };
}

module.exports = { generateHealthAndSafetyPolicyDoc };
