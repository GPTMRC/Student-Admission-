import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import AdmissionForm from './components/AdmissionForm';
import ApplicationsList from './components/ApplicationsList';
import './App.css';

function Welcome() {
  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <h1>🎓 University Admission System</h1>
        <p>Welcome to our online student admission portal</p>
        <div className="welcome-buttons">
          <Link to="/apply" className="welcome-btn primary">
            Start Application
          </Link>
          <Link to="/applications" className="welcome-btn secondary">
            View Applications
          </Link>
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
          <Route path="/" element={<Welcome />} />
          <Route path="/apply" element={<AdmissionForm />} />
          <Route path="/applications" element={<ApplicationsList />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;