# Automated Document Generation Flow: React Frontend to Node.js Backend (docx)

This guide explains the end-to-end data flow for generating a Word document (docx) from a React frontend through a Node.js backend. It is designed as a template for AI or developers to generate new document types by following these steps. **A complete, working example for a Personal Data Protection Consent document is included.**

---

## 1. User Input & Live Preview (Frontend React Page)

### **User Action:**
- The user fills out a form with required fields (e.g., employee name, address, position) on a React page.
- As the user types, a live preview of the document is rendered below the form, showing how the final document will look (in HTML, styled to match the docx as closely as possible).
- On submit, the form data is collected into a `formData` object and sent to the backend.

### **Frontend Code Example: Personal Data Protection Consent**

**File:** `client/src/pages/ConsentForPersonalDataProcessingPage.jsx`

```jsx
import React, { useState } from 'react';

function ConsentPreview({ formData, companyInfo }) {
  return (
    <div className="doc-preview">
      <h2>СОГЛАСНОСТ ЗА ОБРАБОТКА НА ЛИЧНИ ПОДАТОЦИ</h2>
      <p>Контролор: {companyInfo?.companyName || '[Име на компанија]'}, {companyInfo?.address || '[Адреса]'}</p>
      <p>Јас, {formData.employeeName || '[Име и презиме]'}, со адреса {formData.employeeAddress || '[Адреса]'}, на позицијата {formData.employeeWorkPosition || '[Позиција]'}, изјавувам дека сум согласен(а) моите лични податоци да се обработуваат од страна на {companyInfo?.companyName || '[Име на компанија]'} за следните цели:</p>
      <p>Цели на обработка: Администрирање на вработените, водење на персонална евиденција, исполнување на законските обврски</p>
      <p>Категории на лични податоци: Име и презиме, адреса, контакт телефон, е-маил адреса, позиција на работа</p>
      <p>Правен основ: Согласност на субјектот на лични податоци согласно член 6(1)(а) од GDPR</p>
      <p>Рок на чување: 5 години по престанок на работниот однос</p>
      <p>Изјавувам дека сум запознаен(а) со моите права во однос на заштитата на личните податоци, вклучувајќи го правото на пристап, исправка, бришење, ограничување на обработката, право на преносливост на податоците и право на приговор, како и правото да ја повлечам оваа согласност во секое време.</p>
      <p>Датум: {new Date().toLocaleDateString('mk-MK')}</p>
      <p>Субјект на лични податоци:</p>
      <p>___________________________</p>
      <p>({formData.employeeName || '[Име и презиме]'})</p>
    </div>
  );
}

function ConsentForPersonalDataProcessingPage({ user }) {
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeAddress: '',
    employeeWorkPosition: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auto-documents/consent-for-personal-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ formData }),
      });
      if (!response.ok) throw new Error('Error generating document');
      const blob = await response.blob();
      // Download the file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'consent_for_personal_data.docx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input name="employeeName" value={formData.employeeName} onChange={handleChange} placeholder="Employee Name" required />
        <input name="employeeAddress" value={formData.employeeAddress} onChange={handleChange} placeholder="Employee Address" required />
        <input name="employeeWorkPosition" value={formData.employeeWorkPosition} onChange={handleChange} placeholder="Employee Position" required />
        <button type="submit" disabled={loading}>Generate Document</button>
        {error && <div style={{color:'red'}}>{error}</div>}
      </form>
      <h3>Live Preview</h3>
      <ConsentPreview formData={formData} companyInfo={user?.companyInfo} />
    </>
  );
}

export default ConsentForPersonalDataProcessingPage;
```

**Best Practice:**
- The preview should update in real time as the user types.
- The preview should closely match the structure and content of the generated Word document.
- For more advanced previews, you can use libraries to render PDFs or even docx in the browser, but HTML is the most universal and simple.

---

## 2. API Request (Frontend to Backend)

- **Endpoint:**
  - The frontend sends a POST request to `/api/auto-documents/consent-for-personal-data`.
  - The request includes the `formData` and a JWT token for authentication.

---

## 3. Backend Route (Express Router)

**File:** `server/routes/autoDocuments.js`

```js
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const generate = require('../controllers/autoDocuments/consentForPersonalDataProcessingController');

// Consent for Personal Data Processing
router.post('/consent-for-personal-data', authenticateJWT, generate);

module.exports = router;
```

---

## 4. Backend Controller (Handles Request)

**File:** `server/controllers/autoDocuments/consentForPersonalDataProcessingController.js`

```js
const { Packer } = require('docx');
const generateConsentForPersonalDataProcessingDoc = require('../../document_templates/personalDataProtection/consentForPersonalDataProcessing');

async function generate(req, res) {
  try {
    const { formData } = req.body;
    const user = req.user;
    if (!user || !user.companyInfo) {
      return res.status(400).json({ message: 'User or company info missing.' });
    }
    if (!formData.employeeName || !formData.employeeAddress || !formData.employeeWorkPosition) {
      return res.status(400).json({ message: 'Missing required employee fields.' });
    }
    // Call the template function to generate the docx document
    const { doc } = generateConsentForPersonalDataProcessingDoc(formData, user, user.companyInfo);
    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Disposition', 'attachment; filename="consent_for_personal_data.docx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
  } catch (error) {
    console.error('Document generation error:', error);
    res.status(500).json({ message: 'Error generating document', error: error.message });
  }
}

module.exports = generate;
```

---

## 5. Document Template (Business Logic)

**File:** `server/document_templates/personalDataProtection/consentForPersonalDataProcessing.js`

```js
const { Document, Paragraph, TextRun } = require('docx');

function generateConsentForPersonalDataProcessingDoc(formData, user, company) {
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.address || '[Адреса на компанија]';
  const companyTaxNumber = company?.taxNumber || '[Даночен број]';
  const employeeName = formData.employeeName || '[Име и презиме]';
  const employeeAddress = formData.employeeAddress || '[Адреса]';
  const employeePosition = formData.employeeWorkPosition || '[Позиција]';
  const currentDate = new Date().toLocaleDateString('mk-MK');

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ children: [new TextRun("СОГЛАСНОСТ ЗА ОБРАБОТКА НА ЛИЧНИ ПОДАТОЦИ")] }),
        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({ children: [new TextRun(`Контролор на збирката на лични податоци: ${companyName}, со седиште на ${companyAddress}.`)] }),
        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({ children: [new TextRun(`Јас, долупотпишаниот(ата) ${employeeName}, со адреса ${employeeAddress}, на позицијата ${employeePosition}, изјавувам дека сум согласен(а) моите лични податоци да се обработуваат од страна на ${companyName} за следните цели:`)] }),
        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({ children: [new TextRun("Цели на обработка: Администрирање на вработените, водење на персонална евиденција, исполнување на законските обврски")] }),
        new Paragraph({ children: [new TextRun("Категории на лични податоци: Име и презиме, адреса, контакт телефон, е-маил адреса, позиција на работа")] }),
        new Paragraph({ children: [new TextRun("Правен основ: Согласност на субјектот на лични податоци согласно член 6(1)(а) од GDPR")] }),
        new Paragraph({ children: [new TextRun("Рок на чување: 5 години по престанок на работниот однос")] }),
        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({ children: [new TextRun("Изјавувам дека сум запознаен(а) со моите права во однос на заштитата на личните податоци, вклучувајќи го правото на пристап, исправка, бришење, ограничување на обработката, право на преносливост на податоците и право на приговор, како и правото да ја повлечам оваа согласност во секое време.")] }),
        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({ children: [new TextRun(`Датум: ${currentDate}`)] }),
        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({ children: [new TextRun("Субјект на лични податоци:")] }),
        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({ children: [new TextRun("___________________________")] }),
        new Paragraph({ children: [new TextRun(`(${employeeName})`)] }),
      ]
    }]
  });

  return {
    doc,
    filenameSuffix: `Soglasnost_obrabotka_LP_${employeeName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`
  };
}

module.exports = generateConsentForPersonalDataProcessingDoc;
```

---

## 6. Response (File Download)

- The backend sends the generated `.docx` file as a binary response.
- The frontend receives the file and triggers a download for the user.

---

## 7. How to Add a New Automated Document Type

1. **Create a new template file** in `server/document_templates/<category>/<newTemplate>.js` exporting a function that returns a docx document.
2. **Create a new controller** in `server/controllers/autoDocuments/<newTemplate>Controller.js` that imports the template and handles the request.
3. **Add a new route** in `server/routes/autoDocuments.js` for the new document type.
4. **Create a new React page/component** for the form and POST logic, including a live preview component that matches the docx output.
5. **Update documentation and test end-to-end.**

---

## 8. Template for AI Code Generation

- **Input:**
  - Description of the document and required fields.
  - Example template content (Word or docx structure).
- **AI Output:**
  - React form page/component (with live preview).
  - Backend controller file.
  - Document template file.
  - Router line for Express.

---

## 9. Example Directory Structure

```
client/src/pages/ConsentForPersonalDataProcessingPage.jsx
server/routes/autoDocuments.js
server/controllers/autoDocuments/consentForPersonalDataProcessingController.js
server/document_templates/personalDataProtection/consentForPersonalDataProcessing.js
```

---

**This template can be adapted for any new automated document type by following the above steps.** 