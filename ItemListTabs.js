// Discover and search
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faList, faHome } from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import ItemModal from './DiscoverItem';
import { useAuth } from './auth/AuthContext';
import 'react-toastify/dist/ReactToastify.css';
import './styles/ItemListTabs.css';

const ItemListTabs = () => {
  const [activeTab, setActiveTab] = useState('lost');
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [searchName, setSearchName] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Access Denied! Please log in to access your profile');
      navigate('/login');
      return;
    }
    fetchItems();
    setActiveTab('discover');
  }, [isAuthenticated, navigate]);

  const fetchItems = async () => {
    try {
      const lostRes = await axios.get('http://localhost:3000/api/items/lost');
      const foundRes = await axios.get('http://localhost:3000/api/items/found');
      setLostItems(lostRes.data);
      setFoundItems(foundRes.data);
    } catch (err) {
      toast.error('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchName.trim() && !searchCategory.trim() && !searchLocation.trim()) {
      toast.warning('Please enter at least one search filter!');
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3000/api/items/search', {
        params: {
          name: searchName,
          category: searchCategory,
          location: searchLocation
        }
      });
      setSearchResults(res.data);
      if (res.data.length === 0) {
        toast.info('No items found matching your search criteria.');
      }
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChat = (email) => navigate('/chat', { state: { chatUserEmail: email } });


  const renderItems = () => {
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
  };

  return (
    <div className='reports'>
      <div className="discover-form-container">
        <ToastContainer position="top-center" autoClose={8000} hideProgressBar />
        <h1 className="banner">
          <div className="user-tabs">
            <button onClick={() => navigate('/home')} className="discover-tab-button">
              <FontAwesomeIcon icon={faHome} /> GO HOME
            </button>
            <button className={`discover-tab-button ${activeTab === 'discover' ? 'active' : ''}`} onClick={() => setActiveTab('discover')}>
              <FontAwesomeIcon icon={faList} /> Items
            </button>
            <button className={`discover-tab-button ${activeTab === 'user-search' ? 'active' : ''}`} onClick={() => setActiveTab('user-search')}>
              <FontAwesomeIcon icon={faSearch} /> Search
            </button>
          </div>
        </h1>

        <div className="discover-tab-content">
          {activeTab === 'discover' && renderItems()}
          {activeTab === 'user-search' && (
            <div className="search-tab">
              <form onSubmit={handleSearch} className="search-form">
                <input type="text" placeholder="Item Name" value={searchName} onChange={e => setSearchName(e.target.value)} />
                <input type="text" placeholder="Category" value={searchCategory} onChange={e => setSearchCategory(e.target.value)} />
                <input type="text" placeholder="Location" value={searchLocation} onChange={e => setSearchLocation(e.target.value)} />
                <button type="submit" id='search-btn' disabled={loading}>
                  <FontAwesomeIcon icon={faSearch} />
                  {loading? 'Searching' : 'Search'}
                </button>
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
          )}
        </div>

        {selectedItem && (
          <ItemModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onChat={handleChat}
            showActions={true}
            context = {activeTab}
          />
        )}

      </div>
    </div>
  );
};

export default ItemListTabs;