// ClaimManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  faCheckCircle,
  faTimesCircle,
  faHome,
  faSpinner,
  faClipboardList,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import ClaimReviewModal from './ClaimReviewModal';
import './styles/ClaimManagement.css';

const ClaimManagement = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('pending');
  const [claims, setClaims]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState(null);

  // fetch claims by status
  const fetchClaims = useCallback(async (status) => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/claims', {
        params: { status }
      });
      setClaims(res.data);
    } catch {
      toast.error('Failed to load claims');
    } finally {
      setLoading(false);
    }
  }, []);

  // initial auth & data load
  useEffect(() => {
    if (!isAuthenticated) return navigate('/login');
    if (!user || user.UserType !== 'Staff') return navigate('/unauthorized');
    fetchClaims(activeTab);
  }, [activeTab, fetchClaims, isAuthenticated, user, navigate]);

  // table click opens the review modal
  const openReview = (claim) => setSelected(claim);

  // approve/reject directly from modal
  const handleAction = async (claimId, action) => {
    setLoading(true);
    try {
      await axios.put(`http://localhost:3000/api/claims/${claimId}`, {
        action,
        ModeratorEmail: user?.Email
      });

      toast.success(`Claim ${action}d.`);
      setSelected(null);
      fetchClaims(activeTab);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} claim`);
    } finally {
      setLoading(false);
    }
  };

  // render table rows
  const renderClaims = () => {
    if (loading) {
      return <p><FontAwesomeIcon icon={faSpinner} spin /> Loading…</p>;
    }
    if (!claims.length) {
      return <p>No {activeTab} claims.</p>;
    }
    return (
      <table className="claims-table">
        <thead>
          <tr>
            <th>Claim ID</th>
            <th>Item</th>
            <th>Claimer</th>
            <th>Claimed At</th>
            <th>Status</th>
            {activeTab === 'pending' && <th>Review</th>}
          </tr>
        </thead>
        <tbody>
          {claims.map(c => (
            <tr key={c.ClaimID}>
              <td>{c.ClaimID}</td>
              <td>{c.ItemName} (#{c.ItemID})</td>
              <td>{c.ClaimerEmail}</td>
              <td>{new Date(c.CreatedAt).toLocaleString()}</td>
              <td>{c.ClaimStatus}</td>
              {activeTab === 'pending' && (
                <td>
                  <button
                    className="review-btn"
                    onClick={() => openReview(c)}
                  >
                    Review
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="claim-management">
      <ToastContainer position="top-center" autoClose={5000} hideProgressBar />
      <div className="claim-tabs">
        <button
          className={activeTab==='pending'?'active':''}
          onClick={() => setActiveTab('pending')}
        >
          <FontAwesomeIcon icon={faClipboardList} /> Pending
        </button>
        <button
          className={activeTab==='approved'?'active':''}
          onClick={() => setActiveTab('approved')}
        >
          <FontAwesomeIcon icon={faCheckCircle} /> Approved
        </button>
        <button
          className={activeTab==='rejected'?'active':''}
          onClick={() => setActiveTab('rejected')}
        >
          <FontAwesomeIcon icon={faTimesCircle} /> Rejected
        </button>
        <button
          className="dashboard-btn"
          onClick={() => navigate(user.UserType==='Staff'?'/admin/dashboard':'/home')}
        >
          <FontAwesomeIcon icon={faHome} /> Home
        </button>
      </div>
      <div className="claim-content">{renderClaims()}</div>

      {selected && (
        <ClaimReviewModal
          claim={selected}
          onClose={() => setSelected(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
};

export default ClaimManagement;
