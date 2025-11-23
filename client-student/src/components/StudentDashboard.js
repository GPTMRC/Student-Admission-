import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentDashboard.css';
import CertificateOfRegistration from './CertificateOfRegistration';

const StudentDashboard = ({ studentData }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    navigate('/login');
  };

  // Mock notifications data
  useEffect(() => {
    const mockNotifications = [
      { id: 1, type: 'academic', title: 'Grades Updated', message: 'Your midterm grades are now available', timestamp: '2024-01-15', read: false },
      { id: 2, type: 'system', title: 'System Maintenance', message: 'Portal maintenance scheduled for Sunday', timestamp: '2024-01-14', read: false },
      { id: 3, type: 'academic', title: 'Document Ready', message: 'Your COR is ready for download', timestamp: '2024-01-13', read: true },
    ];
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  }, []);

  // Fix: Handle COR navigation properly
  const handleCORNavigation = () => {
    setActiveSection('cor');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notif => ({ ...notif, read: true }));
    setNotifications(updatedNotifications);
    setUnreadCount(0);
  };

  const handleCloseCOR = () => {
    setActiveSection('dashboard');
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  if (!studentData) {
    return (
      <div className="loading-dashboard">
        <div className="loading-spinner"></div>
        <p>Loading student data...</p>
      </div>
    );
  }

  // Navigation items - FIXED: Use proper React components
  const navItems = [
    { 
      id: 'dashboard', 
      icon: '📊', 
      label: 'Dashboard', 
      component: <DashboardHome studentData={studentData} onCORNavigate={handleCORNavigation} />
    },
    { 
      id: 'academics', 
      icon: '📚', 
      label: 'Academic Records', 
      component: <AcademicSection studentData={studentData} />
    },
    { 
      id: 'documents', 
      icon: '📄', 
      label: 'Online Documents', 
      component: <DocumentsSection studentData={studentData} />
    },
    { 
      id: 'cor', 
      icon: '🎓', 
      label: 'COR Generator', 
      component: <CertificateOfRegistration studentData={studentData} onClose={handleCloseCOR} />
    },
    { 
      id: 'scheduler', 
      icon: '📅', 
      label: 'Request Scheduler', 
      component: <SchedulerSection />
    },
    { 
      id: 'applications', 
      icon: '📋', 
      label: 'Applications', 
      component: <ApplicationsSection />
    },
    { 
      id: 'profile', 
      icon: '👤', 
      label: 'My Profile', 
      component: <ProfileSection studentData={studentData} />
    },
    { 
      id: 'settings', 
      icon: '⚙️', 
      label: 'Account Settings', 
      component: <SettingsSection darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
    },
    { 
      id: 'resources', 
      icon: '🏛️', 
      label: 'Campus Resources', 
      component: <ResourcesSection />
    },
  ];

  const activeComponent = navItems.find(item => item.id === activeSection)?.component;

  return (
    <div className={`student-dashboard ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'} ${darkMode ? 'dark-mode' : ''}`}>
      {/* Sidebar Navigation */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo-section">
            <img src="/logo-ptc.png" alt="PTC Logo" className="sidebar-logo" />
            {sidebarOpen && <span className="college-name">Pateros Technological College</span>}
          </div>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => {
            const isApplications = item.id === 'applications';
            return (
              <button
                key={item.id}
                className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                {sidebarOpen && <span className="nav-label">{item.label}</span>}
                {isApplications && unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>
            );
          })}
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
          <button className="logout-btn" onClick={handleLogout}>
            <span className="logout-icon">🚪</span>
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="content-header">
          <div className="header-left">
            <div className="breadcrumb">
              <span>Dashboard</span>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">
                {navItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
              </span>
            </div>
            <h1>{navItems.find(item => item.id === activeSection)?.label || 'Dashboard'}</h1>
            <p>Welcome back, {studentData.first_name}!</p>
          </div>

          <div className="header-right">
            <div className="header-actions">
              <div className="search-box">
                <input type="text" placeholder="Search..." className="search-input" />
                <span className="search-icon">🔍</span>
              </div>

              <div className="notification-wrapper">
                <button className="icon-btn notification-btn" onClick={toggleNotifications}>
                  <span className="icon">🔔</span>
                  {unreadCount > 0 && (
                    <span className="notification-indicator">{unreadCount}</span>
                  )}
                </button>
                {showNotifications && (
                  <div className="notification-dropdown">
                    <div className="notification-header">
                      <h3>Notifications</h3>
                      <button className="mark-read-btn" onClick={markAllAsRead}>
                        Mark all as read
                      </button>
                    </div>
                    <div className="notification-list">
                      {notifications.map(notification => (
                        <div key={notification.id} className={`notification-item ${notification.read ? 'read' : 'unread'}`}>
                          <div className="notification-icon">
                            {notification.type === 'academic' ? '📚' : '⚙️'}
                          </div>
                          <div className="notification-content">
                            <div className="notification-title">{notification.title}</div>
                            <div className="notification-message">{notification.message}</div>
                            <div className="notification-time">{notification.timestamp}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button className="theme-toggle icon-btn" onClick={toggleDarkMode}>
                <span className="icon">{darkMode ? '☀️' : '🌙'}</span>
              </button>
            </div>

            <div className="quick-stats">
              <div className="stat-item">
                <span className="stat-label">Program</span>
                <span className="stat-value">{studentData.program_enrolled}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Year Level</span>
                <span className="stat-value">{studentData.year_level}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Status</span>
                <span className={`status-badge ${studentData.enrollment_status === 'Active' ? 'active' : 'inactive'}`}>
                  {studentData.enrollment_status}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="content-area">
          {activeComponent}
        </main>
      </div>
    </div>
  );
};

// Enhanced Dashboard Home Component with COR Quick Access - FIXED
const DashboardHome = ({ studentData, onCORNavigate }) => {
  const [widgets, setWidgets] = useState(['academic', 'documents', 'schedule', 'announcements']);
  
  const customizableWidgets = {
    academic: { title: 'Academic Summary', icon: '📚', component: <AcademicWidget /> },
    documents: { title: 'Recent Documents', icon: '📄', component: <DocumentsWidget /> },
    schedule: { title: 'Class Schedule', icon: '🕒', component: <ScheduleWidget /> },
    announcements: { title: 'Announcements', icon: '📢', component: <AnnouncementsWidget /> },
    resources: { title: 'Quick Resources', icon: '🏛️', component: <ResourcesWidget /> },
    cor: { title: 'COR Generator', icon: '🎓', component: <CORWidget onGenerateCOR={onCORNavigate} /> },
  };

  return (
    <div className="dashboard-home">
      <div className="welcome-banner">
        <h2>Welcome to Your Student Portal</h2>
        <p>Manage your academic journey and access campus resources</p>
      </div>

      <div className="quick-actions-grid">
        <div className="action-card primary">
          <div className="action-icon">📚</div>
          <h3>Academic Records</h3>
          <p>View your grades, transcripts, and academic progress</p>
          <button className="action-btn">View Records</button>
        </div>
        
        <div className="action-card secondary">
          <div className="action-icon">🎓</div>
          <h3>COR Generator</h3>
          <p>Generate and print your Certificate of Registration</p>
          <button className="action-btn" onClick={onCORNavigate}>
            Generate COR
          </button>
        </div>
        
        <div className="action-card success">
          <div className="action-icon">👤</div>
          <h3>Profile Settings</h3>
          <p>Update your personal information and preferences</p>
          <button className="action-btn">Edit Profile</button>
        </div>
        
        <div className="action-card info">
          <div className="action-icon">🏛️</div>
          <h3>Campus Resources</h3>
          <p>Access library, LMS, and student services</p>
          <button className="action-btn">Explore</button>
        </div>
      </div>

      {/* Customizable Widgets Grid */}
      <div className="widgets-grid">
        {widgets.map(widgetKey => (
          <div key={widgetKey} className="dashboard-widget">
            <div className="widget-header">
              <span className="widget-icon">{customizableWidgets[widgetKey].icon}</span>
              <h3>{customizableWidgets[widgetKey].title}</h3>
            </div>
            <div className="widget-content">
              {customizableWidgets[widgetKey].component}
            </div>
          </div>
        ))}
      </div>

      <div className="student-info-cards">
        <div className="info-card">
          <h3>Student Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Student Number:</label>
              <span>{studentData.student_number}</span>
            </div>
            <div className="info-item">
              <label>Full Name:</label>
              <span>{studentData.first_name} {studentData.middle_name || ''} {studentData.last_name}</span>
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
              <label>Institutional Email:</label>
              <span>{studentData.institutional_email}</span>
            </div>
            <div className="info-item">
              <label>Enrollment Date:</label>
              <span>{studentData.date_enrolled || 'Not specified'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// New COR Widget Component - FIXED
const CORWidget = ({ onGenerateCOR }) => (
  <div className="cor-widget">
    <div className="cor-widget-content">
      <p>Quickly generate your Certificate of Registration for printing.</p>
      <div className="cor-features">
        <ul>
          <li>✅ Printable short bond paper format</li>
          <li>✅ Editable course information</li>
          <li>✅ Automatic fee calculations</li>
          <li>✅ Official PTC format</li>
        </ul>
      </div>
      <button className="cor-quick-btn" onClick={onGenerateCOR}>
        🚀 Generate COR Now
      </button>
    </div>
  </div>
);

// Widget Components
const AcademicWidget = () => (
  <div className="academic-widget">
    <div className="widget-stat">
      <span className="stat-value">1.75</span>
      <span className="stat-label">Current GPA</span>
    </div>
    <div className="widget-stat">
      <span className="stat-value">15</span>
      <span className="stat-label">Units Enrolled</span>
    </div>
    <button className="widget-btn">View Grades</button>
  </div>
);

const DocumentsWidget = () => (
  <div className="documents-widget">
    <div className="document-item">
      <span className="doc-icon">📄</span>
      <span className="doc-name">COR - 1st Sem 2024</span>
      <button className="doc-btn">Print</button>
    </div>
    <div className="document-item">
      <span className="doc-icon">📄</span>
      <span className="doc-name">Grades - Midterm</span>
      <button className="doc-btn">View</button>
    </div>
  </div>
);

const ScheduleWidget = () => (
  <div className="schedule-widget">
    <div className="schedule-item">
      <span className="schedule-time">08:00 AM</span>
      <span className="schedule-course">CS 101</span>
    </div>
    <div className="schedule-item">
      <span className="schedule-time">10:00 AM</span>
      <span className="schedule-course">MATH 102</span>
    </div>
  </div>
);

const AnnouncementsWidget = () => (
  <div className="announcements-widget">
    <div className="announcement-item">
      <strong>System Maintenance</strong>
      <p>Portal will be unavailable on Sunday</p>
    </div>
  </div>
);

const ResourcesWidget = () => (
  <div className="resources-widget">
    <button className="resource-quick-btn">LMS</button>
    <button className="resource-quick-btn">Library</button>
    <button className="resource-quick-btn">Support</button>
  </div>
);

// Section Components
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
      <h2>Academic Records</h2>
      <div className="documents-section">
        <div className="section-header">
          <h3>Available Documents</h3>
          <p>Print your academic documents online</p>
        </div>
        <div className="documents-grid">
          {academicDocuments.map(doc => (
            <div key={doc.id} className="document-card">
              <div className="document-icon">📄</div>
              <div className="document-info">
                <h3>{doc.name}</h3>
                <p>{doc.description}</p>
                <div className={`document-status ${doc.available ? 'available' : 'unavailable'}`}>
                  {doc.available ? 'Available for Printing' : 'Under Processing'}
                </div>
              </div>
              <button
                className={`print-btn ${!doc.available ? 'disabled' : ''}`}
                onClick={() => handlePrintDocument(doc.id)}
                disabled={!doc.available || selectedDocument === doc.id}
              >
                {selectedDocument === doc.id ? 'Printing...' : 'Print Document'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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
      <h2>Online Documents</h2>
      <div className="documents-management">
        <div className="documents-list">
          {documents.map(doc => (
            <div key={doc.id} className="document-item">
              <div className="document-details">
                <span className="document-name">{doc.name}</span>
                <span className={`document-status ${doc.status}`}>
                  {doc.status === 'available' ? '✅ Available' : '⏳ Processing'}
                </span>
              </div>
              <div className="document-actions">
                <button className="action-btn primary" disabled={doc.status !== 'available'}>
                  Download
                </button>
                <button className="action-btn secondary" disabled={doc.status !== 'available'}>
                  Print
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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
      <h2>Request Certified True Copy</h2>
      <div className="scheduler-container">
        <div className="scheduler-info">
          <h3>📅 Schedule an Appointment</h3>
          <p>Request for certified true copy of your documents</p>
          <div className="info-cards">
            <div className="info-card">
              <h4>📍 Location</h4>
              <p>Registrar's Office<br />Main Building, 2nd Floor</p>
            </div>
            <div className="info-card">
              <h4>⏰ Office Hours</h4>
              <p>Monday-Friday<br />8:00 AM - 5:00 PM</p>
            </div>
            <div className="info-card">
              <h4>📋 Requirements</h4>
              <p>Valid ID<br />Document Request Form</p>
            </div>
          </div>
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
          <button type="submit" className="submit-btn primary">
            Schedule Appointment
          </button>
        </form>
      </div>
    </div>
  );
};

const ApplicationsSection = () => (
  <div className="section-content">
    <h2>Application Status</h2>
    <p>Track all your applications in one place.</p>
    <div className="coming-soon">📋 Application tracking coming soon...</div>
  </div>
);

const ProfileSection = ({ studentData }) => (
  <div className="section-content">
    <h2>My Profile</h2>
    <div className="profile-editor">
      <div className="profile-header">
        <div className="profile-avatar-large">
          {studentData.first_name?.[0]}{studentData.last_name?.[0]}
        </div>
        <div className="profile-info">
          <h3>{studentData.first_name} {studentData.last_name}</h3>
          <p>{studentData.student_number}</p>
        </div>
      </div>
      <div className="profile-form">
        <h4>Personal Information</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>First Name</label>
            <input type="text" value={studentData.first_name} readOnly />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input type="text" value={studentData.last_name} readOnly />
          </div>
          <div className="form-group">
            <label>Institutional Email</label>
            <input type="email" value={studentData.institutional_email} readOnly />
          </div>
          <div className="form-group">
            <label>Program</label>
            <input type="text" value={studentData.program_enrolled} readOnly />
          </div>
        </div>
        <button className="edit-btn">Request Profile Update</button>
      </div>
    </div>
  </div>
);

const SettingsSection = ({ darkMode, toggleDarkMode }) => (
  <div className="section-content">
    <h2>Account Settings</h2>
    <div className="settings-grid">
      <div className="setting-card">
        <h3>🎨 Theme Preferences</h3>
        <div className="theme-settings">
          <label className="theme-toggle-large">
            <span>Dark Mode</span>
            <div className={`toggle-switch ${darkMode ? 'active' : ''}`} onClick={toggleDarkMode}>
              <div className="toggle-slider"></div>
            </div>
          </label>
        </div>
      </div>
      <div className="setting-card">
        <h3>🔒 Password & Security</h3>
        <p>Change your password and manage security settings</p>
        <button className="setting-btn">Manage Security</button>
      </div>
      <div className="setting-card">
        <h3>🔔 Notifications</h3>
        <p>Configure email and push notifications</p>
        <button className="setting-btn">Notification Settings</button>
      </div>
      <div className="setting-card">
        <h3>📧 Email Preferences</h3>
        <p>Manage your email notification preferences</p>
        <button className="setting-btn">Email Settings</button>
      </div>
    </div>
  </div>
);

const ResourcesSection = () => (
  <div className="section-content">
    <h2>Campus Resources</h2>
    <div className="resources-grid">
      <div className="resource-card">
        <h3>💻 Learning Management System</h3>
        <p>Access your courses and learning materials</p>
        <button className="resource-btn">Go to LMS</button>
      </div>
      <div className="resource-card">
        <h3>📖 Library Resources</h3>
        <p>Digital library and research materials</p>
        <button className="resource-btn">Access Library</button>
      </div>
      <div className="resource-card">
        <h3>🤝 Student Support</h3>
        <p>Get help from various campus offices</p>
        <button className="resource-btn">Get Support</button>
      </div>
    </div>
  </div>
);

export default StudentDashboard;