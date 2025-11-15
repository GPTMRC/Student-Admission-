import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './AdminLogin.css';

const AdminLogin = ({ onLoginSuccess }) => {
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Method 1: Supabase Authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) throw error;

      // Check if user has admin role (you'll need to set this up in your Supabase)
      // For now, we'll assume successful login means admin access
      console.log('✅ Login successful:', data);
      
      // Call the success callback to redirect to dashboard
      onLoginSuccess();

    } catch (error) {
      console.error('❌ Login error:', error);
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // Simple demo login (remove in production)
  const handleDemoLogin = () => {
    setLoginData({
      email: 'admin@ptc.edu.ph',
      password: 'demo123'
    });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* College Header */}
        <div className="login-header">
          <div className="logo-container">
            <img src="logo-ptc.png" alt="PTC Logo" className="logo-image" />
          </div>
          <div className="college-info">
            <h1 className="college-name">Pateros Technological College</h1>
            <p className="login-title">Admin Portal</p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="login-form">
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Admin Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={loginData.email}
              onChange={handleInputChange}
              placeholder="admin@ptc.edu.ph"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={loginData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="loading-spinner-small"></div>
                Signing In...
              </>
            ) : (
              '🔐 Sign In'
            )}
          </button>

          {/* Demo login button - remove in production */}
          <button 
            type="button" 
            className="demo-login-button"
            onClick={handleDemoLogin}
            disabled={loading}
          >
            🚀 Fill Demo Credentials
          </button>
        </form>

        <div className="login-footer">
          <p>Restricted Access - Authorized Personnel Only</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;