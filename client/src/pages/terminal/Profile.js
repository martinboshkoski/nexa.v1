import React, { useState, useEffect } from 'react';
import styles from '../../styles/terminal/Profile.module.css';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import { useAuth } from '../../contexts/AuthContext';

const Profile = () => {
  const { token, currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [userProfile, setUserProfile] = useState({
    // User profile simplified - no fullName needed
  });
  
  const [companyProfile, setCompanyProfile] = useState({
    companyName: '',
    companyAddress: '',
    taxNumber: '',
    businessActivity: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // User profile simplified
          setUserProfile({});
          
          if (data.company) {
            setCompanyProfile({
              companyName: data.company.companyName || '',
              companyAddress: data.company.companyAddress || '',
              taxNumber: data.company.taxNumber || '',
              businessActivity: data.company.businessActivity || ''
            });
          }
        }
      } catch (error) {
        setError('Неуспешно вчитување на податоците за профилот');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handleUserInputChange = (e) => {
    const { name, value } = e.target;
    setUserProfile({
      ...userProfile,
      [name]: value
    });
  };

  const handleCompanyInputChange = (e) => {
    const { name, value } = e.target;
    setCompanyProfile({
      ...companyProfile,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    
    try {
      // Get CSRF token
      const csrfResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/csrf-token`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!csrfResponse.ok) {
        throw new Error('Failed to get CSRF token');
      }

      const { csrfToken } = await csrfResponse.json();

      // Update user profile (simplified - no fullName to update)
      // const userResponse = await fetch('http://localhost:5002/api/users/profile', {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'X-CSRF-Token': csrfToken,
      //     Authorization: `Bearer ${token}`
      //   },
      //   credentials: 'include',
      //   body: JSON.stringify({})
      // });
      
      // Update company profile
      const companyResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/users/company`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(companyProfile)
      });
      
      if (!companyResponse.ok) {
        throw new Error('Неуспешно ажурирање на профилот на компанијата');
      }
      
      setSuccess('Профилот е успешно ажуриран!');
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const businessActivities = [
    'Развој на софтвер',
    'Правни услуги',
    'Финансиски услуги',
    'Здравствена заштита',
    'Образование',
    'Недвижности',
    'Производство',
    'Трговија на мало',
    'Консалтинг',
    'Друго'
  ];

  return (
    <div>
      <Header isTerminal={true} />
      
      <div className={styles["dashboard-layout"]}>
        <Sidebar />

        <main className={styles["dashboard-main"]}>
          <div className={styles['profile-container']}>
            <div className={styles['profile-header']}>
              <h1>Кориснички профил</h1>
              <p>Управувајте со вашите лични и компаниски информации.</p>
            </div>
          
          {loading ? (
            <div className="text-center">
              <p>Се вчитува профилот...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles['profile-form']}>
              {error && <div className={styles['error-message']}>{error}</div>}
              {success && <div className={styles['success-message']}>{success}</div>}
              
              <div className={styles['form-section']}>
                <h2 className={styles['form-section-title']}>Лични информации</h2>
                
                <div className={styles['form-group']}>
                  <label htmlFor="email" className={styles['form-label']}>Е-пошта</label>
                  <input
                    type="email"
                    id="email"
                    className={styles['form-input']}
                    value={currentUser?.email || ''}
                    disabled
                  />
                  <small>Е-поштата не може да се менува.</small>
                </div>
              </div>
              
              <div className={styles['form-section']}>
                <h2 className={styles['form-section-title']}>Информации за компанијата</h2>
                
                <div className={styles['form-group']}>
                  <label htmlFor="companyName" className={styles['form-label']}>Име на компанија</label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    className={styles['form-input']}
                    value={companyProfile.companyName}
                    onChange={handleCompanyInputChange}
                    required
                  />
                </div>
                
                <div className={styles['form-group']}>
                  <label htmlFor="companyAddress" className={styles['form-label']}>Адреса на компанија</label>
                  <input
                    type="text"
                    id="companyAddress"
                    name="companyAddress"
                    className={styles['form-input']}
                    value={companyProfile.companyAddress}
                    onChange={handleCompanyInputChange}
                    required
                  />
                </div>
                
                <div className={styles['form-group']}>
                  <label htmlFor="taxNumber" className={styles['form-label']}>Даночен број</label>
                  <input
                    type="text"
                    id="taxNumber"
                    name="taxNumber"
                    className={styles['form-input']}
                    value={companyProfile.taxNumber}
                    onChange={handleCompanyInputChange}
                    required
                  />
                </div>
                
                <div className={styles['form-group']}>
                  <label htmlFor="businessActivity" className={styles['form-label']}>Деловна активност</label>
                  <select
                    id="businessActivity"
                    name="businessActivity"
                    className={styles['form-select']}
                    value={companyProfile.businessActivity}
                    onChange={handleCompanyInputChange}
                    required
                  >
                    <option value="">Изберете деловна активност</option>
                    {businessActivities.map((activity) => (
                      <option key={activity} value={activity}>
                        {activity}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <button 
                type="submit" 
                className={styles['save-button']}
                disabled={saving}
              >
                {saving ? 'Се зачувува...' : 'Зачувај ги промените'}
              </button>
            </form>
          )}
        </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
