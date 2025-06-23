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
    excerpt: '',
    category: 'general',
    language: 'mk',
    featuredImage: '',
    status: 'published',
    priority: 'normal'
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let featuredImageUrl = formData.featuredImage;

      // Upload image if file is selected
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append('image', imageFile);

        // Get CSRF token for image upload
        let csrfToken;
        try {
          const csrfResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/csrf-token`, {
            credentials: 'include'
          });
          if (csrfResponse.ok) {
            const csrfData = await csrfResponse.json();
            csrfToken = csrfData.csrfToken;
          }
        } catch (error) {
          console.warn('Failed to fetch CSRF token:', error);
        }

        const imageResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/news/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            ...(csrfToken && { 'X-CSRF-Token': csrfToken })
          },
          credentials: 'include',
          body: imageFormData
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          featuredImageUrl = imageData.imageUrl;
        }
      }

      // Prepare news data
      const newsData = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt || formData.content.substring(0, 200) + '...',
        category: formData.category,
        language: formData.language,
        featuredImage: featuredImageUrl,
        status: formData.status,
        priority: formData.priority
      };

      // Get CSRF token for news creation
      let csrfToken;
      try {
        const csrfResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/csrf-token`, {
          credentials: 'include'
        });
        if (csrfResponse.ok) {
          const csrfData = await csrfResponse.json();
          csrfToken = csrfData.csrfToken;
        }
      } catch (error) {
        console.warn('Failed to fetch CSRF token:', error);
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/news`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(csrfToken && { 'X-CSRF-Token': csrfToken })
        },
        credentials: 'include',
        body: JSON.stringify(newsData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Грешка при додавање на веста.');
      }

      const result = await response.json();
      console.log('News created:', result);

      setSuccess('Веста е успешно додадена и испратена кон блогот!');
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        category: 'general',
        language: 'mk',
        featuredImage: '',
        status: 'published',
        priority: 'normal'
      });
      setImageFile(null);
      
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';

      setTimeout(() => {
        navigate('/terminal/news');
      }, 3000);
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
    { value: 'economy', label: 'Економија' },
    { value: 'legal', label: 'Правни прашања' },
    { value: 'finance', label: 'Финансии' }
  ];

  const languages = [
    { value: 'mk', label: 'Македонски' },
    { value: 'en', label: 'English' }
  ];

  const statuses = [
    { value: 'published', label: 'Објавено' },
    { value: 'draft', label: 'Нацрт' }
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
            placeholder="Внесете наслов на веста"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="excerpt">Краток опис</label>
          <textarea
            id="excerpt"
            name="excerpt"
            value={formData.excerpt}
            onChange={handleInputChange}
            className={styles.textarea}
            rows="3"
            placeholder="Краток опис што ќе се прикаже како превју (ако е празно, автоматски ќе се генерира)"
          />
        </div>

        <div className={styles.formRow}>
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
            <label htmlFor="language">Јазик*</label>
            <select
              id="language"
              name="language"
              value={formData.language}
              onChange={handleInputChange}
              required
              className={styles.select}
            >
              {languages.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="status">Статус*</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              required
              className={styles.select}
            >
              {statuses.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
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
            rows="12"
            placeholder="Внесете ја содржината на веста овде..."
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="featuredImage">URL на слика</label>
          <input
            type="url"
            id="featuredImage"
            name="featuredImage"
            value={formData.featuredImage}
            onChange={handleInputChange}
            className={styles.input}
            placeholder="https://example.com/image.jpg (опционално)"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="image">Или прикачете слика</label>
          <input
            type="file"
            id="image"
            name="image"
            onChange={handleImageChange}
            accept="image/*"
            className={styles.fileInput}
          />
          <small className={styles.helpText}>JPEG, PNG или WebP до 5MB</small>
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
