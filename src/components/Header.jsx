import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="brand-logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">Career<span className="logo-highlight">Forge</span></span>
        </Link>
        <div className="header-actions">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="user-name-link">
                👤 {user?.fullName}
              </Link>
              <button className="btn btn-outline" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
