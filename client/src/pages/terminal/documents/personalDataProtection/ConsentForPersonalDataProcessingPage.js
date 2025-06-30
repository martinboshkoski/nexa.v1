import React, { useState } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import Header from '../../../../components/common/Header';
import Sidebar from '../../../../components/terminal/Sidebar';
import ProfileReminderBanner from '../../../../components/terminal/ProfileReminderBanner';
import DocumentPreview from '../../../../components/terminal/documents/DocumentPreview';
import styles from '../../../../styles/terminal/documents/DocumentGeneration.module.css';

const ConsentForPersonalDataProcessingPage = () => {
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    // companyName: currentUser?.company?.name || '',
    // companyAddress: currentUser?.company?.address || '',
    // companyTaxNumber: currentUser?.company?.taxNumber || '',
    employeeName: '',
    employeeAddress: '',
    employeeWorkPosition: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.employeeName.trim()) newErrors.employeeName = 'Ова поле е задолжително';
    if (!formData.employeeAddress.trim()) newErrors.employeeAddress = 'Ова поле е задолжително';
    if (!formData.employeeWorkPosition.trim()) newErrors.employeeWorkPosition = 'Ова поле е задолжително';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerateDocument = async () => {
    if (!validateForm()) return;

    if (!currentUser) {
      console.error("User not authenticated");
      alert("Мора да бидете најавени за да генерирате документ.");
      return;
    }

    console.log("Step 1: Sending form data from frontend", formData);

    try {
      setIsGenerating(true);
      // Use explicit URL to ensure we're hitting the right port
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${apiUrl}/documents/generate/consent-for-personal-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ formData }),
      });

      if (!response.ok) {
        console.log(`HTTP Error: ${response.status} ${response.statusText}`);
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          console.log('Could not parse error response as JSON');
        }
        
        throw new Error(errorMessage);
      }

      // Handle document download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Согласност_за_обработка_на_лични_податоци.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      console.log('Document downloaded successfully!');

    } catch (error) {
      console.error("Error generating document:", error);
      alert(`Неуспешно генерирање на документот: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Header isTerminal={true} />
      <div className={styles.dashboardLayout}>
        <Sidebar />
        <main className={styles.dashboardMain}>
          {!currentUser?.profileComplete && <ProfileReminderBanner />}
          
          {/* Elegant headline under navbar */}
          <div className={styles.pageHeadline}>
            <h1>Согласност за обработка на лични податоци</h1>
            <p>Генерирајте согласност за обработка на лични податоци во согласност со GDPR</p>
          </div>

          {/* Split layout with form and preview */}
          <div className={styles.splitLayout}>
            {/* Form Section */}
            <div className={styles.formSection}>
              <div className={styles['form-sections']}>
                <div className={styles['form-section']}>
                  <div className={styles['form-group']}>
                    <label htmlFor="employeeName">Име и презиме на вработениот *</label>
                    <input
                      type="text"
                      id="employeeName"
                      value={formData.employeeName}
                      onChange={(e) => handleInputChange('employeeName', e.target.value)}
                      placeholder="пр. Марко Петровски"
                      className={errors.employeeName ? styles.error : ''}
                    />
                    {errors.employeeName && <span className={styles['error-message']}>{errors.employeeName}</span>}
                  </div>

                  <div className={styles['form-group']}>
                    <label htmlFor="employeeAddress">Адреса на вработениот *</label>
                    <input
                      type="text"
                      id="employeeAddress"
                      value={formData.employeeAddress}
                      onChange={(e) => handleInputChange('employeeAddress', e.target.value)}
                      placeholder="пр. ул. Македонија бр. 123, Скопје"
                      className={errors.employeeAddress ? styles.error : ''}
                    />
                    {errors.employeeAddress && <span className={styles['error-message']}>{errors.employeeAddress}</span>}
                  </div>

                  <div className={styles['form-group']}>
                    <label htmlFor="employeeWorkPosition">Работна позиција *</label>
                    <input
                      type="text"
                      id="employeeWorkPosition"
                      value={formData.employeeWorkPosition}
                      onChange={(e) => handleInputChange('employeeWorkPosition', e.target.value)}
                      placeholder="пр. Софтверски инженер"
                      className={errors.employeeWorkPosition ? styles.error : ''}
                    />
                    {errors.employeeWorkPosition && <span className={styles['error-message']}>{errors.employeeWorkPosition}</span>}
                  </div>
                </div>
              </div>

              <div className={styles['form-actions']}>
                <button
                  onClick={handleGenerateDocument}
                  disabled={isGenerating}
                  className={styles['generate-btn']}
                >
                  {isGenerating ? (
                    <>
                      <span className={styles['loading-spinner']}></span>
                      Генерирање...
                    </>
                  ) : (
                    'Генерирај документ'
                  )}
                </button>
              </div>
            </div>

            {/* Preview Section */}
            <div className={styles.previewSection}>
              <DocumentPreview 
                formData={formData}
                documentType="consentForPersonalDataProcessing"
                currentStep={1}
              />
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default ConsentForPersonalDataProcessingPage;
