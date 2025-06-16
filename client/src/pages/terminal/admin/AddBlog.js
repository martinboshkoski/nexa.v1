import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import ApiService from '../../../services/api';
import styles from '../../../styles/terminal/admin/AddBlog.module.css';
import Header from '../../../components/common/Header';
import Footer from '../../../components/common/Footer';
import Sidebar from '../../../components/terminal/Sidebar';
import ProfileRequired from '../../../components/common/ProfileRequired';

const AddBlog = () => {
  const { token, currentUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    translations: {
      mk: {
        title: '',
        content: '',
        summary: '',
        seo: { metaTitle: '', metaDescription: '', keywords: '', canonicalUrl: '', ogImage: '' },
      },
      en: { // Keep for structure, but won't be used or sent for 'mk' only
        title: '', 
        content: '', 
        summary: '', 
        seo: { metaTitle: '', metaDescription: '', keywords: '', canonicalUrl: '', ogImage: '' }
      }, 
    },
    slug: { mk: '', en: '' }, 
    tags: { mk: '', en: '' }, 
    image: null,
    category: 'general',
    publishedLanguages: ['mk'], 
    defaultLanguage: 'mk', 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // General error message
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({}); // For field-specific errors

  const generateSlug = useCallback((title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\\u0400-\\u04FF]+/g, '-') // Added Cyrillic characters for Macedonian
      .replace(/^-+|-+$/g, '');
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const parts = name.split('.');

    setFormData(prev => {
      const newState = JSON.parse(JSON.stringify(prev)); // Deep copy

      if (parts.length === 3 && parts[0] === 'translations' && parts[1] === 'mk') { // e.g., translations.mk.title
        const [, , field] = parts;
        newState.translations.mk = newState.translations.mk || { seo: {} };
        newState.translations.mk[field] = value;

        if (field === 'title') {
          newState.slug.mk = generateSlug(value);
          newState.translations.mk.seo = newState.translations.mk.seo || {};
          newState.translations.mk.seo.metaTitle = value.length <= 60 ? value : (newState.translations.mk.seo.metaTitle || '');
        }
      } else if (parts.length === 4 && parts[0] === 'translations' && parts[1] === 'mk' && parts[2] === 'seo') { // e.g., translations.mk.seo.keywords
        const [, , , seoField] = parts;
        newState.translations.mk = newState.translations.mk || { seo: {} };
        newState.translations.mk.seo = newState.translations.mk.seo || {};
        newState.translations.mk.seo[seoField] = value;
      } else if (parts.length === 2 && (parts[0] === 'tags' || parts[0] === 'slug') && parts[1] === 'mk') { // e.g., tags.mk or slug.mk
        const [key] = parts;
        newState[key] = newState[key] || {};
        newState[key].mk = value;
      } else { // Single level field like category
        newState[name] = value;
      }
      return newState;
    });
  };
  
  const getCharacterCountClass = (current, max) => {
    if (current > max) return styles.error;
    if (current > max * 0.9) return styles.warning;
    return '';
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
    setFieldErrors({});

    if (!token || !currentUser) {
      setError('Не сте автентицирани. Ве молиме најавете се повторно.');
      setLoading(false);
      return;
    }
    
    let currentFormData = { ...formData }; // Work with a mutable copy

    // Ensure slug for Macedonian is generated if missing and title exists
    if (currentFormData.translations.mk?.title?.trim() && (!currentFormData.slug.mk || !currentFormData.slug.mk.trim())) {
        currentFormData = {
            ...currentFormData,
            slug: {
                ...currentFormData.slug,
                mk: generateSlug(currentFormData.translations.mk.title)
            }
        };
    }
    
    const finalFormData = {
        ...currentFormData,
        defaultLanguage: 'mk',
        publishedLanguages: ['mk'],
    };

    try {
      const dataToSend = new FormData();
      
      const translationsToSend = {
        mk: {
          title: finalFormData.translations.mk?.title || '',
          content: finalFormData.translations.mk?.content || '',
          summary: finalFormData.translations.mk?.summary || '',
          seo: finalFormData.translations.mk?.seo || { metaTitle: '', metaDescription: '', keywords: '', canonicalUrl: '', ogImage: '' }
        },
        // Backend might expect 'en' structure, even if empty. Adjust if not needed.
        en: { title: '', content: '', summary: '', seo: { metaTitle: '', metaDescription: '', keywords: '', canonicalUrl: '', ogImage: '' } }
      };

      const slugToSend = {
        mk: finalFormData.slug?.mk ? generateSlug(finalFormData.slug.mk) : (finalFormData.translations.mk?.title ? generateSlug(finalFormData.translations.mk.title) : ''),
        en: '' 
      };

      const processedTags = {
        mk: finalFormData.tags.mk ? finalFormData.tags.mk.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        en: [] 
      };
      
      dataToSend.append('translations', JSON.stringify(translationsToSend));
      dataToSend.append('slug', JSON.stringify(slugToSend));
      dataToSend.append('tags', JSON.stringify(processedTags));
      dataToSend.append('category', finalFormData.category || 'general');
      dataToSend.append('publishedLanguages', JSON.stringify(['mk']));
      dataToSend.append('defaultLanguage', 'mk');
      
      if (currentUser) {
        dataToSend.append('authorId', currentUser.id || '');
        dataToSend.append('authorName', currentUser.email || currentUser.username || '');
      }
      
      if (finalFormData.image) {
        dataToSend.append('image', finalFormData.image);
      }

      // console.log('FormData keys being sent (Macedonian only):', [...dataToSend.keys()]);
      // for (let [key, value] of dataToSend.entries()) {
      //   console.log(`${key}: ${value}`);
      // }

      try {
        const response = await ApiService.createBlog(dataToSend);

        if (response && (response.blogId || (response.data && response.data.blogId))) {
          setSuccess('Блогот е успешно додаден.');
          setFormData({ 
            translations: {
              mk: { title: '', content: '', summary: '', seo: { metaTitle: '', metaDescription: '', keywords: '', canonicalUrl: '', ogImage: '' } },
              en: { title: '', content: '', summary: '', seo: { metaTitle: '', metaDescription: '', keywords: '', canonicalUrl: '', ogImage: '' } },
            },
            slug: { mk: '', en: '' },
            tags: { mk: '', en: '' },
            image: null,
            category: 'general',
            publishedLanguages: ['mk'],
            defaultLanguage: 'mk',
          });
          const fileInput = document.querySelector('input[type="file"]');
          if (fileInput) fileInput.value = '';
          setTimeout(() => {
            if (token && currentUser) { // Check token and user again before navigating
              navigate('/terminal/admin/blogs');
            } else {
              navigate('/login', { state: { from: { pathname: '/terminal/admin/blogs' } } });
            }
          }, 2000);
        } else {
          throw new Error(response?.message || 'Грешка при додавање на блогот.');
        }
      } catch (apiError) {
        if (apiError.message && (
            apiError.message.includes('Authentication failed') || 
            apiError.message.includes('No authorization token') ||
            apiError.message.includes('401') || 
            apiError.message.toLowerCase().includes('unauthorized')
          )) {
          setError('Грешка при автентикација: Ве молиме најавете се повторно.');
          setLoading(false);
          return; 
        }
        setError(apiError.message || 'Грешка при додавање на блогот.');
      }
    } catch (err) {
      if (Object.keys(fieldErrors).length === 0) { 
          setError(err.message || 'Грешка при додавање на блогот.');
      }
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'general', label: 'Општо' },
    { value: 'business', label: 'Бизнис' },
    { value: 'technology', label: 'Технологија' },
    { value: 'finance', label: 'Финансии' },
    { value: 'investment', label: 'Инвестиции' }
  ];

  // const langForPreview = 'mk'; // Not used

  return (
    <ProfileRequired>
      <div>
        <Header isTerminal={true} />
        <div className={styles["dashboard-layout"]}>
          <Sidebar />
          <main className={styles["dashboard-main"]}>
            <div className={styles.container}>
              <h1>Додади нов блог</h1>
              {error && <div className={`${styles.error} ${styles.message}`}>{error}</div>}
              {success && <div className={`${styles.success} ${styles.message}`}>{success}</div>}

            <form onSubmit={handleSubmit} className={styles.form} noValidate> 
              <div className={styles.sectionDivider}>Глобални поставки</div>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label htmlFor="category">Категорија*</label>
                  <select id="category" name="category" value={formData.category} onChange={handleInputChange} required className={styles.select}>
                    {categories.map(({ value, label }) => (<option key={value} value={value}>{label}</option>))}\
                  </select>
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="image">Насловна слика</label>
                <input type="file" id="image" name="image" onChange={handleImageChange} accept="image/*" className={styles.fileInput} />
              </div>

              <div className={styles.languageContainer}>
                <div className={styles.languageSection} style={{ borderColor: 'var(--color-accent)' }}>
                  <div className={styles.languageHeader}>
                    Содржина на Македонски
                    <span className={styles.languageFlag}>
                      🇲🇰 MK
                      <span className={styles.defaultLanguage}> (Стандарден јазик)</span>
                    </span>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="translations.mk.title">Наслов (МК)*</label>
                    <input 
                      type="text" 
                      id="translations.mk.title" 
                      name="translations.mk.title" 
                      value={formData.translations?.mk?.title || ''} 
                      onChange={handleInputChange} 
                      className={`${styles.input} ${fieldErrors['translations.mk.title'] ? styles.inputError : ''}`}
                      required 
                    />
                    {fieldErrors['translations.mk.title'] && <div className={styles.fieldErrorMessage}>{fieldErrors['translations.mk.title']}</div>}
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="translations.mk.summary">Резиме (МК)*</label>
                    <textarea 
                      id="translations.mk.summary" 
                      name="translations.mk.summary" 
                      value={formData.translations?.mk?.summary || ''} 
                      onChange={handleInputChange} 
                      className={`${styles.textarea} ${fieldErrors['translations.mk.summary'] ? styles.inputError : ''}`}
                      rows="3" 
                      placeholder="Напишете кратко резиме на блогот (до 200 карактери)"
                      maxLength="200"
                      required
                    />
                     <small className={styles.characterCount}> {/* Changed from styles.charCount */}
                        <span className={getCharacterCountClass(formData.translations?.mk?.summary?.length || 0, 200)}>
                            {formData.translations?.mk?.summary?.length || 0}
                        </span> / 200 карактери
                    </small>
                    {fieldErrors['translations.mk.summary'] && <div className={styles.fieldErrorMessage}>{fieldErrors['translations.mk.summary']}</div>}
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="translations.mk.content">Содржина (МК)*</label>
                    <textarea 
                      id="translations.mk.content" 
                      name="translations.mk.content" 
                      value={formData.translations?.mk?.content || ''} 
                      onChange={handleInputChange} 
                      className={`${styles.textarea} ${styles.contentArea} ${fieldErrors['translations.mk.content'] ? styles.inputError : ''}`}
                      rows="15" 
                      placeholder="Напишете ја целосната содржина на блогот овде..."
                      required
                    />
                    {fieldErrors['translations.mk.content'] && <div className={styles.fieldErrorMessage}>{fieldErrors['translations.mk.content']}</div>}
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="tags.mk">Тагови (МК)</label>
                    <input 
                      type="text" 
                      id="tags.mk" 
                      name="tags.mk" 
                      value={formData.tags?.mk || ''} 
                      onChange={handleInputChange} 
                      className={styles.input}
                      placeholder="Одделете ги таговите со запирка (пр. технологија, бизнис)"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="slug.mk">Slug (МК)</label>
                    <input 
                      type="text" 
                      id="slug.mk" 
                      name="slug.mk" 
                      value={formData.slug?.mk || ''} 
                      onChange={handleInputChange} 
                      className={styles.input}
                      placeholder="Автоматски генериран од насловот, или внесете рачно"
                    />
                     <small>URL: {`http://localhost:3000/blog/mk/${formData.slug?.mk || '[slug]'}`}</small>
                  </div>

                  {/* SEO Fields for Macedonian */}
                  <div className={styles.sectionDivider}>SEO Поставки (МК)</div>
                  <div className={styles.formGroup}>
                    <label htmlFor="translations.mk.seo.metaTitle">Мета Наслов (МК)</label>
                    <input 
                      type="text" 
                      id="translations.mk.seo.metaTitle" 
                      name="translations.mk.seo.metaTitle" 
                      value={formData.translations?.mk?.seo?.metaTitle || ''} 
                      onChange={handleInputChange} 
                      className={styles.input}
                      maxLength="60"
                      placeholder="Оптимизиран наслов за пребарувачи (до 60 карактери)"
                    />
                    <small className={styles.characterCount}> {/* Changed from styles.charCount */}
                        <span className={getCharacterCountClass(formData.translations?.mk?.seo?.metaTitle?.length || 0, 60)}>
                            {formData.translations?.mk?.seo?.metaTitle?.length || 0}
                        </span> / 60 карактери
                    </small>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="translations.mk.seo.metaDescription">Мета Опис (МК)</label>
                    <textarea 
                      id="translations.mk.seo.metaDescription" 
                      name="translations.mk.seo.metaDescription" 
                      value={formData.translations?.mk?.seo?.metaDescription || ''} 
                      onChange={handleInputChange} 
                      className={styles.textarea}
                      rows="3"
                      maxLength="160"
                      placeholder="Оптимизиран опис за пребарувачи (до 160 карактери)"
                    />
                    <small className={styles.characterCount}> {/* Changed from styles.charCount */}
                        <span className={getCharacterCountClass(formData.translations?.mk?.seo?.metaDescription?.length || 0, 160)}>
                            {formData.translations?.mk?.seo?.metaDescription?.length || 0}
                        </span> / 160 карактери
                    </small>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="translations.mk.seo.keywords">Клучни зборови (МК)</label>
                    <input 
                      type="text" 
                      id="translations.mk.seo.keywords" 
                      name="translations.mk.seo.keywords" 
                      value={formData.translations?.mk?.seo?.keywords || ''} 
                      onChange={handleInputChange} 
                      className={styles.input}
                      placeholder="Одделете ги клучните зборови со запирка"
                    />
                  </div>
                   <div className={styles.formGroup}>
                    <label htmlFor="translations.mk.seo.canonicalUrl">Каноничен URL (МК)</label>
                    <input
                      type="url"
                      id="translations.mk.seo.canonicalUrl"
                      name="translations.mk.seo.canonicalUrl"
                      value={formData.translations?.mk?.seo?.canonicalUrl || ''}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="https://vasata-stranica.com/originalen-blog-post"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="translations.mk.seo.ogImage">Open Graph Слика URL (МК)</label>
                    <input
                      type="url"
                      id="translations.mk.seo.ogImage"
                      name="translations.mk.seo.ogImage"
                      value={formData.translations?.mk?.seo?.ogImage || ''}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="URL до слика за социјални мрежи (пр. https://.../slika.jpg)"
                    />
                    <small>Ако е празно, ќе се користи насловната слика на блогот.</small>
                  </div>
                </div>
              </div>

              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? 'Зачувување...' : 'Зачувај блог'}
              </button>
            </form>
          </div>
        </main>
      </div>
      <Footer isTerminal={true} />
    </div>
    </ProfileRequired>
  );
};

export default AddBlog;