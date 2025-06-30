import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import styles from '../../styles/terminal/Profile.module.css';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';

const Profile = () => {
  const { currentUser, token } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    companyName: '',
    mission: '',
    website: '',
    industry: '',
    companySize: '',
    role: '',
    description: '',
    crnNumber: '',
    address: '',
    phone: '',
    companyPIN: '',
    taxNumber: '',
    contactEmail: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const industryOptions = [
    'Технологии', 'Финансии', 'Здравство', 'Образование', 'Трговија',
    'Производство', 'Услуги', 'Градежништво', 'Транспорт', 'Туризм',
    'Земјоделство', 'Енергетика', 'Друго'
  ];
  const companySizeOptions = [
    '1-10 вработени', '11-50 вработени', '51-200 вработени', '201-500 вработени', '500+ вработени'
  ];

  useEffect(() => {
    if (currentUser) {
      setFormData({
        email: currentUser.email || '',
        companyName: currentUser.companyInfo?.companyName || '',
        mission: currentUser.companyInfo?.mission || '',
        website: currentUser.companyInfo?.website || '',
        industry: currentUser.companyInfo?.industry || '',
        companySize: currentUser.companyInfo?.companySize || '',
        role: currentUser.companyInfo?.role || '',
        description: currentUser.companyInfo?.description || '',
        crnNumber: currentUser.companyInfo?.crnNumber || '',
        address: currentUser.companyInfo?.address || '',
        phone: currentUser.companyInfo?.phone || '',
        companyPIN: currentUser.companyInfo?.companyPIN || '',
        taxNumber: currentUser.companyInfo?.taxNumber || '',
        contactEmail: currentUser.companyInfo?.contactEmail || ''
      });
      setLoading(false);
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const companyInfo = { ...formData };
      delete companyInfo.email;
      delete companyInfo.taxNumber;
      await ApiService.request(`/users/company`, {
        method: 'POST',
        body: JSON.stringify(companyInfo),
      });
      if (formData.email !== currentUser.email) {
        await ApiService.request(`/users/profile`, {
          method: 'PUT',
          body: JSON.stringify({ email: formData.email }),
        });
      }
      setSuccess('Профилот е успешно ажуриран!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      setError(error.message || 'Настана грешка при ажурирање на профилот.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles['profile-container']}>Се вчитуваат податоци...</div>;
  }

  return (
    <div>
      <Header isTerminal={true} />
      <div className={styles['dashboard-layout']}>
        <Sidebar />
        <main className={styles['dashboard-main']}>
          <div className={styles['profile-container']}>
            <div className={styles['profile-header']}>
              <h1>Профил</h1>
              <p>Ажурирајте ги вашите лични и компаниски податоци</p>
            </div>
            {error && <div className={styles['error-message']}>{error}</div>}
            {success && <div className={styles['success-message']}>{success}</div>}
            <form onSubmit={handleSubmit} className={styles['profile-form']}>
              <div className={styles['form-section']}>
                <h2 className={styles['form-section-title']}>Лични податоци</h2>
                <div className={styles['form-group']}>
                  <label className={styles['form-label']} htmlFor="email">Email адреса</label>
                  <input
                    className={styles['form-input']}
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>
              <div className={styles['form-section']}>
                <h2 className={styles['form-section-title']}>Компаниски податоци</h2>
                <div className={styles['form-group']}>
                  <label className={styles['form-label']} htmlFor="companyName">Име на компанија *</label>
                  <input
                    className={styles['form-input']}
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Внесете го името на вашата компанија"
                    required
                  />
                </div>
                <div className={styles['form-group']}>
                  <label className={styles['form-label']} htmlFor="role">Ваша позиција</label>
                  <input
                    className={styles['form-input']}
                    type="text"
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    placeholder="Извршен директор, Основач, Менаџер..."
                  />
                </div>
                <div className={styles['form-group']}>
                  <label className={styles['form-label']} htmlFor="mission">Мисија на компанијата</label>
                  <textarea
                    className={styles['form-input']}
                    id="mission"
                    name="mission"
                    value={formData.mission}
                    onChange={handleInputChange}
                    placeholder="Опишете ја мисијата и целите на вашата компанија..."
                    rows={3}
                  />
                </div>
                <div className={styles['form-group']}>
                  <label className={styles['form-label']} htmlFor="industry">Индустрија</label>
                  <select
                    className={styles['form-select']}
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                  >
                    <option value="">Изберете индустрија</option>
                    {industryOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className={styles['form-group']}>
                  <label className={styles['form-label']} htmlFor="companySize">Големина на компанија</label>
                  <select
                    className={styles['form-select']}
                    id="companySize"
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleInputChange}
                  >
                    <option value="">Изберете големина</option>
                    {companySizeOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className={styles['form-group']}>
                  <label className={styles['form-label']} htmlFor="description">Опис на компанијата</label>
                  <textarea
                    className={styles['form-input']}
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Опишете ги активностите и услугите на вашата компанија..."
                    rows={4}
                  />
                </div>
                <div className={styles['form-group']}>
                  <label className={styles['form-label']} htmlFor="website">Веб-страница</label>
                  <input
                    className={styles['form-input']}
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://www.example.com"
                  />
                </div>
                <div className={styles['form-group']}>
                  <label className={styles['form-label']} htmlFor="contactEmail">Контакт email</label>
                  <input
                    className={styles['form-input']}
                    type="email"
                    id="contactEmail"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    placeholder="contact@company.com"
                  />
                </div>
              </div>
              <div className={styles['form-section']}>
                <h2 className={styles['form-section-title']}>Правни и контакт податоци</h2>
                <div className={styles['form-group']}>
                  <label className={styles['form-label']} htmlFor="crnNumber">Матичен број</label>
                  <input
                    className={styles['form-input']}
                    type="text"
                    id="crnNumber"
                    name="crnNumber"
                    value={formData.crnNumber}
                    onChange={handleInputChange}
                    placeholder="1234567"
                  />
                </div>
                <div className={styles['form-group']}>
                  <label className={styles['form-label']} htmlFor="taxNumber">Даночен број</label>
                  <input
                    className={styles['form-input']}
                    type="text"
                    id="taxNumber"
                    name="taxNumber"
                    value={formData.taxNumber}
                    placeholder="4080012345678"
                    disabled
                  />
                </div>
                <div className={styles['form-group']}>
                  <label className={styles['form-label']} htmlFor="companyPIN">ПИН на компанија</label>
                  <input
                    className={styles['form-input']}
                    type="text"
                    id="companyPIN"
                    name="companyPIN"
                    value={formData.companyPIN}
                    onChange={handleInputChange}
                    placeholder="123456789"
                  />
                </div>
                <div className={styles['form-group']}>
                  <label className={styles['form-label']} htmlFor="phone">Телефон</label>
                  <input
                    className={styles['form-input']}
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+389 2 123 456"
                  />
                </div>
              </div>
              <button type="submit" className={styles['save-button']} disabled={saving}>
                {saving ? 'Се зачувува...' : 'Зачувај ги промените'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
