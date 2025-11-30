// src/components/AdminLogin.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import AdminRegistration from './AdminRegistration';
import './AdminLogin.css';

const AdminLogin = ({ onLoginSuccess }) => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRegistration, setShowRegistration] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
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

      const { data: adminRow, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', loginData.email)
        .eq('password', loginData.password)
        .single();

      if (adminError) {
        if (adminError.code === 'PGRST116') throw new Error('Invalid email or password');
        throw adminError;
      }

      if (!adminRow) throw new Error('Invalid email or password');

      const user = {
        id: adminRow.id,
        email: adminRow.email,
        user_metadata: { full_name: adminRow.full_name }
      };

      const admin = {
        id: adminRow.id,
        full_name: adminRow.full_name,
        role: adminRow.role,
        email: adminRow.email
      };

      onLoginSuccess && onLoginSuccess({ user, admin });

    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleShowRegistration = () => {
    setShowRegistration(true);
    setError('');
  };

  const handleHideRegistration = () => {
    setShowRegistration(false);
    setError('');
  };

  const handleRegistrationSuccess = (userData) => {
    onLoginSuccess && onLoginSuccess(userData);
  };

  if (showRegistration) {
    return (
      <AdminRegistration
        onRegistrationSuccess={handleRegistrationSuccess}
        onSwitchToLogin={handleHideRegistration}
      />
    );
  }

  return (
    <div className="admin-login-container">
      <div className="admin-login-content">
        <div className="admin-login-card">
          <div className="admin-logo-slot">
            <img src="logo-ptc.png" alt="PTC Logo" className="admin-logo-image" />
          </div>

          <div className="admin-login-header">
            <h1 className="admin-login-title">Admin Login</h1>
            <p className="admin-login-subtitle">Pateros Technological College</p>
          </div>

          <form onSubmit={handleLogin} className="admin-login-form" noValidate>
            {error && (
              <div
                className={`admin-error-message ${
                  error.includes('already exists') || error.includes('successfully')
                    ? 'admin-success-message'
                    : ''
                }`}
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="admin-form-group">
              <input
                type="email"
                name="email"
                value={loginData.email}
                onChange={handleInputChange}
                placeholder="Email address"
                disabled={loading}
                required
                className="admin-input"
              />
            </div>

            <div className="admin-form-group">
              <input
                type="password"
                name="password"
                value={loginData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                disabled={loading}
                required
                className="admin-input"
              />
            </div>

            <button type="submit" className="admin-login-button" disabled={loading}>
              {loading ? (
                <>
                  <div className="admin-loading-spinner"></div>
                  Signing In...
                </>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>

            {/* Removed Demo Credentials Button */}

            <button
              type="button"
              onClick={handleShowRegistration}
              disabled={loading}
              className="admin-create-button"
            >
              Create Admin Account
            </button>
          </form>

          <div className="admin-login-footer">
            <p className="admin-footer-text">
              <strong>New to PTC Portal?</strong> First-time users can create their admin account to
              access the dashboard and institutional services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
