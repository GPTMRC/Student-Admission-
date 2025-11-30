import React, { useState, useEffect } from 'react';
import './ScheduleTable.css';

const ScheduleTable = () => {
  const [scheduleData, setScheduleData] = useState([]);
  const [scheduleFilter, setScheduleFilter] = useState('all');
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScheduleData();
  }, []);

  const loadScheduleData = () => {
    setLoading(true);
    setTimeout(() => {
      const savedSchedule = localStorage.getItem('adminScheduleData');
      if (savedSchedule) {
        setScheduleData(JSON.parse(savedSchedule));
      } else {
        const initialSchedule = [
          {
            id: 1,
            student_number: '20230001',
            first_name: 'Juan',
            last_name: 'Dela Cruz',
            middle_name: 'Santos',
            institutional_email: 'juan.delacruz@paterostechnologicalcollege.edu.ph',
            program_enrolled: 'Bachelor of Science in Computer Science',
            year_level: '3rd Year',
            enrollment_status: 'Active',
            date_enrolled: '2023-08-15',
            personal_email: 'juan.delacruz@gmail.com',
            contact_number: '+639123456789',
            address: '123 Main Street, Manila',
            date_of_birth: '2002-05-15',
            gender: 'Male',
            appointment_date: new Date().toISOString().split('T')[0],
            appointment_time: '09:00',
            purpose: 'Certificate of Registration Request',
            document_type: 'Certificate of Registration',
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 2,
            student_number: '20230002',
            first_name: 'Maria',
            last_name: 'Clara',
            middle_name: 'Garcia',
            institutional_email: 'maria.clara@paterostechnologicalcollege.edu.ph',
            program_enrolled: 'Bachelor of Science in Information Technology',
            year_level: '2nd Year',
            enrollment_status: 'Active',
            date_enrolled: '2023-08-20',
            personal_email: 'maria.clara@gmail.com',
            contact_number: '+639987654321',
            address: '456 Oak Avenue, Quezon City',
            date_of_birth: '2003-03-20',
            gender: 'Female',
            appointment_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            appointment_time: '14:00',
            purpose: 'Transcript of Records Request',
            document_type: 'Transcript of Records',
            status: 'approved',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        setScheduleData(initialSchedule);
        localStorage.setItem('adminScheduleData', JSON.stringify(initialSchedule));
      }
      setLoading(false);
    }, 500);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', class: 'status-pending', color: '#F59E0B' },
      approved: { label: 'Approved', class: 'status-approved', color: '#10B981' },
      completed: { label: 'Completed', class: 'status-completed', color: '#8B5CF6' },
      cancelled: { label: 'Cancelled', class: 'status-cancelled', color: '#EF4444' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`status-badge ${config.class}`}>
        <span className="status-dot" style={{backgroundColor: config.color}}></span>
        {config.label}
      </span>
    );
  };

  const getDocumentTypeBadge = (documentType) => {
    const docConfig = {
      'Certificate of Registration': { label: 'COR', class: 'doc-cor', color: '#3B82F6' },
      'Certificate of Grade': { label: 'COG', class: 'doc-cog', color: '#06B6D4' },
      'Transcript of Records': { label: 'TOR', class: 'doc-tor', color: '#8B5CF6' }
    };

    const config = docConfig[documentType] || { label: documentType, class: 'doc-other', color: '#6B7280' };
    return (
      <span className={`doc-badge ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const getFullName = (item) => {
    return `${item.first_name} ${item.middle_name ? item.middle_name + ' ' : ''}${item.last_name}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Filter schedule data
  const filteredSchedule = scheduleData.filter(item => {
    const matchesStatus = scheduleFilter === 'all' || item.status === scheduleFilter;
    const matchesSearch = item.student_number?.toLowerCase().includes(scheduleSearch.toLowerCase()) ||
                         item.first_name?.toLowerCase().includes(scheduleSearch.toLowerCase()) ||
                         item.last_name?.toLowerCase().includes(scheduleSearch.toLowerCase()) ||
                         item.institutional_email?.toLowerCase().includes(scheduleSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Sort by appointment date and time
  const sortedSchedule = [...filteredSchedule].sort((a, b) => {
    const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
    const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
    return dateA - dateB;
  });

  const exportSchedule = () => {
    const dataStr = JSON.stringify(scheduleData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schedule-data.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const refreshData = () => {
    loadScheduleData();
  };

  if (loading) {
    return (
      <div className="schedule-table-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Loading schedule data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-table-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Appointment Schedule</h1>
          
        </div>
        <div className="header-actions">
          <button onClick={refreshData} className="btn btn-outline">
            Refresh
          </button>
          <button onClick={exportSchedule} className="btn btn-primary">
            Export Data
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-number">{scheduleData.length}</div>
            <div className="stat-label">Total Appointments</div>
          </div>
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-number">
              {scheduleData.filter(item => item.status === 'pending').length}
            </div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-number">
              {scheduleData.filter(item => item.status === 'approved').length}
            </div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-number">
              {scheduleData.filter(item => item.status === 'completed').length}
            </div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 12L11 14L15 10M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-section">
        <div className="search-control">
          <div className="search-input-wrapper">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 14L11.1 11.1M12.6667 7.33333C12.6667 10.2789 10.2789 12.6667 7.33333 12.6667C4.38781 12.6667 2 10.2789 2 7.33333C2 4.38781 4.38781 2 7.33333 2C10.2789 2 12.6667 4.38781 12.6667 7.33333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search by student name, number, or email..."
              value={scheduleSearch}
              onChange={(e) => setScheduleSearch(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <div className="filter-control">
          <select
            value={scheduleFilter}
            onChange={(e) => setScheduleFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="table-container">
        <div className="table-header">
          <h3>Appointment Records</h3>
          <div className="table-summary">
            Showing {sortedSchedule.length} of {scheduleData.length} records
          </div>
        </div>
        <div className="table-wrapper">
          <table className="schedule-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Appointment</th>
                <th>Document</th>
                <th>Program</th>
                <th>Status</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {sortedSchedule.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">
                    <div className="empty-state">
                      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                        <path d="M8 6H40C41.1046 6 42 6.89543 42 8V40C42 41.1046 41.1046 42 40 42H8C6.89543 42 6 41.1046 6 40V8C6 6.89543 6.89543 6 8 6Z" stroke="#D1D5DB" strokeWidth="2"/>
                        <path d="M16 16H32M16 24H28M16 32H24" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <h4>No appointments found</h4>
                      <p>No schedule data matches your current filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedSchedule.map((item) => (
                  <tr key={item.id} className="schedule-row">
                    <td>
                      <div className="student-cell">
                        <div className="student-name">{getFullName(item)}</div>
                        <div className="student-id">{item.student_number}</div>
                        <div className="student-email">{item.institutional_email}</div>
                      </div>
                    </td>
                    <td>
                      <div className="appointment-cell">
                        <div className="appointment-date">{formatDate(item.appointment_date)}</div>
                        <div className="appointment-time">{formatTime(item.appointment_time)}</div>
                      </div>
                    </td>
                    <td>
                      <div className="document-cell">
                        {getDocumentTypeBadge(item.document_type)}
                        <div className="document-purpose">{item.purpose}</div>
                      </div>
                    </td>
                    <td>
                      <div className="program-cell">
                        <div className="program-name">{item.program_enrolled}</div>
                        <div className="program-year">{item.year_level}</div>
                      </div>
                    </td>
                    <td>
                      {getStatusBadge(item.status)}
                    </td>
                    <td>
                      <div className="contact-cell">
                        <div className="contact-phone">{item.contact_number}</div>
                        <div className="contact-email">{item.personal_email}</div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ScheduleTable;