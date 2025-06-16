import React, { useState, useEffect } from "react";
import styles from "../../styles/terminal/Dashboard.module.css";
import Header from "../../components/common/Header";
import { useAuth } from "../../contexts/AuthContext";
import { Link } from "react-router-dom";
import Sidebar from "../../components/terminal/Sidebar";
import SocialFeed from "../../components/terminal/SocialFeed";
import ProfileReminderBanner from "../../components/terminal/ProfileReminderBanner";

const Dashboard = () => {
  const { currentUser, token } = useAuth();
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(
          "http://localhost:5002/api/users/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setCompanyData(data.company);
        }
      } catch (error) {
        setError("Грешка при преземање на профилот");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [token]);

  return (
    <div>
      {error && (
        <div className="text-center" style={{ color: "red", marginTop: 20 }}>
          {error}
        </div>
      )}
      <Header isTerminal={true} />

      <div className={styles["dashboard-layout"]}>
        <Sidebar />

        <main className={styles["dashboard-main"]}>
          <ProfileReminderBanner />
          
          <div className={styles["dashboard-header"]}>
            {/* <h2>Вести</h2> */}
            {companyData && (
              <div className={styles["user-info"]}>
                <span>{companyData.companyName}</span>
                <Link to="/terminal/profile" className={styles["profile-link"]}>
                  Уреди профил
                </Link>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center">
              <p>Се вчитува...</p>
            </div>
          ) : null}

          <SocialFeed />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;