const { Document, Packer, Paragraph, TextRun, HeadingLevel, Tab, TabStopPosition, TabStopType } = require('docx');

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

function generatePrivacyPolicyDoc(formData, user, company) {
    const {
        policyEffectiveDate = new Date(),
        dataControllerName = company?.name || '[Име на компанија]',
        dataControllerAddress = company?.address || '[Адреса на компанија]',
        contactEmail = '[Контакт е-маил за приватност]',
        // ... other relevant fields from formData like typesOfDataCollected, purposesOfProcessing, dataRetentionPeriod, etc.
    } = formData;

    const doc = new Document({
        creator: "Nexa Platform",
        title: "Политика за приватност",
        description: "Политика за приватност генерирана од Nexa Platform",
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "ПОЛИТИКА ЗА ПРИВАТНОСТ",
                            bold: true,
                        }),
                    ],
                    heading: HeadingLevel.TITLE,
                    alignment: 'center',
                    spacing: { after: 300 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Дата на стапување на сила: ${formatDate(policyEffectiveDate, 'dd.MM.yyyy')}`,
                        }),
                    ],
                    spacing: { after: 200 },
                }),

                new Paragraph({ text: "1. ВОВЕД", heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Оваа Политика за приватност објаснува како ${dataControllerName} (во понатамошниот текст \\"Контролор\\", \\"ние\\", \\"нас\\" или \\"наш\\") ги собира, користи, открива и заштитува вашите лични податоци кога ја посетувате нашата веб-страница [Доколку е применливо: име на веб-страница], ги користите нашите услуги или на друг начин стапувате во интеракција со нас.`,
                        }),
                    ],
                    spacing: { after: 100 },
                }),

                new Paragraph({ text: "2. КОНТРОЛОР НА ЛИЧНИ ПОДАТОЦИ", heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Контролор на вашите лични податоци е:`, }),
                    ],
                    spacing: { after: 50 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: dataControllerName, bold: true }),
                    ],
                    spacing: { after: 50 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Адреса: ${dataControllerAddress}` }),
                    ],
                    spacing: { after: 50 },
                }),
                 new Paragraph({
                    children: [
                        new TextRun({ text: `Е-пошта за прашања поврзани со приватност: ${contactEmail}` }),
                    ],
                    spacing: { after: 100 },
                }),

                new Paragraph({ text: "3. КОИ ЛИЧНИ ПОДАТОЦИ ГИ СОБИРАМЕ", heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Можеме да собираме различни видови лични податоци, вклучувајќи, но не ограничувајќи се на: ${formData.typesOfDataCollected || '[Наведете типови на податоци: на пр. име, презиме, е-пошта, телефонски број, IP адреса, итн.]'}` }),
                    ],
                    spacing: { after: 100 },
                }),

                new Paragraph({ text: "4. КАКО ГИ КОРИСТИМЕ ВАШИТЕ ЛИЧНИ ПОДАТОЦИ", heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }),
                 new Paragraph({
                    children: [
                        new TextRun({ text: `Вашите лични податоци ги користиме за следниве цели: ${formData.purposesOfProcessing || '[Наведете цели: на пр. за обезбедување и подобрување на нашите услуги, за комуникација со вас, за маркетинг цели со ваша согласност, за исполнување на законски обврски, итн.]'}` }),
                    ],
                    spacing: { after: 100 },
                }),
                
                new Paragraph({ text: "5. ПРАВНА ОСНОВА ЗА ОБРАБОТКА", heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Обработката на вашите лични податоци се заснова на: ${formData.legalBasis || '[Наведете правна основа: на пр. ваша согласност, извршување на договор, легитимен интерес, законска обврска.]'}` }),
                    ],
                    spacing: { after: 100 },
                }),

                new Paragraph({ text: "6. СПОДЕЛУВАЊЕ НА ЛИЧНИ ПОДАТОЦИ", heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Вашите лични податоци може да ги споделиме со: ${formData.dataSharingInfo || '[Наведете со кого се споделуваат: на пр. трети страни – даватели на услуги, државни органи по законско барање, итн. Опишете ги и мерките за заштита.]'}` }),
                    ],
                    spacing: { after: 100 },
                }),

                new Paragraph({ text: "7. ЧУВАЊЕ НА ЛИЧНИ ПОДАТОЦИ", heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Вашите лични податоци ќе ги чуваме онолку долго колку што е потребно за исполнување на целите за кои се собрани, или како што е пропишано со закон. Периодот на чување е: ${formData.dataRetentionPeriod || '[Наведете период или критериуми за одредување на периодот]'}.` }),
                    ],
                    spacing: { after: 100 },
                }),

                new Paragraph({ text: "8. ВАШИТЕ ПРАВА", heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Имате право на пристап, исправка, бришење на вашите лични податоци, право на ограничување на обработката, право на преносливост на податоците, право на приговор и право да ја повлечете согласноста во секое време. За остварување на овие права, ве молиме контактирајте не на горенаведената е-пошта." }),
                    ],
                    spacing: { after: 100 },
                }),

                new Paragraph({ text: "9. БЕЗБЕДНОСТ НА ПОДАТОЦИТЕ", heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Преземаме соодветни технички и организациски мерки за заштита на вашите лични податоци од неовластен пристап, употреба или откривање. ${formData.securityMeasures || '[Доколку сакате, наведете конкретни мерки]'}` }),
                    ],
                    spacing: { after: 100 },
                }),

                new Paragraph({ text: "10. ИЗМЕНИ НА ОВАА ПОЛИТИКА", heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Го задржуваме правото да ја измениме оваа Политика за приватност во секое време. Сите измени ќе бидат објавени на оваа страница со нова дата на стапување на сила." }),
                    ],
                    spacing: { after: 200 },
                }),
                 new Paragraph({
                    children: [
                        new TextRun({ text: `Последна измена: ${formatDate(policyEffectiveDate, 'dd.MM.yyyy')}` }),
                    ],
                    spacing: { after: 200 },
                }),
            ],
        }],
    });

    return {
        doc,
        filenameSuffix: `Politika_za_privatnost_${dataControllerName.replace(/\\s+/g, '\_')}_${formatDate(policyEffectiveDate, 'yyyyMMdd')}`
    };
}

module.exports = { generatePrivacyPolicyDoc };

