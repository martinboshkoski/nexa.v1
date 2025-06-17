import React, { useState, useEffect } from 'react';
import styles from '../../styles/terminal/RightSidebar.module.css';

const RightSidebar = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopInvestments = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/investments?limit=3`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setInvestments(data.investments || data);
        }
      } catch (error) {
        console.error('Грешка при преземање на инвестиции:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopInvestments();
  }, []);

  return (
    <aside className={styles.rightSidebar}>
      {/* Top Investment Opportunities */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>💰</span>
          Топ Инвестициски Можности
        </h3>
        <div className={styles.sectionContent}>
          {loading ? (
            <div className={styles.loading}>Се вчитува...</div>
          ) : investments.length > 0 ? (
            investments.slice(0, 3).map((investment, index) => (
              <div key={index} className={styles.investmentCard}>
                <div className={styles.investmentHeader}>
                  <h4 className={styles.investmentTitle}>{investment.title}</h4>
                  <span className={styles.investmentAmount}>
                    {investment.minInvestment}€+
                  </span>
                </div>
                <p className={styles.investmentDescription}>
                  {investment.description?.substring(0, 80)}...
                </p>
                <div className={styles.investmentMeta}>
                  <span className={styles.investmentSector}>{investment.sector}</span>
                  <span className={styles.investmentRisk}>{investment.riskLevel}</span>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noData}>Нема достапни инвестиции</div>
          )}
          <a href="/terminal/investments" className={styles.sectionLink}>
            Видете сè →
          </a>
        </div>
      </div>

      {/* Start New Project Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🚀</span>
          Започнете Нов Проект
        </h3>
        <div className={styles.sectionContent}>
          <div className={styles.projectActions}>
            <a href="/terminal/documents" className={styles.actionButton}>
              <span className={styles.actionIcon}>📄</span>
              <div className={styles.actionText}>
                <div className={styles.actionTitle}>Генерирај Документи</div>
                <div className={styles.actionDesc}>Договори, барања, извештаи</div>
              </div>
            </a>
            
            <a href="/terminal/legal-screening" className={styles.actionButton}>
              <span className={styles.actionIcon}>⚖️</span>
              <div className={styles.actionText}>
                <div className={styles.actionTitle}>Правен Скрининг</div>
                <div className={styles.actionDesc}>Проверка на законски услови</div>
              </div>
            </a>
            
            <button className={styles.actionButton}>
              <span className={styles.actionIcon}>💼</span>
              <div className={styles.actionText}>
                <div className={styles.actionTitle}>Бизнис План</div>
                <div className={styles.actionDesc}>AI-генерирана стратегија</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Marketing Banner */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>📢</span>
          Маркетинг
        </h3>
        <div className={styles.sectionContent}>
          <div className={styles.marketingBanner}>
            <div className={styles.bannerContent}>
              <h4 className={styles.bannerTitle}>Промовирајте го вашиот бизнис!</h4>
              <p className={styles.bannerDescription}>
                Достигнете до илјадници потенцијални клиенти преку нашата платформа.
              </p>
              <div className={styles.bannerFeatures}>
                <div className={styles.feature}>✨ Таргетирана реклама</div>
                <div className={styles.feature}>📊 Детални аналитики</div>
                <div className={styles.feature}>🎯 Висока конверзија</div>
              </div>
              <button className={styles.bannerButton}>
                Започнете Кампања
              </button>
            </div>
          </div>
          
          <div className={styles.quickStats}>
            <div className={styles.stat}>
              <div className={styles.statNumber}>2,847</div>
              <div className={styles.statLabel}>Активни корисници</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>156</div>
              <div className={styles.statLabel}>Партнерски компании</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
