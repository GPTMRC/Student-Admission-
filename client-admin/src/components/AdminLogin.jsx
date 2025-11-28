// src/components/AdminLogin.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './AdminLogin.css';

const AdminLogin = ({ onLoginSuccess }) => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        if (adminError.code === 'PGRST116') {
          throw new Error('Invalid email or password');
        }
        throw adminError;
      }

      if (!adminRow) {
        throw new Error('Invalid email or password');
      }

      const user = {
        id: adminRow.id,
        email: adminRow.email,
        user_metadata: {
          full_name: adminRow.full_name
        }
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

  const createDefaultAdmin = async () => {
    try {
      setLoading(true);
      setError('');

      const { data: testData, error: testError } = await supabase
        .from('admin_users')
        .select('email')
        .limit(1);

      if (testError && testError.code === '42703') {
        setError(
          'Table structure is incorrect. Please run the SQL in Supabase SQL Editor to recreate the table with correct structure.'
        );
        return;
      }

      const { data: existingAdmin } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', 'admin@ptc.edu.ph')
        .single();

      if (existingAdmin) {
        setError('Admin user already exists. Use: admin@ptc.edu.ph / demo123');
        setLoginData({ email: 'admin@ptc.edu.ph', password: 'demo123' });
        return;
      }

      const { error: insertError } = await supabase
        .from('admin_users')
        .insert([
          {
            email: 'admin@ptc.edu.ph',
            password: 'demo123',
            full_name: 'PTC Administrator',
            role: 'super_admin'
          }
        ]);

      if (insertError) throw insertError;

      setError('Default admin created successfully. Use: admin@ptc.edu.ph / demo123');
      setLoginData({ email: 'admin@ptc.edu.ph', password: 'demo123' });

    } catch (error) {
      setError('Failed to create admin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setLoginData({ email: 'admin@ptc.edu.ph', password: 'demo123' });
    setError('');
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-content">
        <div className="admin-login-card">
          {/* Logo Slot */}
          <div className="admin-logo-slot">
            {/* Add your logo image here */}
             <img src="logo-ptc.png" alt="PTC Logo" className="admin-logo-image" />
          </div>

          <div className="admin-login-header">
            <h1 className="admin-login-title">Admin Login</h1>
            <p className="admin-login-subtitle">Pateros Technological College</p>
          </div>

          <form onSubmit={handleLogin} className="admin-login-form" noValidate>
            {error && (
              <div className={`admin-error-message ${error.includes('already exists') || error.includes('successfully') ? 'admin-success-message' : ''}`} role="alert">
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

            <div className="admin-button-group">
              <button 
                type="button" 
                onClick={handleDemoLogin} 
                disabled={loading}
                className="admin-demo-button"
              >
                Use Demo Credentials
              </button>

              <button 
                type="button" 
                onClick={createDefaultAdmin} 
                disabled={loading}
                className="admin-create-button"
              >
                Create Admin Account
              </button>
            </div>
          </form>

          <div className="admin-login-footer">
            <p className="admin-footer-text">
              <strong>New to PTC Portal?</strong> First time users can create their admin account to access the dashboard and institutional services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;