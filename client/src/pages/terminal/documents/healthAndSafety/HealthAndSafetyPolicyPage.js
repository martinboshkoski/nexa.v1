import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useTheme } from '../../../../contexts/ThemeContext';
import Header from '../../../../components/common/Header';
import Sidebar from '../../../../components/terminal/Sidebar';
import ProfileReminderBanner from '../../../../components/terminal/ProfileReminderBanner';
import DocumentStepProgress from '../../../../components/terminal/documents/DocumentStepProgress';
import DocumentPreview from '../../../../components/terminal/documents/DocumentPreview';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

const HealthAndSafetyPolicyPage = () => {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Policy Details (Step 1)
    policyEffectiveDate: new Date().toISOString().slice(0,10),
    policyVersion: '1.0',
    // Company Commitment (Step 2)
    companyCommitmentStatement: 'Нашата компанија е посветена на обезбедување безбедна и здрава работна средина за сите вработени, посетители и изведувачи.',
    // Responsibilities (Step 3)
    managementResponsibilities: '',
    employeeResponsibilities: '',
    // Hazard Identification and Control (Step 4)
    hazardIdentificationProcess: '',
    controlMeasures: '',
    // Emergency Procedures (Step 5)
    emergencyContactInfo: '',
    evacuationPlanSummary: '',
    // Training and Communication (Step 6)
    trainingTopics: '',
    communicationMethods: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState({});

  const steps = [
    { id: 1, title: 'Детали за Политика', description: 'Основни информации за политиката', fields: ['policyEffectiveDate', 'policyVersion'] },
    { id: 2, title: 'Посветеност на Компанијата', description: 'Изјава за посветеност', fields: ['companyCommitmentStatement'] },
    { id: 3, title: 'Одговорности', description: 'Одговорности на раководството и вработените', fields: ['managementResponsibilities', 'employeeResponsibilities'] },
    { id: 4, title: 'Идентификација и Контрола на Опасности', description: 'Процеси и мерки', fields: ['hazardIdentificationProcess', 'controlMeasures'] },
    { id: 5, title: 'Итни Процедури', description: 'Контакт и планови за евакуација', fields: ['emergencyContactInfo', 'evacuationPlanSummary'] },
    { id: 6, title: 'Обука и Комуникација', description: 'Теми за обука и методи на комуникација', fields: ['trainingTopics', 'communicationMethods'] },
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
    if (currentStep !== steps.length) {
        // Validate all remaining steps before generation if not on the last step
        for (let i = currentStep; i <= steps.length; i++) {
            if (!validateStep(i)) {
                setCurrentStep(i);
                return;
            }
        }
    }
    
    setIsGenerating(true);
    try {
      const payload = {
        userId: currentUser._id, // Assuming currentUser object has _id
        formData: { ...formData }
      };

      const response = await fetch('/api/documents/generate/health-safety-policy', {
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
        link.download = `Политика_Безбедност_и_Здравје.docx`;
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
                <label htmlFor="policyEffectiveDate">Дата на стапување на сила *</label>
                <input type="date" id="policyEffectiveDate" value={formData.policyEffectiveDate} onChange={(e) => handleInputChange('policyEffectiveDate', e.target.value)} className={errors.policyEffectiveDate ? styles.error : ''} />
                {errors.policyEffectiveDate && <span className={styles['error-message']}>{errors.policyEffectiveDate}</span>}
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="policyVersion">Верзија на политика *</label>
                <input type="text" id="policyVersion" value={formData.policyVersion} onChange={(e) => handleInputChange('policyVersion', e.target.value)} placeholder="пр. 1.0, 1.1" className={errors.policyVersion ? styles.error : ''} />
                {errors.policyVersion && <span className={styles['error-message']}>{errors.policyVersion}</span>}
              </div>
            </>
          )}
          {stepConfig.id === 2 && (
            <div className={styles['form-group']} style={{ gridColumn: 'span 2' }}>
              <label htmlFor="companyCommitmentStatement">Изјава за посветеност на компанијата *</label>
              <textarea id="companyCommitmentStatement" value={formData.companyCommitmentStatement} onChange={(e) => handleInputChange('companyCommitmentStatement', e.target.value)} placeholder="Внесете ја изјавата за посветеност" rows="5" className={errors.companyCommitmentStatement ? styles.error : ''}></textarea>
              {errors.companyCommitmentStatement && <span className={styles['error-message']}>{errors.companyCommitmentStatement}</span>}
            </div>
          )}
          {stepConfig.id === 3 && (
            <>
              <div className={styles['form-group']} style={{ gridColumn: 'span 2' }}>
                <label htmlFor="managementResponsibilities">Одговорности на раководството *</label>
                <textarea id="managementResponsibilities" value={formData.managementResponsibilities} onChange={(e) => handleInputChange('managementResponsibilities', e.target.value)} placeholder="Опишете ги одговорностите на раководството" rows="4" className={errors.managementResponsibilities ? styles.error : ''}></textarea>
                {errors.managementResponsibilities && <span className={styles['error-message']}>{errors.managementResponsibilities}</span>}
              </div>
              <div className={styles['form-group']} style={{ gridColumn: 'span 2' }}>
                <label htmlFor="employeeResponsibilities">Одговорности на вработените *</label>
                <textarea id="employeeResponsibilities" value={formData.employeeResponsibilities} onChange={(e) => handleInputChange('employeeResponsibilities', e.target.value)} placeholder="Опишете ги одговорностите на вработените" rows="4" className={errors.employeeResponsibilities ? styles.error : ''}></textarea>
                {errors.employeeResponsibilities && <span className={styles['error-message']}>{errors.employeeResponsibilities}</span>}
              </div>
            </>
          )}
          {stepConfig.id === 4 && (
            <>
              <div className={styles['form-group']} style={{ gridColumn: 'span 2' }}>
                <label htmlFor="hazardIdentificationProcess">Процес на идентификација на опасности *</label>
                <textarea id="hazardIdentificationProcess" value={formData.hazardIdentificationProcess} onChange={(e) => handleInputChange('hazardIdentificationProcess', e.target.value)} placeholder="Опишете го процесот" rows="4" className={errors.hazardIdentificationProcess ? styles.error : ''}></textarea>
                {errors.hazardIdentificationProcess && <span className={styles['error-message']}>{errors.hazardIdentificationProcess}</span>}
              </div>
              <div className={styles['form-group']} style={{ gridColumn: 'span 2' }}>
                <label htmlFor="controlMeasures">Контролни мерки *</label>
                <textarea id="controlMeasures" value={formData.controlMeasures} onChange={(e) => handleInputChange('controlMeasures', e.target.value)} placeholder="Наведете ги контролните мерки" rows="4" className={errors.controlMeasures ? styles.error : ''}></textarea>
                {errors.controlMeasures && <span className={styles['error-message']}>{errors.controlMeasures}</span>}
              </div>
            </>
          )}
          {stepConfig.id === 5 && (
            <>
              <div className={styles['form-group']}>
                <label htmlFor="emergencyContactInfo">Контакт информации за итни случаи *</label>
                <input type="text" id="emergencyContactInfo" value={formData.emergencyContactInfo} onChange={(e) => handleInputChange('emergencyContactInfo', e.target.value)} placeholder="пр. 112, Име и телефон на одговорно лице" className={errors.emergencyContactInfo ? styles.error : ''} />
                {errors.emergencyContactInfo && <span className={styles['error-message']}>{errors.emergencyContactInfo}</span>}
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="evacuationPlanSummary">Резиме на планот за евакуација *</label>
                <textarea id="evacuationPlanSummary" value={formData.evacuationPlanSummary} onChange={(e) => handleInputChange('evacuationPlanSummary', e.target.value)} placeholder="Кратко резиме на планот" rows="3" className={errors.evacuationPlanSummary ? styles.error : ''}></textarea>
                {errors.evacuationPlanSummary && <span className={styles['error-message']}>{errors.evacuationPlanSummary}</span>}
              </div>
            </>
          )}
          {stepConfig.id === 6 && (
            <>
              <div className={styles['form-group']} style={{ gridColumn: 'span 2' }}>
                <label htmlFor="trainingTopics">Теми за обука *</label>
                <textarea id="trainingTopics" value={formData.trainingTopics} onChange={(e) => handleInputChange('trainingTopics', e.target.value)} placeholder="Наведете ги темите за обука (пр. прва помош, противпожарна заштита)" rows="3" className={errors.trainingTopics ? styles.error : ''}></textarea>
                {errors.trainingTopics && <span className={styles['error-message']}>{errors.trainingTopics}</span>}
              </div>
              <div className={styles['form-group']} style={{ gridColumn: 'span 2' }}>
                <label htmlFor="communicationMethods">Методи на комуникација *</label>
                <textarea id="communicationMethods" value={formData.communicationMethods} onChange={(e) => handleInputChange('communicationMethods', e.target.value)} placeholder="Наведете ги методите (пр. состаноци, огласна табла, е-пошта)" rows="3" className={errors.communicationMethods ? styles.error : ''}></textarea>
                {errors.communicationMethods && <span className={styles['error-message']}>{errors.communicationMethods}</span>}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`${styles.pageContainer} ${theme === 'dark' ? 'dark-theme' : 'light-theme'}`}>
      <Header isTerminal={true} />
      <div className={styles.mainContent}>
        <Sidebar />
        <div className={styles.contentArea}>
          <ProfileReminderBanner />
          <div className={styles.documentPage}>
            <div className={styles.documentHeader}>
              <h2>Политика за безбедност и здравје при работа</h2>
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
                <DocumentPreview formData={formData} documentType="HealthAndSafetyPolicy" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthAndSafetyPolicyPage;
