import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentDashboard.css';
import CertificateOfRegistration from './CertificateOfRegistration';

const StudentDashboard = ({ studentData }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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

  const handleCORNavigation = () => {
    setActiveSection('cor');
  };

  const handleCloseCOR = () => {
    setActiveSection('dashboard');
  };

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
  { id: 'cor', label: 'COR Generator', lineIcon: '🎓' },
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
            <DashboardHome studentData={studentData} onCORNavigate={handleCORNavigation} />
          )}
          {activeSection === 'academics' && (
            <AcademicSection studentData={studentData} />
          )}
          {activeSection === 'documents' && (
            <DocumentsSection studentData={studentData} />
          )}
          {activeSection === 'cor' && (
            <CertificateOfRegistration studentData={studentData} onClose={handleCloseCOR} />
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
        </div>
      </div>
    </div>
  );
};

// Dashboard Home Component with Combined Student Profile and Recent Activity
const DashboardHome = ({ studentData, onCORNavigate }) => {
  return (
    <div className="dashboard-home">
      {/* Statistics Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-info">
            <h3>Current GPA</h3>
            <div className="stat-number">1.75</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <h3>Units Enrolled</h3>
            <div className="stat-number">15</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>Pending Documents</h3>
            <div className="stat-number">2</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>Completed Courses</h3>
            <div className="stat-number">24</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-controls">
        <div className="quick-actions">
          <button className="action-btn primary" onClick={onCORNavigate}>
            🎓 Generate COR
          </button>
          <button className="action-btn secondary">
            📚 View Grades
          </button>
          <button className="action-btn secondary">
            📄 My Documents
          </button>
        </div>
      </div>

      {/* Combined Student Profile with Recent Activity */}
      <div className="applications-table-container">
        <div className="table-header">
          <h3>Student Profile & Recent Activity</h3>
        </div>
        <div className="student-profile-activity-grid">
          {/* Student Information Column */}
          <div className="student-info-column">
            {/* Personal Info Card */}
            <div className="student-info-card">
              <h4>👤 Personal Information</h4>
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
              </div>
            </div>

            {/* Academic Info Card */}
            <div className="student-info-card">
              <h4>🎓 Academic Information</h4>
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
                  <div className="info-row-label">Status</div>
                  <div className="info-row-value">
                    <span className={`status-badge ${studentData.enrollment_status === 'Active' ? 'status-completed' : 'status-rejected'}`}>
                      {studentData.enrollment_status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Stats Card */}
            <div className="student-info-card">
              <h4>📊 Academic Summary</h4>
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
          </div>

          {/* Recent Activities Column */}
          <div className="recent-activities-column">
            <div className="student-info-card">
              <h4>📈 Recent Activities</h4>
              <div className="recent-activities-list">
                <div className="activity-item">
                  <div className="activity-icon">📊</div>
                  <div className="activity-content">
                    <div className="activity-title">Midterm Grades Posted</div>
                    <div className="activity-date">2024-01-15</div>
                    <div className="activity-status">
                      <span className="status-badge status-completed">Completed</span>
                    </div>
                    <div className="activity-details">All subjects updated with midterm grades</div>
                  </div>
                </div>
                
                <div className="activity-item">
                  <div className="activity-icon">📄</div>
                  <div className="activity-content">
                    <div className="activity-title">COR Generation</div>
                    <div className="activity-date">2024-01-10</div>
                    <div className="activity-status">
                      <span className="status-badge status-completed">Available</span>
                    </div>
                    <div className="activity-details">Certificate of Registration ready for download</div>
                  </div>
                </div>
                
                <div className="activity-item">
                  <div className="activity-icon">📚</div>
                  <div className="activity-content">
                    <div className="activity-title">Library Book Return</div>
                    <div className="activity-date">2024-01-08</div>
                    <div className="activity-status">
                      <span className="status-badge status-scheduled">Pending</span>
                    </div>
                    <div className="activity-details">Due in 3 days - "Advanced Calculus"</div>
                  </div>
                </div>
                
                <div className="activity-item">
                  <div className="activity-icon">💳</div>
                  <div className="activity-content">
                    <div className="activity-title">Tuition Payment</div>
                    <div className="activity-date">2024-01-05</div>
                    <div className="activity-status">
                      <span className="status-badge status-completed">Processed</span>
                    </div>
                    <div className="activity-details">Payment confirmed for Spring 2024</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Academic Section Component
const AcademicSection = ({ studentData }) => {
  const [selectedDocument, setSelectedDocument] = useState(null);

  const academicDocuments = [
    { id: 'cor', name: 'Certificate of Registration', description: 'Current semester registration details', available: true },
    { id: 'grades', name: 'Grade Report', description: 'Official grade report for all semesters', available: true },
    { id: 'transcript', name: 'Official Transcript', description: 'Complete academic transcript', available: false },
    { id: 'enrollment', name: 'Enrollment Verification', description: 'Proof of current enrollment', available: true },
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
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>Current GPA</h3>
            <div className="stat-number">1.75</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-info">
            <h3>Units Completed</h3>
            <div className="stat-number">85</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-info">
            <h3>Remaining Units</h3>
            <div className="stat-number">35</div>
          </div>
        </div>
      </div>

      <div className="applications-table-container">
        <div className="table-header">
          <h3>Academic Documents</h3>
          <p>Print your academic documents online</p>
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

// Documents Section Component
const DocumentsSection = ({ studentData }) => {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const mockDocuments = [
      { id: 1, name: 'Certificate of Registration', type: 'cor', status: 'available', lastUpdated: '2024-01-15' },
      { id: 2, name: 'Official Transcript', type: 'transcript', status: 'processing', lastUpdated: '2024-01-10' },
      { id: 3, name: 'Enrollment Verification', type: 'verification', status: 'available', lastUpdated: '2024-01-12' },
    ];
    setDocuments(mockDocuments);
  }, []);

  return (
    <div className="section-content">
      <div className="applications-table-container">
        <div className="table-header">
          <h3>Online Documents</h3>
          <p>Manage and download your academic documents</p>
        </div>
        <table className="applications-table">
          <thead>
            <tr>
              <th>Document Name</th>
              <th>Type</th>
              <th>Last Updated</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map(doc => (
              <tr key={doc.id}>
                <td>
                  <div className="student-name">
                    <strong>{doc.name}</strong>
                  </div>
                </td>
                <td>{doc.type}</td>
                <td>{doc.lastUpdated}</td>
                <td>
                  <span className={`status-badge ${doc.status === 'available' ? 'status-completed' : 'status-scheduled'}`}>
                    {doc.status === 'available' ? 'Available' : 'Processing'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-schedule" disabled={doc.status !== 'available'}>
                      Download
                    </button>
                    <button className="btn-schedule" disabled={doc.status !== 'available'}>
                      Print
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
    alert('Appointment requested for ' + selectedDate + ' at ' + selectedTime + '\nPurpose: ' + purpose);
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
const ApplicationsSection = () => (
  <div className="section-content">
    <div className="applications-table-container">
      <div className="table-header">
        <h3>Application Status</h3>
        <p>Track all your applications in one place</p>
      </div>
      <div className="no-data">
        <div className="placeholder-icon">📋</div>
        <h3>Application tracking coming soon...</h3>
        <p>This feature is currently under development</p>
      </div>
    </div>
  </div>
);

// Profile Section Component
const ProfileSection = ({ studentData }) => (
  <div className="section-content">
    <div className="applications-table-container">
      <div className="table-header">
        <h3>My Profile</h3>
        <p>View and manage your personal information</p>
      </div>
      <div className="profile-editor">
        <div className="profile-header">
          <div className="admin-avatar large">
            {studentData.first_name?.[0]}{studentData.last_name?.[0]}
          </div>
          <div className="profile-info">
            <h3>{studentData.first_name} {studentData.last_name}</h3>
            <p>{studentData.student_number}</p>
          </div>
        </div>
        
        <div className="info-grid">
          <div className="info-item">
            <label>First Name:</label>
            <span>{studentData.first_name}</span>
          </div>
          <div className="info-item">
            <label>Last Name:</label>
            <span>{studentData.last_name}</span>
          </div>
          <div className="info-item">
            <label>Student Number:</label>
            <span>{studentData.student_number}</span>
          </div>
          <div className="info-item">
            <label>Program:</label>
            <span>{studentData.program_enrolled}</span>
          </div>
          <div className="info-item">
            <label>Year Level:</label>
            <span>{studentData.year_level}</span>
          </div>
          <div className="info-item">
            <label>Email:</label>
            <span>{studentData.institutional_email}</span>
          </div>
        </div>
        
        <button className="btn-confirm">Request Profile Update</button>
      </div>
    </div>
  </div>
);

// Settings Section Component
const SettingsSection = () => (
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
          <button className="btn-schedule">Manage Security</button>
        </div>
        <div className="setting-card">
          <h4>🔔 Notifications</h4>
          <p>Configure email and push notifications</p>
          <button className="btn-schedule">Notification Settings</button>
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

// Resources Section Component
const ResourcesSection = () => (
  <div className="section-content">
    <div className="applications-table-container">
      <div className="table-header">
        <h3>Campus Resources</h3>
        <p>Access various campus services and resources</p>
      </div>
      <div className="settings-grid">
        <div className="setting-card">
          <h4>💻 Learning Management System</h4>
          <p>Access your courses and learning materials</p>
          <button className="btn-schedule">Go to LMS</button>
        </div>
        <div className="setting-card">
          <h4>📖 Library Resources</h4>
          <p>Digital library and research materials</p>
          <button className="btn-schedule">Access Library</button>
        </div>
        <div className="setting-card">
          <h4>🤝 Student Support</h4>
          <p>Get help from various campus offices</p>
          <button className="btn-schedule">Get Support</button>
        </div>
      </div>
    </div>
  </div>
);

export default StudentDashboard;