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

      console.log('🔍 Attempting login with:', loginData.email);

      const { data: adminRow, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', loginData.email)
        .eq('password', loginData.password)
        .single();

      console.log('🔍 Login response:', { adminRow, adminError });

      if (adminError) {
        if (adminError.code === 'PGRST116') {
          throw new Error('Invalid email or password');
        }
        throw adminError;
      }

      if (!adminRow) {
        throw new Error('Invalid email or password');
      }

      // SUCCESS - Create user object for AdminDashboard
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

      console.log('✅ Login successful!');
      onLoginSuccess && onLoginSuccess({ user, admin });

    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultAdmin = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔍 Creating default admin...');

      // First check if table exists and has correct structure
      const { data: testData, error: testError } = await supabase
        .from('admin_users')
        .select('email')
        .limit(1);

      console.log('🔍 Table check:', { testData, testError });

      if (testError && testError.code === '42703') {
        // Column doesn't exist - need to recreate table
        setError(`
          ❗ Table structure is incorrect. 
          Please run this SQL in Supabase SQL Editor:

          DROP TABLE IF EXISTS admin_users;

          CREATE TABLE admin_users (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'admin',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          INSERT INTO admin_users (email, password, full_name, role) 
          VALUES ('admin@ptc.edu.ph', 'demo123', 'PTC Administrator', 'super_admin');
        `);
        return;
      }

      // Check if admin already exists
      const { data: existingAdmin } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', 'admin@ptc.edu.ph')
        .single();

      if (existingAdmin) {
        setError('✅ Admin user already exists. Use: admin@ptc.edu.ph / demo123');
        setLoginData({ email: 'admin@ptc.edu.ph', password: 'demo123' });
        return;
      }

      // Create new admin
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

      setError('✅ Default admin created! Use: admin@ptc.edu.ph / demo123');
      setLoginData({ email: 'admin@ptc.edu.ph', password: 'demo123' });

    } catch (error) {
      console.error('Create admin error:', error);
      setError('Failed to create admin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setLoginData({ email: 'admin@ptc.edu.ph', password: 'demo123' });
    setError('');
  };

  const checkTableStructure = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .limit(1);

      if (error) {
        setError('Table error: ' + error.message);
      } else {
        setError('✅ Table structure is OK. Columns: ' + (data[0] ? Object.keys(data[0]).join(', ') : 'No data'));
      }
    } catch (err) {
      setError('Check failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-container">
            <img src="/logo-ptc.png" alt="PTC Logo" className="logo-image" />
          </div>
          <div className="college-info">
            <h1 className="college-name">Pateros Technological College</h1>
            <p className="login-title">Admin Portal</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="login-form" noValidate>
          {error && (
            <div className="error-message" role="alert" style={{ 
              whiteSpace: 'pre-wrap',
              textAlign: 'left',
              fontSize: error.includes('❗') ? '12px' : '14px'
            }}>
              {error.includes('✅') ? '✅' : '⚠️'} {error}
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
              required
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
              placeholder="demo123"
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Signing In...' : '🔐 Sign In to Dashboard'}
          </button>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button 
              type="button" 
              onClick={handleDemoLogin} 
              disabled={loading}
              style={{ flex: 1 }}
            >
              🚀 Fill Credentials
            </button>

            <button 
              type="button" 
              onClick={createDefaultAdmin} 
              disabled={loading}
              style={{ flex: 1, background: '#28a745' }}
            >
              ⚡ Create Admin
            </button>
          </div>

          <button 
            type="button" 
            onClick={checkTableStructure}
            disabled={loading}
            style={{ 
              width: '100%', 
              marginTop: '5px', 
              background: '#6c757d',
              fontSize: '12px',
              padding: '8px'
            }}
          >
            🔧 Check Table Structure
          </button>
        </form>

        <div className="login-footer">
          <p>Restricted Access - Authorized Personnel Only</p>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            First time? Run the SQL above, then click "Create Admin"
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;