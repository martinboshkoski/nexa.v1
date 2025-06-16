import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import Header from '../../../../components/common/Header';
import Sidebar from '../../../../components/terminal/Sidebar';
import ProfileReminderBanner from '../../../../components/terminal/ProfileReminderBanner';
import DocumentStepProgress from '../../../../components/terminal/documents/DocumentStepProgress';
import DocumentPreview from '../../../../components/terminal/documents/DocumentPreview';
import styles from '../../../../styles/terminal/documents/AnnexEmploymentAgreement.module.css'; // Reusing styles

const ConsentForPersonalDataProcessingPage = () => {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Information about the Controller and Data Subject
    controllerName: '', // Company Name, will be auto-filled if possible
    controllerAddress: '', // Company Address
    controllerContact: '', // Company Contact (email/phone)
    dataSubjectName: '', // Employee/User Name
    dataSubjectAddress: '', // Employee/User Address
    // Step 2: Purposes of Processing
    processingPurposes: 'Обработка на податоци за потребите на работен однос, вклучувајќи исплата на плата, евиденција на работно време, здравствено осигурување и други законски обврски.',
    // Step 3: Types of Personal Data
    dataTypes: 'Име и презиме, ЕМБГ, адреса на живеење, трансакциска сметка, контакт информации (телефон, е-пошта), податоци за образование и квалификации, податоци за работно искуство, здравствени податоци (за потребите на здравствено осигурување и безбедност при работа).',
    // Step 4: Legal Basis for Processing
    legalBasis: 'Согласност на субјектот на лични податоци, исполнување на законски обврски на контролорот, исполнување на договор во кој субјектот е страна.',
    // Step 5: Data Retention Period
    retentionPeriod: 'Податоците ќе се чуваат за време на траењето на работниот однос и по неговото завршување согласно законските рокови за чување на документација.',
    // Step 6: Data Subject Rights
    dataSubjectRights: 'Право на пристап, право на исправка, право на бришење (право да се биде заборавен), право на ограничување на обработката, право на преносливост на податоците, право на приговор.',
    consentDate: new Date().toISOString().slice(0,10),
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (currentUser && currentUser.company) {
      setFormData(prev => ({
        ...prev,
        controllerName: currentUser.company.name || '',
        controllerAddress: currentUser.company.address || '',
        controllerContact: currentUser.company.email || '', // Assuming company email is primary contact
      }));
    }
  }, [currentUser]);

  const steps = [
    { id: 1, title: 'Информации за Контролор и Субјект', description: 'Детали за компанијата и лицето', fields: ['controllerName', 'controllerAddress', 'controllerContact', 'dataSubjectName', 'dataSubjectAddress'] },
    { id: 2, title: 'Цели на Обработка', description: 'Зошто се обработуваат податоците', fields: ['processingPurposes'] },
    { id: 3, title: 'Видови на Лични Податоци', description: 'Кои податоци се обработуваат', fields: ['dataTypes'] },
    { id: 4, title: 'Правен Основ за Обработка', description: 'Легитимност на обработката', fields: ['legalBasis'] },
    { id: 5, title: 'Рок на Чување на Податоци', description: 'Колку долго ќе се чуваат податоците', fields: ['retentionPeriod'] },
    { id: 6, title: 'Права на Субјектот и Согласност', description: 'Вашите права и датум на согласност', fields: ['dataSubjectRights', 'consentDate'] },
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateStep = (stepId) => {
    const step = steps.find(s => s.id === stepId);
    const stepErrors = {};
    step.fields.forEach(field => {
      if (!formData[field] || String(formData[field]).trim() === '') {
        stepErrors[field] = 'Ова поле е задолжително';
      }
    });
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleGenerateDocument = async () => {
    if (!validateStep(currentStep)) return;
     for (let i = 1; i <= steps.length; i++) {
        if (!validateStep(i)) {
            setCurrentStep(i);
            alert('Ве молиме пополнете ги сите задолжителни полиња во сите чекори.');
            return;
        }
    }
    
    setIsGenerating(true);
    try {
      const payload = {
        userId: currentUser._id,
        formData: { ...formData }
      };

      const response = await fetch('/api/documents/generate/consent-personal-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Согласност_Обработка_Лични_Податоци.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Грешка при генерирање на документот');
      }
    } catch (error) {
      console.error('Error generating document:', error);
      alert(`Настана грешка при генерирање на документот: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStepContent = () => {
    const stepConfig = steps.find(s => s.id === currentStep);
    if (!stepConfig) return null;

    return (
      <div className={styles['step-content']}>
        <h3>{stepConfig.title}</h3>
        <div className={styles['form-grid']}>
          {stepConfig.id === 1 && (
            <>
              <div className={styles['form-group']}>
                <label htmlFor="controllerName">Име на контролор (Компанија) *</label>
                <input type="text" id="controllerName" value={formData.controllerName} onChange={(e) => handleInputChange('controllerName', e.target.value)} placeholder="Име на компанијата" className={errors.controllerName ? styles.error : ''} />
                {errors.controllerName && <span className={styles['error-message']}>{errors.controllerName}</span>}
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="controllerAddress">Адреса на контролор *</label>
                <input type="text" id="controllerAddress" value={formData.controllerAddress} onChange={(e) => handleInputChange('controllerAddress', e.target.value)} placeholder="Адреса на компанијата" className={errors.controllerAddress ? styles.error : ''} />
                {errors.controllerAddress && <span className={styles['error-message']}>{errors.controllerAddress}</span>}
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="controllerContact">Контакт на контролор *</label>
                <input type="text" id="controllerContact" value={formData.controllerContact} onChange={(e) => handleInputChange('controllerContact', e.target.value)} placeholder="Е-пошта или телефон на компанијата" className={errors.controllerContact ? styles.error : ''} />
                {errors.controllerContact && <span className={styles['error-message']}>{errors.controllerContact}</span>}
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="dataSubjectName">Име и презиме на субјектот на податоци *</label>
                <input type="text" id="dataSubjectName" value={formData.dataSubjectName} onChange={(e) => handleInputChange('dataSubjectName', e.target.value)} placeholder="Име и презиме" className={errors.dataSubjectName ? styles.error : ''} />
                {errors.dataSubjectName && <span className={styles['error-message']}>{errors.dataSubjectName}</span>}
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="dataSubjectAddress">Адреса на субјектот на податоци *</label>
                <input type="text" id="dataSubjectAddress" value={formData.dataSubjectAddress} onChange={(e) => handleInputChange('dataSubjectAddress', e.target.value)} placeholder="Адреса на живеење" className={errors.dataSubjectAddress ? styles.error : ''} />
                {errors.dataSubjectAddress && <span className={styles['error-message']}>{errors.dataSubjectAddress}</span>}
              </div>
            </>
          )}
          {stepConfig.id === 2 && (
            <div className={styles['form-group']} style={{ gridColumn: 'span 2' }}>
              <label htmlFor="processingPurposes">Цели на обработка *</label>
              <textarea id="processingPurposes" value={formData.processingPurposes} onChange={(e) => handleInputChange('processingPurposes', e.target.value)} rows="5" className={errors.processingPurposes ? styles.error : ''}></textarea>
              {errors.processingPurposes && <span className={styles['error-message']}>{errors.processingPurposes}</span>}
            </div>
          )}
          {stepConfig.id === 3 && (
            <div className={styles['form-group']} style={{ gridColumn: 'span 2' }}>
              <label htmlFor="dataTypes">Видови на лични податоци кои се обработуваат *</label>
              <textarea id="dataTypes" value={formData.dataTypes} onChange={(e) => handleInputChange('dataTypes', e.target.value)} rows="5" className={errors.dataTypes ? styles.error : ''}></textarea>
              {errors.dataTypes && <span className={styles['error-message']}>{errors.dataTypes}</span>}
            </div>
          )}
          {stepConfig.id === 4 && (
            <div className={styles['form-group']} style={{ gridColumn: 'span 2' }}>
              <label htmlFor="legalBasis">Правен основ за обработка *</label>
              <textarea id="legalBasis" value={formData.legalBasis} onChange={(e) => handleInputChange('legalBasis', e.target.value)} rows="4" className={errors.legalBasis ? styles.error : ''}></textarea>
              {errors.legalBasis && <span className={styles['error-message']}>{errors.legalBasis}</span>}
            </div>
          )}
          {stepConfig.id === 5 && (
             <div className={styles['form-group']} style={{ gridColumn: 'span 2' }}>
              <label htmlFor="retentionPeriod">Рок на чување на податоците *</label>
              <textarea id="retentionPeriod" value={formData.retentionPeriod} onChange={(e) => handleInputChange('retentionPeriod', e.target.value)} rows="3" className={errors.retentionPeriod ? styles.error : ''}></textarea>
              {errors.retentionPeriod && <span className={styles['error-message']}>{errors.retentionPeriod}</span>}
            </div>
          )}
          {stepConfig.id === 6 && (
            <>
              <div className={styles['form-group']} style={{ gridColumn: 'span 2' }}>
                <label htmlFor="dataSubjectRights">Права на субјектот на лични податоци *</label>
                <textarea id="dataSubjectRights" value={formData.dataSubjectRights} onChange={(e) => handleInputChange('dataSubjectRights', e.target.value)} rows="5" className={errors.dataSubjectRights ? styles.error : ''}></textarea>
                {errors.dataSubjectRights && <span className={styles['error-message']}>{errors.dataSubjectRights}</span>}
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="consentDate">Датум на давање согласност *</label>
                <input type="date" id="consentDate" value={formData.consentDate} onChange={(e) => handleInputChange('consentDate', e.target.value)} className={errors.consentDate ? styles.error : ''} />
                {errors.consentDate && <span className={styles['error-message']}>{errors.consentDate}</span>}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.pageContainer}>
      <Header />
      <div className={styles.mainContent}>
        <Sidebar />
        <div className={styles.contentArea}>
          <ProfileReminderBanner />
          <div className={styles.documentPage}>
            <div className={styles.documentHeader}>
              <h2>Согласност за обработка на лични податоци</h2>
              <p>Пополнете ги формуларите за да генерирате документ.</p>
            </div>
            <DocumentStepProgress steps={steps} currentStep={currentStep} />
            <div className={styles.formAndPreviewContainer}>
              <div className={styles.formSection}>
                {renderStepContent()}
                <div className={styles.navigationButtons}>
                  {currentStep > 1 && (
                    <button onClick={handlePrevStep} className={styles.prevButton}>Назад</button>
                  )}
                  {currentStep < steps.length && (
                    <button onClick={handleNextStep} className={styles.nextButton}>Следно</button>
                  )}
                  {currentStep === steps.length && (
                    <button onClick={handleGenerateDocument} disabled={isGenerating} className={styles.generateButton}>
                      {isGenerating ? 'Генерирање...' : 'Генерирај Документ'}
                    </button>
                  )}
                </div>
              </div>
              <div className={styles.previewSection}>
                <DocumentPreview formData={formData} documentType="ConsentForPersonalDataProcessing" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentForPersonalDataProcessingPage;
