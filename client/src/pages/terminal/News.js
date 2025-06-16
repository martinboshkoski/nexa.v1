import React, { useState, useEffect } from 'react';
import styles from '../../styles/terminal/News.module.css';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import { useAuth } from '../../contexts/AuthContext';

const News = () => {
  const { token } = useAuth();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/news?page=${currentPage}&limit=6`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setNews(data.news);
          setTotalPages(data.pagination.pages);
        }
      } catch (error) {
        // Silently handle news fetch errors
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [token, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('mk-MK', options);
  };

  return (
    <div>
      <Header isTerminal={true} />
      
      <div className={styles["dashboard-layout"]}>
        <Sidebar />

        <main className={styles["dashboard-main"]}>
          <div className={styles['news-container']}>
            <div className={styles['news-header']}>
              <h1>Вести</h1>
              <p>Најновите вести и објави</p>
            </div>
          
          {loading ? (
            <div className="text-center">
              <p>Се вчитуваат вести...</p>
            </div>
          ) : news.length === 0 ? (
            <div className="text-center">
              <p>Нема достапни вести.</p>
            </div>
          ) : (
            <>
              <div className={styles['news-grid']}>
                {news.map((item) => (
                  <div key={item._id} className={styles['news-card']}>
                    <div className={styles['news-content']}>
                      <h2 className={styles['news-title']}>{item.title}</h2>
                      <div className={styles['news-date']}>{formatDate(item.date)}</div>
                      <p className={styles['news-description']}>{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  {currentPage > 1 && (
                    <button 
                      className={styles['page-button']} 
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      Претходна
                    </button>
                  )}
                  
                  {[...Array(totalPages).keys()].map((page) => (
                    <button
                      key={page + 1}
                      className={`${styles['page-button']} ${currentPage === page + 1 ? styles.active : ''}`}
                      onClick={() => handlePageChange(page + 1)}
                    >
                      {page + 1}
                    </button>
                  ))}
                  
                  {currentPage < totalPages && (
                    <button 
                      className={styles['page-button']} 
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Следна
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        </main>
      </div>
    </div>
  );
};

export default News;
