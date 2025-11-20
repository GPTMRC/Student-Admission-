import React from 'react';
import { Link } from 'react-router-dom';
import './AnimatedBackground.css';

const AnimatedBackground = ({ children }) => {
  return (
    <div className="animated-background-container">
      <div className="background"></div>
      
      <div className="content">
        <div className="main-content-wrapper">
          {/* Left Side - Welcome Content */}
          <div className="welcome-section">
            <div className="logo-space">
              <img src="/logo-ptc.png" alt="PTC LOGO" className="logo" />
            </div>

            <div className="welcome-content">
              <h1>Pateros Technological College</h1>
              
              <div className="main-description">
                <p>Access your academic information, course materials, and institutional resources through our secure student portal.</p>
              </div>
              
              <div className="button-container">
                <Link to="/login" className="action-btn primary-btn">
                  Student Login
                </Link>
              </div>
            </div>
          </div>

          {/* Right Side - Info Card */}
          <div className="info-card-section">
            <div className="info-card">
              <div className="info-card-content">
                <h2>Campus Announcements</h2>
                <div className="announcement-list">
                  <div className="announcement-item">
                    <h3>Enrollment Period</h3>
                    <p>Next semester enrollment starts on January 15, 2024. Prepare your documents early.</p>
                  </div>
                  <div className="announcement-item">
                    <h3>Academic Calendar</h3>
                    <p>Check the updated academic calendar for important dates and deadlines.</p>
                  </div>
                  <div className="announcement-item">
                    <h3>System Maintenance</h3>
                    <p>Portal will be unavailable on Sunday, 2:00 AM - 6:00 AM for system updates.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
};

export default AnimatedBackground;