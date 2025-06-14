import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faBell,
  faComments,
  faL,
  faF,
  faA,
  faBoxOpen,
  faStar,
  faUsers,
  faShieldAlt,
  faBullhorn,
  faChartBar,
  faExclamationTriangle,
  faSlidersH,
  faHistory
} from '@fortawesome/free-solid-svg-icons';
import {useAuth} from './auth/AuthContext';
import Slider from 'react-slick';
import './styles/AdminDashboard.css'; 
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const Dashboard = () => {
  const [notifications, setNotifications] = useState([]);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated){
    navigate('/login');
  }

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/notifications', {
        params: { email: user?.Email },
      });
      setNotifications(response.data.slice(0, 6)); // show first few
    } catch (error) {
      console.error('Error fetching notifications:', error);
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
  });

   const sliderSettings = {
    dots: false,
    infinite: notifications.length > 3,
    autoplay: notifications.length > 3,
    speed: 5000,
    autoplaySpeed: 5000,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: false,
    pauseOnHover: true,
  };

  // Pad with placeholders up to slidesToShow
  const paddedNotifications = useMemo(() => {
    const min = sliderSettings.slidesToShow;
    const copy = [...notifications];
    const needed = Math.max(0, min - copy.length);
    for (let i = 0; i < needed; i++) {
      copy.push({
        NotificationID: `placeholder-${i}`,
        Message: 'No new notifications',
        IsRead: true,
        isPlaceholder: true
      });
    }
    return copy;
  }, [notifications, sliderSettings.slidesToShow]);

  return (
    <main className="admin-page">
      <header className="admin-hero-section">
        <h1>
          <FontAwesomeIcon icon={faL} size="1x" className="heading-icon" />ost and
          <FontAwesomeIcon icon={faF} size="1x" className="heading-icon" />ound
          <FontAwesomeIcon icon={faA} size="1x" className="heading-icon" />dmin
        </h1>
        <h2>{user?.Username}'s Dashboard</h2>

        {/* Notification Slider */}
        <div className="notification-strip-container">
          {!loading && paddedNotifications.length > 0 && (
            <Slider {...sliderSettings}>
              {paddedNotifications.map(notif => (
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

      <section className="admin-features">
        <div className="admin-feature-list">

          {/* Common user features */}
          <Link to='/chat' className="feature-link">
            <div className="home-feature">
              <FontAwesomeIcon icon={faComments} className="home-icon" size="3x" />
              <h3>Chat</h3>
            </div>
          </Link>

          <Link to='/user/profile' className="feature-link">
            <div className="home-feature">
              <FontAwesomeIcon icon={faUser} className="home-icon" size="3x" />
              <h3>Profile</h3>
            </div>
          </Link>

          <Link to='/notifications' className="feature-link">
            <div className="home-feature">
              <FontAwesomeIcon icon={faBell} className="home-icon" size="3x" />
              <h3>Notifications</h3>
            </div>
          </Link>

          {/* Admin-exclusive features */}
          <Link to='/admin/items' className="feature-link">
            <div className="home-feature">
              <FontAwesomeIcon icon={faBoxOpen} className="home-icon" size="3x" />
              <h3>Item Management</h3>
            </div>
          </Link>

          <Link to='/admin/users' className="feature-link">
            <div className="home-feature">
              <FontAwesomeIcon icon={faUsers} className="home-icon" size="3x" />
              <h3>User Management</h3>
            </div>
          </Link>

          <Link to='/admin/claims' className="feature-link">
            <div className="home-feature">
              <FontAwesomeIcon icon={faShieldAlt} className="home-icon" size="3x" />
              <h3>Claim Verification</h3>
            </div>
          </Link>

          <Link to='/admin/announcements' className="feature-link">
            <div className="home-feature">
              <FontAwesomeIcon icon={faBullhorn} className="home-icon" size="3x" />
              <h3>Announcements</h3>
            </div>
          </Link>

          <Link to='/admin/analytics' className="feature-link">
            <div className="home-feature">
              <FontAwesomeIcon icon={faChartBar} className="home-icon" size="3x" />
              <h3>Analytics</h3>
            </div>
          </Link>

          <Link to='/admin/reports' className="feature-link">
            <div className="home-feature">
              <FontAwesomeIcon icon={faExclamationTriangle} className="home-icon" size="3x" />
              <h3>Moderation</h3>
            </div>
          </Link>

          <Link to='/settings' className="feature-link">
            <div className="home-feature">
              <FontAwesomeIcon icon={faSlidersH} className="home-icon" size="3x" />
              <h3>System Settings</h3>
            </div>
          </Link>

          <Link to='/admin/logs' className="feature-link">
            <div className="home-feature">
              <FontAwesomeIcon icon={faHistory} className="home-icon" size="3x" />
              <h3>Activity Logs</h3>
            </div>
          </Link>

          <Link to='/admin/reviews' className="feature-link">
            <div className="home-feature">
              <FontAwesomeIcon icon={faStar} className="home-icon" size="3x" />
              <h3>Review</h3>
            </div>
          </Link>

        </div>
      </section>

      <div className="footer">
        <p>&copy; {new Date().getFullYear()} Campus Lost and Found. Created by Group 6. All rights reserved.</p>
      </div>

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
            <button className="close-modal" onClick={() => setSelectedNotif(null)}>×</button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Dashboard;
