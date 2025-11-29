import React, { useState } from 'react';

const CertificateOfRegistration = ({ studentData, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [corData, setCorData] = useState(null);

  const currentSemesterCourses = [
    { code: 'CS101', name: 'Introduction to Programming', units: 3, schedule: 'MWF 9:00-10:00', room: 'CS Lab 1' },
    { code: 'MATH201', name: 'Calculus I', units: 4, schedule: 'TTH 10:00-11:30', room: 'Math 202' },
    { code: 'ENG101', name: 'Composition and Rhetoric', units: 3, schedule: 'MWF 11:00-12:00', room: 'English 101' },
    { code: 'SCI101', name: 'General Science', units: 3, schedule: 'TTH 1:00-2:30', room: 'Science Lab 3' },
    { code: 'PE101', name: 'Physical Education', units: 2, schedule: 'F 2:00-4:00', room: 'Gymnasium' },
  ];

  const handleGenerateCOR = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setCorData({
        generatedAt: new Date().toLocaleDateString(),
        semester: 'Spring 2024',
        totalUnits: currentSemesterCourses.reduce((sum, course) => sum + course.units, 0),
        courses: currentSemesterCourses,
        academicYear: '2023-2024',
        dateGenerated: new Date().toISOString()
      });
      setIsGenerating(false);
    }, 2000);
  };

  const handleDownloadPDF = () => {
    alert('Downloading Certificate of Registration as PDF...');
    // In a real application, this would generate and download a PDF file
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="document-section">
      <div className="document-header">
        <div className="header-with-close">
          <div>
            <h2>Certificate of Registration</h2>
            <p>Official registration document for current semester</p>
          </div>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
      </div>

      <div className="document-content">
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
              <label>Year Level:</label>
              <span>{studentData.year_level}</span>
            </div>
            <div className="info-item">
              <label>Academic Year:</label>
              <span>2023-2024</span>
            </div>
            <div className="info-item">
              <label>Semester:</label>
              <span>Spring 2024</span>
            </div>
          </div>
        </div>

        {/* Course Registration */}
        {corData && (
          <div className="courses-section">
            <h3>Registered Courses - {corData.semester}</h3>
            <table className="courses-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th>Units</th>
                  <th>Schedule</th>
                  <th>Room</th>
                </tr>
              </thead>
              <tbody>
                {corData.courses.map((course, index) => (
                  <tr key={course.code}>
                    <td>{course.code}</td>
                    <td>{course.name}</td>
                    <td>{course.units}</td>
                    <td>{course.schedule}</td>
                    <td>{course.room}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="2"><strong>Total Units</strong></td>
                  <td><strong>{corData.totalUnits}</strong></td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Official Stamps and Signatures */}
        {corData && (
          <div className="document-footer">
            <div className="official-stamps">
              <div className="stamp-section">
                <div className="stamp-placeholder">REGISTRAR'S OFFICE</div>
                <p>Registrar's Signature</p>
              </div>
              <div className="stamp-section">
                <div className="stamp-placeholder">ACADEMIC AFFAIRS</div>
                <p>Dean's Signature</p>
              </div>
            </div>
            <div className="generation-info">
              <p><strong>Generated on:</strong> {corData.generatedAt}</p>
              <p><strong>Document ID:</strong> COR-{studentData.student_number}-2024-SPRING</p>
              <p><strong>Status:</strong> Officially Registered</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="document-actions">
          {!corData ? (
            <button 
              className={`btn-confirm large ${isGenerating ? 'loading' : ''}`}
              onClick={handleGenerateCOR}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="loading-spinner-small"></span>
                  Generating COR...
                </>
              ) : (
                'Generate Certificate of Registration'
              )}
            </button>
          ) : (
            <div className="action-buttons-group">
              <button className="btn-confirm large" onClick={handleDownloadPDF}>
                📄 Download COR PDF
              </button>
              <button className="btn-schedule large" onClick={handlePrint}>
                🖨️ Print COR
              </button>
              <button className="btn-schedule large" onClick={() => setCorData(null)}>
                🔄 Generate New
              </button>
            </div>
          )}
        </div>

        {/* Important Notes */}
        <div className="important-notes">
          <h4>Important Notes:</h4>
          <ul>
            <li>This document is an official record of your course registration</li>
            <li>Keep this document for your records and for any official purposes</li>
            <li>Changes to registration must be processed through the Registrar's Office</li>
            <li>This COR is valid for the current semester only</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CertificateOfRegistration;