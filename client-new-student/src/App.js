import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import AdmissionForm from './components/AdmissionForm';
import AnimatedBackground from './components/AnimatedBackground';
import './App.css';

function AppContent() {
  const location = useLocation();
  
  return (
    <>
      {/* Show AnimatedBackground only on homepage */}
      {location.pathname === '/' && (
        <AnimatedBackground>
          <Routes>
            <Route path="/apply" element={<AdmissionForm />} />
          </Routes>
        </AnimatedBackground>
      )}
      
      {/* Show form directly without AnimatedBackground wrapper */}
      {location.pathname === '/apply' && (
        <div className="admission-form-page">
          <AdmissionForm />
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <AppContent />
      </div>
    </Router>
  );
}

export default App;
