import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import FileUpload from './FileUpload';
import './AdmissionForm.css';

const AdmissionForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    birthday: '',
    year_level: '',
    picture_2x2: '',
    good_moral_cert: '',
    form_138: '',
    graduation_cert: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (fileType, fileUrl) => {
    setFormData(prev => ({
      ...prev,
      [fileType]: fileUrl
    }));
  };

  const sendEmailConfirmation = async (admissionData) => {
    try {
      console.log('📧 Attempting to send email to:', admissionData.email);
      
      const response = await fetch('http://localhost:3002/api/send-exam-email', {  // ← CHANGED TO 3002
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_name: admissionData.full_name,
          student_email: admissionData.email,
          exam_schedule: admissionData.exam_schedule,
          year_level: admissionData.year_level
        }),
      });

      const result = await response.json();
      console.log('Email API response:', result);
      
      if (result.success) {
        console.log('✅ Email sent successfully:', result.messageId);
        return true;
      } else {
        console.error('❌ Email API failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Email request failed:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    console.log('📝 Form submission started...');

    const requiredFiles = ['picture_2x2', 'good_moral_cert', 'form_138', 'graduation_cert'];
    const missingFiles = requiredFiles.filter(fileType => !formData[fileType]);

    if (missingFiles.length > 0) {
      alert(`Please upload all required files: ${missingFiles.join(', ')}`);
      setLoading(false);
      return;
    }

    try {
      const examSchedule = new Date();
      examSchedule.setDate(examSchedule.getDate() + 7);

      console.log('💾 Saving to database...');
      
      const { data, error } = await supabase
        .from('student_admissions')
        .insert([
          {
            full_name: formData.full_name,
            email: formData.email,
            birthday: formData.birthday,
            year_level: formData.year_level,
            picture_2x2: formData.picture_2x2,
            good_moral_cert: formData.good_moral_cert,
            form_138: formData.form_138,
            graduation_cert: formData.graduation_cert,
            exam_schedule: examSchedule.toISOString()
          }
        ])
        .select();

      if (error) {
        console.error('❌ Database error:', error);
        alert('Error submitting application: ' + error.message);
      } else {
        console.log('✅ Database save successful, sending email...');
        
        // Send email confirmation
        const emailSent = await sendEmailConfirmation({
          ...formData,
          exam_schedule: examSchedule.toISOString()
        });
        
        if (emailSent) {
          console.log('✅ Application and email successful!');
          alert('Application submitted successfully! Exam schedule sent to your email.');
        } else {
          console.log('⚠️ Application saved but email failed');
          alert('Application submitted successfully! But failed to send email. Please check your email inbox or contact admissions.');
        }
        
        // Reset form and redirect
        setFormData({
          full_name: '',
          email: '',
          birthday: '',
          year_level: '',
          picture_2x2: '',
          good_moral_cert: '',
          form_138: '',
          graduation_cert: ''
        });
        
        navigate('/applications');
      }
    } catch (error) {
      console.error('❌ General error:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admission-form-page">
      <div className="form-container">
        <div className="form-header">
          <h1>Student Application Form</h1>
          <p>Please fill out all required information and upload necessary documents</p>
        </div>

        <form onSubmit={handleSubmit} className="admission-form">
          {/* Personal Information Section */}
          <div className="form-section">
            <h3>Personal Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Birthday *</label>
                <input
                  type="date"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Year Level *</label>
                <select
                  name="year_level"
                  value={formData.year_level}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Year Level</option>
                  <option value="Freshman">Freshman</option>
                  <option value="Sophomore">Sophomore</option>
                  <option value="Junior">Junior</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="form-section">
            <h3>Required Documents</h3>
            <div className="file-uploads-grid">
              <FileUpload
                label="2x2 Picture"
                fileType="picture_2x2"
                accept="image/*"
                onFileUpload={handleFileUpload}
                currentFile={formData.picture_2x2}
                required
              />

              <FileUpload
                label="Certificate of Good Moral"
                fileType="good_moral_cert"
                accept=".pdf,.doc,.docx,image/*"
                onFileUpload={handleFileUpload}
                currentFile={formData.good_moral_cert}
                required
              />

              <FileUpload
                label="Form 138"
                fileType="form_138"
                accept=".pdf,.doc,.docx,image/*"
                onFileUpload={handleFileUpload}
                currentFile={formData.form_138}
                required
              />

              <FileUpload
                label="Certificate of Graduation"
                fileType="graduation_cert"
                accept=".pdf,.doc,.docx,image/*"
                onFileUpload={handleFileUpload}
                currentFile={formData.graduation_cert}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdmissionForm;