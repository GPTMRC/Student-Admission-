import React, { useState, useEffect } from 'react';
import './ExamSection.css';

const ExamSection = () => {
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    examType: 'all',
    dateRange: ''
  });

  // Sample data - you can replace this with actual data from your database
  const sampleExams = [
    {
      exam_id: 1,
      student_id: 101,
      full_name: 'John Smith',
      desired_program: 'Computer Science',
      exam_type: 'Entrance Exam',
      exam_date: '2024-01-15',
      exam_time: '09:00:00',
      exam_room: 'Room 101',
      exam_score: 85.50,
      total_score: 100.00,
      exam_status: 'completed',
      proctor_name: 'Dr. Smith',
      exam_duration: 120,
      exam_subject: 'General Aptitude',
      remarks: 'Excellent performance'
    },
    {
      exam_id: 2,
      student_id: 102,
      full_name: 'Maria Garcia',
      desired_program: 'Business Administration',
      exam_type: 'Entrance Exam',
      exam_date: '2024-01-15',
      exam_time: '09:00:00',
      exam_room: 'Room 102',
      exam_score: null,
      total_score: 100.00,
      exam_status: 'scheduled',
      proctor_name: 'Prof. Johnson',
      exam_duration: 120,
      exam_subject: 'General Aptitude',
      remarks: ''
    }
  ];

  useEffect(() => {
    // In real application, fetch from API
    setExams(sampleExams);
    setFilteredExams(sampleExams);
  }, []);

  useEffect(() => {
    filterExams();
  }, [filters, exams]);

  const filterExams = () => {
    let filtered = exams;

    if (filters.status !== 'all') {
      filtered = filtered.filter(exam => exam.exam_status === filters.status);
    }

    if (filters.examType !== 'all') {
      filtered = filtered.filter(exam => exam.exam_type === filters.examType);
    }

    if (filters.dateRange) {
      filtered = filtered.filter(exam => exam.exam_date === filters.dateRange);
    }

    setFilteredExams(filtered);
  };

  const handleViewDetails = (exam) => {
    setSelectedExam(exam);
    setIsModalOpen(true);
  };

  const handleUpdateScore = (examId, newScore) => {
    setExams(prev => prev.map(exam => 
      exam.exam_id === examId 
        ? { ...exam, exam_score: newScore, exam_status: 'completed' }
        : exam
    ));
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      scheduled: 'status-scheduled',
      completed: 'status-completed',
      absent: 'status-absent',
      cancelled: 'status-cancelled',
      rescheduled: 'status-rescheduled'
    };

    return <span className={`status-badge ${statusClasses[status]}`}>{status}</span>;
  };

  const calculatePercentage = (score, total) => {
    return total > 0 ? ((score / total) * 100).toFixed(1) : 0;
  };

  return (
    <div className="exam-section">
      <div className="section-header">
        <h2>Exam Management</h2>
        <p>Manage student exams, schedules, and results</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filters.status} 
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="absent">Absent</option>
            <option value="cancelled">Cancelled</option>
            <option value="rescheduled">Rescheduled</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Exam Type:</label>
          <select 
            value={filters.examType} 
            onChange={(e) => setFilters(prev => ({ ...prev, examType: e.target.value }))}
          >
            <option value="all">All Types</option>
            <option value="Entrance Exam">Entrance Exam</option>
            <option value="Make-up Exam">Make-up Exam</option>
            <option value="Special Exam">Special Exam</option>
            <option value="Retake Exam">Retake Exam</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Exam Date:</label>
          <input 
            type="date" 
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
          />
        </div>
      </div>

      {/* Exams Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Program</th>
              <th>Exam Type</th>
              <th>Date & Time</th>
              <th>Room</th>
              <th>Score</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExams.map(exam => (
              <tr key={exam.exam_id}>
                <td className="student-info">
                  <div className="student-name">{exam.full_name}</div>
                  <div className="student-id">ID: {exam.student_id}</div>
                </td>
                <td>{exam.desired_program}</td>
                <td>{exam.exam_type}</td>
                <td>
                  <div className="datetime-cell">
                    <div className="date">{new Date(exam.exam_date).toLocaleDateString()}</div>
                    <div className="time">{exam.exam_time.slice(0, 5)}</div>
                  </div>
                </td>
                <td>{exam.exam_room}</td>
                <td>
                  {exam.exam_score ? (
                    <div className="score-cell">
                      <span className="score">{exam.exam_score}/{exam.total_score}</span>
                      <span className="percentage">
                        ({calculatePercentage(exam.exam_score, exam.total_score)}%)
                      </span>
                    </div>
                  ) : (
                    <span className="no-score">Not taken</span>
                  )}
                </td>
                <td>{getStatusBadge(exam.exam_status)}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-primary btn-small"
                      onClick={() => handleViewDetails(exam)}
                    >
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredExams.length === 0 && (
          <div className="no-data">
            <p>No exams found matching the current filters.</p>
          </div>
        )}
      </div>

      {/* Exam Details Modal */}
      {isModalOpen && selectedExam && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Exam Details</h2>
              <button 
                className="close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Student Name:</label>
                  <span>{selectedExam.full_name}</span>
                </div>
                <div className="detail-item">
                  <label>Student ID:</label>
                  <span>{selectedExam.student_id}</span>
                </div>
                <div className="detail-item">
                  <label>Desired Program:</label>
                  <span>{selectedExam.desired_program}</span>
                </div>
                <div className="detail-item">
                  <label>Exam Type:</label>
                  <span>{selectedExam.exam_type}</span>
                </div>
                <div className="detail-item">
                  <label>Exam Date:</label>
                  <span>{new Date(selectedExam.exam_date).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <label>Exam Time:</label>
                  <span>{selectedExam.exam_time.slice(0, 5)}</span>
                </div>
                <div className="detail-item">
                  <label>Room:</label>
                  <span>{selectedExam.exam_room}</span>
                </div>
                <div className="detail-item">
                  <label>Proctor:</label>
                  <span>{selectedExam.proctor_name}</span>
                </div>
                <div className="detail-item">
                  <label>Duration:</label>
                  <span>{selectedExam.exam_duration} minutes</span>
                </div>
                <div className="detail-item">
                  <label>Subject:</label>
                  <span>{selectedExam.exam_subject}</span>
                </div>
                <div className="detail-item">
                  <label>Status:</label>
                  <span>{getStatusBadge(selectedExam.exam_status)}</span>
                </div>
                {selectedExam.exam_score && (
                  <>
                    <div className="detail-item">
                      <label>Score:</label>
                      <span className="score-detail">
                        {selectedExam.exam_score}/{selectedExam.total_score} 
                        ({calculatePercentage(selectedExam.exam_score, selectedExam.total_score)}%)
                      </span>
                    </div>
                    <div className="detail-item full-width">
                      <label>Remarks:</label>
                      <span>{selectedExam.remarks}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamSection;