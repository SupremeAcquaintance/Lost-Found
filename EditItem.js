// components/EditItemModal.js
import React, { useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes, faEdit } from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/EditItem.css';
import { useAuth } from './auth/AuthContext';

const EditItemModal = ({ item, onClose, onSave }) => {
  const [ItemName, setItemName] = useState(item.ItemName);
  const [Description, setDescription] = useState(item.Description);
  const [Category, setCategory] = useState(item.Category);
  const [Location, setLocation] = useState(item.Location);
  const [Status, setStatus] = useState(item.Status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const {user} = useAuth();

  const handleSave = async () => {
    const updatedItem = {
      ItemID: item.ItemID,
      ItemName,
      Description,
      Category,
      Location,
      Status,
      userEmail: user.userEmail
    };

    setLoading(true);
    try {
      const response = await axios.put(`http://localhost:3000/api/items/${item.ItemID}`, updatedItem);
      if (response.status === 200) {
        toast.success('Report updated successfully!');
        onSave(updatedItem);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update item.');
      toast.error('Failed to update Report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <ToastContainer position="top-center" autoClose={8000} hideProgressBar />
      <div className="modal-content">
        <div className="modal-header">
          <h3><FontAwesomeIcon icon={faEdit} size="2x" /> Edit Item</h3>
        </div>

        {error && <p className="error-message">{error}</p>}

        <label>Item Name:</label>
        <input type="text" value={ItemName} onChange={(e) => setItemName(e.target.value)} required />

        <label>Description:</label>
        <textarea value={Description} onChange={(e) => setDescription(e.target.value)} required />

        <label>Category:</label>
        <input type="text" value={Category} onChange={(e) => setCategory(e.target.value)} required />

        <label>Location:</label>
        <input type="text" value={Location} onChange={(e) => setLocation(e.target.value)} required />

        <label>Status:</label>
        <select value={Status} onChange={(e) => setStatus(e.target.value)} required>
          <option value="Lost">Lost</option>
          <option value="Found">Found</option>

        </select>
        <hr/>
        <div className="modal-buttons">
          <button className="save-btn" onClick={handleSave} disabled={loading}>
            <FontAwesomeIcon icon={faSave} /> {loading ? 'Saving...' : 'Save'}
          </button>
          <button className="cancel-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} /> Cancel
          </button>
        </div>
        <hr/>
      </div>
    </div>
  );
};

export default EditItemModal;
