import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/register';
import StudentDashboard from './components/StudentDashboard';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [studentData, setStudentData] = useState(null);

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Redirect root path to login */}
          <Route path="/" element={<Navigate to="/login" />} />
          
          {/* Login Page - Now the starting screen */}
          <Route 
            path="/login" 
            element={
              <Login 
                setIsAuthenticated={setIsAuthenticated}
                setStudentData={setStudentData}
              />
            } 
          />
          
          {/* Register Page */}
          <Route 
            path="/register" 
            element={
              <Register />
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