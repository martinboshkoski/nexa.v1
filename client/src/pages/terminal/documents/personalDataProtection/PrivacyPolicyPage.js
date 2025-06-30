import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useTheme } from '../../../../contexts/ThemeContext';
import Header from '../../../../components/common/Header';
import Sidebar from '../../../../components/terminal/Sidebar';
import ProfileReminderBanner from '../../../../components/terminal/ProfileReminderBanner';
import DocumentStepProgress from '../../../../components/terminal/documents/DocumentStepProgress';
import DocumentPreview from '../../../../components/terminal/documents/DocumentPreview';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

const PrivacyPolicyPage = () => {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Introduction
    companyName: '', // Auto-fill
    policyEffectiveDate: new Date().toISOString().slice(0,10),
    policyVersion: '1.0',
    // Step 2: Information We Collect
    infoCollectedDirectly: 'Име и презиме, ЕМБГ, адреса, контакт информации (телефон, е-пошта), податоци за плата и трансакциска сметка, податоци поврзани со работното место и квалификации.',
    infoCollectedAutomatically: 'Податоци за најава на системи, IP адреса, тип на уред (за службени потреби).',
    // Step 3: How We Use Your Information
    usageOfInfo: 'Законско исполнување на обврските од работен однос, исплата на плати, менаџирање со човечки ресурси, обезбедување на безбедност на информации и системи, комуникација.',
    // Step 4: Legal Basis for Processing
    legalBasis: 'Согласност на субјектот, исполнување на договор, законски обврски на контролорот, легитимен интерес на контролорот (пр. безбедност).',
    // Step 5: Data Sharing and Disclosure
    dataSharingThirdParties: 'Државни институции (УЈП, ФПИОМ, АВРМ, ФЗОМ), надворешни соработници за обработка на плата, банки, во согласност со закон.',
    // Step 6: Data Retention
    dataRetentionPeriod: 'Согласно законските рокови за чување на документација поврзана со работен однос и финансиско работење.',
    // Step 7: Your Rights
    yourRights: 'Право на пристап, исправка, бришење, ограничување на обработка, преносливост на податоци, приговор, право да се повлече согласноста.',
    // Step 8: Data Security
    dataSecurityMeasures: 'Технички и организациски мерки за заштита на личните податоци од неавторизиран пристап, губење или уништување, вклучувајќи контроли на пристап, енкрипција каде што е соодветно, и редовни проценки на безбедноста.',
    // Step 9: Contact Information
    contactPersonDPO: '', // Name/Email of Data Protection Officer or contact person
    // Step 10: Policy Updates
    policyUpdateMechanism: 'Политиката за приватност може да биде ажурирана. За сите измени ќе бидете навремено известени преку е-пошта или на интерен портал.',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (currentUser && currentUser.company) {
      setFormData(prev => ({
        ...prev,
        companyName: currentUser.company.name || '',
      }));
    }
  }, [currentUser]);

  const steps = [
    { id: 1, title: 'Вовед', description: 'Основни информации за политиката', fields: ['companyName', 'policyEffectiveDate', 'policyVersion'] },
    { id: 2, title: 'Информации кои ги собираме', description: 'Видови на податоци', fields: ['infoCollectedDirectly', 'infoCollectedAutomatically'] },
    { id: 3, title: 'Како ги користиме вашите информации', description: 'Цели на користење', fields: ['usageOfInfo'] },
    { id: 4, title: 'Правен основ за обработка', description: 'Легитимност', fields: ['legalBasis'] },
    { id: 5, title: 'Споделување и откривање податоци', description: 'Со кого ги споделуваме податоците', fields: ['dataSharingThirdParties'] },
    { id: 6, title: 'Чување на податоци', description: 'Период на чување', fields: ['dataRetentionPeriod'] },
    { id: 7, title: 'Вашите права', description: 'Права на субјектот на податоци', fields: ['yourRights'] },
    { id: 8, title: 'Безбедност на податоци', description: 'Мерки за заштита', fields: ['dataSecurityMeasures'] },
    { id: 9, title: 'Контакт информации', description: 'Лице за контакт/Офицер за заштита на ЛП', fields: ['contactPersonDPO'] },
    { id: 10, title: 'Ажурирање на политиката', description: 'Како ќе бидете известени за промени', fields: ['policyUpdateMechanism'] },
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

      const response = await fetch('/api/documents/generate/privacy-policy', {
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
        link.download = `Политика_за_Приватност.docx`;
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
                <label htmlFor="companyName">Име на компанија *</label>
                <input type="text" id="companyName" value={formData.companyName} onChange={(e) => handleInputChange('companyName', e.target.value)} placeholder="Име на вашата компанија" className={errors.companyName ? styles.error : ''} />
                {errors.companyName && <span className={styles['error-message']}>{errors.companyName}</span>}
              </div>
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
                <label htmlFor="infoCollectedDirectly">Информации кои ги собираме директно од Вас *</label>
                <textarea id="infoCollectedDirectly" value={formData.infoCollectedDirectly} onChange={(e) => handleInputChange('infoCollectedDirectly', e.target.value)} rows="4" className={errors.infoCollectedDirectly ? styles.error : ''}></textarea>
                {errors.infoCollectedDirectly && <span className={styles['error-message']}>{errors.infoCollectedDirectly}</span>}
              </div>
              <div className={styles['form-group']} style={{ gridColumn: 'span 2' }}>
                <label htmlFor="infoCollectedAutomatically">Информации кои ги собираме автоматски *</label>
                <textarea id="infoCollectedAutomatically" value={formData.infoCollectedAutomatically} onChange={(e) => handleInputChange('infoCollectedAutomatically', e.target.value)} rows="3" className={errors.infoCollectedAutomatically ? styles.error : ''}></textarea>
                {errors.infoCollectedAutomatically && <span className={styles['error-message']}>{errors.infoCollectedAutomatically}</span>}
              </div>
            </>
          )}
          {stepConfig.id === 3 && (
            <div className={styles['form-group']} style={{ gridColumn: 'span 2' }}>
              <label htmlFor="usageOfInfo">Како ги користиме вашите информации *</label>
              <textarea id="usageOfInfo" value={formData.usageOfInfo} onChange={(e) => handleInputChange('usageOfInfo', e.target.value)} rows="5" className={errors.usageOfInfo ? styles.error : ''}></textarea>
              {errors.usageOfInfo && <span className={styles['error-message']}>{errors.usageOfInfo}</span>}
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
              <label htmlFor="dataSharingThirdParties">Споделување и откривање податоци со трети страни *</label>
              <textarea id="dataSharingThirdParties" value={formData.dataSharingThirdParties} onChange={(e) => handleInputChange('dataSharingThirdParties', e.target.value)} rows="4" className={errors.dataSharingThirdParties ? styles.error : ''}></textarea>
              {errors.dataSharingThirdParties && <span className={styles['error-message']}>{errors.dataSharingThirdParties}</span>}
            </div>
          )}
          {stepConfig.id === 6 && (
            <div className={styles['form-group']} style={{ gridColumn: 'span 2' }}>
              <label htmlFor="dataRetentionPeriod">Чување на податоци (рок) *</label>
              <textarea id="dataRetentionPeriod" value={formData.dataRetentionPeriod} onChange={(e) => handleInputChange('dataRetentionPeriod', e.target.value)} rows="3" className={errors.dataRetentionPeriod ? styles.error : ''}></textarea>
              {errors.dataRetentionPeriod && <span className={styles['error-message']}>{errors.dataRetentionPeriod}</span>}
            </div>
          )}
          {stepConfig.id === 7 && (
            <div className={styles['form-group']} style={{ gridColumn: 'span 2' }}>
              <label htmlFor="yourRights">Вашите права *</label>
              <textarea id="yourRights" value={formData.yourRights} onChange={(e) => handleInputChange('yourRights', e.target.value)} rows="5" className={errors.yourRights ? styles.error : ''}></textarea>
              {errors.yourRights && <span className={styles['error-message']}>{errors.yourRights}</span>}
            </div>
          )}
          {stepConfig.id === 8 && (
            <div className={styles['form-group']} style={{ gridColumn: 'span 2' }}>
              <label htmlFor="dataSecurityMeasures">Мерки за безбедност на податоците *</label>
              <textarea id="dataSecurityMeasures" value={formData.dataSecurityMeasures} onChange={(e) => handleInputChange('dataSecurityMeasures', e.target.value)} rows="5" className={errors.dataSecurityMeasures ? styles.error : ''}></textarea>
              {errors.dataSecurityMeasures && <span className={styles['error-message']}>{errors.dataSecurityMeasures}</span>}
            </div>
          )}
          {stepConfig.id === 9 && (
            <div className={styles['form-group']} style={{ gridColumn: 'span 2' }}>
              <label htmlFor="contactPersonDPO">Контакт лице/Офицер за заштита на лични податоци *</label>
              <input type="text" id="contactPersonDPO" value={formData.contactPersonDPO} onChange={(e) => handleInputChange('contactPersonDPO', e.target.value)} placeholder="Име и презиме, е-пошта или телефон" className={errors.contactPersonDPO ? styles.error : ''} />
              {errors.contactPersonDPO && <span className={styles['error-message']}>{errors.contactPersonDPO}</span>}
            </div>
          )}
          {stepConfig.id === 10 && (
            <div className={styles['form-group']} style={{ gridColumn: 'span 2' }}>
              <label htmlFor="policyUpdateMechanism">Механизам за известување за ажурирање на политиката *</label>
              <textarea id="policyUpdateMechanism" value={formData.policyUpdateMechanism} onChange={(e) => handleInputChange('policyUpdateMechanism', e.target.value)} rows="3" className={errors.policyUpdateMechanism ? styles.error : ''}></textarea>
              {errors.policyUpdateMechanism && <span className={styles['error-message']}>{errors.policyUpdateMechanism}</span>}
            </div>
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
              <h2>Политика за приватност</h2>
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
                <DocumentPreview formData={formData} documentType="PrivacyPolicy" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
