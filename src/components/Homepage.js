import React from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css';

const Homepage = () => {
  return (
    <div className="homepage">
      <div className="homepage-container">
        <header className="homepage-header">
          <h1>Welcome to Our University</h1>
          <p className="subtitle">Begin Your Educational Journey With Us</p>
        </header>

        <div className="hero-section">
          <div className="hero-content">
            <h2>Student Admission Portal</h2>
            <p>
              Join our prestigious institution and unlock your potential. 
              Apply now for the upcoming academic year and take the first step 
              towards a brighter future.
            </p>
            <div className="cta-buttons">
              <Link to="/apply" className="cta-button primary">
                Apply Now
              </Link>
              <Link to="/applications" className="cta-button secondary">
                View Applications
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <div className="placeholder-image">🎓</div>
          </div>
        </div>

        <div className="features-section">
          <h3>Admission Requirements</h3>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📷</div>
              <h4>2x2 Picture</h4>
              <p>Recent passport-sized photo with white background</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📄</div>
              <h4>Good Moral Certificate</h4>
              <p>Certificate of good moral character from previous school</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h4>Form 138</h4>
              <p>High school report card (Form 138)</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎓</div>
              <h4>Graduation Certificate</h4>
              <p>Certificate of graduation or completion</p>
            </div>
          </div>
        </div>

        <div className="process-section">
          <h3>Admission Process</h3>
          <div className="process-steps">
            <div className="step">
              <div className="step-number">1</div>
              <h4>Submit Application</h4>
              <p>Complete the online application form with your details</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h4>Upload Documents</h4>
              <p>Upload all required documents for verification</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h4>Get Exam Schedule</h4>
              <p>Receive your entrance exam schedule via email</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h4>Take Entrance Exam</h4>
              <p>Attend the scheduled examination</p>
            </div>
          </div>
        </div>

        <footer className="homepage-footer">
          <p>Need help? Contact our admission office at <strong>admissions@university.edu</strong></p>
        </footer>
      </div>
    </div>
  );
};

export default Homepage;