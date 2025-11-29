import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './ApplicationsList.css';

const ApplicationsList = () => {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdmissions = async () => {
    const { data, error } = await supabase
      .from('student_admissions')
      .select('*')
      .order('submitted_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching admissions:', error);
    } else {
      setAdmissions(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAdmissions();
  }, []);

  if (loading) {
    return <div className="loading">Loading applications...</div>;
  }

  return (
    <div className="applications-page">
      <div className="applications-container">
        <div className="applications-header">
          <h1>Student Applications</h1>
          <p>View all submitted student applications</p>
        </div>

        <div className="applications-list">
          {admissions.map(admission => (
            <div key={admission.id} className="application-card">
              <div className="application-header">
                <h3>{admission.full_name}</h3>
                <span className={`status-badge ${admission.exam_schedule ? 'scheduled' : 'pending'}`}>
                  {admission.exam_schedule ? 'Scheduled' : 'Pending'}
                </span>
              </div>
              
              <div className="application-details">
                <div className="detail-group">
                  <p><strong>Email:</strong> {admission.email}</p>
                  <p><strong>Birthday:</strong> {admission.birthday}</p>
                  <p><strong>Year Level:</strong> {admission.year_level}</p>
                </div>
                
                <div className="detail-group">
                  <p><strong>Submitted:</strong> {new Date(admission.submitted_at).toLocaleDateString()}</p>
                  <p><strong>Exam Schedule:</strong> {admission.exam_schedule ? new Date(admission.exam_schedule).toLocaleString() : 'Not scheduled'}</p>
                </div>
              </div>

              <div className="uploaded-files">
                <h4>Uploaded Documents:</h4>
                <div className="file-links">
                  {admission.picture_2x2 && (
                    <a href={admission.picture_2x2} target="_blank" rel="noopener noreferrer">
                      📷 2x2 Picture
                    </a>
                  )}
                  {admission.good_moral_cert && (
                    <a href={admission.good_moral_cert} target="_blank" rel="noopener noreferrer">
                      📄 Good Moral Certificate
                    </a>
                  )}
                  {admission.form_138 && (
                    <a href={admission.form_138} target="_blank" rel="noopener noreferrer">
                      📊 Form 138
                    </a>
                  )}
                  {admission.graduation_cert && (
                    <a href={admission.graduation_cert} target="_blank" rel="noopener noreferrer">
                      🎓 Graduation Certificate
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {admissions.length === 0 && (
          <div className="no-applications">
            <p>No applications submitted yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationsList;
