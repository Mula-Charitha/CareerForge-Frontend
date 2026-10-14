import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <p>&copy; {new Date().getFullYear()} CareerForge. Placement Preparation & Tracking Platform.</p>
      </div>
    </footer>
  );
};

export default Footer;
