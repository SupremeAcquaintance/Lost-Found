import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from './auth/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faN, faCheckCircle, faExclamationCircle,
  faInbox, faSpinner, faHome
} from '@fortawesome/free-solid-svg-icons';
import './styles/Notifications.css';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const { user, isAuthenticated } = useAuth(); 
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    const fetchNotifications = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/notifications', {
          params: { email: user.Email } 
        });
        setNotifications(response.data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user, isAuthenticated, navigate]);

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

  return (
    <div className="notifications-form">
      <div className="notification-header">
        <h2>
          <FontAwesomeIcon icon={faN} size="1x" className="n-icon" />otifications
        </h2>
      </div>
      <div className='admin-discover-tab-buttons'>
        <aside>
        <button onClick={() => navigate(user.UserType === 'Staff' ? '/admin/dashboard' : '/home')}>
          <FontAwesomeIcon icon={faHome} className="home-icon" /> Home
        </button>
        </aside>
      </div>

      <div className="notification-container">
        {loading ? (
          <div className="loading">
            <FontAwesomeIcon icon={faSpinner} spin /> Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="no-notifications">
            <FontAwesomeIcon icon={faInbox} /> No notifications yet.
          </div>
        ) : (
          <ul className="notification-list">
            {notifications.map((notif) => (
              <li
                key={notif.NotificationID}
                className={`notification-item ${notif.IsRead ? 'read' : 'unread'}`}
              >
                <div className="notification-icon">
                  <FontAwesomeIcon
                    icon={notif.IsRead ? faCheckCircle : faExclamationCircle}
                  />
                </div>
                <div className="notification-content">
                  <p className="message">{notif.Message}</p>
                  <span className="timestamp">
                    {new Date(notif.CreatedAt).toLocaleString()}
                  </span>
                </div>
                {!notif.IsRead && (
                  <button
                    className="mark-read-btn"
                    onClick={() => markAsRead(notif.NotificationID)}
                  >
                    Mark as read
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Notifications;
// This code defines a Notifications component that fetches and displays user notifications from a server. 
// It uses React hooks for state management and side effects, and axios for making HTTP requests. 
// The component also includes functionality to mark notifications as read.
