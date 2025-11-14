import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom'; // ADD THIS IMPORT
import './Login.css';

const Login = ({ setIsAuthenticated, setStudentData }) => {
  const [credentials, setCredentials] = useState({
    institutional_email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate(); // ADD THIS

  // STRICT PTC institutional email validation
  const isValidPTCEmail = (email) => {
    const ptcPattern = /^[a-zA-Z0-9._%+-]+@paterostechnologicalcollege\.edu\.ph$/i;
    return ptcPattern.test(email);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('?? LOGIN ATTEMPT STARTED');

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
        setError('No student account found with this institutional email. Please contact MIS office.');
        setLoading(false);
        return;
      }

      // SIMPLIFIED PASSWORD CHECK
      const validPasswords = ['welcome123', 'password123', 'ptc2024', '123456'];
      
      if (validPasswords.includes(credentials.password)) {
        console.log('? LOGIN SUCCESSFUL');
        
        // Set authentication state
        setIsAuthenticated(true);
        setStudentData(student);
        
        // MANUAL REDIRECT to dashboard
        console.log('?? Redirecting to dashboard...');
        navigate('/dashboard');
      } else {
        setError(`Invalid password. Try: ${validPasswords.join(', ')}`);
      }

    } catch (err) {
      setError('Login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Debug: Log when component re-renders
  useEffect(() => {
    console.log('?? Login component rendered');
  });

  return (
    <div className="login-container">
      <div className="login-form">
        <div className="login-header">
          <img src="/logo-ptc.png" alt="PTC Logo" className="ptc-logo" />
          <h1>Pateros Technological College</h1>
          <p>Student Portal - Port 3003</p>
          <div className="allowed-domains strict">
            <strong>DEBUG:</strong> Should redirect to /dashboard after login
          </div>
        </div>
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>PTC Institutional Email</label>
            <input
              type="email"
              placeholder="juan.delacruz@paterostechnologicalcollege.edu.ph"
              value={credentials.institutional_email}
              onChange={(e) => setCredentials({...credentials, institutional_email: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="welcome123"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              required
            />
          </div>
          
          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Logging in...' : 'Login & Go to Dashboard'}
          </button>
        </form>
        
        <div className="test-credentials">
          <h4>Test Login:</h4>
          <p><strong>Email:</strong> juan.delacruz@paterostechnologicalcollege.edu.ph</p>
          <p><strong>Password:</strong> welcome123</p>
          <p><strong>Expected:</strong> Redirect to http://localhost:3003/dashboard</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
