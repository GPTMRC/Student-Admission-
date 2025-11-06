import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [examSchedule, setExamSchedule] = useState('');
  const [examTime, setExamTime] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    console.log('🔄 AdminDashboard mounted - starting fetchApplications');
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      console.log('🔍 Debug: Starting fetchApplications');
      console.log('🔍 Debug: Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
      console.log('🔍 Debug: Supabase Key exists:', !!process.env.REACT_APP_SUPABASE_ANON_KEY);
      console.log('🔍 Debug: supabase client:', supabase);
      
      const { data, error } = await supabase
        .from('student_admissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      console.log('🔍 Debug: Supabase response - error:', error);
      console.log('🔍 Debug: Supabase response - data length:', data?.length);
      console.log('🔍 Debug: Full error details:', JSON.stringify(error, null, 2));

      if (error) {
        console.log('🔍 Debug: Supabase error details:', error);
        throw error;
      }

      console.log('✅ Debug: Successfully fetched applications:', data);
      setApplications(data || []);
    } catch (error) {
      console.error('🔍 Debug: Catch block error:', error);
      console.error('🔍 Debug: Error message:', error.message);
      console.error('🔍 Debug: Error code:', error.code);
      alert('Error loading applications: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleExam = (application) => {
    setSelectedApplication(application);
    
    // Set default schedule (tomorrow 9:00 AM)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = tomorrow.toISOString().split('T')[0];
    
    setExamSchedule(application.exam_schedule ? application.exam_schedule.split('T')[0] : defaultDate);
    setExamTime(application.exam_schedule ? application.exam_schedule.split('T')[1].substring(0, 5) : '09:00');
    setShowScheduleModal(true);
  };

  const submitExamSchedule = async () => {
    if (!examSchedule || !examTime) {
      alert('Please select both date and time');
      return;
    }

    try {
      const examDateTime = `${examSchedule}T${examTime}:00`;
      
      console.log('🔍 Debug: Scheduling exam for:', selectedApplication.id, 'at:', examDateTime);
      
      const { error } = await supabase
        .from('student_admissions')
        .update({ 
          exam_schedule: examDateTime,
          status: 'scheduled'
        })
        .eq('id', selectedApplication.id);

      if (error) throw error;

      // Send email notification
      await sendExamScheduleEmail(selectedApplication, examDateTime);

      alert('Exam scheduled successfully! Email sent to student.');
      setShowScheduleModal(false);
      fetchApplications(); // Refresh the list
    } catch (error) {
      console.error('Error scheduling exam:', error);
      alert('Error scheduling exam: ' + error.message);
    }
  };

  const sendExamScheduleEmail = async (application, examDateTime) => {
    try {
      const studentName = `${application.first_name} ${application.middle_name ? application.middle_name + ' ' : ''}${application.last_name}`;
      
      const response = await fetch('http://localhost:4001/send-confirmation', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_name: studentName,
          student_email: application.email,
          exam_schedule: examDateTime,
          year_level: application.year_level
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      console.log('Exam schedule email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
      // Don't throw error here - the schedule was still saved
    }
  };

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      const { error } = await supabase
        .from('student_admissions')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;

      alert('Status updated successfully!');
      fetchApplications(); // Refresh the list
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status: ' + error.message);
    }
  };

  const deleteApplication = async (applicationId) => {
    if (!window.confirm('Are you sure you want to delete this application?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('student_admissions')
        .delete()
        .eq('id', applicationId);

      if (error) throw error;

      alert('Application deleted successfully!');
      fetchApplications(); // Refresh the list
    } catch (error) {
      console.error('Error deleting application:', error);
      alert('Error deleting application: ' + error.message);
    }
  };

  // Filter applications based on status and search term
  const filteredApplications = applications.filter(app => {
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    const matchesSearch = 
      app.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      submitted: { label: 'Submitted', class: 'status-submitted' },
      scheduled: { label: 'Scheduled', class: 'status-scheduled' },
      completed: { label: 'Completed', class: 'status-completed' },
      rejected: { label: 'Rejected', class: 'status-rejected' }
    };
    
    const config = statusConfig[status] || { label: 'Pending', class: 'status-pending' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading applications...</p>
      </div>
    );
  }

   return (
    <div className="admin-dashboard">
      {/* UPDATED: Dashboard Header with Logo on Left */}
      <div className="dashboard-header">
        {/* Left Side: College Information with Logo */}
        <div className="college-section">
         <div className="logo-container large transparent-bg">
          <img src="logo-ptc.png" alt="Logo" className="logo-image no-padding" />
          </div>
          <div className="college-info">
            <h1 className="college-name">Pateros Technological College</h1>
            <p className="dashboard-title">Admin Dashboard</p>
          </div>
        </div>

        {/* Right Side: Admin Section */}
        <div className="admin-section">
          <div className="admin-info">
            <div className="admin-name">Administrator</div>
            <div className="admin-role">System Admin</div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <h3>Total Applications</h3>
          <div className="stat-number">{applications.length}</div>
        </div>
        <div className="stat-card">
          <h3>Scheduled Exams</h3>
          <div className="stat-number">
            {applications.filter(app => app.status === 'scheduled').length}
          </div>
        </div>
        <div className="stat-card">
          <h3>Pending Review</h3>
          <div className="stat-number">
            {applications.filter(app => !app.status || app.status === 'submitted').length}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="dashboard-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="filter-controls">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <button onClick={fetchApplications} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="applications-table-container">
        <table className="applications-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Email</th>
              <th>Program</th>
              <th>Year Level</th>
              <th>Submitted Date</th>
              <th>Exam Schedule</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplications.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">
                  No applications found
                </td>
              </tr>
            ) : (
              filteredApplications.map((application) => (
                <tr key={application.id}>
                  <td>
                    <strong>{application.first_name} {application.last_name}</strong>
                  </td>
                  <td>{application.email}</td>
                  <td>{application.desired_program}</td>
                  <td>{application.year_level}</td>
                  <td>{formatDate(application.submitted_at)}</td>
                  <td>
                    {application.exam_schedule ? (
                      formatDate(application.exam_schedule)
                    ) : (
                      <span className="not-scheduled">Not Scheduled</span>
                    )}
                  </td>
                  <td>{getStatusBadge(application.status)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleScheduleExam(application)}
                        className="btn-schedule"
                        title="Schedule Exam"
                      >
                        🗓️ Schedule
                      </button>
                      
                      <select
                        value={application.status || 'submitted'}
                        onChange={(e) => updateApplicationStatus(application.id, e.target.value)}
                        className="status-select"
                      >
                        <option value="submitted">Submitted</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      
                      <button
                        onClick={() => deleteApplication(application.id)}
                        className="btn-delete"
                        title="Delete Application"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Schedule Exam Modal */}
      {showScheduleModal && selectedApplication && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Schedule Exam</h2>
              <button 
                onClick={() => setShowScheduleModal(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="student-info">
                <h4>Student: {selectedApplication.first_name} {selectedApplication.last_name}</h4>
                <p>Email: {selectedApplication.email}</p>
                <p>Program: {selectedApplication.desired_program}</p>
              </div>
              
              <div className="schedule-form">
                <div className="form-group">
                  <label>Exam Date *</label>
                  <input
                    type="date"
                    value={examSchedule}
                    onChange={(e) => setExamSchedule(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="form-group">
                  <label>Exam Time *</label>
                  <input
                    type="time"
                    value={examTime}
                    onChange={(e) => setExamTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                onClick={() => setShowScheduleModal(false)}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button 
                onClick={submitExamSchedule}
                className="btn-confirm"
              >
                🗓️ Schedule Exam & Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;