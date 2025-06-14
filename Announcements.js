import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from './auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBullhorn,
  faPaperPlane,
  faHome
} from '@fortawesome/free-solid-svg-icons';
import './styles/Announcements.css';

const Announcements = () => {
  const { user, isAuthenticated } = useAuth();
  const [message, setMessage] = useState('');
  const [posting, setPosting] = useState(false);
  const navigate = useNavigate();

  if (!isAuthenticated || !user || user.UserType !== 'Staff') {
    navigate('/login');
    return null;
  }

  const handlePost = async () => {
    if (!message.trim()) return;
    const userEmail = user.userEmail;
    setPosting(true);
    try {
      await axios.post('http://localhost:3000/api/announcements/announce', {
        message,
        userEmail
      });

      setMessage('');
      toast.info('Announcement posted to all users!');
    } catch (err) {
      console.error('Error posting announcement:', err);
      toast.error('Failed to post announcement.');
    } finally {
      setPosting(false);
    }
  };


  return (
    <div className='announcement-tab'>
      <ToastContainer position="top-center" autoClose={8000} hideProgressBar />
      <h1><FontAwesomeIcon icon={faBullhorn} />Broadcast</h1>
      <div className="announcements-wrapper">
      <div className="announcements-header">
        <h2><FontAwesomeIcon icon={faBullhorn} /> Post Announcement</h2>
      </div>
      <div className="announcement-input">
        <textarea
          placeholder="Type a new announcement to broadcast to all users..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className="post-btn" onClick={handlePost} disabled={posting}>
          <FontAwesomeIcon icon={faPaperPlane} /> {posting ? 'Posting...' : 'Post'}
        </button>
      </div>

      <div className='other-buttons'>
        <button className="dashboard-btn" onClick={() => navigate('/admin/dashboard')}>
        <FontAwesomeIcon icon={faHome} className="home-icon" /> Dashboard
      </button>
      </div>
    </div>
    </div>
  );
};

export default Announcements;
