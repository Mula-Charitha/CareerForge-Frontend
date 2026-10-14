import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHealthStatus, getProfileCompletion } from '../services/api';
import './Navbar.css';

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [backendOnline, setBackendOnline] = useState(true);
  const [completionPercentage, setCompletionPercentage] = useState(null);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        await getHealthStatus();
        setBackendOnline(true);
      } catch (err) {
        setBackendOnline(false);
      }
    };
    checkBackend();
  }, []);

  useEffect(() => {
    const fetchCompletion = async () => {
      try {
        const data = await getProfileCompletion();
        setCompletionPercentage(data.completionPercentage);
      } catch (err) {
        // Ignore errors if profile not loaded yet
      }
    };
    fetchCompletion();
  }, [location.pathname]);

  const getPageTitle = (path) => {
    switch (path) {
      case '/dashboard': return 'Placement Preparation Dashboard';
      case '/profile': return 'Student Profile';
      case '/dsa': return 'DSA Preparation Module';
      case '/aptitude': return 'Aptitude Practice Module';
      case '/resume': return 'Resume Management';
      case '/certifications': return 'Certifications & Badges';
      case '/jobs': return 'Job Applications Tracker';
      case '/interviews': return 'Mock Interviews';
      case '/analytics': return 'Performance Analytics';
      case '/ai-assistant': return 'AI Career Assistant';
      default: return 'CareerForge';
    }
  };

  return (
    <header className="dashboard-navbar">
      <div className="navbar-left">
        <h1 className="navbar-page-title">{getPageTitle(location.pathname)}</h1>
      </div>

      <div className="navbar-right">
        <div className={`status-badge ${backendOnline ? 'online' : 'offline'}`}>
          <span className="status-dot"></span>
          <span>{backendOnline ? 'Backend API Connected' : 'Offline'}</span>
        </div>

        {completionPercentage !== null && (
          <Link to="/profile" className="profile-completion-badge" title="Click to update profile">
            <span className="completion-label">Profile:</span>
            <div className="completion-bar-mini">
              <div
                className="completion-fill-mini"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <span className="completion-percent">{completionPercentage}%</span>
          </Link>
        )}

        <div className="user-greeting">
          <span>Hello, <strong>{user?.fullName?.split(' ')[0] || 'Student'}</strong>!</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
