import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './AdminDashboard.css';
import StudentAdvisingPage from './StudentAdvisingPage';
import SubjectsPage from './SubjectsPage';

const AdminDashboard = ({ onLogout }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [examSchedule, setExamSchedule] = useState('');
  const [examTime, setExamTime] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Micro Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('09:00');

  // Micro To-do list state
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    console.log('🔄 AdminDashboard mounted - starting fetchApplications');
    fetchApplications();
    loadTodos();
    loadEvents();

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Micro Calendar functions
  const loadEvents = () => {
    const savedEvents = localStorage.getItem('adminCalendarEvents');
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
  };

  const saveEvents = (updatedEvents) => {
    localStorage.setItem('adminCalendarEvents', JSON.stringify(updatedEvents));
    setEvents(updatedEvents);
  };

  const addEvent = () => {
    if (!newEventTitle.trim()) return;

    const dateKey = selectedDate.toISOString().split('T')[0];
    const event = {
      id: Date.now(),
      title: newEventTitle,
      time: newEventTime,
      date: dateKey,
    };

    const updatedEvents = {
      ...events,
      [dateKey]: [...(events[dateKey] || []), event],
    };

    saveEvents(updatedEvents);
    setNewEventTitle('');
    setNewEventTime('09:00');
    setShowEventForm(false);
  };

  const deleteEvent = (dateKey, eventId) => {
    const updatedEvents = {
      ...events,
      [dateKey]: events[dateKey].filter((event) => event.id !== eventId),
    };

    if (updatedEvents[dateKey].length === 0) {
      delete updatedEvents[dateKey];
    }

    saveEvents(updatedEvents);
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1)
    );
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const getEventsForDate = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    return events[dateKey] || [];
  };

  // Micro To-do list functions
  const loadTodos = () => {
    const savedTodos = localStorage.getItem('adminTodos');
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
  };

  const saveTodos = (updatedTodos) => {
    localStorage.setItem('adminTodos', JSON.stringify(updatedTodos));
    setTodos(updatedTodos);
  };

  const addTodo = () => {
    if (!newTodo.trim()) return;

    const todo = {
      id: Date.now(),
      text: newTodo,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    saveTodos([...todos, todo]);
    setNewTodo('');
  };

  const toggleTodo = (id) => {
    const updatedTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos(updatedTodos);
  };

  const deleteTodo = (id) => {
    const updatedTodos = todos.filter((todo) => todo.id !== id);
    saveTodos(updatedTodos);
  };

  const clearCompletedTodos = () => {
    const updatedTodos = todos.filter((todo) => !todo.completed);
    saveTodos(updatedTodos);
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('student_admissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      setApplications(data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
      alert('Error loading applications: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleExam = (application) => {
    setSelectedApplication(application);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = tomorrow.toISOString().split('T')[0];

    setExamSchedule(
      application.exam_schedule
        ? application.exam_schedule.split('T')[0]
        : defaultDate
    );
    setExamTime(
      application.exam_schedule
        ? application.exam_schedule.split('T')[1].substring(0, 5)
        : '09:00'
    );
    setShowScheduleModal(true);
  };

  const submitExamSchedule = async () => {
    if (!examSchedule || !examTime) {
      alert('Please select both date and time');
      return;
    }

    try {
      const examDateTime = `${examSchedule}T${examTime}:00`;

      const { error } = await supabase
        .from('student_admissions')
        .update({
          exam_schedule: examDateTime,
          status: 'scheduled',
        })
        .eq('id', selectedApplication.id);

      if (error) throw error;

      await sendExamScheduleEmail(selectedApplication, examDateTime);

      alert('Exam scheduled successfully! Email sent to student.');
      setShowScheduleModal(false);
      fetchApplications();
    } catch (error) {
      console.error('Error scheduling exam:', error);
      alert('Error scheduling exam: ' + error.message);
    }
  };

  const sendExamScheduleEmail = async (application, examDateTime) => {
    try {
      const studentName = `${application.first_name} ${
        application.middle_name ? application.middle_name + ' ' : ''
      }${application.last_name}`;

      const response = await fetch('http://localhost:4001/send-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_name: studentName,
          student_email: application.email,
          exam_schedule: examDateTime,
          year_level: application.year_level,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      console.log('Exam schedule email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
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
      fetchApplications();
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
      fetchApplications();
    } catch (error) {
      console.error('Error deleting application:', error);
      alert('Error deleting application: ' + error.message);
    }
  };

  const filteredApplications = applications.filter((app) => {
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
      rejected: { label: 'Rejected', class: 'status-rejected' },
    };

    const config =
      statusConfig[status] || { label: 'Pending', class: 'status-pending' };
    return (
      <span className={`status-badge ${config.class}`}>{config.label}</span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Micro Calendar rendering
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Previous month days
    const prevMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
      1
    );
    const daysInPrevMonth = getDaysInMonth(prevMonth);

    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(
        prevMonth.getFullYear(),
        prevMonth.getMonth(),
        daysInPrevMonth - i
      );
      days.push(
        <div key={`prev-${i}`} className="calendar-day micro other-month">
          {daysInPrevMonth - i}
        </div>
      );
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        i
      );
      const dateEvents = getEventsForDate(date);

      days.push(
        <div
          key={i}
          className={`calendar-day micro ${isToday(date) ? 'today' : ''} ${
            isSelected(date) ? 'selected' : ''
          }`}
          onClick={() => setSelectedDate(date)}
        >
          <span className="day-number micro">{i}</span>
          {dateEvents.length > 0 && (
            <div className="day-events micro">
              <div
                className="event-indicator micro"
                title={`${dateEvents.length} events`}
              >
                {dateEvents.length}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Next month days
    const totalCells = 42; // 6 weeks
    const nextMonthDays = totalCells - days.length;
    for (let i = 1; i <= nextMonthDays; i++) {
      days.push(
        <div key={`next-${i}`} className="calendar-day micro other-month">
          {i}
        </div>
      );
    }

    return days;
  };

  // ✅ FIXED NAVIGATION ITEMS - Removed duplicates
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '⌂' },
    { id: 'applications', label: 'Applications', icon: '📰' },
    { id: 'studentAdvising', label: 'Student Advising', icon: '🎓' },
    { id: 'subjects', label: 'Subjects', icon: '📚' },
    { id: 'exams', label: 'Exams', icon: '✓' },
    { id: 'reports', label: 'Reports', icon: '📉' },
    { id: 'settings', label: 'Settings', icon: '☰' },
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
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
      {/* Ultra Compact Navigation Sidebar */}
      <div
        className={`dashboard-sidebar ${
          isSidebarOpen ? 'open' : 'closed'
        } ${isMobile ? 'mobile' : ''}`}
      >
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="logo-ptc.png" alt="PTC Logo" />
          </div>
          {isSidebarOpen && (
            <div className="sidebar-title">
              <h3>PTC Admin</h3>
              <span className="admin-subtitle">Admin</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${
                activeSection === item.id ? 'active' : ''
              }`}
              onClick={() => {
                setActiveSection(item.id);
                if (isMobile) setIsSidebarOpen(false);
              }}
              title={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              {isSidebarOpen && (
                <span className="nav-label">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="nav-item logout-nav"
            onClick={onLogout}
            title="Logout"
          >
            <span className="nav-icon">🚪</span>
            {isSidebarOpen && <span className="nav-label">Logout</span>}
          </button>
        </div>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isMobile && isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content Area */}
      <div className="dashboard-main">
        {/* Compact Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <button className="mobile-menu-btn" onClick={toggleSidebar}>
                <span className="menu-icon">☰</span>
              </button>
              <h1 className="page-title">
                {navItems.find((item) => item.id === activeSection)?.label ||
                  'Dashboard'}
              </h1>
            </div>
            <div className="admin-info">
              <div className="admin-welcome">Welcome, Admin</div>
              <div className="admin-avatar">A</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="dashboard-content">
          {/* DASHBOARD SECTION */}
          {activeSection === 'dashboard' && (
            <div className="dashboard-grid swapped-layout">
              {/* Top Row: Calendar and To-Do */}
              <div className="dashboard-row top-row">
                {/* Micro Calendar with Label */}
                <div className="dashboard-card calendar-section micro">
                  <div className="card-header micro">
                    <div className="calendar-header-micro">
                      <button
                        onClick={() => navigateMonth(-1)}
                        className="nav-btn micro"
                      >
                        ‹
                      </button>
                      <span className="current-month micro">
                        {currentMonth.toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <button
                        onClick={() => navigateMonth(1)}
                        className="nav-btn micro"
                      >
                        ›
                      </button>
                    </div>
                    <div className="calendar-actions micro">
                      <button
                        onClick={() => setShowEventForm(!showEventForm)}
                        className="btn btn-primary micro"
                        title="Add event"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Calendar Label */}
                  <div className="calendar-label">
                    <span className="calendar-label-text">Academic Calendar</span>
                    <span className="calendar-label-badge live">Live</span>
                  </div>

                  <div className="calendar micro">
                    <div className="calendar-header micro">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                        <div
                          key={day}
                          className="calendar-day-header micro"
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="calendar-grid micro">
                      {renderCalendar()}
                    </div>
                  </div>

                  {/* Micro Event Form */}
                  {showEventForm && (
                    <div className="event-form micro">
                      <h4>Add Event for {selectedDate.toLocaleDateString()}</h4>
                      <div className="form-row micro">
                        <input
                          type="text"
                          placeholder="Event title"
                          value={newEventTitle}
                          onChange={(e) =>
                            setNewEventTitle(e.target.value)
                          }
                          className="event-input micro"
                        />
                        <input
                          type="time"
                          value={newEventTime}
                          onChange={(e) => setNewEventTime(e.target.value)}
                          className="time-input micro"
                        />
                        <button
                          onClick={addEvent}
                          className="btn btn-primary micro"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Micro Events List */}
                  {getEventsForDate(selectedDate).length > 0 && (
                    <div className="events-list micro">
                      <div className="events-header micro">
                        <h4>Today's Events</h4>
                        <span className="event-count micro">
                          {getEventsForDate(selectedDate).length}
                        </span>
                      </div>
                      <div className="events-container micro">
                        {getEventsForDate(selectedDate)
                          .slice(0, 2)
                          .map((event) => (
                            <div
                              key={event.id}
                              className="event-item micro"
                            >
                              <div className="event-time micro">
                                {event.time}
                              </div>
                              <div className="event-title micro">
                                {event.title}
                              </div>
                              <button
                                onClick={() =>
                                  deleteEvent(event.date, event.id)
                                }
                                className="btn-icon btn-delete micro"
                                title="Delete event"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Micro To-Do List */}
                <div className="dashboard-card todo-section micro">
                  <div className="card-header micro">
                    <h3>To-Do</h3>
                    <div className="todo-header-actions micro">
                      <span className="todo-count micro">
                        {todos.filter((todo) => !todo.completed).length}
                      </span>
                    </div>
                  </div>

                  {/* Micro Todo Input */}
                  <div className="todo-form micro">
                    <input
                      type="text"
                      placeholder="Add a task..."
                      value={newTodo}
                      onChange={(e) => setNewTodo(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                      className="todo-input micro"
                    />
                    <button
                      onClick={addTodo}
                      className="btn btn-primary micro"
                    >
                      Add
                    </button>
                  </div>

                  <div className="todo-list micro">
                    {todos.length === 0 ? (
                      <div className="no-todos micro">
                        <div className="no-todos-icon micro">📝</div>
                        <p>No tasks yet</p>
                      </div>
                    ) : (
                      <div className="todos-container micro">
                        {todos.slice(0, 4).map((todo) => (
                          <div key={todo.id} className="todo-item micro">
                            <label className="todo-checkbox micro">
                              <input
                                type="checkbox"
                                checked={todo.completed}
                                onChange={() => toggleTodo(todo.id)}
                              />
                              <span
                                className={`todo-text micro ${
                                  todo.completed ? 'completed' : ''
                                }`}
                              >
                                {todo.text}
                              </span>
                            </label>
                            <button
                              onClick={() => deleteTodo(todo.id)}
                              className="btn-icon btn-delete micro"
                              title="Delete task"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {todos.some((todo) => todo.completed) && (
                    <div className="todo-actions micro">
                      <button
                        onClick={clearCompletedTodos}
                        className="btn-text micro"
                      >
                        Clear Completed
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Row: Recent Activity - Full Width */}
              <div className="dashboard-row bottom-row">
                {/* Micro Recent Activity - Full Width */}
                <div className="dashboard-card recent-activity micro full-width">
                  <div className="card-header micro">
                    <h3>Recent Activity</h3>
                    <button className="btn-text micro">View All</button>
                  </div>
                  <div className="activity-list micro">
                    {applications.slice(0, 8).map((app) => (
                      <div key={app.id} className="activity-item micro">
                        <div className="activity-icon micro">📋</div>
                        <div className="activity-content micro">
                          <div className="activity-text micro">
                            <strong>
                              {app.first_name} {app.last_name}
                            </strong>{' '}
                            applied for {app.desired_program}
                          </div>
                          <div className="activity-meta micro">
                            <span className="activity-time micro">
                              {new Date(
                                app.submitted_at
                              ).toLocaleDateString()}
                            </span>
                            <span
                              className={`activity-status micro ${
                                app.status || 'submitted'
                              }`}
                            >
                              {app.status || 'Submitted'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* APPLICATIONS SECTION */}
          {activeSection === 'applications' && (
            <>
              <div className="dashboard-controls">
                <div className="search-box">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search applications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="filter-controls">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="status-filter"
                  >
                    <option value="all">All Status</option>
                    <option value="submitted">Submitted</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  <button
                    onClick={fetchApplications}
                    className="refresh-btn"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              <div className="applications-table-container">
                <table className="applications-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Program</th>
                      <th>Year Level</th>
                      <th>Submitted</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="no-data">
                          No applications found
                        </td>
                      </tr>
                    ) : (
                      filteredApplications.map((application) => (
                        <tr key={application.id}>
                          <td>
                            <div className="student-info-compact">
                              <div className="student-name">
                                {application.first_name}{' '}
                                {application.last_name}
                              </div>
                              <div className="student-email">
                                {application.email}
                              </div>
                            </div>
                          </td>
                          <td>{application.desired_program}</td>
                          <td>{application.year_level}</td>
                          <td>{formatDate(application.submitted_at)}</td>
                          <td>{getStatusBadge(application.status)}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                onClick={() =>
                                  handleScheduleExam(application)
                                }
                                className="btn-icon"
                                title="Schedule Exam"
                              >
                                🗓️
                              </button>

                              <select
                                value={application.status || 'submitted'}
                                onChange={(e) =>
                                  updateApplicationStatus(
                                    application.id,
                                    e.target.value
                                  )
                                }
                                className="status-select"
                              >
                                <option value="submitted">Submitted</option>
                                <option value="scheduled">Scheduled</option>
                                <option value="completed">Completed</option>
                                <option value="rejected">Rejected</option>
                              </select>

                              <button
                                onClick={() =>
                                  deleteApplication(application.id)
                                }
                                className="btn-icon btn-delete"
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
            </>
          )}

          {/* SUBJECTS MASTERLIST SECTION */}
          {activeSection === 'subjects' && <SubjectsPage />}

          {/* STUDENT ADVISING SECTION */}
          {activeSection === 'studentAdvising' && <StudentAdvisingPage />}

          {/* Placeholder for other sections */}
          {activeSection !== 'dashboard' &&
            activeSection !== 'applications' &&
            activeSection !== 'subjects' &&
            activeSection !== 'studentAdvising' && (
              <div className="section-placeholder">
                <div className="placeholder-icon">
                  {
                    navItems.find((item) => item.id === activeSection)
                      ?.icon
                  }
                </div>
                <h2>
                  {
                    navItems.find((item) => item.id === activeSection)
                      ?.label
                  }{' '}
                  Section
                </h2>
                <p>This section is under development.</p>
              </div>
            )}
        </div>
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
                <h4>
                  {selectedApplication.first_name}{' '}
                  {selectedApplication.last_name}
                </h4>
                <p>
                  {selectedApplication.email} •{' '}
                  {selectedApplication.desired_program}
                </p>
              </div>

              <div className="schedule-form">
                <div className="form-group">
                  <label>Exam Date</label>
                  <input
                    type="date"
                    value={examSchedule}
                    onChange={(e) => setExamSchedule(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label>Exam Time</label>
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
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={submitExamSchedule}
                className="btn btn-primary"
              >
                Schedule Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;