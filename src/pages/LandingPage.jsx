import React from 'react';
import HealthStatusBanner from '../components/HealthStatusBanner';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-container">
      <section className="hero-section">
        <div className="badge">Placement Preparation & Tracking Platform</div>
        <h1 className="hero-title">
          Career<span className="gradient-text">Forge</span>
        </h1>
        <p className="hero-subtitle">
          "Your Complete Placement Preparation & Tracking Platform"
        </p>

        <div className="hero-cta">
          <button 
            className="btn btn-primary btn-large"
            onClick={() => alert('Login functionality will be implemented in the Authentication step.')}
          >
            Login
          </button>
          <button 
            className="btn btn-secondary btn-large"
            onClick={() => alert('Register functionality will be implemented in the Authentication step.')}
          >
            Register
          </button>
        </div>

        <div className="system-status-wrapper">
          <HealthStatusBanner />
        </div>
      </section>

      <section className="modules-overview">
        <h2 className="section-title">Platform Foundation Modules</h2>
        <p className="section-desc">CareerForge is structured into modular building blocks for complete placement readiness.</p>
        <div className="module-grid">
          <div className="module-card">
            <div className="module-icon">🔑</div>
            <h3>Authentication</h3>
            <p>Student registration, Login, Logout, JWT authentication & protected routes.</p>
          </div>
          <div className="module-card">
            <div className="module-icon">👤</div>
            <h3>Student Profile</h3>
            <p>Track academic details, skills, GitHub, LinkedIn, and completion metrics.</p>
          </div>
          <div className="module-card">
            <div className="module-icon">📊</div>
            <h3>Placement Dashboard</h3>
            <p>Overall progress, DSA, aptitude, resume status & upcoming tasks analytics.</p>
          </div>
          <div className="module-card">
            <div className="module-icon">⚡</div>
            <h3>DSA Preparation</h3>
            <p>Topic-wise breakdown, problem tracking, difficulty levels & completion %.</p>
          </div>
          <div className="module-card">
            <div className="module-icon">📐</div>
            <h3>Aptitude Preparation</h3>
            <p>Quantitative, logical reasoning, verbal ability & accuracy analytics.</p>
          </div>
          <div className="module-card">
            <div className="module-icon">📝</div>
            <h3>Resume Management</h3>
            <p>Upload resume, version tracking & metadata management.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
