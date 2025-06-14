import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faUpload, faCommentDots, faTimes, faBoxOpen, faSlidersH,
    faPuzzlePiece, faHistory, faSearch, faHome, faBoxes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from './auth/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import ItemModal from './ItemModal';
import './styles/ItemManagement.css'

const ItemManagement = () => {
  const { user, userEmail, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/unauthorized');
    }
  }, [isAdmin, navigate]);

  const thresholdOptions = Array.from({ length: 11 }, (_, i) => 50 + i * 5); // [50, 55, ..., 100]
  const [threshold, setThreshold] = useState(75); // default 75%
  const [activeTab, setActiveTab] = useState('lost');
  const [itemData, setItemData] = useState({ itemName: '', description: '', category: '', location: '', image: null });
  const [matchedItem, setMatchedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [searchName, setSearchName] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [matches, setMatches] = useState([]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:3000/api/items/history/${userEmail}`);
      setHistory(res.data);
    } catch {
      toast.error("Failed to fetch history");
    }
  }, [userEmail]);

  const fetchAllItems = useCallback(async () => {
    try {
      const lostRes = await axios.get('http://localhost:3000/api/items/lost');
      const foundRes = await axios.get('http://localhost:3000/api/items/found');
      setLostItems(lostRes.data);
      setFoundItems(foundRes.data);
    } catch {
      toast.error('Failed to fetch items');
    }
  }, []);

  
  const fetchMatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3000/api/items/matches?threshold=${threshold}`);
      setMatches(res.data);
    } catch {
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  }, [threshold]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);


  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
    if (activeTab === 'items') fetchAllItems();
    if (activeTab === 'matches') fetchMatches();
  }, [activeTab, fetchHistory, fetchAllItems, fetchMatches]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchName && !searchCategory && !searchLocation) {
      toast.warning('Enter at least one search filter');
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3000/api/items/search', {
        params: { name: searchName, category: searchCategory, location: searchLocation }
      });
      setSearchResults(res.data);
      if (res.data.length === 0) toast.info('No items found');
    } catch {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const status = activeTab === 'lost' ? 'Lost' : 'Found';

    if (!itemData.itemName || !itemData.location || !itemData.description) {
      toast.warning("Fill all required fields");
      return;
    }

    const formData = new FormData();
    Object.entries(itemData).forEach(([k, v]) => formData.append(k, v));
    formData.append('status', status);
    formData.append('userEmail', userEmail);

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/api/items', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(response.data.message || "Item reported successfully!");
      if (response.data.matchedItems?.length > 0) {
        setMatchedItem(response.data.matchedItems);
        setShowModal(true);
      }
      setItemData({ itemName: '', description: '', category: '', location: '', image: null });
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChat = (email) => navigate('/chat', { state: { chatUserEmail: email } });


  const renderTabContent = () => {
    if (activeTab === 'history') {
      return (
        <div className="admin-history">
          <h3><FontAwesomeIcon icon={faHistory} /> Your Report History</h3>
          <div className="admin-history-grid">
            {history.length === 0 ? <p>No items reported yet.</p> : history.map(item => {
              let imageUrl = item.Picture?.data ? URL.createObjectURL(new Blob([new Uint8Array(item.Picture.data)], { type: 'image/jpeg' })) : null;
              return (
                <div key={item.ItemID} className="history-card" onClick={() => setSelectedItem(item)}>
                  {imageUrl && <img src={imageUrl} alt="Reported Item" className="history-image" />}
                  <p><strong>{item.ItemName}</strong> ({item.Status})</p>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (activeTab === 'matches') {
      return (
        <div className="matches-tab">
          <h3><FontAwesomeIcon icon={faPuzzlePiece} /> Current Matches</h3>
          <div className="threshold-selector">
          <label>
            <FontAwesomeIcon icon={faSlidersH} /> Match Threshold:&nbsp;
            <select value={threshold} onChange={e => setThreshold(Number(e.target.value))}>
              {thresholdOptions.map(val => (
                <option key={val} value={val}>{val}%</option>
              ))}
            </select>
          </label>
        </div>

          {loading ? (
            <p><FontAwesomeIcon icon={faSpinner} /> Loading...</p>
          ) : matches.length === 0 ? (
            <p>No matches found yet.</p>
          ) : (
            <div className="matches-grid">
              {matches.map(group => {
                const groupImageUrl = group.item.Picture?.data
                  ? URL.createObjectURL(new Blob([new Uint8Array(group.item.Picture.data)], { type: 'image/jpeg' }))
                  : null;

                return (
                  <div key={group.item.ItemID} className="match-group">
                    <div className="history-card" onClick={() => setSelectedItem(group.item)}>
                      {groupImageUrl && (
                        <img
                          src={groupImageUrl}
                          alt="Reported Item"
                          className="history-image"
                        />
                      )}
                      <p><strong>{group.item.ItemName}</strong> ({group.item.Status})</p>
                      <p><em>{group.item.Location}</em></p>
                    </div>

                    <div className="match-list">
                      {group.matches.map(m => {
                        const imageUrl = m.Picture?.data
                          ? URL.createObjectURL(new Blob([new Uint8Array(m.Picture.data)], { type: 'image/jpeg' }))
                          : null;

                        return (
                          <div key={m.ItemID} className="history-card" onClick={() => setSelectedItem(m)}>
                            {imageUrl && (
                              <img
                                src={imageUrl}
                                alt="Matched Item"
                                className="history-image"
                              />
                            )}
                            <p><strong>{m.ItemName}</strong> ({m.Status})</p>
                            <p><em>{m.Location}</em></p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }



    if (activeTab === 'items') {
      return (
        <div className="item-list-container">
          {/* Lost Items Section */}
          <div className="item-category-section">
            <h4>Lost Items</h4>
            <div className="management-item-grid">
              {lostItems.map(item => {
                let imageSrc = null;
                if (item.Picture?.data) {
                  const byteArray = new Uint8Array(item.Picture.data);
                  const binaryString = byteArray.reduce((data, byte) => data + String.fromCharCode(byte), '');
                  const base64String = btoa(binaryString);
                  imageSrc = `data:image/jpeg;base64,${base64String}`;
                }

                return (
                  <div key={item.ItemID} className="management-item-card" onClick={() => setSelectedItem(item)}>
                    {imageSrc && <img src={imageSrc} alt="Item" className="item-card-image" />}
                    <p><strong>{item.ItemName}</strong> ({item.Status})</p>
                    <p><em>Location: {item.Location}</em></p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Found Items Section */}
          <div className="item-category-section">
            <h4>Found Items</h4>
            <div className="management-item-grid">
              {foundItems.map(item => {
                let imageSrc = null;
                if (item.Picture?.data) {
                  const byteArray = new Uint8Array(item.Picture.data);
                  const binaryString = byteArray.reduce((data, byte) => data + String.fromCharCode(byte), '');
                  const base64String = btoa(binaryString);
                  imageSrc = `data:image/jpeg;base64,${base64String}`;
                }

                return (
                  <div key={item.ItemID} className="management-item-card" onClick={() => setSelectedItem(item)}>
                    {imageSrc && <img src={imageSrc} alt="Item" className="item-card-image" />}
                    <p><strong>{item.ItemName}</strong> ({item.Status})</p>
                    <p><em>Location: {item.Location}</em></p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );


    }

    if (activeTab === 'search') {
      return (
        <div className="search-tab">
          <form onSubmit={handleSearch} className="search-form">
            <input type="text" placeholder="Item Name" value={searchName} onChange={e => setSearchName(e.target.value)} />
            <input type="text" placeholder="Category" value={searchCategory} onChange={e => setSearchCategory(e.target.value)} />
            <input type="text" placeholder="Location" value={searchLocation} onChange={e => setSearchLocation(e.target.value)} />
            <button type="submit" id='search-btn'><FontAwesomeIcon icon={faSearch} /> Search</button>
          </form>
          <div className="search-item-grid">
            {searchResults.map(item => (
              <div key={item.ItemID} className="search-item-card" onClick={() => setSelectedItem(item)}>
                {item.Picture?.data && (
                  <img
                    src={URL.createObjectURL(new Blob([new Uint8Array(item.Picture.data)], { type: 'image/jpeg' }))}
                    alt="Item"
                    className="item-card-image"
                  />
                )}
                <p><strong>{item.ItemName}</strong> ({item.Status})</p>
                <p><em>Location: {item.Location}</em></p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className='report-tab'>
        <h3>Fill in item details</h3>
        <form onSubmit={handleSubmit} className="report-item-form">
          <input type="text" name="itemName" placeholder="Item Name" value={itemData.itemName} onChange={e => setItemData({ ...itemData, itemName: e.target.value })} required />
          <textarea name="description" placeholder="Description" value={itemData.description} onChange={e => setItemData({ ...itemData, description: e.target.value })} required />
          <input type="text" name="category" placeholder="Category" value={itemData.category} onChange={e => setItemData({ ...itemData, category: e.target.value })} />
          <input type="text" name="location" placeholder="Location Found/Lost" value={itemData.location} onChange={e => setItemData({ ...itemData, location: e.target.value })} required />
          <label className="upload-label">
            <FontAwesomeIcon icon={faUpload} /> Upload Image
            <input type="file" onChange={e => setItemData({ ...itemData, image: e.target.files[0] })} accept="image/*" hidden />
          </label>
          {itemData.image && <img src={URL.createObjectURL(itemData.image)} alt="Preview" className="image-preview" />}
          <button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</button>
        </form>
      </div>
    );
  };

  return (
    <div className='discover'>
      <div className="discover-form-container">
        <ToastContainer position="top-center" autoClose={8000} hideProgressBar />
        <header className="item-um-header">
          <h2><FontAwesomeIcon icon={faBoxOpen} /> Item Management</h2>
        </header>
        <div className="admin-discover-tab-buttons">
          <button onClick={() => navigate('/admin/dashboard')}>
            <FontAwesomeIcon icon={faHome} /> HOME
          </button>
          <button onClick={() => setActiveTab('lost')}><FontAwesomeIcon icon={faPlusCircle} /> Lost</button>
          <button onClick={() => setActiveTab('found')}><FontAwesomeIcon icon={faSearch} /> Found</button>
          <button onClick={() => setActiveTab('history')}><FontAwesomeIcon icon={faHistory} /> History</button>
          <button onClick={() => setActiveTab('items')}><FontAwesomeIcon icon={faBoxes} /> Items</button>
          <button onClick={() => setActiveTab('search')}><FontAwesomeIcon icon={faSearch} /> Search</button>
          <button onClick={() => setActiveTab('matches')}><FontAwesomeIcon icon={faPuzzlePiece} /> Match</button>
        </div>
        <div className="item-management-tab-content">{renderTabContent()}</div>

        {selectedItem && (
          <ItemModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onChat={handleChat}
            showActions={true}
            context = {activeTab}
          />
        )}

        {showModal && matchedItem?.length > 0 && (
          <div className="match-modal-overlay">
            <div className="match-modal">
              <button className="close-modal" onClick={() => setShowModal(false)}><FontAwesomeIcon icon={faTimes} /></button>
              <h3>Potential Matches Found!</h3>
              {matchedItem.map((item, i) => {
                const base64Image = item.Picture?.data ? `data:image/jpeg;base64,${Buffer.from(item.Picture.data).toString('base64')}` : null;
                return (
                  <div key={i} className="matched-item">
                    {base64Image && <img src={base64Image} alt="Matched Item" className="matched-image" />}
                    <p><strong>Item:</strong> {item.ItemName}</p>
                    <p><strong>Description:</strong> {item.Description}</p>
                    <p><strong>Category:</strong> {item.Category}</p>
                    <p><strong>Location:</strong> {item.Location}</p>
                    <p><strong>Status:</strong> {item.Status}</p>
                    <p><strong>Reported by:</strong> {item.Email}</p>
                    <hr />
                    <button className="chat-button" onClick={() => handleChat(item.Email)}><FontAwesomeIcon icon={faCommentDots} /> Chat Now</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemManagement;
