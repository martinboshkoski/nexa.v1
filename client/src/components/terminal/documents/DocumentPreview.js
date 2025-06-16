import React from 'react';
import { useAuth } from '../../../contexts/AuthContext'; // Corrected path
import styles from '../../../styles/terminal/documents/DocumentPreview.module.css'; // Corrected path

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  try {
    return new Date(dateString).toLocaleDateString('mk-MK', options); // Changed to Macedonian locale
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString; // Fallback to original string if invalid
  }
};

const getCurrentDate = () => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date().toLocaleDateString('mk-MK', options); // Changed to Macedonian locale
};

const DocumentPreview = ({ formData, documentType, currentStep }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <div className={styles.previewContainer}><p>Ве молиме најавете се за да ги видите деталите за компанијата.</p></div>; // Translated
  }

  // Use company data from form if available (for Confirmation of Employment), otherwise from currentUser
  const getCompanyData = () => {
    if (documentType === 'confirmationOfEmployment' && formData) {
      return {
        companyName: formData.companyName || '[Име на компанија]',
        address: formData.companyAddress || '[Адреса на компанија]',
        registrationNumber: formData.companyRegistrationNumber || '[Регистарски број]',
        // Assuming phone and email for company are not part of confirmation form,
        // so we can still try to get them from currentUser or leave placeholders.
        phone: currentUser.companyInfo?.phone || '[Телефон на компанија]',
        email: currentUser.companyInfo?.email || '[Е-пошта на компанија]',
      };
    }
    return currentUser.companyInfo || {};
  };

  const company = getCompanyData();
  const employerName = currentUser.firstName && currentUser.lastName ? `${currentUser.firstName} ${currentUser.lastName}` : '[Име на работодавач]'; // Translated

  const renderAnnexEmploymentAgreementPreview = () => {
    const { 
      fullName,
      position,
      employeeId,
      department,
      email,
      phone,
      agreementType,
      effectiveDate,
      duration,
      compensation,
      benefits,
      specialTerms
    } = formData || {};

    return (
      <div className={styles.document}>
        <h2 className={styles.title}>АНЕКС НА ДОГОВОР ЗА ВРАБОТУВАЊЕ</h2> {/* Translated */}
        <p className={styles.date}>Датум: {getCurrentDate()}</p> {/* Translated */}

        <div className={styles.section}>
          <h4>ИНФОРМАЦИИ ЗА КОМПАНИЈАТА</h4> {/* Translated */}
          <div className={styles.infoBlock}>
            <p><strong>Име на компанија:</strong> {company.companyName || '[Име на компанија]'}</p> {/* Translated */}
            <p><strong>Адреса:</strong> {company.address || '[Адреса на компанија]'}</p> {/* Translated */}
            <p><strong>Телефон:</strong> {company.phone || '[Телефон на компанија]'}</p> {/* Translated */}
            <p><strong>Е-пошта:</strong> {company.email || '[Е-пошта на компанија]'}</p> {/* Translated */}
          </div>
        </div>

        <div className={styles.section}>
          <h4>ИНФОРМАЦИИ ЗА ВРАБОТЕНИОТ</h4> {/* Translated */}
          <div className={styles.infoBlock}>
            <p><strong>Име и презиме:</strong> {fullName || '[Име и презиме на вработен]'}</p> {/* Translated */}
            <p><strong>Позиција:</strong> {position || '[Позиција]'}</p> {/* Translated */}
            <p><strong>ID на вработен:</strong> {employeeId || '[ID на вработен]'}</p> {/* Translated */}
            <p><strong>Оддел:</strong> {department || '[Оддел]'}</p> {/* Translated */}
            <p><strong>Е-пошта:</strong> {email || '[Е-пошта на вработен]'}</p> {/* Translated */}
            <p><strong>Телефон:</strong> {phone || '[Телефон на вработен]'}</p> {/* Translated */}
          </div>
        </div>

        <div className={styles.section}>
          <h4>ДЕТАЛИ ЗА ДОГОВОРОТ</h4> {/* Translated */}
          <div className={styles.infoBlock}>
            <p><strong>Тип на договор:</strong> {agreementType || '[Тип на договор]'}</p> {/* Translated */}
            <p><strong>Датум на важност:</strong> {formatDate(effectiveDate) || '[Датум на важност]'}</p> {/* Translated */}
            <p><strong>Времетраење:</strong> {duration || '[Времетраење]'}</p> {/* Translated */}
            <p><strong>Плата/Надоместок:</strong> {compensation || '[Надоместок]'}</p> {/* Translated */}
            <p><strong>Бенефиции:</strong> {benefits || '[Бенефиции]'}</p> {/* Translated */}
            <p><strong>Посебни услови:</strong> {specialTerms || '[Посебни услови]'}</p> {/* Translated */}
          </div>
        </div>

        <div className={styles.section}>
          <h4>ПОТПИСИ</h4> {/* Translated */}
          <div className={styles.signatures}>
            <div className={styles.signature}>
              <p>_________________________</p>
              <p>Потпис на вработен</p> {/* Translated */}
              <p>{fullName || '[Име и презиме на вработен]'}</p> {/* Translated */}
            </div>
            <div className={styles.signature}>
              <p>_________________________</p>
              <p>Потпис на работодавач</p> {/* Translated */}
              <p>{employerName} ({company.companyName || '[Име на компанија]'})</p> {/* Translated */}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAnnualLeaveDecisionPreview = () => {
    const { 
      fullName,
      position,
      employeeId,
      department,
      email,
      phone,
      leaveYear,
      leaveStartDate,
      leaveEndDate,
      totalLeaveDays,
      remainingLeaveDays,
      reasonForLeave
    } = formData || {};

    return (
      <div className={styles.document}>
        <h2 className={styles.title}>РЕШЕНИЕ ЗА ГОДИШЕН ОДМОР</h2>
        <p className={styles.date}>Датум: {getCurrentDate()}</p>

        <div className={styles.section}>
          <h4>ИНФОРМАЦИИ ЗА КОМПАНИЈАТА</h4>
          <div className={styles.infoBlock}>
            <p><strong>Име на компанија:</strong> {company.companyName || '[Име на компанија]'}</p>
            <p><strong>Адреса:</strong> {company.address || '[Адреса на компанија]'}</p>
            <p><strong>Телефон:</strong> {company.phone || '[Телефон на компанија]'}</p>
            <p><strong>Е-пошта:</strong> {company.email || '[Е-пошта на компанија]'}</p>
          </div>
        </div>

        <div className={styles.section}>
          <h4>ИНФОРМАЦИИ ЗА ВРАБОТЕНИОТ</h4>
          <div className={styles.infoBlock}>
            <p><strong>Име и презиме:</strong> {fullName || '[Име и презиме на вработен]'}</p>
            <p><strong>Позиција:</strong> {position || '[Позиција]'}</p>
            <p><strong>ID на вработен:</strong> {employeeId || '[ID на вработен]'}</p>
            <p><strong>Оддел:</strong> {department || '[Оддел]'}</p>
            <p><strong>Е-пошта:</strong> {email || '[Е-пошта на вработен]'}</p>
            <p><strong>Телефон:</strong> {phone || '[Телефон на вработен]'}</p>
          </div>
        </div>

        <div className={styles.section}>
          <h4>ДЕТАЛИ ЗА ГОДИШНИОТ ОДМОР</h4>
          <div className={styles.infoBlock}>
            <p><strong>Година на одмор:</strong> {leaveYear || '[Година]'}</p>
            <p><strong>Почетен датум:</strong> {formatDate(leaveStartDate) || '[Почетен датум]'}</p>
            <p><strong>Краен датум:</strong> {formatDate(leaveEndDate) || '[Краен датум]'}</p>
            <p><strong>Вкупно денови:</strong> {totalLeaveDays || '[Број на денови]'}</p>
            <p><strong>Преостанати денови:</strong> {remainingLeaveDays || '[Преостанати денови]'}</p>
            <p><strong>Причина за одмор:</strong> {reasonForLeave || '[Причина за одмор]'}</p>
          </div>
        </div>

        <div className={styles.section}>
          <h4>ОДОБРУВАЊЕ</h4>
          <div className={styles.infoBlock}>
            <p>Со ова решение се одобрува годишниот одмор за горенаведениот вработен во согласност со Законот за работни односи и интерните правила на компанијата.</p>
          </div>
        </div>

        <div className={styles.signatures}>
          <div className={styles.signatureBlock}>
            <div className={styles.signatureLine}>
              <p>Потпис на вработен</p>
              <p>{fullName || '[Име на вработен]'}</p>
            </div>
          </div>
          <div className={styles.signatureBlock}>
            <div className={styles.signatureLine}>
              <p>Потпис на работодавач</p>
              <p>{employerName} ({company.companyName || '[Име на компанија]'})</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderConfirmationOfEmploymentPreview = () => {
    const {
      fullName,
      position,
      employeeId,
      department,
      employmentStartDate,
      confirmationDate,
      reasonForConfirmation,
      // companyName, // Handled by getCompanyData
      // companyAddress, // Handled by getCompanyData
      // companyRegistrationNumber, // Handled by getCompanyData
      managerName,
      managerPosition,
      additionalInfo
    } = formData || {};

    // Company details are now primarily from getCompanyData()
    // const companyDetails = getCompanyData(); // Already available as 'company'

    return (
      <div className={styles.document}>
        <h2 className={styles.title}>ПОТВРДА ЗА ВРАБОТУВАЊЕ</h2>
        <p className={styles.date}>Датум на издавање: {formatDate(confirmationDate) || '[Датум на издавање]'}</p>

        <div className={styles.section}>
          <h4>ПОДАТОЦИ ЗА КОМПАНИЈАТА</h4>
          <div className={styles.infoBlock}>
            <p><strong>Име на компанија:</strong> {company.companyName}</p>
            <p><strong>Адреса:</strong> {company.address}</p>
            <p><strong>Регистарски број:</strong> {company.registrationNumber}</p>
            {/* <p><strong>Телефон:</strong> {company.phone}</p> 
            <p><strong>Е-пошта:</strong> {company.email}</p> */}
          </div>
        </div>

        <div className={styles.section}>
          <h4>ПОДАТОЦИ ЗА ВРАБОТЕНИОТ</h4>
          <div className={styles.infoBlock}>
            <p><strong>Име и презиме:</strong> {fullName || '[Име и презиме на вработен]'}</p>
            <p><strong>Работна позиција:</strong> {position || '[Позиција]'}</p>
            <p><strong>ID на вработен:</strong> {employeeId || '[ID на вработен]'}</p>
            <p><strong>Оддел:</strong> {department || '[Оддел]'}</p>
            <p><strong>Датум на вработување:</strong> {formatDate(employmentStartDate) || '[Датум на вработување]'}</p>
          </div>
        </div>

        <div className={styles.section}>
          <h4>ПРЕДМЕТ НА ПОТВРДАТА</h4>
          <div className={styles.infoBlock}>
            <p>
              Се потврдува дека <strong>{fullName || '[Име и презиме на вработен]'}</strong> е во редовен работен однос во компанијата <strong>{company.companyName}</strong>, на работна позиција <strong>{position || '[Позиција]'}</strong>, почнувајќи од <strong>{formatDate(employmentStartDate) || '[Датум на вработување]'}</strong>.
            </p>
            <p>Оваа потврда се издава за потребите на: <strong>{reasonForConfirmation || '[Причина за издавање]'}</strong>.</p>
            {additionalInfo && <p><strong>Дополнителни информации:</strong> {additionalInfo}</p>}
          </div>
        </div>
        
        <div className={styles.section}>
          <p>Оваа потврда служи како доказ за статусот на вработениот и може да се користи за регулативни и правни цели.</p>
        </div>

        <div className={styles.signatures}>
          <div className={styles.signatureBlock} style={{ textAlign: 'right', marginTop: '50px' }}> {/* Adjusted for typical confirmation letter format */}
            <p>Со почит,</p>
            <p>_________________________</p>
            <p>{managerName || '[Име на овластено лице]'}</p>
            <p>{managerPosition || '[Позиција на овластено лице]'}</p>
            <p>{company.companyName}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    switch (documentType) {
      case 'annexEmploymentAgreement':
        return renderAnnexEmploymentAgreementPreview();
      case 'annualLeaveDecision':
        return renderAnnualLeaveDecisionPreview();
      case 'confirmationOfEmployment':
        return renderConfirmationOfEmploymentPreview();
      // Add other document types here as needed
      default:
        return <p>Прегледот не е достапен за овој тип на документ.</p>; // Translated
    }
  };

  return (
    <div className={styles.previewContainer}>
      <h3>Преглед на документ</h3> {/* Translated */}
      {renderPreview()}
    </div>
  );
};

export default DocumentPreview;
