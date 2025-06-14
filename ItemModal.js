import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faCommentDots,
  faEdit,
  faTrashAlt,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import './styles/ItemManagement.css';
import { useNavigate } from 'react-router-dom';
import ClaimModal from './ClaimModal';
import EditItemModal from './EditItem';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './auth/AuthContext';

const ItemModal = ({ item, onClose, context }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [editedItem, setEditedItem] = useState(item);
  const navigate = useNavigate();
  const { userEmail, user } = useAuth();

  if (!item) return null;

  const handleDelete = async (itemId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/items/delete/${itemId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          actorRole: user?.role || 'user',
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Item deleted successfully.');
        onClose();
      } else {
        toast.error(data.message || 'Failed to delete item.');
      }
    } catch (error) {
      toast.error('An error occurred while deleting the item.');
      console.error(error);
    }
  };

  const handleEditSave = (updated) => {
    setEditedItem(updated);
    setShowEditModal(false);
    toast.success('Item updated successfully!');
  };

  const isAdmin = user?.role === 'admin';
  const isHistory = context === 'history';
  const isDiscover = ['discover', 'use-search'].includes(context);
  const isAdminView = ['admin', 'matches', 'items', 'search'].includes(context);
  const isFoundItem = editedItem.Status?.toLowerCase() === 'found';
  const isLostItem = editedItem.Status?.toLowerCase() === 'lost';

  const canChat = (isAdminView || isDiscover) && editedItem.Email !== userEmail;
  const canClaim = isFoundItem && (isAdminView || isDiscover) && editedItem.Email !== userEmail;
  const canEdit = isAdminView || isHistory;
  const canDelete = isAdminView || isHistory;

  let imageSrc = null;
  try {
    if (editedItem.Picture?.data) {
      const byteArray = new Uint8Array(editedItem.Picture.data);
      const binaryString = byteArray.reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      );
      const base64String = btoa(binaryString);
      imageSrc = `data:image/jpeg;base64,${base64String}`;
    }
  } catch (e) {
    console.warn('Error decoding image:', e);
  }

  return (
    <div className="item-modal-overlay">
      <div className="item-modal">
        <ToastContainer position="top-center" autoClose={8000} hideProgressBar />
        <button className="close-modal" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <h3>{editedItem.ItemName || 'Untitled Item'}</h3>

        {imageSrc && <img src={imageSrc} alt="Item" className="item-modal-image" />}
        <p><strong>Description:</strong> {editedItem.Description || 'N/A'}</p>
        <p><strong>Category:</strong> {editedItem.Category || 'N/A'}</p>
        <p><strong>Location:</strong> {editedItem.Location || 'N/A'}</p>
        <p><strong>Status:</strong> {editedItem.Status || 'N/A'}</p>
        <p><strong>Reported by:</strong> {editedItem.Email || 'N/A'}</p>

        <div className="item-modal-actions">
          {canChat && (
            <button onClick={() => navigate('/chat', { state: { chatUserEmail: editedItem.Email } })}>
              <FontAwesomeIcon icon={faCommentDots} /> Chat
            </button>
          )}
          {canEdit && (
            <button onClick={() => setShowEditModal(true)}>
              <FontAwesomeIcon icon={faEdit} /> Edit
            </button>
          )}
          {canClaim && (
            <button onClick={() => setShowClaimModal(true)}>
              <FontAwesomeIcon icon={faCheckCircle} /> Claim
            </button>
          )}
          {canDelete && (
            <button onClick={() => handleDelete(editedItem.ItemID)}>
              <FontAwesomeIcon icon={faTrashAlt} /> Delete
            </button>
          )}
        </div>

        {showClaimModal && (
          <ClaimModal
            itemID={editedItem.ItemID}
            userEmail={userEmail}
            onClose={() => setShowClaimModal(false)}
            onSubmitted={() => setEditedItem(prev => ({ ...prev, Status: 'Pending' }))}
          />
        )}

        {showEditModal && (
          <EditItemModal
            item={editedItem}
            onClose={() => setShowEditModal(false)}
            onSave={handleEditSave}
          />
        )}
      </div>
    </div>
  );
};

export default ItemModal;
