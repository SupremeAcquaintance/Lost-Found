// ItemModal.js
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faCommentDots,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import './styles/ItemManagement.css';
import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import ClaimModal from './ClaimModal';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './auth/AuthContext';

const ItemModal = ({ item, onClose, onChat, onDelete, onEdit }) => {
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [editedItem, setEditedItem] = useState(item);
  const navigate = useNavigate();
  const { userEmail } = useAuth(); // get user email from AuthContext

  if (!item) return null;

  let imageSrc = null;
  if (editedItem.Picture?.data) {
    const byteArray = new Uint8Array(editedItem.Picture.data);
    const binaryString = byteArray.reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ''
    );
    const base64String = btoa(binaryString);
    imageSrc = `data:image/jpeg;base64,${base64String}`;
  }

  return (
    <div className="item-modal-overlay">
      <div className="item-modal">

        <button className="close-modal" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <h3>{editedItem.ItemName}</h3>
        {imageSrc && <img src={imageSrc} alt="Item" className="item-modal-image" />}
        <p><strong>Category:</strong> {editedItem.Category}</p>
        <p><strong>Status:</strong> {editedItem.Status}</p>
        <p><strong>Reported by:</strong> {editedItem.Email}</p>

        <div className="item-modal-actions">
            <button onClick={() => navigate('/chat', { state: { chatUserEmail: editedItem.Email } })}>
                <FontAwesomeIcon icon={faCommentDots} /> Chat
            </button>
            <button onClick={() => setShowClaimModal(true)}>
                <FontAwesomeIcon icon={faCheckCircle} /> Claim
            </button>
        </div>
        {showClaimModal && (
          <ClaimModal
            itemID={item.ItemID}
            userEmail={userEmail}
            onClose={() => setShowClaimModal(false)}
            onSubmitted={() => setEditedItem(prev => ({ ...prev, Status: 'Pending' }))}
          />
        )}

      </div>
    </div>
  );
};

export default ItemModal;
