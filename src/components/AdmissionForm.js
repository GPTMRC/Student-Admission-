import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import FileUpload from './FileUpload';
import './AdmissionForm.css';

const AdmissionForm = () => {
  const navigate = useNavigate();
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
    student_type: 'New',             // ✅ Replaced transferee_status
    last_school_attended: 'N/A',     // ✅ Default to N/A if not transferee
    picture_2x2: '',
    good_moral_cert: '',
    form_138: '',
    graduation_cert: ''
  });

  const [loading, setLoading] = useState(false);

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
  };

  const handleFileUpload = (fileType, fileUrl) => {
    setFormData(prev => ({
      ...prev,
      [fileType]: fileUrl
    }));
  };

  const sendEmailConfirmation = async (admissionData) => {
    try {
      const studentName = `${admissionData.first_name} ${
        admissionData.middle_name ? admissionData.middle_name + ' ' : ''
      }${admissionData.last_name}`;

      const response = await fetch('http://localhost:3002/api/send-exam-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: studentName,
          student_email: admissionData.email,
          exam_schedule: admissionData.exam_schedule,
          year_level: admissionData.year_level
        }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('❌ Email request failed:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

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
            student_type: formData.student_type,                    // ✅ replaced transferee_status
            last_school_attended: formData.last_school_attended,    // ✅ matched DB
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
        const emailSent = await sendEmailConfirmation({
          ...formData,
          exam_schedule: examSchedule.toISOString()
        });

        if (emailSent) {
          alert('✅ Application submitted successfully! Exam schedule sent to your email.');
        } else {
          alert('⚠️ Application submitted but email failed. Please check your inbox.');
        }

        // Reset form
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
                <label>First Name *</label>
                <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label>Middle Name</label>
                <input type="text" name="middle_name" value={formData.middle_name} onChange={handleInputChange} />
              </div>

              <div className="form-group">
                <label>Last Name *</label>
                <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label>Sex *</label>
                <select name="sex" value={formData.sex} onChange={handleInputChange} required>
                  <option value="">Select Sex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label>Birthday *</label>
                <input type="date" name="birthday" value={formData.birthday} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label>Address *</label>
                <input type="text" name="address" value={formData.address} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label>Contact Number *</label>
                <input type="tel" name="contact_number" value={formData.contact_number} onChange={handleInputChange} required />
              </div>
            </div>
          </div>

          {/* Emergency Contact Section */}
          <div className="form-section">
            <h3>Emergency Contact</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Emergency Contact Name *</label>
                <input type="text" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Emergency Contact Number *</label>
                <input type="tel" name="emergency_contact_number" value={formData.emergency_contact_number} onChange={handleInputChange} required />
              </div>
            </div>
          </div>

          {/* Educational Background Section */}
          <div className="form-section">
            <h3>Educational Background</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Junior High School *</label>
                <input type="text" name="junior_high_school" value={formData.junior_high_school} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label>Senior High School *</label>
                <input type="text" name="senior_high_school" value={formData.senior_high_school} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label>Desired Program *</label>
                <input type="text" name="desired_program" value={formData.desired_program} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label>Year Level *</label>
                <select name="year_level" value={formData.year_level} onChange={handleInputChange} required>
                  <option value="">Select Year Level</option>
                  <option value="Freshman">Freshman</option>
                  <option value="Transferee">Transferee</option>
                </select>
              </div>

              <div className="form-group">
                <label>Student Type *</label>
                <select name="student_type" value={formData.student_type} onChange={handleInputChange} required>
                  <option value="New">New Student</option>
                  <option value="Transferee">Transferee</option>
                </select>
              </div>

              {formData.student_type === 'Transferee' && (
                <div className="form-group">
                  <label>Last School Attended *</label>
                  <input
                    type="text"
                    name="last_school_attended"
                    value={formData.last_school_attended}
                    onChange={handleInputChange}
                    required={formData.student_type === 'Transferee'}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Documents Section */}
          <div className="form-section">
            <h3>Required Documents</h3>
            <div className="file-uploads-grid">
              <FileUpload label="2x2 Picture" fileType="picture_2x2" accept="image/*" onFileUpload={handleFileUpload} currentFile={formData.picture_2x2} required />
              <FileUpload label="Certificate of Good Moral" fileType="good_moral_cert" accept=".pdf,.doc,.docx,image/*" onFileUpload={handleFileUpload} currentFile={formData.good_moral_cert} required />
              <FileUpload label="Form 138" fileType="form_138" accept=".pdf,.doc,.docx,image/*" onFileUpload={handleFileUpload} currentFile={formData.form_138} required />
              <FileUpload label="Certificate of Graduation" fileType="graduation_cert" accept=".pdf,.doc,.docx,image/*" onFileUpload={handleFileUpload} currentFile={formData.graduation_cert} required />
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
