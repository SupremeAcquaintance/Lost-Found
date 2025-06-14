import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import './styles/User Registration.css';
import axios from 'axios';
import { useAuth } from './auth/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UserRegistration = () => {
    const [RegNumber, setRegNumber] = useState('');
    const { login } = useAuth(); // Use the login method from AuthContext
    const [Residence, setResidence] = useState('');
    const [Username, setUsername] = useState('');
    const [Email, setEmail] = useState('');
    const [Phone, setPhone] = useState('');
    const [UserType, setUserType] = useState('Student');
    const [PasswordHash, setPassword] = useState('');
    const [ConfirmPassword, setConfirmPassword] = useState('');
    const [welcomeMessage, setWelcomeMessage] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (PasswordHash !== ConfirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        const userData = { RegNumber, Username, Email, Phone, UserType, PasswordHash, Residence };

        setLoading(true);
        try {
            const response = await axios.post('http://localhost:3000/api/register', userData);
            if (response.status === 201 && response.data.welcomeMessage) {
                await login(userData);
                toast.success('Registration successful!');
                setWelcomeMessage(response.data.welcomeMessage);
                setShowModal(true);

                // Reset form
                setUsername('');
                setRegNumber('');
                setEmail('');
                setPhone('');
                setPassword('');
                setConfirmPassword('');
                setUserType('Student');
                setResidence('');
            } else {
                toast.error('Registration failed!');
            }
        } catch (error) {
            console.error('Error during registration:', error);
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        navigate('/home');
    };

    return (
        <div className='registration-page'>
            <p>Join the community to report lost items and help others find theirs.</p>
            <div className="registration-container">
                <FontAwesomeIcon icon={faUserPlus} size="3x" className="registration-icon" />
                <h2>Register</h2>
                <ToastContainer position="top-center" autoClose={8000} hideProgressBar />
                <form onSubmit={handleSubmit} className="registration-form">
                    <input type="text" placeholder="RegNumber" value={RegNumber} onChange={(e) => setRegNumber(e.target.value)} required />
                    <input type="text" placeholder="Username" value={Username} onChange={(e) => setUsername(e.target.value)} required />
                    <input type="email" placeholder="Email" value={Email} onChange={(e) => setEmail(e.target.value)} required />
                    <input type="number" placeholder="Phone" value={Phone} onChange={(e) => setPhone(e.target.value)} required />
                    <select value={UserType} onChange={(e) => setUserType(e.target.value)} required>
                        <option value="Student">Student</option>
                    </select>
                    <input type="password" placeholder="Password" value={PasswordHash} onChange={(e) => setPassword(e.target.value)} required />
                    <input type="password" placeholder="Confirm Password" value={ConfirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    <input type="text" placeholder="Residence" value={Residence} onChange={(e) => setResidence(e.target.value)} required />
                    <button type="submit" className="btn" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
                </form>
                <p className="login-prompt">
                    Already have an account?
                    <button onClick={() => navigate('/login')} className="link-btn">Sign In</button>
                </p>
            </div>

            {/* Welcome Modal */}
            {showModal && (
                <div className="welcome-modal-overlay">
                    <div className="welcome-modal-content">
                        <h3>🎉Welcome!🎉</h3>
                        <pre style={{ whiteSpace: 'pre-wrap' }}>{welcomeMessage}</pre>
                        <button className="go-to-home-btn" onClick={handleCloseModal}>Go to Home</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserRegistration;
