// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Welcome from './frontend/components/Welcome';
import HomePage from './frontend/components/HomePage'; // Import the HomePage component
import UserProfile from './frontend/components/UserProfile';
import ItemForm from './frontend/components/ItemForm';
import ItemList from './frontend/components/ItemList';
import UserLogin from './frontend/components/UserLogin';
import UserRegistration from './frontend/components/UserRegistration';
import AdminDashboard from './frontend/components/AdminDashboard';
import AdminReview from './frontend/components/AdminReviewPanel';
import Notifications from './frontend/components/Notifications';
import Conversation from './frontend/components/ChatRoom';
import Announcements from './frontend/components/Announcements';
import Search from './frontend/components/ItemListTabs';
import ClaimManagement from './frontend/components/ClaimManagement';
import UserManagement from './frontend/components/UserManagement';
import ItemManagement from './frontend/components/ItemManagement';
import ActivityLogs from './frontend/components/ActivityLog';
import SystemReview from './frontend/components/Review';
import UserSettings from './frontend/components/UserSettings';
import { AuthProvider } from './frontend/components/auth/AuthContext'; // Import the AuthProvider
import './App.css';

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <div className="app-container">
                    <Routes>
                        <Route path="/" element={<Welcome />} />
                        <Route path="/login" element={<UserLogin />} />
                        <Route path="/register" element={<UserRegistration />} />
                        <Route path="/home" element={<HomePage />} />
                        <Route path="/user/profile" element={<UserProfile />} />
                        <Route path="/report" element={<ItemForm />} />
                        <Route path="/items" element={<ItemList />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                        <Route path="/chat" element={<Conversation/>} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/admin/items" element={<ItemManagement />} />
                        <Route path="/admin/announcements" element={<Announcements />} />
                        <Route path="/admin/claims" element={<ClaimManagement />} />
                        <Route path="/admin/users" element={<UserManagement/>} />
                        <Route path="/admin/logs" element={<ActivityLogs/>}/>
                        <Route path="/settings" element={<UserSettings/>}/>
                        <Route path='/admin/reviews' element={<AdminReview/>}/>
                        <Route path="/ratings" element={<SystemReview/>}/>
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
};

export default App;