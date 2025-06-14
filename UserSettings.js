import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './auth/AuthContext';
import './styles/UserSettings.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserEdit, faLock, faTrashAlt, faSave, faUndo, faSignOutAlt,
  faInfoCircle, faCog, faBell, faHome
} from '@fortawesome/free-solid-svg-icons';

const UserSettings = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [activeTab, setActiveTab] = useState('profile');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [prefs, setPrefs] = useState({ notifications: true, theme: 'dark' });
  const [loading, setLoading] = useState(false);

  console.log("USER", user);
  useEffect(() => {

    if (!user) {
        toast.error('Access Denied! Please log in to access your profile');
        navigate('/login');
        return;
      }

    axios.get('http://localhost:3000/api/settings', {user})
      .then(res => {
        if (res.data.preferences) setPrefs(res.data.preferences);
      })
      .catch(() => toast.error('Failed to load preferences'));
  }, []);

  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword) {
      toast.error('Please fill in both password fields');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await axios.post('http://localhost:3000/api/settings/change-password', {
        oldPassword,
        newPassword,
        user
      });
      toast.success('Password updated');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('This action is irreversible. Delete your account?')) return;

    try {
      await axios.delete('http://localhost:3000/api/settings/delete-account', {user});
      logout();
      navigate('/');
    } catch {
      toast.error('Error deleting account');
    }
  };

  const handleSavePrefs = async () => {
    setLoading(true);
    try {
      await axios.put('http://localhost:3000/api/settings/preferences', {prefs, user});
      toast.success('Preferences saved');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => window.location.reload();
  const handleGoHome = () => {
    if (user?.UserType === 'Staff') {
      navigate('/admin/dashboard');
    } else if (user?.UserType === 'Student') {
      navigate('/home');
    } else {
      navigate('/unauthorized');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="panel">
            <p><strong>Username:</strong> {user?.Username}</p>
            <p><strong>Email:</strong> {user?.Email}</p>
            <button onClick={() => navigate('/user/profile')} className="action-btn">
              <FontAwesomeIcon icon={faUserEdit} /> Edit Profile
            </button>
          </div>
        );

      case 'security':
        return (
          <div className="panel">
            <input
              type="password"
              placeholder="Old Password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <div className="btn-group">
              <button onClick={handlePasswordChange} className="action-btn" disabled={loading}>
                <FontAwesomeIcon icon={faSave} /> {loading ? 'Updating...' : 'Update Password'}
              </button>
              <button onClick={handleDeleteAccount} className="action-btn delete">
                <FontAwesomeIcon icon={faTrashAlt} /> Delete Account
              </button>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="panel">
            <label className="toggle-label">
              <FontAwesomeIcon icon={faBell} /> Notifications
              <input
                type="checkbox"
                checked={prefs.notifications}
                onChange={(e) => setPrefs({ ...prefs, notifications: e.target.checked })}
              />
            </label>
            <label className="select-label">
              Theme
              <select
                value={prefs.theme}
                onChange={(e) => setPrefs({ ...prefs, theme: e.target.value })}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="futuristic">Futuristic</option>
              </select>
            </label>
            <div className="btn-group">
              <button onClick={handleCancel} className="action-btn">
                <FontAwesomeIcon icon={faUndo} /> Cancel
              </button>
              <button onClick={handleSavePrefs} disabled={loading} className="action-btn">
                {loading ? 'Saving...' : (<><FontAwesomeIcon icon={faSave} /> Save</>)}
              </button>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="panel about-panel">
            <p><strong>Version:</strong> 0.1.0</p>
            <p>Campus Lost & Found v0.1.0 — an intelligent, AI-driven platform to reunite lost items with their owners.`</p>
            <button onClick={handleLogout} className="action-btn logout">
              <FontAwesomeIcon icon={faSignOutAlt} /> Logout
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="settings-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <aside className="settings-sidebar">
        <button
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <FontAwesomeIcon icon={faUserEdit} className="tab-icon" />
          <span>Profile</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <FontAwesomeIcon icon={faLock} className="tab-icon" />
          <span>Security</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          <FontAwesomeIcon icon={faCog} className="tab-icon" />
          <span>Preferences</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          <FontAwesomeIcon icon={faInfoCircle} className="tab-icon" />
          <span>About</span>
        </button>
        <button onClick={() => handleGoHome()} className="tab-btn home-btn">
          <FontAwesomeIcon icon={faHome} className="tab-icon" />
          <span>Home</span>
        </button>
      </aside>

      <main className="settings-content">
        <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
        {renderTabContent()}
      </main>
    </div>
  );
};

export default UserSettings;
