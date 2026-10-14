import React, { useEffect, useState } from 'react';
import { getHealthStatus } from '../services/api';
import './HealthStatusBanner.css';

const HealthStatusBanner = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHealthStatus();
      setHealth(data);
    } catch (err) {
      setError('Backend REST API unavailable. Make sure Spring Boot server is running on port 8080.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="health-banner-card">
      <div className="banner-header">
        <div className="banner-title-group">
          <span className="banner-icon">📡</span>
          <h3>Backend System Status</h3>
        </div>
        <button 
          className="refresh-btn" 
          onClick={checkStatus} 
          disabled={loading}
          title="Refresh health status"
        >
          {loading ? 'Checking...' : '🔄 Refresh'}
        </button>
      </div>
      <div className="banner-body">
        {loading ? (
          <div className="status-indicator loading">
            <span className="dot pulse"></span>
            <span>Connecting to Spring Boot REST API (/api/health)...</span>
          </div>
        ) : error ? (
          <div className="status-indicator error">
            <span className="dot offline"></span>
            <div className="status-info">
              <span className="status-badge error-badge">STATUS: OFFLINE</span>
              <span className="status-msg">{error}</span>
            </div>
          </div>
        ) : (
          <div className="status-indicator online">
            <span className="dot online"></span>
            <div className="status-info">
              <span className="status-badge success-badge">STATUS: {health?.status || 'UP'}</span>
              <span className="status-msg">{health?.message || 'CareerForge Backend is running'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthStatusBanner;
