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
        <footer className="homepage-footer">
          <p>Need help? Contact our admission office at <strong>admissions@university.edu</strong></p>
        </footer>
      </div>
    </div>
  );
};

export default Homepage;