import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import styles from '../../../styles/terminal/admin/AddNews.module.css';
import Header from '../../../components/common/Header';
import Footer from '../../../components/common/Footer';
import Sidebar from '../../../components/terminal/Sidebar';
import ProfileRequired from '../../../components/common/ProfileRequired';

const AddNews = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const isTerminal = true;
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: null,
    category: 'general'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({ ...prev, image: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      // Get CSRF token
      let csrfToken;
      try {
        const csrfResponse = await fetch('http://localhost:5002/api/csrf-token', {
          credentials: 'include'
        });
        if (csrfResponse.ok) {
          const csrfData = await csrfResponse.json();
          csrfToken = csrfData.csrfToken;
        }
      } catch (error) {
        console.warn('Failed to fetch CSRF token:', error);
      }

      const response = await fetch('http://localhost:5002/api/news', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          ...(csrfToken && { 'X-CSRF-Token': csrfToken })
        },
        credentials: 'include',
        body: formDataToSend
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Грешка при додавање на веста.');
      }

      setSuccess('Веста е успешно додадена.');
      setFormData({
        title: '',
        content: '',
        image: null,
        category: 'general'
      });
      
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';

      setTimeout(() => {
        navigate('/terminal/news');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Грешка при додавање на веста.');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'general', label: 'Општо' },
    { value: 'business', label: 'Бизнис' },
    { value: 'technology', label: 'Технологија' },
    { value: 'economy', label: 'Економија' }
  ];

  return (
    <ProfileRequired>
      <div>
        <Header isTerminal={isTerminal} />
        
        <div className={styles["dashboard-layout"]}>
          <Sidebar />
          
          <main className={styles["dashboard-main"]}>
            <div className={styles.container}>
              <h1>Додади нова вест</h1>

            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title">Наслов*</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="category">Категорија*</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            className={styles.select}
          >
            {categories.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="content">Содржина*</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            required
            className={styles.textarea}
            rows="10"
            placeholder="Внесете ја содржината на веста овде..."
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="image">Слика</label>
          <input
            type="file"
            id="image"
            name="image"
            onChange={handleImageChange}
            accept="image/*"
            className={styles.fileInput}
          />
        </div>

        <div className={styles.buttonGroup}>
          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? 'Зачувување...' : 'Зачувај'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/terminal/news')}
            className={styles.cancelButton}
          >
            Откажи
          </button>
        </div>
      </form>
          </div>
        </main>
      </div>
      
      <Footer isTerminal={isTerminal} />
    </div>
    </ProfileRequired>
  );
};

export default AddNews;
