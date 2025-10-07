import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdmissionForm from './components/AdmissionForm';
import ApplicationsList from './components/ApplicationsList';
import './App.css';

// Simple Welcome component that redirects to admission
function Welcome() {
  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <h1>🎓 University Admission System</h1>
        <p>Welcome to our online student admission portal</p>
        <div className="welcome-buttons">
          <a href="/apply" className="welcome-btn primary">
            Start Application
          </a>
          <a href="/applications" className="welcome-btn secondary">
            View Applications
          </a>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Redirect root path directly to admission form */}
          <Route path="/" element={<Navigate to="/apply" replace />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/apply" element={<AdmissionForm />} />
          <Route path="/applications" element={<ApplicationsList />} />
          <Route path="*" element={<Navigate to="/apply" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;