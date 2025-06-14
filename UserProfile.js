import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './auth/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserCircle, faHome, faEdit, faSpinner, faX, faListAlt, faClock
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import EditProfile from './EditProfile';
import { ToastContainer, toast } from 'react-toastify';
import './styles/User Profile.css';

const UserProfile = () => {
  const { userEmail } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activityLog, setActivityLog] = useState([]);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logLoading, setLogLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userEmail) {
      toast.error('Access Denied! Please log in to access your profile');
      navigate('/login');
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/user/profile', {
          params: { Email: userEmail }
        });
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError(error.response?.data?.error || 'Failed to load user profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userEmail, navigate]);

  const handleEditProfile = (updatedUser) => {
    setUser(prevUser => ({
      ...prevUser,
      ...updatedUser,
    }));
  };

  const handleGoBack = () => {
    if (user && user.UserType === 'Staff' | user.UserType === 'Student') {
      navigate('/settings');
    } else {
      navigate('/unauthorized');
    }
  };

  const handleViewActivityLog = async () => {
    setLogModalOpen(true);
    setLogLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/api/user/profile/activity-log', {
        params: { email: userEmail }
      });
      setActivityLog(response.data);
    } catch (err) {
      console.error('Error fetching activity log:', err);
      toast.error('Failed to load activity log.');
    } finally {
      setLogLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='profile-form'>
        <h1>User Profile<ToastContainer /></h1>
        <div className="loading">
          <FontAwesomeIcon icon={faSpinner} spin /> Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='profile-form'>
        <h1>User Profile <ToastContainer /></h1>
        <div className="error">
          <FontAwesomeIcon icon={faX} /> {error}
          <button onClick={handleGoBack} className="homing-btn">
            <FontAwesomeIcon icon={faHome} style={{ marginRight: '5px' }} />
            <span>Settings</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-form">
      <ToastContainer />
      <div className="admin-discover-tab-buttons">
          <button onClick={handleGoBack}>
            <FontAwesomeIcon icon={faHome} style={{ marginRight: '5px' }} />
            <span>Go Back</span>
          </button>
          <button onClick={() => setIsModalOpen(true)}>
            <FontAwesomeIcon icon={faEdit} style={{ marginRight: '5px' }} />
            <span>Edit Profile</span>
          </button>
          <button onClick={handleViewActivityLog}>
            <FontAwesomeIcon icon={faListAlt} style={{ marginRight: '5px' }} />
            <span>Your Activity</span>
          </button>
        </div>
      <div className="profile-container">
        <div className="profile-header">
          <FontAwesomeIcon icon={faUserCircle} size="3x" className="profile-icon" />
          <h2>{user.Username}</h2>
        </div>
        <div className="profile-details">
          <p className='detail'><strong>Email:</strong> {user.Email}</p>
          <p className='detail'><strong>Phone:</strong> {user.Phone || 'N/A'}</p>
          <p className='detail'><strong>Reg Number:</strong> {user.RegNumber}</p>
          <p className='detail'><strong>User ID:</strong> {user.UserID}</p>
          <p className='detail'><strong>User Privilege:</strong> {user.UserType}</p>
          <p className='detail'><strong>Residence:</strong> {user.Residence}</p>
          <p className='detail'><strong>Joined on:</strong> {new Date(user.CreatedAt).toLocaleDateString()}</p>
          <p className='detail'><strong>Last Modified on:</strong> {new Date(user.UpdatedAt).toLocaleDateString()}</p>
        </div>

        {isModalOpen && (
          <EditProfile
            user={user}
            onClose={() => setIsModalOpen(false)}
            onSave={handleEditProfile}
          />
        )}

        {logModalOpen && (
          <div className="user-ac-modal-overlay">
            <div className="act-log-modal">
              <div className="modal-header">
                <h2>Activity Log</h2>
                <button onClick={() => setLogModalOpen(false)} className="act-modal-close">
                  <FontAwesomeIcon icon={faX} />
                </button>
              </div>
                {logLoading ? (
                  <div className="loading"><FontAwesomeIcon icon={faSpinner} spin /> Loading...</div>
                ) : activityLog.length === 0 ? (
                  <p>No activity found.</p>
                ) : (
                  <ul className="log-list">
                    {activityLog.map(log => (
                      <li key={log.LogID} className="log-entry">
                        <p><strong>Action:</strong> {log.ActionType}</p>
                        <p><strong>Description:</strong> {log.ActionDetails}</p>
                        <p><strong><FontAwesomeIcon icon={faClock}/>:</strong> {new Date(new Date(log.Timestamp).setHours(new Date(log.Timestamp).getHours() - 2)).toLocaleString()}</p>
                        {log.AffectedItemID && <p><strong>Item ID:</strong> {log.AffectedItemID}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
