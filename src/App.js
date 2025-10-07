import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AnimatedBackground from './components/AnimatedBackground';
import Homepage from './components/Homepage';
import ApplicationsList from './components/ApplicationsList';
import AdmissionForm from './components/AdmissionForm';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <AnimatedBackground particleCount={40}>
            <div className="features">
              <div className="feature">
                <h3>Fast & Easy</h3>
                <p>Complete your application in minutes.</p>
              </div>
              <div className="feature">
                <h3>Engaging</h3>
                <p>Unlock your true potential at Pateros Technological College.</p>
              </div>
              <div className="feature">
                <h3>Be part of it</h3>
                <p>Enjoy college life in Pateros Technological college</p>
              </div>
            </div>
          </AnimatedBackground>
        } />
        
        {/* These routes will use their own components without animated background */}
        <Route path="/Admission" element={<AdmissionForm />} />
        <Route path="/applicationslist" element={<ApplicationsList />} />
      </Routes>
    </Router>
  );
}

export default App;