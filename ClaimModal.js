// ClaimModal.js
import React, { useState } from 'react';
import axios from 'axios';
import { faTimes, faUpload, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './styles/ClaimModal.css';
import { useAuth } from './auth/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { wait } from '@testing-library/user-event/dist/utils';

const ClaimModal = ({ itemID, userEmail, onClose, onSubmitted }) => {
  const [message, setMessage] = useState('');
  const { isAuthenticated } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!isAuthenticated || !userEmail) {
          toast.error('You must be logged in to claim an item.');
          return;
    }
    if (!message && !file) {
      toast.error('Please provide a message or upload evidence.');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('ClaimerEmail', userEmail);
      form.append('Message', message);
      if (file) form.append('evidence', file);

      const res = await axios.post(
        `http://localhost:3000/api/items/${itemID}/claim`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      toast.success(res.data.message);
      onSubmitted();  // let parent refresh status
      wait(3000);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Claim failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="claim-modal-overlay">
      <div className="claim-modal">
        <ToastContainer position="top-center" autoClose={5000} hideProgressBar />
        <button className="close-modal" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
        <h3>Submit a Claim</h3>
        <textarea
          placeholder="Add a note to help verify ownership..."
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <label className="upload-label">
          <FontAwesomeIcon icon={faUpload} /> Upload Evidence
          <input
            type="file"
            accept="image/*"
            onChange={e => setFile(e.target.files[0])}
            hidden
          />
        </label>
        {file && <p>Selected: {file.name}</p>}
        <button onClick={handleSubmit} disabled={loading}>
          <FontAwesomeIcon icon={faPaperPlane} /> {loading ? 'Submitting...' : 'Submit Claim'}
        </button>
      </div>
    </div>
  );
};

export default ClaimModal;