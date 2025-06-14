import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faUpload, faCommentDots, faCheckCircle, faTimes, faHistory, faSearch, faHome } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from './auth/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import ItemModal from './ItemModal';
import ClaimModal from './ClaimModal';
import 'react-toastify/dist/ReactToastify.css';
import './styles/ItemForm.css';

const ItemFormTabs = () => {
  const { userEmail, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // 🔐 Redirect if user is not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const [activeTab, setActiveTab] = useState('lost');
  const [itemData, setItemData] = useState({
    itemName: '',
    description: '',
    category: '',
    location: '',
    image: null,
  });

  const [matchedItem, setMatchedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:3000/api/items/history/${userEmail}`);
      setHistory(res.data);
    } catch (err) {
      toast.error("Failed to fetch history");
    }
  }, [userEmail]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setItemData({ ...itemData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }
    setItemData({ ...itemData, image: file });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const status = activeTab === 'lost' ? 'Lost' : 'Found';

    if (!itemData.itemName || !itemData.location || !itemData.description) {
      toast.warning("Please fill in all required fields!");
      return;
    }

    const formData = new FormData();
    Object.entries(itemData).forEach(([key, value]) => formData.append(key, value));
    formData.append('status', status);
    formData.append('userEmail', userEmail);

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/api/items', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(response.data.message || "Item reported successfully!");

      if (response.data.matchedItems && response.data.matchedItems.length > 0) {
        setMatchedItem(response.data.matchedItems);
        setShowModal(true);
      }

      setItemData({ itemName: '', description: '', category: '', location: '', image: null });

    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit item");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setMatchedItem(null);
  }

  const handleChat = (receiverEmail) => {
    navigate('/chat', { state: { chatUserEmail: receiverEmail } });
  };

  const renderTabContent = () => {
    if (activeTab === 'history') {
      return (
        <div className="history-container">
          <h3><FontAwesomeIcon icon={faHistory} /> Your Report History</h3>
          <div className="history-grid">
            {history.length === 0 ? (
              <p>No items reported yet.</p>
            ) : (
              history.map(item => {
                let imageUrl = null;
                if (item.Picture?.data) {
                  const blob = new Blob([new Uint8Array(item.Picture.data)], { type: 'image/jpeg' });
                  imageUrl = URL.createObjectURL(blob);
                }

                return (
                  <div key={item.ItemID} className="items-history-card" onClick={() => setSelectedItem(item)}>
                    {imageUrl && <img src={imageUrl} alt="Reported Item" className="history-image" />}
                    <p><strong>{item.ItemName}</strong> ({item.Status})</p>
                    <p>{item.Description}</p>
                    <p><em>Location: {item.Location}</em></p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="item-form">
        <input type="text" name="itemName" placeholder="Item Name" value={itemData.itemName} onChange={handleChange} required />
        <textarea name="description" placeholder="Description" value={itemData.description} onChange={handleChange} required />
        <input type="text" name="category" placeholder="Category" value={itemData.category} onChange={handleChange} />
        <input type="text" name="location" placeholder="Location Found/Lost" value={itemData.location} onChange={handleChange} required />
        <label className="upload-label">
          <FontAwesomeIcon icon={faUpload} /> Upload Image
          <input type="file" onChange={handleFileChange} accept="image/*" hidden />
        </label>
        {itemData.image && <img src={URL.createObjectURL(itemData.image)} alt="Preview" className="image-preview" />}
        <button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</button>
      </form>
    );
  };

  return (
    <div className='reports'>
      <div className="item-form-container">
        <ToastContainer position="top-center" autoClose={8000} hideProgressBar />
        <div className="user-tabs">
          <button onClick={() => navigate('/home')} className="item-home-btn">
            <FontAwesomeIcon icon={faHome} className='homed-icon' style={{ marginRight: '5px' }} />HOME
          </button>
          <button className={`items-tab-button ${activeTab === 'lost' ? 'active' : ''}`} onClick={() => setActiveTab('lost')}>
            <FontAwesomeIcon icon={faPlusCircle} /> Lost
          </button>
          <button className={`items-tab-button ${activeTab === 'found' ? 'active' : ''}`} onClick={() => setActiveTab('found')}>
            <FontAwesomeIcon icon={faSearch} /> Found
          </button>
          <button className={`items-tab-button ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            <FontAwesomeIcon icon={faHistory} /> History
          </button>
        </div>

        <div className="report-tab-content">{renderTabContent()}</div>

        {selectedItem && (
          <ItemModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onChat={handleChat}
            showActions={true}
            context = {activeTab}
          />
        )}

        {showModal && matchedItem && matchedItem.length > 0 && (
          <div className="match-modal-overlay">
            <div className="match-modal">
              <button className="close-modal" onClick={() => setShowModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
              <h3>Potential Matches Found!</h3>
              {matchedItem.map((item, index) => {
                const base64Image = item.Picture?.data
                  ? `data:image/jpeg;base64,${Buffer.from(item.Picture.data).toString('base64')}`
                  : null;

                return (
                  <div key={index} className="matched-item">
                    {base64Image && <img src={base64Image} alt="Matched Item" className="matched-image" />}
                    <p><strong>Item:</strong> {item.ItemName}</p>
                    <p><strong>Description:</strong> {item.Description}</p>
                    <p><strong>Category:</strong> {item.Category}</p>
                    <p><strong>Location:</strong> {item.Location}</p>
                    <p><strong>Status:</strong> {item.Status}</p>
                    <p><strong>Reported by:</strong> {item.Email}</p>
                    <hr />
                    <div className='item-modal-actions'>
                      <button onClick={() => handleChat(item.Email)}>
                      <FontAwesomeIcon icon={faCommentDots} /> Chat Now
                    </button>
                    <button onClick={() => handleCloseModal()}>
                      <FontAwesomeIcon icon={faTimes} /> Close
                    </button>
                    <button onClick={() => setShowClaimModal(true)}>
                      <FontAwesomeIcon icon={faCheckCircle} /> Claim
                    </button>
                    </div>
                    <hr />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {showClaimModal && (
        <ClaimModal
          itemID={matchedItem.ItemID}
          userEmail={userEmail}
          onClose={() => setShowClaimModal(false)}
        />
      )}
    </div>
  );
};

export default ItemFormTabs;
 // Export the ItemFormTabs component for use in in reporting and viewing history in the app
// This component allows users to report lost or found items, view their report history, and see potential matches for their reported items.
//  It uses React hooks for state management and axios for API calls, along with FontAwesome icons for UI elements. 
// The component also includes form validation and error handling using react-toastify for notifications.
