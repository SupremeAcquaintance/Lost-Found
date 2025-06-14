// UserManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faExclamationTriangle,
  faUserSlash,
  faSpinner,
  faEye,
  faUserCheck,
  faUserTimes,
  faHome,
  faUserShield,
  faPlusCircle
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from './auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import './styles/UserManagement.css';

const UserManagement = () => {
  const { isAuthenticated, isAdmin, userEmail } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // New-admin form state
  const [newAdmin, setNewAdmin] = useState({
  RegNumber: '',
  Username: '',
  Email: '',
  Phone: '',
  Residence: '',
  Password: '',
  ConfirmPassword: '',
  adminEmail: userEmail
});

  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return navigate('/login');
    fetchUsers();
  }, [isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    let list = users;

    if (activeTab === 'flagged') {
      list = list.filter(u => u.FlagCount > 0);
    } else if (activeTab === 'suspended') {
      list = list.filter(u => u.IsSuspended);
    } else if (activeTab === 'unverified') {
      list = list.filter(u => !u.IsVerified);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(u =>
        (u.Email && u.Email.toLowerCase().includes(term)) ||
        (u.Username && u.Username.toLowerCase().includes(term))
      );
    }

    setFilteredUsers(list);
  }, [activeTab, users, searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/admin/users');
      setUsers(res.data);
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId, action) => {
    try {
      const res = await axios.post(`http://localhost:3000/api/admin/users/${action}`, { userId, adminEmail: userEmail });
      toast.success(res.data.message);
      fetchUsers();
      setSelectedUser(null);
    } catch {
      toast.error('Action failed');
    }
  };

  const handleCreateAdmin = async () => {
  const { RegNumber, Username, Email, Phone, Residence, Password, ConfirmPassword, adminEmail } = newAdmin;

  if (!Email || !Username || !Password) {
    return toast.warning('Username, Email, and Password are required');
  }

  if (Password !== ConfirmPassword) {
    return toast.warning('Passwords do not match');
  }

  setCreating(true);
  try {
    const res = await axios.post('http://localhost:3000/api/admin/users/create-admin', {
      RegNumber,
      Username,
      Email,
      Phone,
      Residence,
      Password,
      adminEmail,
    });
    toast.success(res.data.message);
    fetchUsers();
    setShowCreateModal(false);
    setNewAdmin({
      RegNumber: '',
      Username: '',
      Email: '',
      Phone: '',
      Residence: '',
      Password: '',
      ConfirmPassword: '',
      adminEmail,
    });
  } catch (err) {
    toast.error(err.response?.data?.message || 'Creation failed');
  } finally {
    setCreating(false);
  }
};


  return (
    <div className="user-management-container">
      <ToastContainer />

      <header className="um-header">
        <h2><FontAwesomeIcon icon={faUsers} /> User Management</h2>
        {isAdmin && (
          <button className="add-admin-btn" onClick={() => setShowCreateModal(true)}>
            <FontAwesomeIcon icon={faPlusCircle} /> Add Admin
          </button>
        )}
      </header>

      <div className="user-tabs">
        <button className={activeTab==='unverified'?'active':''} onClick={() => setActiveTab('unverified')}>
          <FontAwesomeIcon icon={faUserShield} /> New
        </button>
        <button className={activeTab==='all'?'active':''} onClick={() => setActiveTab('all')}>
          All Users
        </button>
        <button className={activeTab==='flagged'?'active':''} onClick={() => setActiveTab('flagged')}>
          <FontAwesomeIcon icon={faExclamationTriangle} /> Flagged
        </button>
        <button className={activeTab==='suspended'?'active':''} onClick={() => setActiveTab('suspended')}>
          <FontAwesomeIcon icon={faUserSlash} /> Suspended
        </button>
        <button onClick={() => navigate('/admin/dashboard')} >
          <FontAwesomeIcon icon={faHome} /> HOME
        </button>
      </div>
      <div className="user-search-bar">
        <input
          type="text"
          placeholder="Search by email or username..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="loading"><FontAwesomeIcon icon={faSpinner} spin /> Loading users...</p>
      ) : (
        <div className="user-grid">
          {filteredUsers.map(u => (
            <div key={u.UserID} className="user-card" >
              <h4>{u.Email}</h4>
              <p><strong>Role:</strong> {u.Role || 'Guest'}</p>
              <p>
                <strong>Status:</strong>{' '}
                {u.IsSuspended ? (
                  <span className="status suspended">Suspended</span>
                ) : (
                  <span className="status active">Active</span>
                )}
              </p>
              <div className="user-actions">
                <button onClick={() => setSelectedUser(u)} title="View Profile">
                  <FontAwesomeIcon icon={faEye} />
                </button>
                <button
                  onClick={() => handleAction(u.UserID, u.IsSuspended ? 'unsuspend' : 'suspend')}
                  title={u.IsSuspended ? 'Unsuspend':'Suspend'}
                >
                  <FontAwesomeIcon icon={u.IsSuspended ? faUserCheck : faUserTimes} />
                </button>
                <button
                  onClick={() => handleAction(u.UserID, 'verify')}
                  title="Verify"
                >
                  <FontAwesomeIcon icon={faUserShield} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile Modal */}
      {selectedUser && (
        <div className="user-profile-modal">
          <div className="modal-content">
            <button className="close-modal" onClick={() => setSelectedUser(null)}>×</button>
            <h3>{selectedUser.Username}</h3>
            <p><strong>ID:</strong> {selectedUser.UserID}</p>
            <p><strong>Email:</strong> {selectedUser.Email}</p>
            <p><strong>RegNumber:</strong> {selectedUser.RegNumber}</p>
            <p><strong>Role:</strong> {selectedUser.Role || 'Guest'}</p>
            <p><strong>Suspended:</strong> {selectedUser.IsSuspended ? 'Yes' : 'No'}</p>
            <p><strong>Verified:</strong> {selectedUser.IsVerified ? 'Yes' : 'No'}</p>
            <p><strong>Registered On:</strong> {new Date(selectedUser.CreatedAt).toLocaleDateString()}</p>
            <div className="modal-actions">
              <button onClick={() => handleAction(selectedUser.UserID, 'verify')}>
                <FontAwesomeIcon icon={faUserCheck} /> Verify
              </button>
              <button onClick={() => handleAction(selectedUser.UserID, selectedUser.IsSuspended ? 'unsuspend' : 'suspend')}>
                <FontAwesomeIcon icon={selectedUser.IsSuspended ? faUserCheck : faUserTimes} />
                {selectedUser.IsSuspended ? 'Unsuspend' : 'Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {showCreateModal && (
  <div className="create-admin-modal">
    <div className="modal-content">
      <button className="close-modal" onClick={() => setShowCreateModal(false)}>×</button>
      <h3>Register New Admin</h3>

      <input
        type="text"
        placeholder="Registration Number"
        value={newAdmin.RegNumber}
        onChange={e => setNewAdmin({...newAdmin, RegNumber: e.target.value})}
      />
      <input
        type="text"
        placeholder="Username"
        value={newAdmin.Username}
        onChange={e => setNewAdmin({...newAdmin, Username: e.target.value})}
      />
      <input
        type="email"
        placeholder="Email"
        value={newAdmin.Email}
        onChange={e => setNewAdmin({...newAdmin, Email: e.target.value})}
      />
      <input
        type="text"
        placeholder="Phone"
        value={newAdmin.Phone}
        onChange={e => setNewAdmin({...newAdmin, Phone: e.target.value})}
      />
      <input
        type="text"
        placeholder="Residence"
        value={newAdmin.Residence}
        onChange={e => setNewAdmin({...newAdmin, Residence: e.target.value})}
      />
      <input
        type="password"
        placeholder="Password"
        value={newAdmin.Password}
        onChange={e => setNewAdmin({...newAdmin, Password: e.target.value})}
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={newAdmin.ConfirmPassword}
        onChange={e => setNewAdmin({...newAdmin, ConfirmPassword: e.target.value})}
      />

      <button
        onClick={handleCreateAdmin}
        disabled={creating}
      >
        <FontAwesomeIcon icon={faPlusCircle} /> {creating ? 'Creating...' : 'Create Admin'}
      </button>
    </div>
  </div>
)}

    </div>
  );
};

export default UserManagement;
