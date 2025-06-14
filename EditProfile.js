// EditProfile.js Modal
import React, { useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAuth } from './auth/AuthContext';
import { faSave, faUserEdit, faTimes } from '@fortawesome/free-solid-svg-icons'; 
import './styles/EditProfile.css';

const EditProfile = ({ user, onClose, onSave }) => { // Receive user data, close function, and save function as props
  const [Username, setUsername] = useState(user.Username);
  const [Email, setEmail] = useState(user.Email);
  const [loading, setLoading] = useState(false);
  const [Phone, setPhone] = useState(user.Phone || '');
  const [Residence, setResidence] = useState(user.Residence)
  const [error, setError] = useState(null); // State to handle errors
  const {login} = useAuth();

  const handleSave = async () => { 
    const UserType = user.UserType
    const updatedUser  = { 
      Email,
      Username,
      Phone,
      Residence,
      UserType
    }; // Create updatedUser object with the updated user data
    setLoading(true);
    try {
      // Call the express backend API to update the user profile
      const response = await axios.put('http://localhost:3000/api/user/profile/edit', updatedUser );
      
      if (response.status === 200) {
        onSave(updatedUser ); // Call the save function passed as a prop
        login({ ...user, ...updatedUser }); // Update the user in the AuthContext
        onClose(); // Close the modal
      }
    }
    catch (err) {
      setError(err.response?.data?.message || 'An error occurred while updating the profile.'); // Set the error message if the API call fails
    }
    finally {
        setLoading(false);
      }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="edit-prof-modal-header">
          <FontAwesomeIcon icon={faUserEdit} size="3x" className="edit-icon" />
          <h3>Edit Profile</h3>
        </div>
        {error && <p className="error-message">{error}</p>} {/* Display error message if any */}
        <label>
          Username:
          <input 
            type="text" 
            value={Username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
        </label>
        <label>
          Email:
          <input 
            type="email" 
            value={Email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </label>
        <label>
          Phone:
          <input 
            type="text" 
            value={Phone} 
            onChange={(e) => setPhone(e.target.value)} 
          />
        </label>
        <label>
          Residence:
          <input 
            type="text" 
            value={Residence} 
            onChange={(e) => setResidence(e.target.value)} 
            required 
          />
        </label>
        <div className="modal-buttons">
        <button className="save-btn" onClick={handleSave} disabled={loading}>
            <FontAwesomeIcon icon={faSave} style={{ marginRight: '5px' }} className='save-icon'/>
            {loading ? 'Saving...' : 'Save'}
        </button>
        <button className="cancel-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} style={{ marginRight: '5px' }} className='cancel-icon' />
            Cancel
        </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile; // Export the EditProfile component for use in the user profile page
// This component is used to edit the user's profile information in a modal dialog