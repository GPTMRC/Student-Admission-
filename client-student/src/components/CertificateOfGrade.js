import React, { useState } from 'react';

const CertificateOfGrade = ({ studentData, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [gradeData, setGradeData] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState('all');

  const academicHistory = {
    'Spring 2024': [
      { code: 'CS101', name: 'Introduction to Programming', units: 3, grade: 'A', equivalent: 1.0 },
      { code: 'MATH201', name: 'Calculus I', units: 4, grade: 'B+', equivalent: 1.5 },
      { code: 'ENG101', name: 'Composition and Rhetoric', units: 3, grade: 'A-', equivalent: 1.25 },
      { code: 'SCI101', name: 'General Science', units: 3, grade: 'B', equivalent: 2.0 },
      { code: 'PE101', name: 'Physical Education', units: 2, grade: 'A', equivalent: 1.0 },
    ],
    'Fall 2023': [
      { code: 'CS100', name: 'Computer Fundamentals', units: 3, grade: 'A', equivalent: 1.0 },
      { code: 'MATH101', name: 'College Algebra', units: 3, grade: 'A-', equivalent: 1.25 },
      { code: 'COMM101', name: 'Communication Skills', units: 3, grade: 'B+', equivalent: 1.5 },
      { code: 'HIST101', name: 'Philippine History', units: 3, grade: 'A', equivalent: 1.0 },
    ],
    'Spring 2023': [
      { code: 'MATH100', name: 'Basic Mathematics', units: 3, grade: 'B+', equivalent: 1.5 },
      { code: 'ENG100', name: 'Basic English', units: 3, grade: 'A-', equivalent: 1.25 },
      { code: 'SCI100', name: 'General Science', units: 3, grade: 'B', equivalent: 2.0 },
    ]
  };

  const calculateGPA = (courses) => {
    const totalPoints = courses.reduce((sum, course) => sum + (course.equivalent * course.units), 0);
    const totalUnits = courses.reduce((sum, course) => sum + course.units, 0);
    return totalPoints / totalUnits;
  };

  const handleGenerateGrades = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const selectedCourses = selectedSemester === 'all' 
        ? Object.values(academicHistory).flat()
        : academicHistory[selectedSemester];

      const cumulativeGPA = calculateGPA(Object.values(academicHistory).flat());
      const semesterGPA = selectedSemester !== 'all' ? calculateGPA(academicHistory[selectedSemester]) : cumulativeGPA;

      setGradeData({
        generatedAt: new Date().toLocaleDateString(),
        selectedSemester,
        courses: selectedCourses,
        semesterGPA: semesterGPA.toFixed(2),
        cumulativeGPA: cumulativeGPA.toFixed(2),
        totalUnitsCompleted: Object.values(academicHistory).flat().reduce((sum, course) => sum + course.units, 0)
      });
      setIsGenerating(false);
    }, 2000);
  };

  const handleDownloadPDF = () => {
    alert('Downloading Certificate of Grades as PDF...');
  };

  const handlePrint = () => {
    window.print();
  };

  const getGradeColor = (grade) => {
    if (['A', 'A-', 'B+'].includes(grade)) return 'grade-excellent';
    if (['B', 'B-', 'C+'].includes(grade)) return 'grade-good';
    if (['C', 'C-', 'D+'].includes(grade)) return 'grade-average';
    return 'grade-poor';
  };

  return (
    <div className="document-section">
      <div className="document-header">
        <div className="header-with-close">
          <div>
            <h2>Certificate of Grades</h2>
            <p>Official grade report and academic performance</p>
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
              <label>Academic Standing:</label>
              <span className="status-badge status-completed">Good Standing</span>
            </div>
          </div>
        </div>

        {/* Semester Selection */}
        <div className="semester-selection">
          <label>Select Semester:</label>
          <select 
            value={selectedSemester} 
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="form-select"
          >
            <option value="all">All Semesters (Cumulative)</option>
            <option value="Spring 2024">Spring 2024</option>
            <option value="Fall 2023">Fall 2023</option>
            <option value="Spring 2023">Spring 2023</option>
          </select>
        </div>

        {/* Grade Report */}
        {gradeData && (
          <div className="grades-section">
            <div className="grades-header">
              <h3>Grade Report - {selectedSemester === 'all' ? 'Cumulative' : selectedSemester}</h3>
              <div className="gpa-summary">
                <div className="gpa-item">
                  <span className="gpa-label">
                    {selectedSemester === 'all' ? 'Cumulative GPA' : 'Semester GPA'}:
                  </span>
                  <span className="gpa-value">{gradeData.semesterGPA}</span>
                </div>
                {selectedSemester === 'all' && (
                  <div className="gpa-item">
                    <span className="gpa-label">Total Units Completed:</span>
                    <span className="gpa-value">{gradeData.totalUnitsCompleted}</span>
                  </div>
                )}
              </div>
            </div>

            <table className="grades-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th>Units</th>
                  <th>Grade</th>
                  <th>Equivalent</th>
                  <th>Semester</th>
                </tr>
              </thead>
              <tbody>
                {gradeData.courses.map((course, index) => (
                  <tr key={`${course.code}-${index}`}>
                    <td>{course.code}</td>
                    <td>{course.name}</td>
                    <td>{course.units}</td>
                    <td>
                      <span className={`grade-badge ${getGradeColor(course.grade)}`}>
                        {course.grade}
                      </span>
                    </td>
                    <td>{course.equivalent}</td>
                    <td>
                      {Object.keys(academicHistory).find(semester => 
                        academicHistory[semester].some(c => c.code === course.code)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Grading System Legend */}
            <div className="grading-legend">
              <h4>Grading System:</h4>
              <div className="grade-scale">
                <span>A: 1.0 (Excellent)</span>
                <span>B+: 1.5 (Very Good)</span>
                <span>B: 2.0 (Good)</span>
                <span>C+: 2.5 (Satisfactory)</span>
                <span>C: 3.0 (Passing)</span>
                <span>D: 4.0 (Conditional)</span>
                <span>F: 5.0 (Failed)</span>
              </div>
            </div>
          </div>
        )}

        {/* Official Footer */}
        {gradeData && (
          <div className="document-footer">
            <div className="official-stamps">
              <div className="stamp-section">
                <div className="stamp-placeholder">REGISTRAR'S OFFICE</div>
                <p>Official Seal</p>
              </div>
            </div>
            <div className="generation-info">
              <p><strong>Generated on:</strong> {gradeData.generatedAt}</p>
              <p><strong>Document ID:</strong> CG-{studentData.student_number}-{Date.now()}</p>
              <p><strong>This is an unofficial document. For official copies, visit the Registrar's Office.</strong></p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="document-actions">
          {!gradeData ? (
            <button 
              className={`btn-confirm large ${isGenerating ? 'loading' : ''}`}
              onClick={handleGenerateGrades}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="loading-spinner-small"></span>
                  Generating Grade Report...
                </>
              ) : (
                'Generate Certificate of Grades'
              )}
            </button>
          ) : (
            <div className="action-buttons-group">
              <button className="btn-confirm large" onClick={handleDownloadPDF}>
                📄 Download Grades PDF
              </button>
              <button className="btn-schedule large" onClick={handlePrint}>
                🖨️ Print Grade Report
              </button>
              <button className="btn-schedule large" onClick={() => setGradeData(null)}>
                🔄 Generate New
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificateOfGrade;