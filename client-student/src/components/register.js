import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Register = () => {
  const [formData, setFormData] = useState({
    student_number: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    institutional_email: '',
    program_enrolled: '',
    year_level: '',
    password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const isValidPTCEmail = (email) => {
    const ptcPattern = /^[a-zA-Z0-9._%+-]+@paterostechnologicalcollege\.edu\.ph$/i;
    return ptcPattern.test(email);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.student_number.trim()) {
      setError('Student Number is required');
      return false;
    }
    if (formData.student_number.length > 20) {
      setError('Student Number must be 20 characters or less');
      return false;
    }
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError('First name and last name are required');
      return false;
    }
    if (formData.first_name.length > 100 || formData.last_name.length > 100) {
      setError('First name and last name must be 100 characters or less');
      return false;
    }
    if (formData.middle_name && formData.middle_name.length > 100) {
      setError('Middle name must be 100 characters or less');
      return false;
    }
    if (!isValidPTCEmail(formData.institutional_email)) {
      setError('Valid PTC institutional email is required (@paterostechnologicalcollege.edu.ph)');
      return false;
    }
    if (formData.institutional_email.length > 255) {
      setError('Email must be 255 characters or less');
      return false;
    }
    if (!formData.program_enrolled) {
      setError('Program enrolled is required');
      return false;
    }
    if (formData.program_enrolled.length > 100) {
      setError('Program name must be 100 characters or less');
      return false;
    }
    if (!formData.year_level) {
      setError('Year level is required');
      return false;
    }
    if (formData.year_level.length > 20) {
      setError('Year level must be 20 characters or less');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password.length > 255) {
      setError('Password must be 255 characters or less');
      return false;
    }
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const { data: existingById, error: idError } = await supabase
        .from('institutional_students')
        .select('student_number')
        .eq('student_number', formData.student_number)
        .single();

      if (existingById) {
        setError('Student Number already exists. Please use a different Student Number or contact MIS office.');
        setLoading(false);
        return;
      }

      const { data: existingByEmail, error: emailError } = await supabase
        .from('institutional_students')
        .select('institutional_email')
        .eq('institutional_email', formData.institutional_email)
        .single();

      if (existingByEmail) {
        setError('Email already registered. Please use a different email or contact MIS office.');
        setLoading(false);
        return;
      }

      const studentData = {
        student_number: formData.student_number,
        first_name: formData.first_name,
        last_name: formData.last_name,
        institutional_email: formData.institutional_email,
        program_enrolled: formData.program_enrolled,
        year_level: formData.year_level,
        enrollment_status: 'active',
        student_status: 'regular',
        created_by: 'student_registration',
        password_hash: formData.password
      };

      if (formData.middle_name.trim()) {
        studentData.middle_name = formData.middle_name;
      }

      const { data: newStudent, error: insertError } = await supabase
        .from('institutional_students')
        .insert([studentData])
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(`Database error: ${insertError.message}`);
      }

      setSuccess('Account created successfully! You can now login to access your dashboard.');
      
      setFormData({
        student_number: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        institutional_email: '',
        program_enrolled: '',
        year_level: '',
        password: '',
        confirm_password: ''
      });

      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  return (
    <div className="login-container">
      <div className="main-content-wrapper">
        <div className="login-section">
          <div className="login-form-card">
            <div className="logo-space">
              <img src="/logo-ptc.png" alt="PTC LOGO" className="logo" />
            </div>
            <div className="login-content">
              <h1>Create Student Account</h1>
              <p className="login-subtitle">Register for PTC Student Portal Access</p>
              <form onSubmit={handleRegister} className="login-form">
                <div className="form-group">
                  <input
                    type="text"
                    name="student_number"
                    placeholder="Student Number *"
                    value={formData.student_number}
                    onChange={handleChange}
                    maxLength="20"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <input
                      type="text"
                      name="first_name"
                      placeholder="First Name *"
                      value={formData.first_name}
                      onChange={handleChange}
                      maxLength="100"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="text"
                      name="middle_name"
                      placeholder="Middle Name"
                      value={formData.middle_name}
                      onChange={handleChange}
                      maxLength="100"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="last_name"
                    placeholder="Last Name *"
                    value={formData.last_name}
                    onChange={handleChange}
                    maxLength="100"
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="email"
                    name="institutional_email"
                    placeholder="institutional@paterostechnologicalcollege.edu.ph *"
                    value={formData.institutional_email}
                    onChange={handleChange}
                    maxLength="255"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <select
                      name="program_enrolled"
                      value={formData.program_enrolled}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Program *</option>
                      <option value="BSIT">BS Information Technology</option>
                      <option value="BSCS">BS Computer Science</option>
                      <option value="BSE">BS Education</option>
                      <option value="BSBA">BS Business Administration</option>
                      <option value="BSTM">BS Tourism Management</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <select
                      name="year_level"
                      value={formData.year_level}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Year Level *</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <input
                      type="password"
                      name="password"
                      placeholder="Password *"
                      value={formData.password}
                      onChange={handleChange}
                      maxLength="255"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="password"
                      name="confirm_password"
                      placeholder="Confirm Password *"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      maxLength="255"
                      required
                    />
                  </div>
                </div>
                <div className="password-requirements">
                  <p><strong>Password Requirements:</strong></p>
                  <ul>
                    <li>At least 6 characters long</li>
                    <li>Maximum 255 characters</li>
                    <li>Use a combination of letters and numbers</li>
                    <li>Avoid common passwords</li>
                  </ul>
                </div>
                {error && (
                  <div className="error-message">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="success-message">
                    {success}
                  </div>
                )}
                <button type="submit" disabled={loading} className="login-btn primary-btn">
                  {loading ? (
                    <>
                      <div className="loading-spinner-small"></div>
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={handleLoginRedirect}
                  className="login-btn create-account-btn"
                >
                  Back to Login
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div className="help-footer">
        <div className="help-footer-content">
          <div className="help-info">
            <h3>Registration Assistance</h3>
            <p>Contact MIS Office for account registration issues or if you encounter problems during sign-up.</p>
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

export default Register;