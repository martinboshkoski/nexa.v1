import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { makeAuthenticatedRequest } from '../../services/csrfService';
import styles from '../../styles/terminal/SimpleCompleteProfile.module.css';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';

const SimpleCompleteProfile = () => {
  const { currentUser, token } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    companyName: '',
    companyAddress: '',
    taxNumber: '',
    email: currentUser?.email || '',
    website: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updatedFormData = {
        ...prev,
        [name]: value
      };
      console.log('SimpleCompleteProfile.js - handleInputChange - Step 1: Form data changed', updatedFormData);
      return updatedFormData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    console.log('SimpleCompleteProfile.js - handleSubmit - Step 2: Submitting form with data', formData);

    try {
      // Update company profile
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/users/company`, {
        method: 'POST',
        body: JSON.stringify({
          companyName: formData.companyName,
          companyAddress: formData.companyAddress,
          taxNumber: formData.taxNumber,
          email: formData.email,
          website: formData.website,
          businessActivity: 'Правни услуги' // Default value
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Неуспешно ажурирање на профилот: ${response.status} - ${errorText}`);
      }

      const companyResult = await response.json();
      console.log('SimpleCompleteProfile.js - handleSubmit - Step 3: Response from /users/company', companyResult);

      // Mark profile as complete
      const updateResponse = await makeAuthenticatedRequest(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        body: JSON.stringify({
          profileComplete: true
        })
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(`Неуспешно ажурирање на статусот на профилот: ${updateResponse.status} - ${errorText}`);
      }

      const profileResult = await updateResponse.json();
      console.log('SimpleCompleteProfile.js - handleSubmit - Step 4: Response from /users/profile', profileResult);

      setSuccess('Профилот е успешно пополнет!');
      setTimeout(() => {
        navigate('/terminal');
      }, 2000);

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header isTerminal={true} />
      
      <div className={styles.dashboardLayout}>
        <Sidebar />
        
        <main className={styles.mainContent}>
          <div className={styles.container}>
            <div className={styles.header}>
              <h1 className={styles.title}>Пополни го твојот профил</h1>
              <p className={styles.subtitle}>
                Додај ги основните информации за твојата компанија за подобро корисничко искуство.
              </p>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}
            {success && <div className={styles.successMessage}>{success}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="companyName" className={styles.label}>
                  Име на компанија *
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  className={styles.input}
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="Внеси го името на твојата компанија"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="companyAddress" className={styles.label}>
                  Адреса на компанија *
                </label>
                <input
                  type="text"
                  id="companyAddress"
                  name="companyAddress"
                  className={styles.input}
                  value={formData.companyAddress}
                  onChange={handleInputChange}
                  placeholder="Внеси ја адресата на компанијата"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="taxNumber" className={styles.label}>
                  Даночен број *
                </label>
                <input
                  type="text"
                  id="taxNumber"
                  name="taxNumber"
                  className={styles.input}
                  value={formData.taxNumber}
                  onChange={handleInputChange}
                  placeholder="Внеси го даночниот број"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Е-пошта *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={styles.input}
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Внеси ја е-поштата на компанијата"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="website" className={styles.label}>
                  Веб-страница
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  className={styles.input}
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://example.com (опционално)"
                />
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={() => navigate('/terminal')}
                  className={styles.skipButton}
                  disabled={loading}
                >
                  Прескокни засега
                </button>
                
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={loading}
                >
                  {loading ? 'Се зачувува...' : 'Пополни профил'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SimpleCompleteProfile;
