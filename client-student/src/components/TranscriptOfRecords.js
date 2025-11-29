import React, { useState } from 'react';

const TranscriptOfRecords = ({ studentData, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [transcriptData, setTranscriptData] = useState(null);
  const [requestType, setRequestType] = useState('unofficial');

  const completeAcademicRecord = [
    {
      semester: 'Spring 2024',
      courses: [
        { code: 'CS101', name: 'Introduction to Programming', units: 3, grade: 'A', equivalent: 1.0 },
        { code: 'MATH201', name: 'Calculus I', units: 4, grade: 'B+', equivalent: 1.5 },
        { code: 'ENG101', name: 'Composition and Rhetoric', units: 3, grade: 'A-', equivalent: 1.25 },
        { code: 'SCI101', name: 'General Science', units: 3, grade: 'B', equivalent: 2.0 },
        { code: 'PE101', name: 'Physical Education', units: 2, grade: 'A', equivalent: 1.0 },
      ]
    },
    {
      semester: 'Fall 2023',
      courses: [
        { code: 'CS100', name: 'Computer Fundamentals', units: 3, grade: 'A', equivalent: 1.0 },
        { code: 'MATH101', name: 'College Algebra', units: 3, grade: 'A-', equivalent: 1.25 },
        { code: 'COMM101', name: 'Communication Skills', units: 3, grade: 'B+', equivalent: 1.5 },
        { code: 'HIST101', name: 'Philippine History', units: 3, grade: 'A', equivalent: 1.0 },
        { code: 'NSTP101', name: 'ROTC/CWTS', units: 3, grade: 'A', equivalent: 1.0 },
      ]
    },
    {
      semester: 'Spring 2023',
      courses: [
        { code: 'MATH100', name: 'Basic Mathematics', units: 3, grade: 'B+', equivalent: 1.5 },
        { code: 'ENG100', name: 'Basic English', units: 3, grade: 'A-', equivalent: 1.25 },
        { code: 'SCI100', name: 'General Science', units: 3, grade: 'B', equivalent: 2.0 },
        { code: 'FIL101', name: 'Filipino 1', units: 3, grade: 'A', equivalent: 1.0 },
        { code: 'PE100', name: 'Physical Fitness', units: 2, grade: 'A', equivalent: 1.0 },
      ]
    }
  ];

  const calculateStatistics = () => {
    const allCourses = completeAcademicRecord.flatMap(semester => semester.courses);
    const totalUnits = allCourses.reduce((sum, course) => sum + course.units, 0);
    const totalPoints = allCourses.reduce((sum, course) => sum + (course.equivalent * course.units), 0);
    const gpa = totalPoints / totalUnits;
    
    const gradesCount = allCourses.reduce((count, course) => {
      count[course.grade] = (count[course.grade] || 0) + 1;
      return count;
    }, {});

    return {
      totalUnits,
      cumulativeGPA: gpa.toFixed(2),
      gradesCount,
      totalCourses: allCourses.length
    };
  };

  const handleGenerateTranscript = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const stats = calculateStatistics();
      
      setTranscriptData({
        generatedAt: new Date().toLocaleDateString(),
        academicRecord: completeAcademicRecord,
        statistics: stats,
        requestType,
        documentId: `TOR-${studentData.student_number}-${Date.now()}`,
        academicYear: '2023-2024',
        dateOfEntry: 'August 2022',
        expectedGraduation: 'May 2026'
      });
      setIsGenerating(false);
    }, 3000);
  };

  const handleRequestOfficial = () => {
    alert('Official transcript request submitted. Please allow 3-5 business days for processing.');
  };

  const handleDownloadPDF = () => {
    alert(`Downloading ${requestType} Transcript as PDF...`);
  };

  const handlePrint = () => {
    window.print();
  };

  const getGradeColor = (grade) => {
    if (['A', 'A-'].includes(grade)) return 'grade-excellent';
    if (['B+', 'B'].includes(grade)) return 'grade-good';
    if (['B-', 'C+'].includes(grade)) return 'grade-average';
    return 'grade-poor';
  };

  return (
    <div className="document-section">
      <div className="document-header">
        <div className="header-with-close">
          <div>
            <h2>Transcript of Records</h2>
            <p>Complete academic history and official transcript</p>
          </div>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
      </div>

      <div className="document-content">
        {/* Request Type Selection */}
        <div className="request-type-selection">
          <h3>Transcript Type</h3>
          <div className="request-options">
            <label className="request-option">
              <input
                type="radio"
                value="unofficial"
                checked={requestType === 'unofficial'}
                onChange={(e) => setRequestType(e.target.value)}
              />
              <div className="option-content">
                <h4>Unofficial Transcript</h4>
                <p>Immediate download for personal reference</p>
                <span className="option-badge">Free</span>
              </div>
            </label>
            
            <label className="request-option">
              <input
                type="radio"
                value="official"
                checked={requestType === 'official'}
                onChange={(e) => setRequestType(e.target.value)}
              />
              <div className="option-content">
                <h4>Official Transcript</h4>
                <p>Sealed copy with official signatures</p>
                <span className="option-badge">₱250.00</span>
              </div>
            </label>
          </div>
        </div>

        {/* Student Information */}
        <div className="student-info-section">
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
              <label>Date of Entry:</label>
              <span>August 2022</span>
            </div>
            <div className="info-item">
              <label>Expected Graduation:</label>
              <span>May 2026</span>
            </div>
            <div className="info-item">
              <label>Academic Status:</label>
              <span className="status-badge status-completed">Regular Student</span>
            </div>
          </div>
        </div>

        {/* Transcript Content */}
        {transcriptData && (
          <div className="transcript-content">
            {/* Academic Statistics */}
            <div className="academic-statistics">
              <h3>Academic Summary</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-value">{transcriptData.statistics.cumulativeGPA}</span>
                  <span className="stat-label">Cumulative GPA</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{transcriptData.statistics.totalUnits}</span>
                  <span className="stat-label">Total Units</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{transcriptData.statistics.totalCourses}</span>
                  <span className="stat-label">Courses Completed</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">3</span>
                  <span className="stat-label">Semesters</span>
                </div>
              </div>
            </div>

            {/* Complete Academic Record */}
            <div className="academic-record">
              <h3>Complete Academic Record</h3>
              {transcriptData.academicRecord.map((semester, index) => (
                <div key={semester.semester} className="semester-record">
                  <h4>{semester.semester}</h4>
                  <table className="transcript-table">
                    <thead>
                      <tr>
                        <th>Course Code</th>
                        <th>Course Name</th>
                        <th>Units</th>
                        <th>Grade</th>
                        <th>Equivalent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {semester.courses.map(course => (
                        <tr key={course.code}>
                          <td>{course.code}</td>
                          <td>{course.name}</td>
                          <td>{course.units}</td>
                          <td>
                            <span className={`grade-badge ${getGradeColor(course.grade)}`}>
                              {course.grade}
                            </span>
                          </td>
                          <td>{course.equivalent}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="2">
                          <strong>Semester Total:</strong>
                        </td>
                        <td>
                          <strong>
                            {semester.courses.reduce((sum, course) => sum + course.units, 0)}
                          </strong>
                        </td>
                        <td colSpan="2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ))}
            </div>

            {/* Official Stamps for Official Transcripts */}
            {requestType === 'official' && (
              <div className="official-endorsement">
                <div className="endorsement-stamps">
                  <div className="endorsement-section">
                    <div className="official-stamp">OFFICIAL SEAL</div>
                    <p>Registrar's Signature</p>
                    <p>Date: {transcriptData.generatedAt}</p>
                  </div>
                  <div className="endorsement-section">
                    <div className="official-stamp">ACADEMIC AFFAIRS</div>
                    <p>Dean's Signature</p>
                    <p>Date: {transcriptData.generatedAt}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="document-actions">
          {!transcriptData ? (
            <button 
              className={`btn-confirm large ${isGenerating ? 'loading' : ''}`}
              onClick={handleGenerateTranscript}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="loading-spinner-small"></span>
                  Generating Transcript...
                </>
              ) : (
                `Generate ${requestType === 'official' ? 'Official' : 'Unofficial'} Transcript`
              )}
            </button>
          ) : (
            <div className="action-buttons-group">
              {requestType === 'unofficial' ? (
                <>
                  <button className="btn-confirm large" onClick={handleDownloadPDF}>
                    📄 Download Transcript PDF
                  </button>
                  <button className="btn-schedule large" onClick={handlePrint}>
                    🖨️ Print Transcript
                  </button>
                </>
              ) : (
                <button className="btn-confirm large" onClick={handleRequestOfficial}>
                  📋 Request Official Transcript
                </button>
              )}
              <button className="btn-schedule large" onClick={() => setTranscriptData(null)}>
                🔄 Generate New
              </button>
            </div>
          )}
        </div>

        {/* Important Information */}
        <div className="important-info">
          <h4>Important Information:</h4>
          <ul>
            <li>Unofficial transcripts are for personal reference only</li>
            <li>Official transcripts require 3-5 business days for processing</li>
            <li>Official transcripts include raised seals and signatures</li>
            <li>There is a ₱250.00 fee for official transcript requests</li>
            <li>Transcripts can be picked up at the Registrar's Office or mailed to specified addresses</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TranscriptOfRecords;