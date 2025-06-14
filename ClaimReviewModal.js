// ClaimReviewModal.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faCheckCircle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import './styles/ClaimReviewModal.css';

const ClaimReviewModal = ({ claim, onClose, onAction }) => {
  // Use the same method as ItemModal to convert the binary data
  const renderImageSrc = (pictureField) => {
    if (!pictureField?.data) return null;
    const byteArray = new Uint8Array(pictureField.data);
    const binaryString = byteArray.reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ''
    );
    return `data:image/jpeg;base64,${btoa(binaryString)}`;
  };

  const itemImgSrc     = renderImageSrc(claim.ItemPicture);
  const evidenceImgSrc = renderImageSrc(claim.ClaimEvidence);

  return (
    <div className="review-modal-overlay">
      <div className="review-modal">
        <button className="close-modal" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
        <h2>Review Claim #{claim.ClaimID}</h2>

        <div className="images-compare">
          <div className="img-block">
            <h4>Reported Item</h4>
            {itemImgSrc
              ? <img src={itemImgSrc} alt="Item" />
              : <p>No Image</p>
            }
          </div>
          <div className="img-block">
            <h4>Evidence</h4>
            {evidenceImgSrc
              ? <img src={evidenceImgSrc} alt="Evidence" />
              : <p>No Evidence</p>
            }
          </div>
        </div>

        <div className="claim-details">
          <p><strong>Claimer:</strong> {claim.ClaimerEmail}</p>
          {claim.Message && (
            <p><strong>Note:</strong> {claim.Message}</p>
          )}
          <p><strong>Claimed At:</strong> {new Date(claim.CreatedAt).toLocaleString()}</p>
        </div>

        <div className="modal-actions">
          <button
            className="approve-btn"
            onClick={() => onAction(claim.ClaimID, 'approve')}
          >
            <FontAwesomeIcon icon={faCheckCircle} /> Approve
          </button>
          <button
            className="reject-btn"
            onClick={() => onAction(claim.ClaimID, 'reject')}
          >
            <FontAwesomeIcon icon={faTimesCircle} /> Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClaimReviewModal;
