// src/App.jsx
import React, { useState } from 'react';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard'; // Import your actual dashboard
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);

  const handleLoginSuccess = (data) => {
    console.log('✅ App: Login successful with data:', data);
    setUser(data.user);
    setAdmin(data.admin);
  };

  const handleLogout = () => {
    console.log('🚪 App: Logging out');
    setUser(null);
    setAdmin(null);
  };

  console.log('🔄 App: Current state - user:', user ? 'logged in' : 'null', 'admin:', admin ? 'exists' : 'null');

  // Show AdminDashboard when both user and admin exist
  if (user && admin) {
    return (
      <AdminDashboard 
        user={user} 
        admin={admin} 
        onLogout={handleLogout} 
      />
    );
  }

  // Show AdminLogin when not logged in
  return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
}