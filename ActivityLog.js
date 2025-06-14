import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHistory,
  faSpinner,
  faEye,
  faSearch,
  faHome,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import './styles/ActivityLog.css';
import { useAuth } from './auth/AuthContext';

const ActivityLog = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return navigate('/login');
    fetchLogs();
  }, [isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    let list = logs;
    if (activeTab !== 'all') {
      list = list.filter(log => log.ActionType.toLowerCase() === activeTab);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(log =>
        log.Email.toLowerCase().includes(term) ||
        log.ActionDetails.toLowerCase().includes(term)
      );
    }

    setFilteredLogs(list);
  }, [logs, searchTerm, activeTab]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/admin/activity-log');
      setLogs(res.data);
    } catch {
      toast.error('Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="activity-log-container">
      <ToastContainer />
      <header className="log-header">
        <h2><FontAwesomeIcon icon={faHistory} /> Activity Log</h2>
      </header>

      <div className="log-tabs">
        <button className={activeTab === 'all' ? 'active' : ''} onClick={() => setActiveTab('all')}>All</button>
        <button className={activeTab === 'login' ? 'active' : ''} onClick={() => setActiveTab('login')}>Login</button>
        <button className={activeTab === 'suspend' ? 'active' : ''} onClick={() => setActiveTab('suspend')}>Suspend</button>
        <button className={activeTab === 'VerifyUser' ? 'active' : ''} onClick={() => setActiveTab('VerifyUser')}>Verify</button>
        <button className={activeTab === 'create' ? 'active' : ''} onClick={() => setActiveTab('create')}>Created</button>
        <button onClick={() => navigate('/admin/dashboard')} >
          <FontAwesomeIcon icon={faHome} /> HOME
        </button>
      </div>

      <div className="log-search-bar">
        <FontAwesomeIcon icon={faSearch} className="search-icon" />
        <input
          type="text"
          placeholder="Search by email or action..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="loading"><FontAwesomeIcon icon={faSpinner} spin /> Loading logs...</p>
      ) : (
        <div className="log-grid">
          {filteredLogs.map(log => (
            <div key={log.LogID} className="log-card">
              <h4>{log.Email}</h4>
              <p><strong>Action:</strong> {log.ActionType}</p>
              <p><strong>Date:</strong> {new Date(log.Timestamp).toLocaleString()}</p>
              <button onClick={() => setSelectedLog(log)} title="View Details">
                <FontAwesomeIcon icon={faEye} /> View
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedLog && (
        <div className="log-modal">
          <div className="modal-content">
            <button className="close-modal" onClick={() => setSelectedLog(null)}>×</button>
            <h3>Activity Details</h3>
            <p><strong>Email:</strong> {selectedLog.Email}</p>
            <p><strong>Action:</strong> {selectedLog.ActionType}</p>
            <p><strong>Details:</strong> {selectedLog.ActionDetails}</p>
            <p><strong>Date:</strong> {new Date(selectedLog.Timestamp).toLocaleString()}</p>
            {selectedLog.Metadata && (
              <pre className="log-metadata"><strong>Metadata:</strong> {JSON.stringify(selectedLog.Metadata, null, 2)}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
