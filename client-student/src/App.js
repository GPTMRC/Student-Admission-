import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import AnimatedBackground from './components/AnimatedBackground';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [studentData, setStudentData] = useState(null);

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Homepage with AnimatedBackground */}
          <Route 
            path="/" 
            element={
              <AnimatedBackground>
                <div style={{textAlign: 'center', padding: '20px'}}>
                  <h2>Pateros Technological College Student Portal</h2>
                  <p>Access your student account using institutional credentials</p>
                </div>
              </AnimatedBackground>
            } 
          />
          
          {/* Login Page */}
          <Route 
            path="/login" 
            element={
              <Login 
                setIsAuthenticated={setIsAuthenticated}
                setStudentData={setStudentData}
              />
            } 
          />
          
          {/* Student Dashboard (Protected) */}
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? 
                <StudentDashboard studentData={studentData} /> : 
                <Navigate to="/login" />
            } 
          />
          
          {/* Redirect any unknown routes to login */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
