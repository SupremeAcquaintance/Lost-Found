import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faClipboardList, faStar, faUser, faBell, faCog, faC, faL, faF, faComments
} from '@fortawesome/free-solid-svg-icons';
import './styles/HomePage.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useAuth } from './auth/AuthContext';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';

const HomePage = () => {
  const [notifications, setNotifications] = useState([]);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    if (!isAuthenticated) {
      navigate('/login');
    }
    try {
      const response = await axios.get('http://localhost:3000/api/notifications', {
        params: { email: user?.Email },
      });
      setNotifications(response.data.slice(0, 6));
    } catch (error) {
      toast.error('No Server Connection');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`http://localhost:3000/api/notifications/read/${notificationId}`);
      setNotifications((prev) =>
        prev.map((n) =>
          n.NotificationID === notificationId ? { ...n, IsRead: true } : n
        )
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  useEffect(() => {
    if (user?.Email) fetchNotifications();
  }, [user]);

  console.log("notifications", notifications);
  const sliderSettings = React.useMemo(() => {
  const count = Array.isArray(notifications) ? notifications.length : 0;
  return {
    dots: false,
    infinite: count > 2,
    autoplay: count > 2,
    speed: 5000,
    autoplaySpeed: 5000,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: false,
    pauseOnHover: true,
  };
}, [notifications]);

  // Ensure at least slidesToShow items
  const paddedNotifications = React.useMemo(() => {
  const minSlides = sliderSettings.slidesToShow;
  const result = [...notifications];
  const placeholderCount = Math.max(0, minSlides - result.length);

  if (result.length < minSlides) {
    for (let i = 0; i < placeholderCount; i++) {
      result.push({
        NotificationID: `placeholder-${i}`,
        Message: 'No new notifications',
        IsRead: true,
        isPlaceholder: true,
      });
    }
  }

  return result; // ✅ Always return something
}, [notifications, sliderSettings.slidesToShow]);

  return (
    <main className="home-page">
      <header className="hero-section">
        <ToastContainer position="top-center" autoClose={8000} hideProgressBar />
        <h5>
          <FontAwesomeIcon icon={faC} size="1.2x" className="heading-icon" />
          ampus <FontAwesomeIcon icon={faL} size="1.2x" className="heading-icon" />
          ost and <FontAwesomeIcon icon={faF} size="1.2x" className="heading-icon" />
          ound
        </h5>
        
        <h2>{user?.Username}'s Dashboard</h2>

        {/* Notification Slider */}
        <div className="notification-strip-container">
          {!loading && paddedNotifications.length > 0 && (
            <Slider {...sliderSettings}>
              {paddedNotifications.map((notif) => (
                <div
                  key={notif.NotificationID}
                  className={`notification-strip ${
                    notif.isPlaceholder
                      ? 'strip-placeholder'
                      : notif.IsRead
                      ? 'strip-read'
                      : 'strip-unread'
                  }`}
                  onClick={() => !notif.isPlaceholder && setSelectedNotif(notif)}
                >
                  <FontAwesomeIcon icon={faBell} className="strip-icon" />
                  <span className="strip-text">{notif.Message}</span>
                </div>
              ))}
            </Slider>
          )}
        </div>
      </header>

      <section className="home-features">
        <div className="feature-list">
          <Link to="/chat" className="feature-link">
            <div className="home-feature">
              <FontAwesomeIcon icon={faComments} className="home-icon" size="3x" />
              <h3>Chat</h3>
            </div>
          </Link>
          <Link to="/user/profile" className="feature-link">
            <div className="home-feature">
              <FontAwesomeIcon icon={faUser} className="home-icon" size="3x" />
              <h3>Profile</h3>
            </div>
          </Link>
          <Link to="/report" className="feature-link">
            <div className="home-feature">
              <FontAwesomeIcon icon={faClipboardList} className="home-icon" size="3x" />
              <h3>Report</h3>
            </div>
          </Link>
          <Link to="/notifications" className="feature-link">
            <div className="home-feature">
              <FontAwesomeIcon icon={faBell} className="home-icon" size="3x" />
              <h3>Notifications</h3>
            </div>
          </Link>
          <Link to="/search" className="feature-link">
            <div className="home-feature">
              <FontAwesomeIcon icon={faSearch} className="home-icon" size="3x" />
              <h3>Discover</h3>
            </div>
          </Link>
          <Link to="/ratings" className="feature-link">
            <div className="home-feature">
              <FontAwesomeIcon icon={faStar} className="home-icon" size="3x" />
              <h3>Review</h3>
            </div>
          </Link>
          <Link to="/settings" className="feature-link">
            <div className="home-feature">
              <FontAwesomeIcon icon={faCog} className="home-icon" size="3x" />
              <h3>Settings</h3>
            </div>
          </Link>
        </div>
      </section>

      <footer className="footer">
        <p>
          &copy; {new Date().getFullYear()} Campus Lost and Found. Created by Group 6. All rights reserved.
        </p>
      </footer>

      {/* Modal */}
      {selectedNotif && (
        <div className="notif-modal">
          <div className="modal-body">
            <h3>Notification</h3>
            <p>{selectedNotif.Message}</p>
            <button
              className="mark-read"
              onClick={() => {
                markAsRead(selectedNotif.NotificationID);
                setSelectedNotif(null);
              }}
            >
              Mark as Read
            </button>
            <button className="close-modal" onClick={() => setSelectedNotif(null)}>
              ×
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default HomePage;
