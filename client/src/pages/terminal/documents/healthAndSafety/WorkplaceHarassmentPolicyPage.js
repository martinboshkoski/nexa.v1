import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import Header from '../../../../components/common/Header';
import Sidebar from '../../../../components/terminal/Sidebar';
import ProfileReminderBanner from '../../../../components/terminal/ProfileReminderBanner';
import DocumentStepProgress from '../../../../components/terminal/documents/DocumentStepProgress';
import DocumentPreview from '../../../../components/terminal/documents/DocumentPreview';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

const WorkplaceHarassmentPolicyPage = () => {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Policy Basics (Step 1)
    policyEffectiveDate: new Date().toISOString().slice(0,10),
    policyVersion: '1.0',
    // Statement & Scope (Step 2)
    zeroToleranceStatement: 'Нашата компанија има нулта толеранција за секаков вид вознемирување на работното место.',
    scopeOfPolicy: 'Оваа политика се однесува на сите вработени, менаџери, клиенти, добавувачи и посетители.',
    // Definitions (Step 3)
    definitionOfHarassment: '',
    examplesOfHarassment: '',
    // Reporting Procedure (Step 4)
    reportingChannels: '',
    investigationProcessSummary: '',
    // Confidentiality & Non-Retaliation (Step 5)
    confidentialityAssurance: 'Сите пријави ќе се третираат со максимална доверливост, колку што е можно.',
    nonRetaliationClause: 'Нема да има никакви негативни последици за вработените кои совесно пријавуваат вознемирување.',
    // Disciplinary Actions (Step 6)
    potentialDisciplinaryActions: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState({});

  const steps = [
    { id: 1, title: 'Основни Податоци за Политиката', description: 'Датум и верзија', fields: ['policyEffectiveDate', 'policyVersion'] },
    { id: 2, title: 'Изјава и Опфат', description: 'Изјава за нулта толеранција и опфат на политиката', fields: ['zeroToleranceStatement', 'scopeOfPolicy'] },
    { id: 3, title: 'Дефиниции', description: 'Дефиниција и примери за вознемирување', fields: ['definitionOfHarassment', 'examplesOfHarassment'] },
    { id: 4, title: 'Процедура за Пријавување', description: 'Канали за пријавување и процес на истрага', fields: ['reportingChannels', 'investigationProcessSummary'] },
    { id: 5, title: 'Доверливост и Заштита од Одмазда', description: 'Обезбедување доверливост и клаузула против одмазда', fields: ['confidentialityAssurance', 'nonRetaliationClause'] },
    { id: 6, title: 'Дисциплински Мерки', description: 'Можни дисциплински мерки', fields: ['potentialDisciplinaryActions'] },
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
        userId: currentUser._id, 
        formData: { ...formData }
      };

      const response = await fetch('/api/documents/generate/workplace-harassment-policy', {
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
        link.download = `Политика_за_Вознемирување_на_Работно_Место.docx`;
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
                <input type="text" id="policyVersion" value={formData.policyVersion} onChange={(e) => handleInputChange('policyVersion', e.target.value)} placeholder="пр. 1.0" className={errors.policyVersion ? styles.error : ''} />
                {errors.policyVersion && <span className={styles['error-message']}>{errors.policyVersion}</span>}
              </div>
            </>
          )}
          {stepConfig.id === 2 && (
            <>
              <div className={styles['form-group']} style={{ gridColumn: 'span 2' }}>
                <label htmlFor="zeroToleranceStatement">Изјава за нулта толеранција *</label>
                <textarea id="zeroToleranceStatement" value={formData.zeroToleranceStatement} onChange={(e) => handleInputChange('zeroToleranceStatement', e.target.value)} rows="3" className={errors.zeroToleranceStatement ? styles.error : ''}></textarea>
                {errors.zeroToleranceStatement && <span className={styles['error-message']}>{errors.zeroToleranceStatement}</span>}
              </div>
              <div className={styles['form-group']} style={{ gridColumn: 'span 2' }}>
                <label htmlFor="scopeOfPolicy">Опфат на политиката *</label>
                <textarea id="scopeOfPolicy" value={formData.scopeOfPolicy} onChange={(e) => handleInputChange('scopeOfPolicy', e.target.value)} rows="3" className={errors.scopeOfPolicy ? styles.error : ''}></textarea>
                {errors.scopeOfPolicy && <span className={styles['error-message']}>{errors.scopeOfPolicy}</span>}
              </div>
            </>
          )}
          {stepConfig.id === 3 && (
            <>
              <div className={styles['form-group']} style={{ gridColumn: 'span 2' }}>
                <label htmlFor="definitionOfHarassment">Дефиниција за вознемирување *</label>
                <textarea id="definitionOfHarassment" value={formData.definitionOfHarassment} onChange={(e) => handleInputChange('definitionOfHarassment', e.target.value)} placeholder="Дефинирајте што се смета за вознемирување" rows="4" className={errors.definitionOfHarassment ? styles.error : ''}></textarea>
                {errors.definitionOfHarassment && <span className={styles['error-message']}>{errors.definitionOfHarassment}</span>}
              </div>
              <div className={styles['form-group']} style={{ gridColumn: 'span 2' }}>
                <label htmlFor="examplesOfHarassment">Примери за вознемирување *</label>
                <textarea id="examplesOfHarassment" value={formData.examplesOfHarassment} onChange={(e) => handleInputChange('examplesOfHarassment', e.target.value)} placeholder="Наведете конкретни примери" rows="4" className={errors.examplesOfHarassment ? styles.error : ''}></textarea>
                {errors.examplesOfHarassment && <span className={styles['error-message']}>{errors.examplesOfHarassment}</span>}
              </div>
            </>
          )}
          {stepConfig.id === 4 && (
            <>
              <div className={styles['form-group']} style={{ gridColumn: 'span 2' }}>
                <label htmlFor="reportingChannels">Канали за пријавување *</label>
                <textarea id="reportingChannels" value={formData.reportingChannels} onChange={(e) => handleInputChange('reportingChannels', e.target.value)} placeholder="Наведете ги каналите (пр. директен претпоставен, HR, анонимна линија)" rows="3" className={errors.reportingChannels ? styles.error : ''}></textarea>
                {errors.reportingChannels && <span className={styles['error-message']}>{errors.reportingChannels}</span>}
              </div>
              <div className={styles['form-group']} style={{ gridColumn: 'span 2' }}>
                <label htmlFor="investigationProcessSummary">Резиме на процесот на истрага *</label>
                <textarea id="investigationProcessSummary" value={formData.investigationProcessSummary} onChange={(e) => handleInputChange('investigationProcessSummary', e.target.value)} placeholder="Опишете го процесот на истрага" rows="4" className={errors.investigationProcessSummary ? styles.error : ''}></textarea>
                {errors.investigationProcessSummary && <span className={styles['error-message']}>{errors.investigationProcessSummary}</span>}
              </div>
            </>
          )}
          {stepConfig.id === 5 && (
            <>
              <div className={styles['form-group']} style={{ gridColumn: 'span 2' }}>
                <label htmlFor="confidentialityAssurance">Обезбедување доверливост *</label>
                <textarea id="confidentialityAssurance" value={formData.confidentialityAssurance} onChange={(e) => handleInputChange('confidentialityAssurance', e.target.value)} rows="3" className={errors.confidentialityAssurance ? styles.error : ''}></textarea>
                {errors.confidentialityAssurance && <span className={styles['error-message']}>{errors.confidentialityAssurance}</span>}
              </div>
              <div className={styles['form-group']} style={{ gridColumn: 'span 2' }}>
                <label htmlFor="nonRetaliationClause">Клаузула за заштита од одмазда *</label>
                <textarea id="nonRetaliationClause" value={formData.nonRetaliationClause} onChange={(e) => handleInputChange('nonRetaliationClause', e.target.value)} rows="3" className={errors.nonRetaliationClause ? styles.error : ''}></textarea>
                {errors.nonRetaliationClause && <span className={styles['error-message']}>{errors.nonRetaliationClause}</span>}
              </div>
            </>
          )}
          {stepConfig.id === 6 && (
            <div className={styles['form-group']} style={{ gridColumn: 'span 2' }}>
              <label htmlFor="potentialDisciplinaryActions">Можни дисциплински мерки *</label>
              <textarea id="potentialDisciplinaryActions" value={formData.potentialDisciplinaryActions} onChange={(e) => handleInputChange('potentialDisciplinaryActions', e.target.value)} placeholder="Наведете можни мерки (пр. предупредување, суспензија, отказ)" rows="4" className={errors.potentialDisciplinaryActions ? styles.error : ''}></textarea>
              {errors.potentialDisciplinaryActions && <span className={styles['error-message']}>{errors.potentialDisciplinaryActions}</span>}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`${styles.pageContainer} light-theme`}>
      <Header isTerminal={true} />
      <div className={styles.mainContent}>
        <Sidebar />
        <div className={styles.contentArea}>
          <ProfileReminderBanner />
          <div className={styles.documentPage}>
            <div className={styles.documentHeader}>
              <h2>Политика за спречување на вознемирување на работно место</h2>
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
                {/* Preview component might need adjustment for this specific document type */}
                <DocumentPreview formData={formData} documentType="WorkplaceHarassmentPolicy" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkplaceHarassmentPolicyPage;
