import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Header from '../common/Header';
import Footer from '../common/Footer';
import Sidebar from './Sidebar';
import ProfileRequired from '../common/ProfileRequired';
import styles from '../../styles/terminal/CompanyVerification.module.css';

const CompanyVerification = () => {
  const { t } = useTranslation();
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    mission: '',
    website: '',
    industry: '',
    description: '',
    crnNumber: '',
    address: '',
    phone: '',
    email: ''
  });
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/verification/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVerificationStatus(response.data);
    } catch (error) {
      console.error('Error fetching verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 10) {
      setError(t('companyVerification.errors.maxFiles'));
      return;
    }
    
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 
                         'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const validSize = file.size <= 10 * 1024 * 1024; // 10MB
      return validTypes.includes(file.type) && validSize;
    });

    if (validFiles.length !== files.length) {
      setError(t('companyVerification.errors.invalidFiles'));
    } else {
      setError('');
    }

    setDocuments(validFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const submitData = new FormData();

      // Add form data
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });

      // Add documents
      documents.forEach((file, index) => {
        submitData.append('documents', file);
      });

      const response = await axios.post('/api/verification/submit', submitData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess(response.data.message);
      fetchVerificationStatus(); // Refresh status
      
      // Reset form if not auto-approved
      if (response.data.verification.status !== 'approved') {
        setFormData({
          companyName: '',
          mission: '',
          website: '',
          industry: '',
          description: '',
          crnNumber: '',
          address: '',
          phone: '',
          email: ''
        });
        setDocuments([]);
      }

    } catch (error) {
      setError(error.response?.data?.message || t('companyVerification.errors.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#00ff00';
      case 'rejected': return '#ff0000';
      case 'requires_additional_info': return '#ffaa00';
      case 'under_review': return '#0099ff';
      default: return '#ffff00';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return t('companyVerification.status.approved');
      case 'rejected': return t('companyVerification.status.rejected');
      case 'requires_additional_info': return t('companyVerification.status.additionalInfoRequired');
      case 'under_review': return t('companyVerification.status.underReview');
      case 'pending': return t('companyVerification.status.pending');
      default: return status;
    }
  };

  if (loading) {
    return (
      <div>
        <Header isTerminal={true} />
        <div className={styles["dashboard-layout"]}>
          <Sidebar />
          <main className={styles["dashboard-main"]}>
            <div className={styles.container}>
              <div className={styles.loading}>{t('companyVerification.loading')}</div>
            </div>
          </main>
        </div>
        <Footer isTerminal={true} />
      </div>
    );
  }

  // If already verified
  if (verificationStatus?.status === 'approved') {
    return (
      <div>
        <Header isTerminal={true} />
        <div className={styles["dashboard-layout"]}>
          <Sidebar />
          <main className={styles["dashboard-main"]}>
            <div className={styles.container}>
              <div className={styles.statusCard}>
                <div className={styles.statusHeader}>
                  <span 
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(verificationStatus.status) }}
                  >
                    {getStatusText(verificationStatus.status)}
                  </span>
                </div>
                <div className={styles.statusContent}>
                  <h3>{t('companyVerification.approved.title')}</h3>
                  <p>{t('companyVerification.approved.description')}</p>
                  <div className={styles.companyInfo}>
                    <h4>{verificationStatus.companyInfo?.companyName}</h4>
                    <p>{verificationStatus.companyInfo?.description}</p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
        <Footer isTerminal={true} />
      </div>
    );
  }

  // If has pending/under review verification
  if (verificationStatus && ['pending', 'under_review', 'requires_additional_info'].includes(verificationStatus.status)) {
    return (
      <div>
        <Header isTerminal={true} />
        <div className={styles["dashboard-layout"]}>
          <Sidebar />
          <main className={styles["dashboard-main"]}>
            <div className={styles.container}>
              <div className={styles.statusCard}>
                <div className={styles.statusHeader}>
                  <span 
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(verificationStatus.status) }}
                  >
                    {getStatusText(verificationStatus.status)}
                  </span>
                </div>
                <div className={styles.statusContent}>
                  <h3>{t('companyVerification.status.title')}</h3>
                  <p><strong>{t('companyVerification.submitted')}:</strong> {new Date(verificationStatus.submittedAt).toLocaleDateString()}</p>
                  <p><strong>{t('companyVerification.autoApprovalScore')}:</strong> {verificationStatus.autoApprovalScore}/100</p>
                  
                  {verificationStatus.reviewNotes && (
                    <div className={styles.reviewNotes}>
                      <strong>{t('companyVerification.reviewNotes')}:</strong>
                      <p>{verificationStatus.reviewNotes}</p>
                    </div>
                  )}

                  {verificationStatus.rejectionReason && (
                    <div className={styles.rejectionReason}>
                      <strong>{t('companyVerification.rejectionReason')}:</strong>
                      <p>{verificationStatus.rejectionReason}</p>
                    </div>
                  )}

                  {verificationStatus.additionalInfoRequested && (
                    <div className={styles.additionalInfo}>
                      <strong>{t('companyVerification.additionalInfoRequired')}:</strong>
                      <p>{verificationStatus.additionalInfoRequested}</p>
                    </div>
                  )}

                  <p className={styles.waitMessage}>
                    {t('companyVerification.waitMessage')}
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
        <Footer isTerminal={true} />
      </div>
    );
  }

  // If rejected, allow resubmission
  const canResubmit = !verificationStatus || verificationStatus.status === 'rejected';

  return (
    <ProfileRequired>
      <div>
        <Header isTerminal={true} />
        <div className={styles["dashboard-layout"]}>
          <Sidebar />
          <main className={styles["dashboard-main"]}>
            <div className={styles.container}>
              <div className={styles.header}>
                <h2>{t('companyVerification.form.title')}</h2>
                <p>{t('companyVerification.form.description')}</p>
              </div>

            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

            {verificationStatus?.status === 'rejected' && (
              <div className={styles.rejectedNotice}>
                <h4>{t('companyVerification.rejected.title')}</h4>
                <p><strong>{t('companyVerification.rejected.reason')}:</strong> {verificationStatus.rejectionReason}</p>
                <p>{t('companyVerification.rejected.resubmitMessage')}</p>
              </div>
            )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <h3>{t('companyVerification.form.companyInfo')}</h3>
          
          <div className={styles.formGroup}>
            <label>{t('companyVerification.form.companyName')} *</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              required
              placeholder={t('companyVerification.form.companyNamePlaceholder')}
            />
          </div>

          <div className={styles.formGroup}>
            <label>{t('companyVerification.form.crnNumber')}</label>
            <input
              type="text"
              name="crnNumber"
              value={formData.crnNumber}
              onChange={handleInputChange}
              placeholder={t('companyVerification.form.crnNumberPlaceholder')}
            />
          </div>

          <div className={styles.formGroup}>
            <label>{t('companyVerification.form.industry')} *</label>
            <select
              name="industry"
              value={formData.industry}
              onChange={handleInputChange}
              required
            >
              <option value="">{t('companyVerification.form.selectIndustry')}</option>
              <option value="technology">{t('companyVerification.form.industries.technology')}</option>
              <option value="finance">{t('companyVerification.form.industries.finance')}</option>
              <option value="healthcare">{t('companyVerification.form.industries.healthcare')}</option>
              <option value="education">{t('companyVerification.form.industries.education')}</option>
              <option value="retail">{t('companyVerification.form.industries.retail')}</option>
              <option value="manufacturing">{t('companyVerification.form.industries.manufacturing')}</option>
              <option value="consulting">{t('companyVerification.form.industries.consulting')}</option>
              <option value="real-estate">{t('companyVerification.form.industries.realEstate')}</option>
              <option value="other">{t('companyVerification.form.industries.other')}</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>{t('companyVerification.form.website')}</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder={t('companyVerification.form.websitePlaceholder')}
            />
          </div>

          <div className={styles.formGroup}>
            <label>{t('companyVerification.form.mission')} *</label>
            <textarea
              name="mission"
              value={formData.mission}
              onChange={handleInputChange}
              required
              placeholder={t('companyVerification.form.missionPlaceholder')}
              rows="3"
            />
          </div>

          <div className={styles.formGroup}>
            <label>{t('companyVerification.form.descriptionLabel')} *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              placeholder={t('companyVerification.form.descriptionPlaceholder')}
              rows="4"
            />
          </div>
        </div>

        <div className={styles.section}>
          <h3>{t('companyVerification.form.contactInfo')}</h3>
          
          <div className={styles.formGroup}>
            <label>{t('companyVerification.form.address')} *</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              placeholder={t('companyVerification.form.addressPlaceholder')}
              rows="2"
            />
          </div>

          <div className={styles.formGroup}>
            <label>{t('companyVerification.form.phone')} *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              placeholder={t('companyVerification.form.phonePlaceholder')}
            />
          </div>

          <div className={styles.formGroup}>
            <label>{t('companyVerification.form.email')} *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder={t('companyVerification.form.emailPlaceholder')}
            />
          </div>
        </div>

        <div className={styles.section}>
          <h3>{t('companyVerification.form.documents')}</h3>
          <p>{t('companyVerification.form.documentsDescription')}</p>
          
          <div className={styles.formGroup}>
            <label>{t('companyVerification.form.documentsLabel')}</label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className={styles.fileInput}
            />
            <div className={styles.fileInfo}>
              {t('companyVerification.form.fileInfo')}
            </div>
            
            {documents.length > 0 && (
              <div className={styles.fileList}>
                <strong>{t('companyVerification.form.selectedFiles')}:</strong>
                <ul>
                  {documents.map((file, index) => (
                    <li key={index}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className={styles.submitSection}>
          <button 
            type="submit" 
            className={styles.submitBtn}
            disabled={submitting}
          >
            {submitting ? t('companyVerification.form.submitting') : canResubmit ? t('companyVerification.form.resubmit') : t('companyVerification.form.submit')}
          </button>            <div className={styles.submitInfo}>
              <p>{t('companyVerification.form.reviewTime')}</p>
              <p>{t('companyVerification.form.autoApprovalInfo')}</p>
            </div>
          </div>
        </form>        </div>
      </main>
    </div>
    <Footer isTerminal={true} />
  </div>
</ProfileRequired>
);
};

export default CompanyVerification;
