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

  if (!studentData) {
    return React.createElement(
      'div',
      { className: 'loading-dashboard' },
      React.createElement('div', { className: 'loading-spinner' }),
      React.createElement('p', null, 'Loading student data...')
    );
  }

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

  // Navigation items - UPDATED WITH COR GENERATOR
  const navItems = [
    { 
      id: 'dashboard', 
      icon: '📊', 
      label: 'Dashboard', 
      component: React.createElement(DashboardHome, { studentData: studentData }) 
    },
    { 
      id: 'academics', 
      icon: '📚', 
      label: 'Academic Records', 
      component: React.createElement(AcademicSection, { studentData: studentData }) 
    },
    { 
      id: 'documents', 
      icon: '📄', 
      label: 'Online Documents', 
      component: React.createElement(DocumentsSection, { studentData: studentData }) 
    },
    { 
      id: 'cor', 
      icon: '🎓', 
      label: 'COR Generator', 
      component: React.createElement(CertificateOfRegistration, { 
        studentData: studentData,
        onClose: handleCloseCOR
      }) 
    },
    { 
      id: 'scheduler', 
      icon: '📅', 
      label: 'Request Scheduler', 
      component: React.createElement(SchedulerSection) 
    },
    { 
      id: 'applications', 
      icon: '📋', 
      label: 'Applications', 
      component: React.createElement(ApplicationsSection) 
    },
    { 
      id: 'profile', 
      icon: '👤', 
      label: 'My Profile', 
      component: React.createElement(ProfileSection, { studentData: studentData }) 
    },
    { 
      id: 'settings', 
      icon: '⚙️', 
      label: 'Account Settings', 
      component: React.createElement(SettingsSection, { darkMode: darkMode, toggleDarkMode: toggleDarkMode }) 
    },
    { 
      id: 'resources', 
      icon: '🏛️', 
      label: 'Campus Resources', 
      component: React.createElement(ResourcesSection) 
    },
  ];

  const activeComponent = navItems.find(item => item.id === activeSection)?.component;

  return React.createElement(
    'div',
    { 
      className: `student-dashboard ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'} ${darkMode ? 'dark-mode' : ''}` 
    },
    // Sidebar Navigation
    React.createElement(
      'div',
      { className: 'sidebar' },
      React.createElement(
        'div',
        { className: 'sidebar-header' },
        React.createElement(
          'div',
          { className: 'logo-section' },
          React.createElement('img', { 
            src: '/logo-ptc.png', 
            alt: 'PTC Logo', 
            className: 'sidebar-logo' 
          }),
          React.createElement('span', { className: 'college-name' }, 'Pateros Technological College')
        ),
        React.createElement(
          'button',
          { 
            className: 'sidebar-toggle', 
            onClick: toggleSidebar 
          },
          sidebarOpen ? '◀' : '▶'
        )
      ),
      React.createElement(
        'nav',
        { className: 'sidebar-nav' },
        navItems.map(item => {
          const isApplications = item.id === 'applications';
          const buttonContent = [
            React.createElement('span', { key: 'icon', className: 'nav-icon' }, item.icon),
            sidebarOpen && React.createElement('span', { key: 'label', className: 'nav-label' }, item.label),
            isApplications && unreadCount > 0 && React.createElement('span', { key: 'badge', className: 'notification-badge' }, unreadCount)
          ].filter(Boolean);

          return React.createElement(
            'button',
            {
              key: item.id,
              className: `nav-item ${activeSection === item.id ? 'active' : ''}`,
              onClick: () => setActiveSection(item.id)
            },
            buttonContent
          );
        })
      ),
      React.createElement(
        'div',
        { className: 'sidebar-footer' },
        React.createElement(
          'div',
          { className: 'user-info' },
          React.createElement(
            'div',
            { className: 'user-avatar' },
            studentData.first_name[0] + studentData.last_name[0]
          ),
          sidebarOpen && React.createElement(
            'div',
            { className: 'user-details' },
            React.createElement('div', { className: 'user-name' }, studentData.first_name + ' ' + studentData.last_name),
            React.createElement('div', { className: 'user-id' }, studentData.student_number)
          )
        ),
        React.createElement(
          'button',
          { className: 'logout-btn', onClick: handleLogout },
          React.createElement('span', { className: 'logout-icon' }, '🚪'),
          sidebarOpen && 'Logout'
        )
      )
    ),
    // Main Content
    React.createElement(
      'div',
      { className: 'main-content' },
      React.createElement(
        'header',
        { className: 'content-header' },
        React.createElement(
          'div',
          { className: 'header-left' },
          React.createElement(
            'div',
            { className: 'breadcrumb' },
            React.createElement('span', null, 'Dashboard'),
            React.createElement('span', { className: 'breadcrumb-separator' }, '/'),
            React.createElement('span', { className: 'breadcrumb-current' }, 
              navItems.find(item => item.id === activeSection)?.label || 'Dashboard'
            )
          ),
          React.createElement(
            'h1',
            null,
            navItems.find(item => item.id === activeSection)?.label || 'Dashboard'
          ),
          React.createElement('p', null, 'Welcome back, ' + studentData.first_name + '!')
        ),
        React.createElement(
          'div',
          { className: 'header-right' },
          React.createElement(
            'div',
            { className: 'header-actions' },
            React.createElement(
              'div',
              { className: 'search-box' },
              React.createElement('input', { 
                type: 'text', 
                placeholder: 'Search...', 
                className: 'search-input' 
              }),
              React.createElement('span', { className: 'search-icon' }, '🔍')
            ),
            React.createElement(
              'div',
              { className: 'notification-wrapper' },
              React.createElement(
                'button',
                { className: 'icon-btn notification-btn' },
                React.createElement('span', { className: 'icon' }, '🔔'),
                unreadCount > 0 && React.createElement('span', { className: 'notification-indicator' }, unreadCount)
              ),
              React.createElement(
                'div',
                { className: 'notification-dropdown' },
                React.createElement(
                  'div',
                  { className: 'notification-header' },
                  React.createElement('h3', null, 'Notifications'),
                  React.createElement(
                    'button',
                    { 
                      className: 'mark-read-btn', 
                      onClick: markAllAsRead 
                    },
                    'Mark all as read'
                  )
                ),
                React.createElement(
                  'div',
                  { className: 'notification-list' },
                  notifications.map(notification => 
                    React.createElement(
                      'div',
                      { 
                        key: notification.id, 
                        className: `notification-item ${notification.read ? 'read' : 'unread'}` 
                      },
                      React.createElement(
                        'div',
                        { className: 'notification-icon' },
                        notification.type === 'academic' ? '📚' : '⚙️'
                      ),
                      React.createElement(
                        'div',
                        { className: 'notification-content' },
                        React.createElement('div', { className: 'notification-title' }, notification.title),
                        React.createElement('div', { className: 'notification-message' }, notification.message),
                        React.createElement('div', { className: 'notification-time' }, notification.timestamp)
                      )
                    )
                  )
                )
              )
            ),
            React.createElement(
              'button',
              { 
                className: 'theme-toggle icon-btn', 
                onClick: toggleDarkMode 
              },
              React.createElement('span', { className: 'icon' }, darkMode ? '☀️' : '🌙')
            )
          ),
          React.createElement(
            'div',
            { className: 'quick-stats' },
            React.createElement(
              'div',
              { className: 'stat-item' },
              React.createElement('span', { className: 'stat-label' }, 'Program'),
              React.createElement('span', { className: 'stat-value' }, studentData.program_enrolled)
            ),
            React.createElement(
              'div',
              { className: 'stat-item' },
              React.createElement('span', { className: 'stat-label' }, 'Year Level'),
              React.createElement('span', { className: 'stat-value' }, studentData.year_level)
            ),
            React.createElement(
              'div',
              { className: 'stat-item' },
              React.createElement('span', { className: 'stat-label' }, 'Status'),
              React.createElement(
                'span',
                { 
                  className: `status-badge ${studentData.enrollment_status === 'Active' ? 'active' : 'inactive'}` 
                },
                studentData.enrollment_status
              )
            )
          )
        )
      ),
      React.createElement(
        'main',
        { className: 'content-area' },
        activeComponent
      )
    )
  );
};

// Enhanced Dashboard Home Component with COR Quick Access
const DashboardHome = ({ studentData }) => {
  const [widgets, setWidgets] = useState(['academic', 'documents', 'schedule', 'announcements']);
  
  const customizableWidgets = {
    academic: { title: 'Academic Summary', icon: '📚', component: React.createElement(AcademicWidget) },
    documents: { title: 'Recent Documents', icon: '📄', component: React.createElement(DocumentsWidget) },
    schedule: { title: 'Class Schedule', icon: '🕒', component: React.createElement(ScheduleWidget) },
    announcements: { title: 'Announcements', icon: '📢', component: React.createElement(AnnouncementsWidget) },
    resources: { title: 'Quick Resources', icon: '🏛️', component: React.createElement(ResourcesWidget) },
    cor: { title: 'COR Generator', icon: '🎓', component: React.createElement(CORWidget) },
  };

  return React.createElement(
    'div',
    { className: 'dashboard-home' },
    React.createElement(
      'div',
      { className: 'welcome-banner' },
      React.createElement('h2', null, 'Welcome to Your Student Portal'),
      React.createElement('p', null, 'Manage your academic journey and access campus resources')
    ),
    React.createElement(
      'div',
      { className: 'dashboard-controls' },
      React.createElement(
        'div',
        { className: 'widget-customizer' },
        React.createElement('h3', null, 'Customize Dashboard'),
        React.createElement(
          'div',
          { className: 'widget-options' },
          Object.keys(customizableWidgets).map(widgetKey => 
            React.createElement(
              'label',
              { key: widgetKey, className: 'widget-option' },
              React.createElement('input', {
                type: 'checkbox',
                checked: widgets.includes(widgetKey),
                onChange: (e) => {
                  if (e.target.checked) {
                    setWidgets([...widgets, widgetKey]);
                  } else {
                    setWidgets(widgets.filter(w => w !== widgetKey));
                  }
                }
              }),
              customizableWidgets[widgetKey].title
            )
          )
        )
      )
    ),
    React.createElement(
      'div',
      { className: 'quick-actions-grid' },
      React.createElement(
        'div',
        { className: 'action-card primary' },
        React.createElement('div', { className: 'action-icon' }, '📚'),
        React.createElement('h3', null, 'Academic Records'),
        React.createElement('p', null, 'View your grades, transcripts, and academic progress'),
        React.createElement('button', { className: 'action-btn' }, 'View Records')
      ),
      React.createElement(
        'div',
        { className: 'action-card secondary' },
        React.createElement('div', { className: 'action-icon' }, '🎓'),
        React.createElement('h3', null, 'COR Generator'),
        React.createElement('p', null, 'Generate and print your Certificate of Registration'),
        React.createElement('button', { 
          className: 'action-btn',
          onClick: () => window.location.hash = '#cor'
        }, 'Generate COR')
      ),
      React.createElement(
        'div',
        { className: 'action-card success' },
        React.createElement('div', { className: 'action-icon' }, '👤'),
        React.createElement('h3', null, 'Profile Settings'),
        React.createElement('p', null, 'Update your personal information and preferences'),
        React.createElement('button', { className: 'action-btn' }, 'Edit Profile')
      ),
      React.createElement(
        'div',
        { className: 'action-card info' },
        React.createElement('div', { className: 'action-icon' }, '🏛️'),
        React.createElement('h3', null, 'Campus Resources'),
        React.createElement('p', null, 'Access library, LMS, and student services'),
        React.createElement('button', { className: 'action-btn' }, 'Explore')
      )
    ),
    // Customizable Widgets Grid
    React.createElement(
      'div',
      { className: 'widgets-grid' },
      widgets.map(widgetKey => 
        React.createElement(
          'div',
          { key: widgetKey, className: 'dashboard-widget' },
          React.createElement(
            'div',
            { className: 'widget-header' },
            React.createElement('span', { className: 'widget-icon' }, customizableWidgets[widgetKey].icon),
            React.createElement('h3', null, customizableWidgets[widgetKey].title)
          ),
          React.createElement(
            'div',
            { className: 'widget-content' },
            customizableWidgets[widgetKey].component
          )
        )
      )
    ),
    React.createElement(
      'div',
      { className: 'student-info-cards' },
      React.createElement(
        'div',
        { className: 'info-card' },
        React.createElement('h3', null, 'Student Information'),
        React.createElement(
          'div',
          { className: 'info-grid' },
          React.createElement(
            'div',
            { className: 'info-item' },
            React.createElement('label', null, 'Student Number:'),
            React.createElement('span', null, studentData.student_number)
          ),
          React.createElement(
            'div',
            { className: 'info-item' },
            React.createElement('label', null, 'Full Name:'),
            React.createElement('span', null, studentData.first_name + ' ' + (studentData.middle_name || '') + ' ' + studentData.last_name)
          ),
          React.createElement(
            'div',
            { className: 'info-item' },
            React.createElement('label', null, 'Program:'),
            React.createElement('span', null, studentData.program_enrolled)
          ),
          React.createElement(
            'div',
            { className: 'info-item' },
            React.createElement('label', null, 'Year Level:'),
            React.createElement('span', null, studentData.year_level)
          ),
          React.createElement(
            'div',
            { className: 'info-item' },
            React.createElement('label', null, 'Institutional Email:'),
            React.createElement('span', null, studentData.institutional_email)
          ),
          React.createElement(
            'div',
            { className: 'info-item' },
            React.createElement('label', null, 'Enrollment Date:'),
            React.createElement('span', null, studentData.date_enrolled || 'Not specified')
          )
        )
      )
    )
  );
};

// New COR Widget Component
const CORWidget = () =>
  React.createElement(
    'div',
    { className: 'cor-widget' },
    React.createElement(
      'div',
      { className: 'cor-widget-content' },
      React.createElement('p', null, 'Quickly generate your Certificate of Registration for printing.'),
      React.createElement(
        'div',
        { className: 'cor-features' },
        React.createElement(
          'ul',
          null,
          React.createElement('li', null, '✅ Printable short bond paper format'),
          React.createElement('li', null, '✅ Editable course information'),
          React.createElement('li', null, '✅ Automatic fee calculations'),
          React.createElement('li', null, '✅ Official PTC format')
        )
      ),
      React.createElement(
        'button',
        { 
          className: 'cor-quick-btn',
          onClick: () => window.location.hash = '#cor'
        },
        '🚀 Generate COR Now'
      )
    )
  );

// Widget Components (keep existing ones)
const AcademicWidget = () => 
  React.createElement(
    'div',
    { className: 'academic-widget' },
    React.createElement(
      'div',
      { className: 'widget-stat' },
      React.createElement('span', { className: 'stat-value' }, '1.75'),
      React.createElement('span', { className: 'stat-label' }, 'Current GPA')
    ),
    React.createElement(
      'div',
      { className: 'widget-stat' },
      React.createElement('span', { className: 'stat-value' }, '15'),
      React.createElement('span', { className: 'stat-label' }, 'Units Enrolled')
    ),
    React.createElement('button', { className: 'widget-btn' }, 'View Grades')
  );

const DocumentsWidget = () =>
  React.createElement(
    'div',
    { className: 'documents-widget' },
    React.createElement(
      'div',
      { className: 'document-item' },
      React.createElement('span', { className: 'doc-icon' }, '📄'),
      React.createElement('span', { className: 'doc-name' }, 'COR - 1st Sem 2024'),
      React.createElement('button', { className: 'doc-btn' }, 'Print')
    ),
    React.createElement(
      'div',
      { className: 'document-item' },
      React.createElement('span', { className: 'doc-icon' }, '📄'),
      React.createElement('span', { className: 'doc-name' }, 'Grades - Midterm'),
      React.createElement('button', { className: 'doc-btn' }, 'View')
    )
  );

const ScheduleWidget = () =>
  React.createElement(
    'div',
    { className: 'schedule-widget' },
    React.createElement(
      'div',
      { className: 'schedule-item' },
      React.createElement('span', { className: 'schedule-time' }, '08:00 AM'),
      React.createElement('span', { className: 'schedule-course' }, 'CS 101')
    ),
    React.createElement(
      'div',
      { className: 'schedule-item' },
      React.createElement('span', { className: 'schedule-time' }, '10:00 AM'),
      React.createElement('span', { className: 'schedule-course' }, 'MATH 102')
    )
  );

const AnnouncementsWidget = () =>
  React.createElement(
    'div',
    { className: 'announcements-widget' },
    React.createElement(
      'div',
      { className: 'announcement-item' },
      React.createElement('strong', null, 'System Maintenance'),
      React.createElement('p', null, 'Portal will be unavailable on Sunday')
    )
  );

const ResourcesWidget = () =>
  React.createElement(
    'div',
    { className: 'resources-widget' },
    React.createElement('button', { className: 'resource-quick-btn' }, 'LMS'),
    React.createElement('button', { className: 'resource-quick-btn' }, 'Library'),
    React.createElement('button', { className: 'resource-quick-btn' }, 'Support')
  );

// Keep all other existing components (AcademicSection, DocumentsSection, SchedulerSection, etc.)
// ... (rest of your existing components remain the same)

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

  return React.createElement(
    'div',
    { className: 'section-content' },
    React.createElement('h2', null, 'Academic Records'),
    React.createElement(
      'div',
      { className: 'documents-section' },
      React.createElement(
        'div',
        { className: 'section-header' },
        React.createElement('h3', null, 'Available Documents'),
        React.createElement('p', null, 'Print your academic documents online')
      ),
      React.createElement(
        'div',
        { className: 'documents-grid' },
        academicDocuments.map(doc => 
          React.createElement(
            'div',
            { key: doc.id, className: 'document-card' },
            React.createElement('div', { className: 'document-icon' }, '📄'),
            React.createElement(
              'div',
              { className: 'document-info' },
              React.createElement('h3', null, doc.name),
              React.createElement('p', null, doc.description),
              React.createElement(
                'div',
                { className: `document-status ${doc.available ? 'available' : 'unavailable'}` },
                doc.available ? 'Available for Printing' : 'Under Processing'
              )
            ),
            React.createElement(
              'button',
              {
                className: `print-btn ${!doc.available ? 'disabled' : ''}`,
                onClick: () => handlePrintDocument(doc.id),
                disabled: !doc.available || selectedDocument === doc.id
              },
              selectedDocument === doc.id ? 'Printing...' : 'Print Document'
            )
          )
        )
      )
    )
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

  return React.createElement(
    'div',
    { className: 'section-content' },
    React.createElement('h2', null, 'Online Documents'),
    React.createElement(
      'div',
      { className: 'documents-management' },
      React.createElement(
        'div',
        { className: 'documents-list' },
        documents.map(doc => 
          React.createElement(
            'div',
            { key: doc.id, className: 'document-item' },
            React.createElement(
              'div',
              { className: 'document-details' },
              React.createElement('span', { className: 'document-name' }, doc.name),
              React.createElement(
                'span',
                { className: `document-status ${doc.status}` },
                doc.status === 'available' ? '✅ Available' : '⏳ Processing'
              )
            ),
            React.createElement(
              'div',
              { className: 'document-actions' },
              React.createElement(
                'button',
                { 
                  className: 'action-btn primary', 
                  disabled: doc.status !== 'available' 
                },
                'Download'
              ),
              React.createElement(
                'button',
                { 
                  className: 'action-btn secondary', 
                  disabled: doc.status !== 'available' 
                },
                'Print'
              )
            )
          )
        )
      )
    )
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

  return React.createElement(
    'div',
    { className: 'section-content' },
    React.createElement('h2', null, 'Request Certified True Copy'),
    React.createElement(
      'div',
      { className: 'scheduler-container' },
      React.createElement(
        'div',
        { className: 'scheduler-info' },
        React.createElement('h3', null, '📅 Schedule an Appointment'),
        React.createElement('p', null, 'Request for certified true copy of your documents'),
        React.createElement(
          'div',
          { className: 'info-cards' },
          React.createElement(
            'div',
            { className: 'info-card' },
            React.createElement('h4', null, '📍 Location'),
            React.createElement('p', null, 'Registrar\'s Office\nMain Building, 2nd Floor')
          ),
          React.createElement(
            'div',
            { className: 'info-card' },
            React.createElement('h4', null, '⏰ Office Hours'),
            React.createElement('p', null, 'Monday-Friday\n8:00 AM - 5:00 PM')
          ),
          React.createElement(
            'div',
            { className: 'info-card' },
            React.createElement('h4', null, '📋 Requirements'),
            React.createElement('p', null, 'Valid ID\nDocument Request Form')
          )
        )
      ),
      React.createElement(
        'form',
        { 
          className: 'scheduler-form', 
          onSubmit: handleSubmitRequest 
        },
        React.createElement(
          'div',
          { className: 'form-group' },
          React.createElement('label', null, 'Select Date'),
          React.createElement('input', {
            type: 'date',
            value: selectedDate,
            onChange: (e) => setSelectedDate(e.target.value),
            min: new Date().toISOString().split('T')[0],
            required: true
          })
        ),
        React.createElement(
          'div',
          { className: 'form-group' },
          React.createElement('label', null, 'Select Time'),
          React.createElement(
            'select',
            {
              value: selectedTime,
              onChange: (e) => setSelectedTime(e.target.value),
              required: true
            },
            React.createElement('option', { value: '' }, 'Choose time slot'),
            timeSlots.map(slot => 
              React.createElement('option', { key: slot, value: slot }, slot)
            )
          )
        ),
        React.createElement(
          'div',
          { className: 'form-group' },
          React.createElement('label', null, 'Purpose of Request'),
          React.createElement('textarea', {
            value: purpose,
            onChange: (e) => setPurpose(e.target.value),
            placeholder: 'Please specify the purpose for requesting certified true copies...',
            rows: 4,
            required: true
          })
        ),
        React.createElement(
          'button',
          { type: 'submit', className: 'submit-btn primary' },
          'Schedule Appointment'
        )
      )
    )
  );
};

const ApplicationsSection = () =>
  React.createElement(
    'div',
    { className: 'section-content' },
    React.createElement('h2', null, 'Application Status'),
    React.createElement('p', null, 'Track all your applications in one place.'),
    React.createElement('div', { className: 'coming-soon' }, '📋 Application tracking coming soon...')
  );

const ProfileSection = ({ studentData }) =>
  React.createElement(
    'div',
    { className: 'section-content' },
    React.createElement('h2', null, 'My Profile'),
    React.createElement(
      'div',
      { className: 'profile-editor' },
      React.createElement(
        'div',
        { className: 'profile-header' },
        React.createElement(
          'div',
          { className: 'profile-avatar-large' },
          studentData.first_name[0] + studentData.last_name[0]
        ),
        React.createElement(
          'div',
          { className: 'profile-info' },
          React.createElement('h3', null, studentData.first_name + ' ' + studentData.last_name),
          React.createElement('p', null, studentData.student_number)
        )
      ),
      React.createElement(
        'div',
        { className: 'profile-form' },
        React.createElement('h4', null, 'Personal Information'),
        React.createElement(
          'div',
          { className: 'form-grid' },
          React.createElement(
            'div',
            { className: 'form-group' },
            React.createElement('label', null, 'First Name'),
            React.createElement('input', { type: 'text', value: studentData.first_name, readOnly: true })
          ),
          React.createElement(
            'div',
            { className: 'form-group' },
            React.createElement('label', null, 'Last Name'),
            React.createElement('input', { type: 'text', value: studentData.last_name, readOnly: true })
          ),
          React.createElement(
            'div',
            { className: 'form-group' },
            React.createElement('label', null, 'Institutional Email'),
            React.createElement('input', { type: 'email', value: studentData.institutional_email, readOnly: true })
          ),
          React.createElement(
            'div',
            { className: 'form-group' },
            React.createElement('label', null, 'Program'),
            React.createElement('input', { type: 'text', value: studentData.program_enrolled, readOnly: true })
          )
        ),
        React.createElement('button', { className: 'edit-btn' }, 'Request Profile Update')
      )
    )
  );

const SettingsSection = ({ darkMode, toggleDarkMode }) =>
  React.createElement(
    'div',
    { className: 'section-content' },
    React.createElement('h2', null, 'Account Settings'),
    React.createElement(
      'div',
      { className: 'settings-grid' },
      React.createElement(
        'div',
        { className: 'setting-card' },
        React.createElement('h3', null, '🎨 Theme Preferences'),
        React.createElement(
          'div',
          { className: 'theme-settings' },
          React.createElement(
            'label',
            { className: 'theme-toggle-large' },
            React.createElement('span', null, 'Dark Mode'),
            React.createElement(
              'div',
              { 
                className: `toggle-switch ${darkMode ? 'active' : ''}`,
                onClick: toggleDarkMode
              },
              React.createElement('div', { className: 'toggle-slider' })
            )
          )
        )
      ),
      React.createElement(
        'div',
        { className: 'setting-card' },
        React.createElement('h3', null, '🔒 Password & Security'),
        React.createElement('p', null, 'Change your password and manage security settings'),
        React.createElement('button', { className: 'setting-btn' }, 'Manage Security')
      ),
      React.createElement(
        'div',
        { className: 'setting-card' },
        React.createElement('h3', null, '🔔 Notifications'),
        React.createElement('p', null, 'Configure email and push notifications'),
        React.createElement('button', { className: 'setting-btn' }, 'Notification Settings')
      ),
      React.createElement(
        'div',
        { className: 'setting-card' },
        React.createElement('h3', null, '📧 Email Preferences'),
        React.createElement('p', null, 'Manage your email notification preferences'),
        React.createElement('button', { className: 'setting-btn' }, 'Email Settings')
      )
    )
  );

const ResourcesSection = () =>
  React.createElement(
    'div',
    { className: 'section-content' },
    React.createElement('h2', null, 'Campus Resources'),
    React.createElement(
      'div',
      { className: 'resources-grid' },
      React.createElement(
        'div',
        { className: 'resource-card' },
        React.createElement('h3', null, '💻 Learning Management System'),
        React.createElement('p', null, 'Access your courses and learning materials'),
        React.createElement('button', { className: 'resource-btn' }, 'Go to LMS')
      ),
      React.createElement(
        'div',
        { className: 'resource-card' },
        React.createElement('h3', null, '📖 Library Resources'),
        React.createElement('p', null, 'Digital library and research materials'),
        React.createElement('button', { className: 'resource-btn' }, 'Access Library')
      ),
      React.createElement(
        'div',
        { className: 'resource-card' },
        React.createElement('h3', null, '🤝 Student Support'),
        React.createElement('p', null, 'Get help from various campus offices'),
        React.createElement('button', { className: 'resource-btn' }, 'Get Support')
      )
    )
  );

export default StudentDashboard;