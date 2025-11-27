import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = ({ setIsAuthenticated, setStudentData }) => {
  const [credentials, setCredentials] = useState({
    institutional_email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // STRICT PTC institutional email validation
  const isValidPTCEmail = (email) => {
    const ptcPattern = /^[a-zA-Z0-9._%+-]+@paterostechnologicalcollege\.edu\.ph$/i;
    return ptcPattern.test(email);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // STRICT VALIDATION - Only @paterostechnologicalcollege.edu.ph
    if (!isValidPTCEmail(credentials.institutional_email)) {
      setError('Access restricted to PTC institutional emails only (@paterostechnologicalcollege.edu.ph)');
      setLoading(false);
      return;
    }

    try {
      // Check institutional_students table
      const { data: student, error: studentError } = await supabase
        .from('institutional_students')
        .select('*')
        .eq('institutional_email', credentials.institutional_email)
        .single();

      if (studentError || !student) {
        setError('No student account found with this institutional email. Please contact MIS office or register for an account.');
        setLoading(false);
        return;
      }

      // Check enrollment status
      if (student.enrollment_status !== 'active') {
        setError('Account is not active. Please contact MIS office for assistance.');
        setLoading(false);
        return;
      }

      // PASSWORD VALIDATION - Check against stored password_hash
      if (student.password_hash === credentials.password) {
        // Set authentication state
        setIsAuthenticated(true);
        setStudentData(student);
        
        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        setError('Invalid password. Please try again or contact MIS office for password reset.');
      }

    } catch (err) {
      setError('Login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterRedirect = () => {
    navigate('/register');
  };

  return (
    <div className="login-container">
      <div className="main-content-wrapper">
        {/* Spacer to push content down */}
        <div className="login-spacer"></div>
        
        {/* Login Form Container */}
        <div className="login-section">
          <div className="login-form-card">
            <div className="logo-space">
              <img src="/logo-ptc.png" alt="PTC LOGO" className="logo" />
            </div>

            <div className="login-content">
              <h1>Student Login</h1>
              <p className="login-subtitle">
                Pateros Technological College
              </p>
              
              <form onSubmit={handleLogin} className="login-form">
                <div className="form-group">
                  <input
                    type="email"
                    placeholder="juan.delacruz@paterostechnologicalcollege.edu.ph"
                    value={credentials.institutional_email}
                    onChange={(e) => setCredentials({...credentials, institutional_email: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                    required
                  />
                </div>
                
                {error && (
                  <div className="error-message">
                    {error}
                  </div>
                )}
                
                <button type="submit" disabled={loading} className="login-btn primary-btn">
                  {loading ? (
                    <>
                      <div className="loading-spinner-small"></div>
                      Logging in...
                    </>
                  ) : (
                    'Sign In to Dashboard'
                  )}
                </button>

                {/* Create Account Button */}
                <button 
                  type="button" 
                  onClick={handleRegisterRedirect}
                  className="login-btn create-account-btn"
                >
                  Create Account
                </button>
              </form>

              {/* New Student Registration Info */}
              <div className="new-student-info">
                <h3>New to PTC Portal?</h3>
                <p>First time users can create their student account to access the dashboard and institutional services.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Need Help Footer */}
      <div className="help-footer">
        <div className="help-footer-content">
          <div className="help-info">
            <h3>Need Help?</h3>
            <p>Contact MIS Office for account issues, registration, or technical support during office hours.</p>
          </div>
          <div className="contact-details">
            <div className="contact-item">
              <span className="contact-icon">📧</span>
              <span>mis@paterostechnologicalcollege.edu.ph</span>
            </div>
            <div className="contact-item">
              <span className="contact-icon">📞</span>
              <span>(02) 8642-1234</span>
            </div>
            <div className="contact-item">
              <span className="contact-icon">🕒</span>
              <span>Mon-Fri: 8:00 AM - 5:00 PM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;