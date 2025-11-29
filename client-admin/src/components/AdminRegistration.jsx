// src/components/AdminRegistration.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './AdminRegistration.css';

const AdminRegistration = ({ onRegistrationSuccess, onSwitchToLogin }) => {
  const [registerData, setRegisterData] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '', 
    full_name: '' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));

    // Check password strength in real-time
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength('');
      return;
    }

    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const length = password.length;

    let strength = '';
    let score = 0;

    if (length >= 8) score++;
    if (hasLowercase) score++;
    if (hasUppercase) score++;
    if (hasNumbers) score++;
    if (hasSpecialChars) score++;

    switch (score) {
      case 0:
      case 1:
      case 2:
        strength = 'Weak';
        break;
      case 3:
      case 4:
        strength = 'Moderate';
        break;
      case 5:
        strength = 'Strong';
        break;
      default:
        strength = '';
    }

    setPasswordStrength(strength);
  };

  const isValidPTCEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;
    
    const domain = email.toLowerCase().split('@')[1];
    return domain === 'paterostechnologicalcollege.edu.ph';
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!registerData.email || !registerData.password || !registerData.full_name) {
      setError('Please fill in all fields');
      return;
    }

    // Validate PTC email domain
    if (!isValidPTCEmail(registerData.email)) {
      setError('Please use an official Pateros Technological College email address (@paterostechnologicalcollege.edu.ph)');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Remove the 6-character limit and provide guidance instead
    if (registerData.password.length < 1) {
      setError('Please enter a password');
      return;
    }

    // Optional: Recommend stronger passwords but don't enforce
    if (registerData.password.length < 8) {
      const proceed = window.confirm(
        'Your password is shorter than recommended (8 characters). For better security, we recommend using a longer password. Would you like to continue with this password?'
      );
      if (!proceed) return;
    }

    try {
      setLoading(true);
      setError('');

      // Check if user already exists
      const { data: existingAdmin, error: checkError } = await supabase
        .from('admin_users')
        .select('id, email')
        .eq('email', registerData.email.toLowerCase().trim())
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing admin:', checkError);
        throw new Error('Unable to verify email availability');
      }

      if (existingAdmin) {
        setError('An admin with this email already exists. Please use a different email address or try logging in.');
        return;
      }

      // Create new admin user
      const { data: newAdmin, error: insertError } = await supabase
        .from('admin_users')
        .insert([
          {
            email: registerData.email.toLowerCase().trim(),
            password: registerData.password, // Note: Still plain text - consider hashing
            full_name: registerData.full_name.trim(),
            role: 'admin',
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      if (!newAdmin) {
        throw new Error('Registration failed: No data returned');
      }

      // Auto-login after successful registration
      const user = {
        id: newAdmin.id,
        email: newAdmin.email,
        user_metadata: {
          full_name: newAdmin.full_name,
          role: newAdmin.role
        }
      };

      const admin = {
        id: newAdmin.id,
        full_name: newAdmin.full_name,
        role: newAdmin.role,
        email: newAdmin.email,
        created_at: newAdmin.created_at
      };

      setError('Registration successful! Setting up your account...');
      
      // Small delay to show success message
      setTimeout(() => {
        onRegistrationSuccess && onRegistrationSuccess({ user, admin });
      }, 2000);

    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    onSwitchToLogin && onSwitchToLogin();
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'Weak': return '#fc8181';
      case 'Moderate': return '#f6e05e';
      case 'Strong': return '#68d391';
      default: return 'transparent';
    }
  };

  const getPasswordStrengthClass = () => {
    switch (passwordStrength) {
      case 'Weak': return 'password-strength-weak';
      case 'Moderate': return 'password-strength-moderate';
      case 'Strong': return 'password-strength-strong';
      default: return '';
    }
  };

  return (
    <div className="admin-registration-container">
      <div className="admin-registration-content">
        <div className="admin-registration-card">
          {/* Logo Slot */}
          <div className="admin-logo-slot">
            <img src="logo-ptc.png" alt="PTC Logo" className="admin-logo-image" />
          </div>

          <div className="admin-registration-header">
            <h1 className="admin-registration-title">Admin Registration</h1>
            <p className="admin-registration-subtitle">Pateros Technological College</p>
          </div>

          <form onSubmit={handleRegister} className="admin-registration-form" noValidate>
            {error && (
              <div className={`admin-error-message ${error.includes('successful') ? 'admin-success-message' : ''}`} role="alert">
                {error}
              </div>
            )}

            <div className="admin-form-group">
              <input
                type="text"
                name="full_name"
                value={registerData.full_name}
                onChange={handleInputChange}
                placeholder="Full Name"
                disabled={loading}
                required
                className="admin-input"
              />
            </div>

            <div className="admin-form-group">
              <input
                type="email"
                name="email"
                value={registerData.email}
                onChange={handleInputChange}
                placeholder="username@paterostechnologicalcollege.edu.ph"
                disabled={loading}
                required
                className="admin-input"
              />
              <div className="password-guidance">
                <small>
                  Only @paterostechnologicalcollege.edu.ph email addresses are allowed
                </small>
              </div>
            </div>

            <div className="admin-form-group">
              <input
                type="password"
                name="password"
                value={registerData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                disabled={loading}
                required
                className="admin-input"
              />
              {passwordStrength && (
                <div className="password-strength-indicator">
                  <span>Password Strength: </span>
                  <span 
                    className={getPasswordStrengthClass()}
                    style={{ 
                      color: getPasswordStrengthColor(),
                      fontWeight: 'bold',
                      marginLeft: '5px'
                    }}
                  >
                    {passwordStrength}
                  </span>
                </div>
              )}
              <div className="password-guidance">
                <small>
                  For strong security, use at least 8 characters with a mix of uppercase, lowercase, numbers, and symbols.
                </small>
              </div>
            </div>

            <div className="admin-form-group">
              <input
                type="password"
                name="confirmPassword"
                value={registerData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                disabled={loading}
                required
                className="admin-input"
              />
            </div>

            <button type="submit" className="admin-register-button" disabled={loading}>
              {loading ? (
                <>
                  <div className="admin-loading-spinner"></div>
                  Creating Account...
                </>
              ) : (
                'Create Admin Account'
              )}
            </button>

            <div className="admin-button-group">
              <button 
                type="button" 
                onClick={handleBackToLogin}
                disabled={loading}
                className="admin-back-to-login-button"
              >
                ← Back to Login
              </button>
            </div>
          </form>

          <div className="admin-registration-footer">
            <p className="admin-footer-text">
              <strong>Register for PTC Portal</strong> 
              {' Create your admin account to access the dashboard and institutional services.'}
            </p>
            <p className="admin-security-note">
              <small>
                <strong>Note:</strong> Registration is restricted to PTC official email addresses only.
              </small>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRegistration;
