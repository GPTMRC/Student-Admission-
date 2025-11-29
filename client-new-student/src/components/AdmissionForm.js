import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import FileUpload from './FileUpload';
import './AdmissionForm.css';

const AdmissionForm = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    birthday: '',
    sex: '',
    address: '',
    contact_number: '',
    emergency_contact_name: '',
    emergency_contact_number: '',
    junior_high_school: '',
    senior_high_school: '',
    desired_program: '',
    year_level: '',
    student_type: 'New',
    last_school_attended: 'N/A',
    picture_2x2: '',
    good_moral_cert: '',
    form_138: '',
    graduation_cert: ''
  });

  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const [summaryExamScheduleISO, setSummaryExamScheduleISO] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4001';

  const programs = [
    'Bachelor of Science in Information Technology',
    'Bachelor of Science in Office Administration',
    'Certificate in Office Administration',
    'Certificate of Computer Science',
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'student_type') {
      setFormData(prev => ({
        ...prev,
        student_type: value,
        last_school_attended: value === 'New' ? 'N/A' : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileUpload = (fileType, fileUrl) => {
    setFormData(prev => ({
      ...prev,
      [fileType]: fileUrl
    }));
  };

  const validateForm = () => {
    const errors = {};
    
    // Required fields validation
    const requiredFields = [
      'first_name', 'last_name', 'email', 'birthday', 'sex', 
      'address', 'contact_number', 'emergency_contact_name', 
      'emergency_contact_number', 'junior_high_school', 
      'senior_high_school', 'desired_program', 'year_level'
    ];

    requiredFields.forEach(field => {
      if (!formData[field]?.toString().trim()) {
        errors[field] = 'This field is required';
      }
    });

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // File validation
    const requiredFiles = ['picture_2x2', 'good_moral_cert', 'form_138', 'graduation_cert'];
    requiredFiles.forEach(fileType => {
      if (!formData[fileType]) {
        errors[fileType] = 'This document is required';
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const sendEmailConfirmation = async (admissionData) => {
    try {
      const studentName = `${admissionData.first_name} ${admissionData.middle_name ? admissionData.middle_name + ' ' : ''}${admissionData.last_name}`;

      const resp = await fetch(`${API_BASE_URL}/send-confirmation`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          student_name: studentName,
          student_email: admissionData.email,
          exam_schedule: admissionData.exam_schedule,
          year_level: admissionData.year_level
        }),
      });

      const text = await resp.text().catch(() => '');
      let json;
      try { json = text ? JSON.parse(text) : null; } catch (err) { json = null; }

      if (!resp.ok) {
        console.error('❌ /send-confirmation error', resp.status, resp.statusText, { bodyText: text, bodyJson: json });
        return { success: false, error: `Server ${resp.status}: ${json?.message || text || resp.statusText}`, raw: text, payload: json };
      }

      if (!json) {
        console.warn('⚠️ /send-confirmation returned non-JSON response:', text);
        return { success: false, error: 'Non-JSON response from server', raw: text };
      }

      if (typeof json.success === 'boolean') {
        if (json.success) return { success: true, payload: json };
        return { success: false, error: json.message || 'Email API reported failure', payload: json };
      }

      return { success: true, payload: json };

    } catch (error) {
      console.error('❌ Email request failed (network/parsing):', error);
      return { success: false, error: error.message || 'Network or parsing error' };
    }
  };

  const testBackendConnection = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/test-frontend-connection`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          test: 'frontend connection',
          timestamp: new Date().toISOString()
        }),
      });

      const text = await resp.text().catch(() => '');
      let json;
      try { json = text ? JSON.parse(text) : null; } catch (_) { json = null; }

      if (!resp.ok) {
        console.error('❌ test-frontend-connection responded with', resp.status, resp.statusText, { bodyText: text, bodyJson: json });
        return false;
      }

      if (json && typeof json.success === 'boolean') {
        return json.success;
      }

      return true;
    } catch (error) {
      console.error('❌ Backend connection test failed:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!validateForm()) {
      alert('Please fill in all required fields and upload all documents.');
      setLoading(false);
      return;
    }

    const connectionOk = await testBackendConnection();
    if (!connectionOk) {
      alert('⚠️ Cannot connect to server. Please try again later. (Check backend is running on ' + API_BASE_URL + ')');
      setLoading(false);
      return;
    }

    const examSchedule = new Date();
    examSchedule.setDate(examSchedule.getDate() + 7);
    setSummaryExamScheduleISO(examSchedule.toISOString());
    setShowSummary(true);
    setLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitConfirmed = async () => {
    setShowSummary(false);
    setLoading(true);

    try {
      const examScheduleISO = summaryExamScheduleISO || (() => {
        const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString();
      })();

      const { data, error } = await supabase
        .from('student_admissions')
        .insert([
          {
            first_name: formData.first_name,
            middle_name: formData.middle_name,
            last_name: formData.last_name,
            email: formData.email,
            birthday: formData.birthday,
            sex: formData.sex,
            address: formData.address,
            contact_number: formData.contact_number,
            emergency_contact_name: formData.emergency_contact_name,
            emergency_contact_number: formData.emergency_contact_number,
            junior_high_school: formData.junior_high_school,
            senior_high_school: formData.senior_high_school,
            desired_program: formData.desired_program,
            year_level: formData.year_level,
            student_type: formData.student_type,
            last_school_attended: formData.last_school_attended,
            picture_2x2: formData.picture_2x2,
            good_moral_cert: formData.good_moral_cert,
            form_138: formData.form_138,
            graduation_cert: formData.graduation_cert,
            exam_schedule: examScheduleISO,
            submitted_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) {
        console.error('❌ Database error:', error);
        alert('Error submitting application: ' + (error.message || JSON.stringify(error)));
        setLoading(false);
        return;
      }

      const emailResult = await sendEmailConfirmation({
        ...formData,
        exam_schedule: examScheduleISO
      });

      if (emailResult.success) {
        alert('✅ Application submitted successfully! Exam schedule sent to your email.');
      } else {
        console.warn('Email send failed details:', emailResult);
        const serverMsg = emailResult.error ? ` (${emailResult.error})` : '';
        alert('⚠️ Application submitted but email failed to send. Check console / server logs' + serverMsg);
      }

      setFormData({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        birthday: '',
        sex: '',
        address: '',
        contact_number: '',
        emergency_contact_name: '',
        emergency_contact_number: '',
        junior_high_school: '',
        senior_high_school: '',
        desired_program: '',
        year_level: '',
        student_type: 'New',
        last_school_attended: 'N/A',
        picture_2x2: '',
        good_moral_cert: '',
        form_138: '',
        graduation_cert: ''
      });

      setFormErrors({});
      setSummaryExamScheduleISO(null);

      window.scrollTo({ top: 0, behavior: 'smooth' });
      const firstInput = document.querySelector('input[name="first_name"]');
      if (firstInput) firstInput.focus();

    } catch (error) {
      console.error('❌ General error:', error);
      alert('Error: ' + (error.message || JSON.stringify(error)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fillup-form-page">
      <div className="form-paper">
        {/* Form Header */}
        <div className="form-header">
          <div className="university-header">
            <h1>Pateros Technology College</h1>
            <p>Office of Admissions and Registration</p>
            <h2>STUDENT APPLICATION FORM</h2>
          </div>
          <div className="form-instructions">
            <p><strong>Instructions:</strong> Fill out all fields completely and accurately. Fields marked with <span className="required">*</span> are required.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Section 1: Personal Information */}
          <div className="form-section">
            <div className="section-header">
              <span className="section-number">I.</span>
              <h3>PERSONAL INFORMATION</h3>
            </div>
            
            <div className="form-grid">
              <div className="input-group">
                <label>First Name <span className="required">*</span></label>
                <input 
                  type="text" 
                  name="first_name" 
                  value={formData.first_name} 
                  onChange={handleInputChange}
                  className={formErrors.first_name ? 'error' : ''} 
                  placeholder="Enter first name"
                />
                {formErrors.first_name && <span className="error-text">{formErrors.first_name}</span>}
              </div>

              <div className="input-group">
                <label>Middle Name</label>
                <input 
                  type="text" 
                  name="middle_name" 
                  value={formData.middle_name} 
                  onChange={handleInputChange}
                  placeholder="Enter middle name"
                />
              </div>

              <div className="input-group">
                <label>Last Name <span className="required">*</span></label>
                <input 
                  type="text" 
                  name="last_name" 
                  value={formData.last_name} 
                  onChange={handleInputChange}
                  className={formErrors.last_name ? 'error' : ''}
                  placeholder="Enter last name"
                />
                {formErrors.last_name && <span className="error-text">{formErrors.last_name}</span>}
              </div>

              <div className="input-group">
                <label>Sex <span className="required">*</span></label>
                <select 
                  name="sex" 
                  value={formData.sex} 
                  onChange={handleInputChange}
                  className={formErrors.sex ? 'error' : ''}
                >
                  <option value="">Select Sex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                {formErrors.sex && <span className="error-text">{formErrors.sex}</span>}
              </div>

              <div className="input-group">
                <label>Email <span className="required">*</span></label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleInputChange}
                  className={formErrors.email ? 'error' : ''}
                  placeholder="your.email@example.com"
                />
                {formErrors.email && <span className="error-text">{formErrors.email}</span>}
              </div>

              <div className="input-group">
                <label>Birthday <span className="required">*</span></label>
                <input 
                  type="date" 
                  name="birthday" 
                  value={formData.birthday} 
                  onChange={handleInputChange}
                  className={formErrors.birthday ? 'error' : ''}
                />
                {formErrors.birthday && <span className="error-text">{formErrors.birthday}</span>}
              </div>

              <div className="input-group full-width">
                <label>Address <span className="required">*</span></label>
                <input 
                  type="text" 
                  name="address" 
                  value={formData.address} 
                  onChange={handleInputChange}
                  className={formErrors.address ? 'error' : ''}
                  placeholder="Complete address including city and zip code"
                />
                {formErrors.address && <span className="error-text">{formErrors.address}</span>}
              </div>

              <div className="input-group">
                <label>Contact Number <span className="required">*</span></label>
                <input 
                  type="tel" 
                  name="contact_number" 
                  value={formData.contact_number} 
                  onChange={handleInputChange}
                  className={formErrors.contact_number ? 'error' : ''}
                  placeholder="0912 345 6789"
                />
                {formErrors.contact_number && <span className="error-text">{formErrors.contact_number}</span>}
              </div>
            </div>
          </div>

          {/* Section 2: Emergency Contact */}
          <div className="form-section">
            <div className="section-header">
              <span className="section-number">II.</span>
              <h3>EMERGENCY CONTACT</h3>
            </div>
            
            <div className="form-grid">
              <div className="input-group">
                <label>Emergency Contact Name <span className="required">*</span></label>
                <input 
                  type="text" 
                  name="emergency_contact_name" 
                  value={formData.emergency_contact_name} 
                  onChange={handleInputChange}
                  className={formErrors.emergency_contact_name ? 'error' : ''}
                  placeholder="Full name of emergency contact"
                />
                {formErrors.emergency_contact_name && <span className="error-text">{formErrors.emergency_contact_name}</span>}
              </div>
              
              <div className="input-group">
                <label>Emergency Contact Number <span className="required">*</span></label>
                <input 
                  type="tel" 
                  name="emergency_contact_number" 
                  value={formData.emergency_contact_number} 
                  onChange={handleInputChange}
                  className={formErrors.emergency_contact_number ? 'error' : ''}
                  placeholder="0912 345 6789"
                />
                {formErrors.emergency_contact_number && <span className="error-text">{formErrors.emergency_contact_number}</span>}
              </div>
            </div>
          </div>

          {/* Section 3: Educational Background */}
          <div className="form-section">
            <div className="section-header">
              <span className="section-number">III.</span>
              <h3>EDUCATIONAL BACKGROUND</h3>
            </div>
            
            <div className="education-table">
              <div className="table-header">
                <div>Level</div>
                <div>Name of School</div>
              </div>
              
              <div className="table-row">
                <div className="table-label">Junior High School <span className="required">*</span></div>
                <div className="table-input">
                  <input
                    type="text"
                    name="junior_high_school"
                    value={formData.junior_high_school}
                    onChange={handleInputChange}
                    className={formErrors.junior_high_school ? 'error' : ''}
                    placeholder="Name of junior high school"
                  />
                </div>
              </div>

              <div className="table-row">
                <div className="table-label">Senior High School <span className="required">*</span></div>
                <div className="table-input">
                  <input
                    type="text"
                    name="senior_high_school"
                    value={formData.senior_high_school}
                    onChange={handleInputChange}
                    className={formErrors.senior_high_school ? 'error' : ''}
                    placeholder="Name of senior high school"
                  />
                </div>
              </div>
            </div>

            <div className="form-grid">
              <div className="input-group">
                <label>Desired Program <span className="required">*</span></label>
                <select
                  name="desired_program"
                  value={formData.desired_program}
                  onChange={handleInputChange}
                  className={formErrors.desired_program ? 'error' : ''}
                >
                  <option value="">Select Program</option>
                  {programs.map(program => (
                    <option key={program} value={program}>{program}</option>
                  ))}
                </select>
                {formErrors.desired_program && <span className="error-text">{formErrors.desired_program}</span>}
              </div>

              <div className="input-group">
                <label>Year Level <span className="required">*</span></label>
                <select 
                  name="year_level" 
                  value={formData.year_level} 
                  onChange={handleInputChange}
                  className={formErrors.year_level ? 'error' : ''}
                >
                  <option value="">Select Year Level</option>
                  <option value="Freshman">Freshman</option>
                  <option value="Transferee">Transferee</option>
                </select>
                {formErrors.year_level && <span className="error-text">{formErrors.year_level}</span>}
              </div>

              <div className="input-group">
                <label>Student Type <span className="required">*</span></label>
                <select 
                  name="student_type" 
                  value={formData.student_type} 
                  onChange={handleInputChange}
                >
                  <option value="New">New Student</option>
                  <option value="Transferee">Transferee</option>
                </select>
              </div>

              {formData.student_type === 'Transferee' && (
                <div className="input-group">
                  <label>Last School Attended <span className="required">*</span></label>
                  <input
                    type="text"
                    name="last_school_attended"
                    value={formData.last_school_attended}
                    onChange={handleInputChange}
                    placeholder="Name of previous school"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Required Documents */}
          <div className="form-section">
            <div className="section-header">
              <span className="section-number">IV.</span>
              <h3>REQUIRED DOCUMENTS</h3>
            </div>
            
            <div className="documents-grid">
              <FileUpload 
                label="2x2 ID Picture" 
                fileType="picture_2x2" 
                accept="image/*" 
                onFileUpload={handleFileUpload} 
                currentFile={formData.picture_2x2}
                error={formErrors.picture_2x2}
                required 
              />
              <FileUpload 
                label="Certificate of Good Moral" 
                fileType="good_moral_cert" 
                accept=".pdf,.doc,.docx,image/*" 
                onFileUpload={handleFileUpload} 
                currentFile={formData.good_moral_cert}
                error={formErrors.good_moral_cert}
                required 
              />
              <FileUpload 
                label="Form 138 (Report Card)" 
                fileType="form_138" 
                accept=".pdf,.doc,.docx,image/*" 
                onFileUpload={handleFileUpload} 
                currentFile={formData.form_138}
                error={formErrors.form_138}
                required 
              />
              <FileUpload 
                label="Certificate of Graduation" 
                fileType="graduation_cert" 
                accept=".pdf,.doc,.docx,image/*" 
                onFileUpload={handleFileUpload} 
                currentFile={formData.graduation_cert}
                error={formErrors.graduation_cert}
                required 
              />
            </div>
          </div>

          {/* Section 5: Important Notes */}
          <div className="form-section important-notes">
            <div className="section-header">
              <span className="section-number">V.</span>
              <h3>IMPORTANT EXAMINATION NOTES</h3>
            </div>
            
            <div className="notes-content">
              <div className="note-item">
                <strong>🖊️ What to Bring on Exam Day:</strong>
                <ul>
                  <li>Original 2x2 ID Picture</li>
                  <li>Original Certificate of Good Moral</li>
                  <li>Original Form 138</li>
                  <li>Original Certificate of Graduation</li>
                  <li>Ballpen (Black ink only)</li>
                  <li>Valid ID for verification</li>
                </ul>
              </div>
              
              <div className="note-item">
                <strong>📝 Examination Guidelines:</strong>
                <ul>
                  <li>Arrive 30 minutes before your scheduled exam time</li>
                  <li>Dress appropriately (no slippers, no sleeveless)</li>
                  <li>Mobile phones must be turned off during the exam</li>
                  <li>Follow all instructions from the proctor</li>
                  <li>No cheating - immediate disqualification if caught</li>
                </ul>
              </div>

              <div className="note-item warning">
                <strong>⚠️ Important Reminder:</strong>
                <p>Bring the ORIGINAL documents that you uploaded. Photocopies will not be accepted during the examination and document verification process.</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'SUBMITTING APPLICATION...' : 'SUBMIT APPLICATION'}
            </button>
          </div>
        </form>
      </div>

      {/* Summary Modal */}
      {showSummary && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Review Application Before Sending</h3>
              <p>Please review the summary below. If everything looks correct click <strong>Confirm & Send</strong>. Click <strong>Back</strong> to return to the form and make changes.</p>
            </div>

            <div className="modal-body">
              <div className="summary-section">
                <h4 className="summary-section-title">Personal Information</h4>
                <div className="summary-grid">
                  <div className="summary-row">
                    <div className="summary-label">Full Name:</div>
                    <div className="summary-value">{`${formData.first_name} ${formData.middle_name ? formData.middle_name + ' ' : ''}${formData.last_name}`}</div>
                  </div>

                  <div className="summary-row">
                    <div className="summary-label">Email:</div>
                    <div className="summary-value">{formData.email}</div>
                  </div>

                  <div className="summary-row">
                    <div className="summary-label">Birthday / Sex:</div>
                    <div className="summary-value">{formData.birthday} / {formData.sex}</div>
                  </div>

                  <div className="summary-row">
                    <div className="summary-label">Contact Number:</div>
                    <div className="summary-value">{formData.contact_number}</div>
                  </div>

                  <div className="summary-row">
                    <div className="summary-label">Address:</div>
                    <div className="summary-value">{formData.address}</div>
                  </div>
                </div>
              </div>

              <div className="summary-section">
                <h4 className="summary-section-title">Emergency Contact</h4>
                <div className="summary-grid">
                  <div className="summary-row">
                    <div className="summary-label">Emergency Contact:</div>
                    <div className="summary-value">{formData.emergency_contact_name} — {formData.emergency_contact_number}</div>
                  </div>
                </div>
              </div>

              <div className="summary-section">
                <h4 className="summary-section-title">Educational Background</h4>
                <div className="summary-grid">
                  <div className="summary-row">
                    <div className="summary-label">Education:</div>
                    <div className="summary-value">JHS: {formData.junior_high_school} | SHS: {formData.senior_high_school}</div>
                  </div>

                  <div className="summary-row">
                    <div className="summary-label">Program / Year:</div>
                    <div className="summary-value">{formData.desired_program} — {formData.year_level}</div>
                  </div>

                  <div className="summary-row">
                    <div className="summary-label">Student Type:</div>
                    <div className="summary-value">{formData.student_type}{formData.student_type === 'Transferee' ? ` — ${formData.last_school_attended}` : ''}</div>
                  </div>
                </div>
              </div>

              <div className="summary-section">
                <h4 className="summary-section-title">Examination Schedule</h4>
                <div className="summary-grid">
                  <div className="summary-row">
                    <div className="summary-label">Exam Date & Time:</div>
                    <div className="summary-value">
                      {summaryExamScheduleISO ? new Date(summaryExamScheduleISO).toLocaleString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Not scheduled'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="documents-summary">
                <strong>Uploaded Documents</strong>
                <div className="documents-list">
                  <div className="document-item">
                    <div className={`document-status-icon ${formData.picture_2x2 ? 'uploaded' : 'missing'}`}>
                      {formData.picture_2x2 ? '✓' : '!'}
                    </div>
                    <div className="document-name">2x2 ID Picture</div>
                  </div>
                  <div className="document-item">
                    <div className={`document-status-icon ${formData.good_moral_cert ? 'uploaded' : 'missing'}`}>
                      {formData.good_moral_cert ? '✓' : '!'}
                    </div>
                    <div className="document-name">Good Moral Certificate</div>
                  </div>
                  <div className="document-item">
                    <div className={`document-status-icon ${formData.form_138 ? 'uploaded' : 'missing'}`}>
                      {formData.form_138 ? '✓' : '!'}
                    </div>
                    <div className="document-name">Form 138 (Report Card)</div>
                  </div>
                  <div className="document-item">
                    <div className={`document-status-icon ${formData.graduation_cert ? 'uploaded' : 'missing'}`}>
                      {formData.graduation_cert ? '✓' : '!'}
                    </div>
                    <div className="document-name">Graduation Certificate</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setShowSummary(false)}
                className="modal-btn back"
              >
                Back to Form
              </button>

              <button
                type="button"
                onClick={submitConfirmed}
                disabled={loading}
                className="modal-btn confirm"
              >
                {loading ? (
                  <>
                    <div className="modal-loading-spinner" style={{display: 'inline-block', width: '16px', height: '16px', marginRight: '8px'}}></div>
                    SENDING...
                  </>
                ) : (
                  'Confirm & Send Application'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">Processing your application...</div>
        </div>
      )}
    </div>
  );
};

export default AdmissionForm;