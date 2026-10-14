import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Profile', path: '/profile', icon: '👤' },
    { name: 'DSA Preparation', path: '/dsa', icon: '⚡' },
    { name: 'Aptitude Prep', path: '/aptitude', icon: '📐' },
    { name: 'Resume', path: '/resume', icon: '📄' },
    { name: 'Certifications', path: '/certifications', icon: '📜' },
    { name: 'Job Applications', path: '/jobs', icon: '💼' },
    { name: 'Mock Interviews', path: '/interviews', icon: '🎙️' },
    { name: 'Analytics', path: '/analytics', icon: '📈' },
    { name: 'AI Career Assistant', path: '/ai-assistant', icon: '🤖' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">⚡</span>
        <div className="brand-text">
          <span className="brand-title">Career<span className="brand-highlight">Forge</span></span>
          <span className="brand-subtitle">Placement Platform</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-widget">
          <div className="user-avatar">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'S'}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.fullName || 'Student'}</span>
            <span className="user-role">{user?.role || 'STUDENT'}</span>
          </div>
        </div>
        <button className="btn-logout-icon" onClick={handleLogout} title="Logout">
          🚪
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
