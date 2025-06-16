const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const { createSectionHeader, createSignatureBlock } = require('../../utils/documentUtils');

function generateWorkplaceHarassmentPolicyDoc(formData, user, company) {
    const {
        policyEffectiveDateWH,
        commitmentStatementWH, // Company's commitment to preventing harassment
        definitionOfHarassment, // What constitutes harassment
        reportingProceduresWH, // How to report harassment
        investigationProcessWH,
        confidentialityAssuranceWH,
        disciplinaryActionsWH, // Consequences of policy violation
        retaliationProhibitionWH
    } = formData;

    const sections = [
        new Paragraph({
            children: [
                new TextRun({
                    text: `ПОЛИТИКА ЗА ЗАШТИТА ОД ВОЗНЕМИРУВАЊЕ НА РАБОТНО МЕСТО`,
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
                    text: `Датум на стапување на сила: ${new Date(policyEffectiveDateWH).toLocaleDateString('mk-MK') || '[Датум на стапување на сила]'}`,
                    size: 24,
                }),
            ],
            alignment: 'left',
            spacing: { after: 200 },
        }),

        createSectionHeader('1. Изјава за посветеност'),
        new Paragraph({
            children: [
                new TextRun({
                    text: `${company.name || '[Име на компанија]'} (во понатамошниот текст: "Компанијата") е посветена на обезбедување работна средина без вознемирување, дискриминација и малтретирање од каков било вид. ${commitmentStatementWH || '[Изјава за посветеност на компанијата]'}`,
                    size: 22,
                }),
            ],
            spacing: { after: 200 },
        }),

        createSectionHeader('2. Дефиниција за вознемирување'),
        new Paragraph({
            children: [
                new TextRun({
                    text: `Вознемирувањето вклучува, но не е ограничено на, несакано однесување кое има за цел или ефект повреда на достоинството на поединецот и создавање на застрашувачка, непријателска, деградирачка, понижувачка или навредлива средина. ${definitionOfHarassment || '[Дефиниција за вознемирување]'}`,
                    size: 22,
                }),
            ],
            spacing: { after: 200 },
        }),

        createSectionHeader('3. Процедури за пријавување'),
        new Paragraph({
            children: [
                new TextRun({
                    text: `Вработените кои веруваат дека биле подложени на вознемирување или биле сведоци на такво однесување, треба веднаш да го пријават инцидентот. ${reportingProceduresWH || '[Опишете ги процедурите за пријавување]'}`,
                    size: 22,
                }),
            ],
            spacing: { after: 200 },
        }),

        createSectionHeader('4. Процес на истрага'),
        new Paragraph({
            children: [
                new TextRun({
                    text: `Компанијата ќе спроведе брза, темелна и непристрасна истрага за сите пријави за вознемирување. ${investigationProcessWH || '[Опишете го процесот на истрага]'}`,
                    size: 22,
                }),
            ],
            spacing: { after: 200 },
        }),

        createSectionHeader('5. Доверливост'),
        new Paragraph({
            children: [
                new TextRun({
                    text: `Сите пријави за вознемирување ќе се третираат со најголема можна доверливост, освен до степен потребен за спроведување на темелна истрага и преземање соодветни корективни мерки. ${confidentialityAssuranceWH || '[Изјава за доверливост]'}`,
                    size: 22,
                }),
            ],
            spacing: { after: 200 },
        }),

        createSectionHeader('6. Дисциплински мерки'),
        new Paragraph({
            children: [
                new TextRun({
                    text: `Секое лице за кое ќе се утврди дека ја прекршило оваа политика ќе биде предмет на дисциплински мерки, кои може да вклучуваат и престанок на работниот однос. ${disciplinaryActionsWH || '[Опишете ги можните дисциплински мерки]'}`,
                    size: 22,
                }),
            ],
            spacing: { after: 200 },
        }),

        createSectionHeader('7. Забрана за одмазда'),
        new Paragraph({
            children: [
                new TextRun({
                    text: `Компанијата строго забранува каква било форма на одмазда против лице кое поднело пријава за вознемирување или учествувало во истрага. ${retaliationProhibitionWH || '[Изјава за забрана на одмазда]'}`,
                    size: 22,
                }),
            ],
            spacing: { after: 400 },
        }),

        createSignatureBlock(company.name, user.fullName, 'Управител', new Date().toLocaleDateString('mk-MK')),
    ];

    const doc = new Document({
        creator: company.name || "Nexa App",
        title: "Политика за заштита од вознемирување на работно место",
        description: "Политика за заштита од вознемирување на работно место генерирана преку Nexa апликацијата.",
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: 1440,
                        right: 1440,
                        bottom: 1440,
                        left: 1440,
                    },
                },
            },
            children: sections,
        }],
    });

    return { doc, filenameSuffix: `Политика_Заштита_Вознемирување_${company.name.replace(/\s+/g, '_')}` };
}

module.exports = { generateWorkplaceHarassmentPolicyDoc };
