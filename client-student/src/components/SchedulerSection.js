import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentDashboard.css';

// Import the document components
import CertificateOfRegistration from './CertificateOfRegistration';
import CertificateOfGrade from './CertificateOfGrade';
import TranscriptOfRecords from './TranscriptOfRecords';

const StudentDashboard = ({ studentData }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleDocumentNavigation = (documentType) => {
    setActiveSection(documentType);
  };

  const handleCloseDocument = () => {
    setActiveSection('dashboard');
  };

  if (error) {
    return (
      <div className="error-boundary">
        <h3>Something went wrong</h3>
        <p>{error.message}</p>
        <button onClick={() => setError(null)}>Try Again</button>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="admin-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading student data...</p>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', lineIcon: '◉' },
    { id: 'academics', label: 'Academic Records', lineIcon: '📓' },
    { id: 'documents', label: 'Online Documents', lineIcon: '📄' },
    { id: 'scheduler', label: 'Request Scheduler', lineIcon: '📅' },
    { id: 'applications', label: 'Applications', lineIcon: '📋' },
    { id: 'profile', label: 'My Profile', lineIcon: '👤' },
    { id: 'settings', label: 'Account Settings', lineIcon: '⚙️' },
    { id: 'resources', label: 'Campus Resources', lineIcon: '🏛️' },
  ];

  return (
    <div className="admin-dashboard">
      {/* Minimalist Sidebar with Light Green Theme */}
      <div className={`dashboard-sidebar minimal-sidebar ${sidebarOpen ? 'open' : 'closed'} ${isMobile ? 'mobile' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/logo-ptc.png" alt="PTC Logo" />
          </div>
          {sidebarOpen && (
            <div className="sidebar-title">
              <h3>PTC Student</h3>
              <span className="admin-subtitle">Portal</span>
            </div>
          )}
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item minimal-circle ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveSection(item.id);
                if (isMobile) setSidebarOpen(false);
              }}
              title={item.label}
            >
              <span className="nav-icon-circle">{item.lineIcon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {studentData.first_name?.[0]}{studentData.last_name?.[0]}
            </div>
            {sidebarOpen && (
              <div className="user-details">
                <div className="user-name">{studentData.first_name} {studentData.last_name}</div>
                <div className="user-id">{studentData.student_number}</div>
              </div>
            )}
          </div>
          <button className="nav-item minimal-circle logout-nav" onClick={handleLogout} title="Logout">
            <span className="nav-icon-circle">⤆</span>
            {sidebarOpen && <span className="nav-label">Logout</span>}
          </button>
        </div>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isMobile && sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Main Content Area */}
      <div className="dashboard-main">
        {/* Dashboard Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <button className="mobile-menu-btn" onClick={toggleSidebar}>
                <span className="menu-icon">☰</span>
              </button>
              <h1 className="page-title">
                {navItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="admin-info">
              <div className="admin-welcome">Welcome, {studentData.first_name}</div>
              <div className="admin-avatar">
                {studentData.first_name?.[0]}{studentData.last_name?.[0]}
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="dashboard-content">
          {activeSection === 'dashboard' && (
            <DashboardHome 
              studentData={studentData} 
              onDocumentNavigate={handleDocumentNavigation} 
            />
          )}
          {activeSection === 'academics' && (
            <AcademicSection studentData={studentData} />
          )}
          {activeSection === 'documents' && (
            <DocumentsSection 
              studentData={studentData} 
              onDocumentNavigate={handleDocumentNavigation}
            />
          )}
          {activeSection === 'scheduler' && (
            <SchedulerSection />
          )}
          {activeSection === 'applications' && (
            <ApplicationsSection />
          )}
          {activeSection === 'profile' && (
            <ProfileSection studentData={studentData} />
          )}
          {activeSection === 'settings' && (
            <SettingsSection />
          )}
          {activeSection === 'resources' && (
            <ResourcesSection />
          )}
          {activeSection === 'cor' && (
            <CertificateOfRegistration 
              studentData={studentData} 
              onClose={handleCloseDocument} 
            />
          )}
          {activeSection === 'grades' && (
            <CertificateOfGrade 
              studentData={studentData} 
              onClose={handleCloseDocument} 
            />
          )}
          {activeSection === 'transcript' && (
            <TranscriptOfRecords 
              studentData={studentData} 
              onClose={handleCloseDocument} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Dashboard Home Component with Updated Compact Cards
const DashboardHome = ({ studentData, onDocumentNavigate }) => {
  const [recentDocuments, setRecentDocuments] = useState([]);

  useEffect(() => {
    // Mock recent documents data
    const mockRecentDocuments = [
      { id: 1, type: 'cor', name: 'Certificate of Registration', date: '2024-01-15', status: 'available' },
      { id: 2, type: 'grades', name: 'Grade Report', date: '2024-01-10', status: 'available' },
      { id: 3, type: 'transcript', name: 'Transcript of Records', date: '2024-01-08', status: 'pending' },
    ];
    setRecentDocuments(mockRecentDocuments);
  }, []);

  const handleQuickAction = (action) => {
    switch (action) {
      case 'cor':
        onDocumentNavigate('cor');
        break;
      case 'grades':
        onDocumentNavigate('grades');
        break;
      case 'documents':
        onDocumentNavigate('documents');
        break;
      default:
        break;
    }
  };

  return (
    <div className="dashboard-home">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-content">
          <h2>Welcome back, {studentData.first_name}! 👋</h2>
          <p>Here's your academic overview for Spring 2024</p>
        </div>
        <div className="welcome-stats">
          <div className="welcome-stat">
            <span className="stat-number">15</span>
            <span className="stat-label">Current Units</span>
          </div>
          <div className="welcome-stat">
            <span className="stat-number">1.75</span>
            <span className="stat-label">Current GPA</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-controls">
        <div className="quick-actions">
          <button 
            className="action-btn primary" 
            onClick={() => handleQuickAction('cor')}
          >
            📋 Generate COR
          </button>
          <button 
            className="action-btn secondary" 
            onClick={() => handleQuickAction('grades')}
          >
            📊 View Grades
          </button>
          <button 
            className="action-btn secondary" 
            onClick={() => handleQuickAction('documents')}
          >
            📄 My Documents
          </button>
        </div>
      </div>

      {/* Student Dashboard Grid - Updated with Compact Cards */}
      <div className="student-dashboard-grid">
        {/* Personal Info Card - Compact */}
        <div className="dashboard-card personal-info-card">
          <div className="card-header">
            <h4>👤 Personal Information</h4>
          </div>
          <div className="info-grid-compact">
            <div className="info-row">
              <div className="info-row-label">Student ID</div>
              <div className="info-row-value">{studentData.student_number}</div>
            </div>
            <div className="info-row">
              <div className="info-row-label">Full Name</div>
              <div className="info-row-value">
                {studentData.first_name} {studentData.middle_name || ''} {studentData.last_name}
              </div>
            </div>
            <div className="info-row">
              <div className="info-row-label">Email</div>
              <div className="info-row-value email-value email-compact">
                {studentData.institutional_email}
              </div>
            </div>
            <div className="info-row">
              <div className="info-row-label">Status</div>
              <div className="info-row-value">
                <span className={`status-badge ${studentData.enrollment_status === 'Active' ? 'status-completed' : 'status-rejected'}`}>
                  {studentData.enrollment_status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Info Card - Compact */}
        <div className="dashboard-card academic-info-card">
          <div className="card-header">
            <h4>🎓 Academic Information</h4>
          </div>
          <div className="info-grid-compact">
            <div className="info-row">
              <div className="info-row-label">Program</div>
              <div className="info-row-value">{studentData.program_enrolled}</div>
            </div>
            <div className="info-row">
              <div className="info-row-label">Year Level</div>
              <div className="info-row-value">{studentData.year_level}</div>
            </div>
            <div className="info-row">
              <div className="info-row-label">Semester</div>
              <div className="info-row-value">Spring 2024</div>
            </div>
            <div className="info-row">
              <div className="info-row-label">Academic Year</div>
              <div className="info-row-value">2023-2024</div>
            </div>
          </div>
        </div>

        {/* Academic Stats Card - Compact */}
        <div className="dashboard-card stats-card">
          <div className="card-header">
            <h4>📊 Academic Summary</h4>
          </div>
          <div className="academic-quick-stats">
            <div className="academic-stat-item">
              <div className="academic-stat-value">1.75</div>
              <div className="academic-stat-label">Current GPA</div>
            </div>
            <div className="academic-stat-item">
              <div className="academic-stat-value">85</div>
              <div className="academic-stat-label">Units Completed</div>
            </div>
            <div className="academic-stat-item">
              <div className="academic-stat-value">15</div>
              <div className="academic-stat-label">Current Units</div>
            </div>
          </div>
        </div>

        {/* Recent Documents Card - Compact */}
        <div className="dashboard-card recent-documents-card">
          <div className="card-header">
            <h4>📄 Recent Documents</h4>
          </div>
          <div className="recent-documents-list">
            {recentDocuments.map(doc => (
              <div key={doc.id} className="recent-document-item">
                <div className="document-icon">
                  {doc.type === 'cor' && '📋'}
                  {doc.type === 'grades' && '📊'}
                  {doc.type === 'transcript' && '🎓'}
                </div>
                <div className="document-info">
                  <div className="document-name">{doc.name}</div>
                  <div className="document-date">{doc.date}</div>
                </div>
                <div className="document-status">
                  <span className={`status-badge ${doc.status === 'available' ? 'status-completed' : 'status-scheduled'}`}>
                    {doc.status === 'available' ? 'Available' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button 
            className="btn-schedule view-all-btn"
            onClick={() => onDocumentNavigate('documents')}
          >
            View All Documents
          </button>
        </div>
      </div>

      {/* Upcoming Deadlines - Compact */}
      <div className="dashboard-card deadlines-card">
        <div className="card-header">
          <h4>📅 Upcoming Deadlines</h4>
        </div>
        <div className="deadlines-list">
          <div className="deadline-item">
            <div className="deadline-date">Jan 30, 2024</div>
            <div className="deadline-title">Add/Drop Period Ends</div>
            <div className="deadline-type">Academic</div>
          </div>
          <div className="deadline-item">
            <div className="deadline-date">Feb 15, 2024</div>
            <div className="deadline-title">Midterm Examinations</div>
            <div className="deadline-type">Exams</div>
          </div>
          <div className="deadline-item">
            <div className="deadline-date">Mar 1, 2024</div>
            <div className="deadline-title">Scholarship Application</div>
            <div className="deadline-type">Financial</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Academic Section Component - Updated
const AcademicSection = ({ studentData }) => {
  const [selectedDocument, setSelectedDocument] = useState(null);

  const academicDocuments = [
    { 
      id: 'cor', 
      name: 'Certificate of Registration', 
      description: 'Current semester registration details', 
      available: true 
    },
    { 
      id: 'grades', 
      name: 'Certificate of Grade', 
      description: 'Official grade report for all semesters', 
      available: true 
    },
    { 
      id: 'transcript', 
      name: 'Transcript of Records', 
      description: 'Complete academic transcript', 
      available: true 
    },
  ];

  const handlePrintDocument = (documentId) => {
    setSelectedDocument(documentId);
    setTimeout(() => {
      alert('Printing ' + academicDocuments.find(doc => doc.id === documentId)?.name);
      setSelectedDocument(null);
    }, 2000);
  };

  return (
    <div className="section-content">
      <div className="applications-table-container">
        <div className="table-header">
          <h3>Academic Records</h3>
          <p>Access your academic documents and records</p>
        </div>
        <table className="applications-table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Description</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {academicDocuments.map(doc => (
              <tr key={doc.id}>
                <td>
                  <div className="student-name">
                    <strong>{doc.name}</strong>
                  </div>
                </td>
                <td>{doc.description}</td>
                <td>
                  <span className={`status-badge ${doc.available ? 'status-completed' : 'status-rejected'}`}>
                    {doc.available ? 'Available' : 'Processing'}
                  </span>
                </td>
                <td>
                  <button
                    className={`btn-schedule ${!doc.available ? 'disabled' : ''}`}
                    onClick={() => handlePrintDocument(doc.id)}
                    disabled={!doc.available || selectedDocument === doc.id}
                  >
                    {selectedDocument === doc.id ? 'Printing...' : 'Print'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Documents Section Component - Updated with Compact Cards
const DocumentsSection = ({ studentData, onDocumentNavigate }) => {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const mockDocuments = [
      { 
        id: 1, 
        name: 'Certificate of Registration', 
        type: 'cor', 
        status: 'available', 
        lastUpdated: '2024-01-15',
        description: 'Current semester course registration'
      },
      { 
        id: 2, 
        name: 'Certificate of Grade', 
        type: 'grades', 
        status: 'available', 
        lastUpdated: '2024-01-10',
        description: 'Academic performance report'
      },
      { 
        id: 3, 
        name: 'Transcript of Records', 
        type: 'transcript', 
        status: 'available', 
        lastUpdated: '2024-01-12',
        description: 'Complete academic history'
      },
    ];
    setDocuments(mockDocuments);
  }, []);

  const handleDocumentAction = (documentType) => {
    onDocumentNavigate(documentType);
  };

  const getDocumentIcon = (type) => {
    switch (type) {
      case 'cor': return '📋';
      case 'grades': return '📊';
      case 'transcript': return '🎓';
      default: return '📄';
    }
  };

  return (
    <div className="section-content">
      <div className="applications-table-container">
        <div className="table-header">
          <h3>Online Documents</h3>
          <p>Manage and generate your academic documents</p>
        </div>
        
        {/* Compact Documents Grid */}
        <div className="documents-grid">
          {documents.map(doc => (
            <div key={doc.id} className="document-card">
              <div className="document-icon-large">
                {getDocumentIcon(doc.type)}
              </div>
              <div className="document-info-compact">
                <h4>{doc.name}</h4>
                <p className="document-description">{doc.description}</p>
                <div className="document-meta-compact">
                  <span className="last-updated">Updated: {doc.lastUpdated}</span>
                  <span className={`status-badge ${doc.status === 'available' ? 'status-completed' : 'status-scheduled'}`}>
                    {doc.status === 'available' ? 'Available' : 'Processing'}
                  </span>
                </div>
              </div>
              <div className="document-actions">
                <button
                  className="btn-confirm btn-compact"
                  onClick={() => handleDocumentAction(doc.type)}
                >
                  Generate
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Compact Document Information */}
        <div className="documents-info">
          <h4>About Academic Documents</h4>
          <div className="info-cards-compact">
            <div className="info-card-compact">
              <h5>Certificate of Registration (COR)</h5>
              <p>Official document showing your enrolled courses, schedule, and units for the current semester.</p>
            </div>
            <div className="info-card-compact">
              <h5>Certificate of Grade</h5>
              <p>Detailed grade report showing your academic performance. Includes GPA calculation.</p>
            </div>
            <div className="info-card-compact">
              <h5>Transcript of Records (TOR)</h5>
              <p>Complete academic history including all courses taken, grades received, and official standing.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Scheduler Section Component
const SchedulerSection = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [purpose, setPurpose] = useState('');

  const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM'];

  const handleSubmitRequest = (e) => {
    e.preventDefault();
    if (selectedDate && selectedTime && purpose) {
      alert('Appointment requested for ' + selectedDate + ' at ' + selectedTime + '\nPurpose: ' + purpose);
      setSelectedDate('');
      setSelectedTime('');
      setPurpose('');
    }
  };

  return (
    <div className="section-content">
      <div className="applications-table-container">
        <div className="table-header">
          <h3>Request Certified True Copy</h3>
          <p>Schedule an appointment at the Registrar's Office</p>
        </div>
        
        <div className="scheduler-container">
          <div className="scheduler-info">
            <h4>📍 Location</h4>
            <p>Registrar's Office<br />Main Building, 2nd Floor</p>
            
            <h4>⏰ Office Hours</h4>
            <p>Monday-Friday<br />8:00 AM - 5:00 PM</p>
            
            <h4>📋 Requirements</h4>
            <p>Valid ID<br />Document Request Form</p>
          </div>
          
          <form className="scheduler-form" onSubmit={handleSubmitRequest}>
            <div className="form-group">
              <label>Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Select Time</label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                required
              >
                <option value="">Choose time slot</option>
                {timeSlots.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Purpose of Request</label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Please specify the purpose for requesting certified true copies..."
                rows={4}
                required
              />
            </div>
            
            <button type="submit" className="btn-confirm">
              Schedule Appointment
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Applications Section Component
const ApplicationsSection = () => {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    const mockApplications = [
      { id: 1, type: 'Scholarship', status: 'pending', date: '2024-01-15' },
      { id: 2, type: 'Leave of Absence', status: 'approved', date: '2024-01-10' },
      { id: 3, type: 'Subject Change', status: 'rejected', date: '2024-01-08' },
    ];
    setApplications(mockApplications);
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return 'status-completed';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-scheduled';
    }
  };

  return (
    <div className="section-content">
      <div className="applications-table-container">
        <div className="table-header">
          <h3>Application Status</h3>
          <p>Track all your applications in one place</p>
        </div>
        <table className="applications-table">
          <thead>
            <tr>
              <th>Application Type</th>
              <th>Date Submitted</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(app => (
              <tr key={app.id}>
                <td>
                  <div className="student-name">
                    <strong>{app.type}</strong>
                  </div>
                </td>
                <td>{app.date}</td>
                <td>
                  <span className={`status-badge ${getStatusBadge(app.status)}`}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </td>
                <td>
                  <button className="btn-schedule">
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Profile Section - Compact Version
const ProfileSection = ({ studentData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: studentData.first_name,
    last_name: studentData.last_name,
    middle_name: studentData.middle_name || '',
    institutional_email: studentData.institutional_email,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    alert('Profile update requested. Changes will be reviewed by administration.');
    setIsEditing(false);
  };

  return (
    <div className="section-content">
      <div className="applications-table-container">
        <div className="table-header">
          <h3>My Profile</h3>
          <p>View and manage your personal information</p>
        </div>
        <div className="profile-editor-compact">
          <div className="profile-header-compact">
            <div className="admin-avatar medium">
              {studentData.first_name?.[0]}{studentData.last_name?.[0]}
            </div>
            <div className="profile-info-compact">
              <h3>{studentData.first_name} {studentData.last_name}</h3>
              <p>{studentData.student_number}</p>
              <span className={`status-badge ${studentData.enrollment_status === 'Active' ? 'status-completed' : 'status-rejected'}`}>
                {studentData.enrollment_status}
              </span>
            </div>
          </div>
          
          <div className="info-grid-compact-profile">
            <div className="info-item-compact">
              <label>First Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="form-input-compact"
                />
              ) : (
                <span>{studentData.first_name}</span>
              )}
            </div>
            <div className="info-item-compact">
              <label>Last Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="form-input-compact"
                />
              ) : (
                <span>{studentData.last_name}</span>
              )}
            </div>
            <div className="info-item-compact">
              <label>Middle Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleInputChange}
                  className="form-input-compact"
                />
              ) : (
                <span>{studentData.middle_name || 'N/A'}</span>
              )}
            </div>
            <div className="info-item-compact">
              <label>Student Number</label>
              <span>{studentData.student_number}</span>
            </div>
            <div className="info-item-compact">
              <label>Program</label>
              <span>{studentData.program_enrolled}</span>
            </div>
            <div className="info-item-compact">
              <label>Year Level</label>
              <span>{studentData.year_level}</span>
            </div>
            <div className="info-item-compact">
              <label>Email</label>
              {isEditing ? (
                <input
                  type="email"
                  name="institutional_email"
                  value={formData.institutional_email}
                  onChange={handleInputChange}
                  className="form-input-compact"
                />
              ) : (
                <span className="email-compact">{studentData.institutional_email}</span>
              )}
            </div>
            <div className="info-item-compact">
              <label>Enrollment Status</label>
              <span>
                <span className={`status-badge ${studentData.enrollment_status === 'Active' ? 'status-completed' : 'status-rejected'}`}>
                  {studentData.enrollment_status}
                </span>
              </span>
            </div>
          </div>
          
          <div className="profile-actions-compact">
            {isEditing ? (
              <>
                <button className="btn-confirm btn-compact" onClick={handleSave}>
                  Save Changes
                </button>
                <button 
                  className="btn-schedule btn-compact" 
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      first_name: studentData.first_name,
                      last_name: studentData.last_name,
                      middle_name: studentData.middle_name || '',
                      institutional_email: studentData.institutional_email,
                    });
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button className="btn-confirm btn-compact" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Settings Section Component
const SettingsSection = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    securityAlerts: true,
  });

  const handleSettingChange = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  return (
    <div className="section-content">
      <div className="applications-table-container">
        <div className="table-header">
          <h3>Account Settings</h3>
          <p>Manage your account preferences and security</p>
        </div>
        <div className="settings-grid">
          <div className="setting-card">
            <h4>🔒 Password & Security</h4>
            <p>Change your password and manage security settings</p>
            <button className="btn-schedule">Change Password</button>
          </div>
          <div className="setting-card">
            <h4>🔔 Notifications</h4>
            <div className="setting-options">
              <label className="setting-option">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={() => handleSettingChange('emailNotifications')}
                />
                Email Notifications
              </label>
              <label className="setting-option">
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={() => handleSettingChange('pushNotifications')}
                />
                Push Notifications
              </label>
              <label className="setting-option">
                <input
                  type="checkbox"
                  checked={settings.securityAlerts}
                  onChange={() => handleSettingChange('securityAlerts')}
                />
                Security Alerts
              </label>
            </div>
          </div>
          <div className="setting-card">
            <h4>📧 Email Preferences</h4>
            <p>Manage your email notification preferences</p>
            <button className="btn-schedule">Email Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Resources Section Component
const ResourcesSection = () => {
  const resources = [
    {
      title: '💻 Learning Management System',
      description: 'Access your courses and learning materials',
      link: 'https://lms.ptc.edu'
    },
    {
      title: '📖 Library Resources',
      description: 'Digital library and research materials',
      link: 'https://library.ptc.edu'
    },
    {
      title: '🤝 Student Support',
      description: 'Get help from various campus offices',
      link: 'https://support.ptc.edu'
    },
    {
      title: '🎓 Career Services',
      description: 'Job placement and career guidance',
      link: 'https://careers.ptc.edu'
    },
    {
      title: '🏥 Health Services',
      description: 'Campus clinic and wellness resources',
      link: 'https://health.ptc.edu'
    },
    {
      title: '💰 Financial Aid',
      description: 'Scholarships and financial assistance',
      link: 'https://finaid.ptc.edu'
    }
  ];

  const handleResourceClick = (link) => {
    window.open(link, '_blank');
  };

  return (
    <div className="section-content">
      <div className="applications-table-container">
        <div className="table-header">
          <h3>Campus Resources</h3>
          <p>Access various campus services and resources</p>
        </div>
        <div className="settings-grid">
          {resources.map((resource, index) => (
            <div key={index} className="setting-card">
              <h4>{resource.title}</h4>
              <p>{resource.description}</p>
              <button 
                className="btn-schedule"
                onClick={() => handleResourceClick(resource.link)}
              >
                Access Resource
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;