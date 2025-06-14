import React, { useEffect, useState, useMemo } from 'react';
import Slider from 'react-slick';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStar,
  faUser,
  faHome,
  faUpload,
  faCommentDots,
} from '@fortawesome/free-solid-svg-icons';
import './styles/Review.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useAuth } from './auth/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const SystemReview = () => {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/system-reviews');
      setReviews(res.data);
    } catch (err) {
      toast.error('Error fetching reviews:', err);
    }
  };

  const submitReview = async () => {
    if (!rating) return toast.error('Please provide a rating.');

    try {
      await axios.post('http://localhost:3000/api/system-reviews', {
        email: user?.Email,
        rating,
        comment,
      });
      toast.info("Review sumbitted!")
      setRating(0);
      setComment('');
      fetchReviews();
    } catch (err) {
      toast.error('Error submitting review:', err);
    }
  };

  const sliderSettings = useMemo(() => {
    return {
      dots: false,
      infinite: true,
      autoplay: true,
      speed: 5000,
      autoplaySpeed: 5000,
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: false,
      pauseOnHover: true,
    };
  },

);

  const paddedReviews = useMemo(() => {
    const minSlides = sliderSettings.slidesToShow || 3;
    const filled = [...reviews];
    const placeholdersNeeded = Math.max(0, minSlides - filled.length);
    for (let i = 0; i < placeholdersNeeded; i++) {
      filled.push({
        ReviewID: `placeholder-${i}`,
        Rating: 0,
        Username: '',
        Comment: 'No reviews yet — be the first to share your experience!',
        CreatedAt: null,
        isPlaceholder: true,
      });
    }
    return filled;
  }, [reviews, sliderSettings.slidesToShow]);

  return (
    <div className="review-section">
      <ToastContainer />
      <div className='that-home-button'>
        <button onClick={() => navigate('/home')}>
          <FontAwesomeIcon icon={faHome} /> HOME
        </button>
      </div>
      <div className='rate-n-review'>
        <h2>
          <FontAwesomeIcon icon={faStar} className="heading-icon" />Rate Lost & Found System<FontAwesomeIcon icon={faStar} className="heading-icon" />
        </h2>

        <div className="rating-form">
          {[1, 2, 3, 4, 5].map((star) => (
            <FontAwesomeIcon
              key={star}
              icon={faStar}
              className={`star-icon ${star <= rating ? 'selected' : ''}`}
              onClick={() => setRating(star)}
            />
          ))}
          <textarea
            placeholder="Write your comment here...(OPTIONAL!)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button onClick={submitReview}>
            <FontAwesomeIcon icon={faUpload} /> Submit Review
          </button>
        </div>

      </div>
      <h3 className="review-carousel-heading">What others are saying:</h3>
      <div className="slider-container">
        <Slider {...sliderSettings}>
          {paddedReviews.map((rev) => (
            <div key={rev.ReviewID} className="review-card">
              {rev.isPlaceholder ? (
                <div className="review-content placeholder">
                  <FontAwesomeIcon icon={faCommentDots} className="review-comment-icon" />
                  <p className="review-comment">{rev.Comment}</p>
                </div>
              ) : (
                <>
                  <div className="review-stars">
                    {Array.from({ length: rev.Rating }, (_, i) => (
                      <FontAwesomeIcon icon={faStar} key={i} className="star-filled" />
                    ))}
                  </div>
                  <div className="review-content">
                    <span className="review-user"><FontAwesomeIcon icon={faUser} className="review-user-icon" /> {rev.Username}</span>
                    <FontAwesomeIcon icon={faCommentDots} className="review-comment-icon" /> 
                    <p className="review-comment">"{rev.Comment}"</p>
                    <span className="review-date">
                      {rev.CreatedAt ? new Date(rev.CreatedAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                </>
              )}
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default SystemReview;
