import React, { createContext, useContext, useState, useEffect } from 'react';

// Create AuthContext for authentication and authorization
const AuthContext = createContext();

// AuthProvider component manages user authentication state and role-based access
export const AuthProvider = ({ children }) => {
  // user holds authenticated user data: { Email, UserType, ... }
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize user state from localStorage (persisted login)
  useEffect(() => {
    const stored = localStorage.getItem('lnaf_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  // Login: save user data and persist
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('lnaf_user', JSON.stringify(userData));
  };

  // Logout: clear user data
  const logout = () => {
    setUser(null);
    localStorage.removeItem('lnaf_user');
  };

  // Derived flag indicating admin privileges
  const isAdmin = user?.UserType === 'Staff';

  return (
    <AuthContext.Provider value={{
        user,
        login,
        logout,
        isAdmin,
        loading,
        isAuthenticated: !!user,         
        userEmail: user?.Email || null 
      }}>
        {!loading && children}
      </AuthContext.Provider>      
  );
};

// Custom hook to access AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
