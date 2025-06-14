import React, { useEffect, useState } from 'react';
import Slider from 'react-slick';
import axios from 'axios';
import './styles/AdminReview.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStar,
  faTrash,
  faUserShield,
  faEnvelope,
  faCommentDots,
  faChartLine,
  faList,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';

const AdminReviewPanel = () => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchAdminReviews();
  }, []);

  const fetchAdminReviews = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/adminSystemReviews');
      setReviews(res.data);
    } catch (err) {
      console.error('Error fetching admin reviews:', err);
    }
  };

  const deleteReview = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await axios.delete(`http://localhost:3000/api/adminSystemReviews/${id}`);
      fetchAdminReviews();
    } catch (err) {
      console.error('Error deleting review:', err);
    }
  };

  const sliderSettings = {
    dots: true,
    infinite: reviews.length > 1,
    speed: 600,
    autoplay: reviews.length > 1,
    autoplaySpeed: 7000,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  // 💡 Calculate average rating
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.Rating, 0) / reviews.length).toFixed(1)
      : 0;

  return (
    <div className="admin-review-section">
      <h2>
        <FontAwesomeIcon icon={faUserShield} className="heading-icon" />
        Admin Review Dashboard
      </h2>

      {/* 💫 Summary Box */}
      <div className="review-summary-box">
        <div className="summary-card">
          <FontAwesomeIcon icon={faChartLine} className="summary-icon" />
          <div>
            <span className="summary-label">Avg Rating</span>
            <span className="summary-value">
              {averageRating} <FontAwesomeIcon icon={faStar} className="star-summary" />
            </span>
          </div>
        </div>
        <div className="summary-card">
          <FontAwesomeIcon icon={faList} className="summary-icon" />
          <div>
            <span className="summary-label">Total Ratings</span>
            <span className="summary-value">{reviews.length}</span>
          </div>
        </div>
        <div className="summary-card">
          <FontAwesomeIcon icon={faUsers} className="summary-icon" />
          <div>
            <span className="summary-label">Total Reviews</span>
            <span className="summary-value">{reviews.length}</span>
          </div>
        </div>
      </div>

      <div className="slider-container">
        <Slider {...sliderSettings}>
          {reviews.map((rev) => (
            <div key={rev.ReviewID} className="review-card">
              <div className="review-stars">
                {Array.from({ length: rev.Rating }, (_, i) => (
                  <FontAwesomeIcon icon={faStar} key={i} className="star-filled" />
                ))}
              </div>
              <div className="review-content">
                <div className="review-user-info">
                  <FontAwesomeIcon icon={faUserShield} className="review-user-icon" />
                  <span className="review-user">{rev.Username}</span>
                  <FontAwesomeIcon icon={faEnvelope} className="review-email-icon" />
                  <span className="review-email">{rev.Email}</span>
                </div>
                <FontAwesomeIcon icon={faCommentDots} className="review-comment-icon" />
                <p className="review-comment">"{rev.Comment}"</p>
                <span className="review-date">
                  {new Date(rev.CreatedAt).toLocaleString()}
                </span>
                <button
                  className="delete-btn"
                  onClick={() => deleteReview(rev.ReviewID)}
                >
                  <FontAwesomeIcon icon={faTrash} /> Delete
                </button>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default AdminReviewPanel;
