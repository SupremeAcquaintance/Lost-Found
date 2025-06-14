//Welcome.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faClipboardList, faUser, faStar, faBell, faComments, faCog } from '@fortawesome/free-solid-svg-icons'; // Import the user icon
import './styles/Welcome.css'; // Import the CSS file for styling

const Welcome = () => {
  return (
    <main className="welcome-page">
      <header className="welcome-hero-section">
      <h1>Welcome to Campus Lost and Found</h1>
        <p>Here to present your centralized solution for reporting and recovering lost items!</p>
        <p>
          Join our community where lost items find their way back home. Whether you’ve misplaced your laptop, your key or found a wallet, or someone's ID, our platform connects you with fellow students and staff to ensure that lost belongings are reunited with their rightful owners. 
        </p>
        <Link to="/register" className="getstarted-btn">Get Started</Link>
      </header>

      <section className="welcome-features">
        <div className="welcome-feature-list">
          <div className="feature">
            <Link to='/login' className="feature-link">
              <FontAwesomeIcon icon={faSearch} className='feature-icon' size="2x" />
              <h3>Search for Lost Items</h3>
              <p>Quickly find items reported lost by others.</p>
              </Link>
          </div>
          <div className="feature">
            <Link to='/login' className="feature-link">
                <FontAwesomeIcon icon={faUser} className='feature-icon' size="2x" /> {/* User icon for View Profile */}
                <h3>View Profile</h3>
                <p>Access and manage your profile information.</p>
            </Link>
          </div>
          <div className="feature">
            <Link to='/login' className="feature-link">
              <FontAwesomeIcon icon={faClipboardList} className='feature-icon' size="2x" />
              <h3>Report Found Items</h3>
              <p>Easily report items you’ve found to help others.</p>
            </Link>
          </div>
          <div className="feature">
            <Link to='/login' className="feature-link">
              <FontAwesomeIcon icon={faBell} className='feature-icon' size="2x" />
              <h3>Notifications</h3>
              <p>Receive alerts when items matching your search are reported.</p>
            </Link>
          </div>
          <Link to='/login' className="feature-link">
            <div className="feature">
              <FontAwesomeIcon icon={faComments} className='feature-icon' size="2x" />
              <h3>Chat</h3>
            </div>
          </Link>
          <div className="feature">
            <Link to='/login' className="feature-link">
              <FontAwesomeIcon icon={faCog} className='feature-icon' size="2x" />
              <h3>Settings</h3>
              <p>Customize your preferences and manage your account settings.</p>
            </Link>
          </div>
          <Link to='/login' className="feature-link">
            <div className="feature">
              <FontAwesomeIcon icon={faStar} className="feature-icon" size="3x" />
              <h3>Review</h3>
              <p>Rate, review and comment the lost and found app.</p>
            </div>
          </Link>
        </div>
      </section>
      <div className="footer">
        <p>&copy; {new Date().getFullYear()} Campus Lost and Found. Created by Group 6. All rights reserved.</p>
      </div>
    </main>
  );
};

export default Welcome;