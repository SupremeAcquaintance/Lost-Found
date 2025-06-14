import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignInAlt } from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/User Login.css';

const UserLogin = () => {
  const { login } = useAuth(); // Use the login method from AuthContext
  const [Email, setEmail] = useState('');
  const [PasswordHash, setPassword] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userData = { Email, PasswordHash };
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3000/api/login', userData);
      const user = response.data.user;
      await login(user); // Set user in global context
      toast.success('Welcome', user.Username);

      // Navigate based on UserType
      if (user.UserType === 'Staff') {
        navigate('/admin/dashboard');
      } else {
        navigate('/home');
      }
    } catch (error) {
      console.error('Error during sign in:', error);
      toast.error('Sign in failed. Check your email and password then try again!');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <h3>Sign in to Lost and Found</h3><ToastContainer position="top-center" autoClose={8000} hideProgressBar />
      <div className="login-container">
        <FontAwesomeIcon icon={faSignInAlt} size="3x" className="login-icon" />
        <h2>Sign In</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="Email"
            value={Email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={PasswordHash}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="signin-btn" type="submit" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <p className="register-prompt">
          Don’t have an account?{' '}
          <button onClick={() => navigate('/register')} className="link-btn">
            Register
          </button>
        </p>
      </div>
    </div>
  );
};

export default UserLogin;
 // Export the UserLogin component for use in other parts of the application
// This component handles user login functionality, including form submission, API calls, and displaying notifications.
// It uses React hooks for state management and axios for making HTTP requests to the backend server.
// The component also utilizes FontAwesome icons for visual elements and CSS for styling.
// The useAuth hook is used to manage user authentication state across the application.