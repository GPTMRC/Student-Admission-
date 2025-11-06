import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './components/Homepage';
import AdmissionForm from './components/AdmissionForm';
import AnimatedBackground from './components/AnimatedBackground';
import './App.css';

function App() {
  return (
    <div className="App">
      <AnimatedBackground />
      <Router>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/apply" element={<AdmissionForm />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
