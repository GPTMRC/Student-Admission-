import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './certificate.css'

// Import your logo images
import ptcLogo from '../assets/ptc-logo.png';
import ptcLogoTransparent from '../assets/ptc-logo-transparent.png';

const CertificateOfRegistration = ({ studentData, onClose }) => {
  const certificateRef = useRef();
  const [isGenerating, setIsGenerating] = useState(false);
  const [corData, setCorData] = useState(null);
  const [enrolledSubjects, setEnrolledSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Helper to safely uppercase values
  const U = (v) => {
    if (v === null || v === undefined) return '-';
    return String(v).toUpperCase();
  };

  // Fetch enrolled subjects from your database
  useEffect(() => {
    const fetchEnrolledSubjects = async () => {
      if (!studentData?.student_number) {
        setLoading(false);
        return;
      }

      try {
        // Replace this with your actual API call to fetch enrolled subjects
        const response = await fetch(`/api/student/enrolled-subjects/${studentData.student_number}`);
        if (response.ok) {
          const subjects = await response.json();
          setEnrolledSubjects(subjects);
        } else {
          console.error('Failed to fetch enrolled subjects');
          // Fallback to empty array
          setEnrolledSubjects([]);
        }
      } catch (error) {
        console.error('Error fetching enrolled subjects:', error);
        setEnrolledSubjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledSubjects();
  }, [studentData?.student_number]);

  // Process enrolled subjects data to match the required format
  const processEnrolledSubjects = (subjects) => {
    return subjects.map(subject => ({
      code: subject.subject_code || '-',
      name: subject.subject_name || '-',
      units: subject.units || 0,
      schedule: this.getScheduleFromDatabase(subject), // You'll need to implement this
      room: this.getRoomFromDatabase(subject), // You'll need to implement this
      lec: this.getLectureHours(subject), // Calculate based on your data
      lab: this.getLabHours(subject), // Calculate based on your data
      comp: this.getComputerHours(subject), // Calculate based on your data
      section: subject.section || '-',
      professor: this.getProfessorFromDatabase(subject) // You'll need to implement this
    }));
  };

  // Placeholder methods - you'll need to implement these based on your database structure
  const getScheduleFromDatabase = (subject) => {
    // Implement based on your schedule data
    // This could come from a separate table or be stored with the subject
    return subject.schedule || 'MWF 9:00-10:00'; // Fallback
  };

  const getRoomFromDatabase = (subject) => {
    // Implement based on your room assignment data
    return subject.room || 'TBA'; // Fallback
  };

  const getLectureHours = (subject) => {
    // Calculate lecture hours based on your data structure
    // This might come from a separate field or be calculated
    return subject.lecture_hours || '3'; // Fallback
  };

  const getLabHours = (subject) => {
    // Calculate lab hours based on your data structure
    return subject.lab_hours || '0'; // Fallback
  };

  const getComputerHours = (subject) => {
    // Calculate computer hours based on your data structure
    return subject.computer_hours || '0'; // Fallback
  };

  const getProfessorFromDatabase = (subject) => {
    // Implement based on your faculty assignment data
    return subject.professor || 'TBA'; // Fallback
  };

  // Calculate fees based on enrolled subjects
  const calculateFees = (subjects) => {
    const totalUnits = subjects.reduce((sum, subject) => sum + (subject.units || 0), 0);
    
    // Adjust these calculations based on your actual fee structure
    const tuitionFee = totalUnits * 600; // Example: 600 per unit
    const labFee = subjects.reduce((sum, subject) => sum + (subject.lab_hours || 0) * 300, 0); // Example: 300 per lab hour
    const compFee = subjects.reduce((sum, subject) => sum + (subject.computer_hours || 0) * 200, 0); // Example: 200 per computer hour
    
    const totalFees = tuitionFee + labFee + compFee;

    return {
      tuitionFee: tuitionFee.toLocaleString(),
      labFee: labFee.toLocaleString(),
      compFee: compFee.toLocaleString(),
      totalFees: totalFees.toLocaleString()
    };
  };

  // Default display data with actual database values
  const displayData = {
    studentId: studentData?.student_number || '-',
    program: studentData?.program_enrolled || '-',
    yearLevel: studentData?.year_level || '-',
    semester: studentData?.current_semester || '1ST SEM',
    status: studentData?.status || 'REGULAR',
    studentName: studentData ? 
      `${U(studentData.last_name)}, ${U(studentData.first_name)} ${studentData.middle_name ? U(studentData.middle_name) + ' ' : ''}`.trim() 
      : '-',
    address: studentData?.address || '-',
    sex: studentData?.gender || '-',
    academicYear: studentData?.school_year || '2025-2026',
    subjects: processEnrolledSubjects(enrolledSubjects).map(course => ({
      code: course.code,
      title: course.name,
      unit: course.units.toString(),
      lec: course.lec,
      lab: course.lab,
      comp: course.comp,
      section: course.section,
      day: course.schedule.split(' ')[0],
      time: course.schedule.split(' ')[1],
      professor: course.professor,
      room: course.room
    })),
    ...calculateFees(enrolledSubjects)
  };

  const handleGenerateCOR = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setCorData({
        generatedAt: new Date().toLocaleDateString(),
        semester: displayData.semester,
        totalUnits: enrolledSubjects.reduce((sum, subject) => sum + (subject.units || 0), 0),
        courses: processEnrolledSubjects(enrolledSubjects),
        academicYear: displayData.academicYear,
        dateGenerated: new Date().toISOString()
      });
      setIsGenerating(false);
    }, 1500);
  };

  const generatePDF = async () => {
    if (!corData) {
      alert('Please generate the Certificate of Registration first.');
      return;
    }

    setIsGenerating(true);
    try {
      const element = certificateRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.9);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: 'letter'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`certificate-of-registration-${displayData.studentId}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    if (!corData) {
      alert('Please generate the Certificate of Registration first.');
      return;
    }
    window.print();
  };

  const handleGenerateNew = () => {
    setCorData(null);
  };

  if (loading) {
    return (
      <div className="certificate-of-registration-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading enrollment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="certificate-of-registration-container">
      {/* Header with Close Button */}
      <div className="document-header">
        <div className="header-with-close">
          <div>
            <h2>Certificate of Registration</h2>
            <p>Official registration document for current semester</p>
          </div>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
      </div>

      {/* Action Buttons - Only show when COR is not generated */}
      {!corData && (
        <div className="document-actions">
          <button 
            className={`btn-confirm large ${isGenerating ? 'loading' : ''}`}
            onClick={handleGenerateCOR}
            disabled={isGenerating || enrolledSubjects.length === 0}
          >
            {isGenerating ? (
              <>
                <span className="loading-spinner-small"></span>
                Generating Certificate of Registration...
              </>
            ) : enrolledSubjects.length === 0 ? (
              'No Enrolled Subjects Found'
            ) : (
              'Generate Certificate of Registration'
            )}
          </button>
          {enrolledSubjects.length === 0 && (
            <div className="warning-message">
              <p>No enrolled subjects found for this student. Please contact the registrar's office.</p>
            </div>
          )}
        </div>
      )}

      {/* Certificate Content - Only show when COR is generated */}
      {corData && (
        <>
          <div className="certificate-of-registration" id="certificate-of-registration" ref={certificateRef}>
            {/* Background Watermark Logo */}
            <div className="background-watermark">
              <img 
                src={ptcLogoTransparent} 
                alt="PTC Watermark" 
                className="watermark-logo"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = e.target.parentNode;
                  fallback.innerHTML = '<div style="font-size: 120px; color: #f0f0f0; font-weight: bold; opacity: 0.1;">PTC</div>';
                }}
              />
            </div>

            {/* School Header */}
            <div className="school-header">
              <div className="school-logo-section">
                <div className="logo-container">
                  <div className="logo-image-container">
                    <img 
                      src={ptcLogo} 
                      alt="Pateros Technological College Logo" 
                      className="school-logo"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallback = document.createElement('div');
                        fallback.className = 'logo-placeholder';
                        fallback.textContent = 'PTC LOGO';
                        e.target.parentNode.appendChild(fallback);
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="school-info">
                <h1 className="school-name">PATEROS TECHNOLOGICAL COLLEGE</h1>
                <p className="school-address">College st. Sto. Rosario-Kanluran Pateros, Metro Manila</p>
                <p className="school-tel">Tel: 8424-8370 Loc. 306</p>
              </div>
            </div>

            {/* Certificate Title */}
            <div className="certificate-title">
              <h2>CERTIFICATE OF REGISTRATION</h2>
              <div className="academic-info">
                <p>{U(displayData.semester)} SEM: S.Y: {U(displayData.academicYear)}</p>
              </div>
            </div>

            {/* Student Information */}
            <div className="student-info" aria-label="Student information">
              <div className="info-row">
                <div className="info-item">
                  <span className="label">ID NO:</span>
                  <span className="value">{U(displayData.studentId)}</span>
                </div>
                <div className="info-item">
                  <span className="label">PROGRAM:</span>
                  <span className="value">{U(displayData.program)}</span>
                </div>
              </div>

              <div className="info-row">
                <div className="info-item">
                  <span className="label">YEAR LEVEL:</span>
                  <span className="value">{U(displayData.yearLevel)}</span>
                </div>
                <div className="info-item">
                  <span className="label">SEM:</span>
                  <span className="value">{U(displayData.semester)}</span>
                </div>
              </div>

              <div className="info-row">
                <div className="info-item">
                  <span className="label">STATUS:</span>
                  <span className="value">{U(displayData.status)}</span>
                </div>
                <div className="info-item">
                  <span className="label">SEX:</span>
                  <span className="value">{displayData.sex ? U(displayData.sex) : '-'}</span>
                </div>
              </div>

              <div className="info-row full-width">
                <div className="info-item">
                  <span className="label">NAME:</span>
                  <span className="value">{U(displayData.studentName)}</span>
                </div>
              </div>

              <div className="info-row full-width">
                <div className="info-item">
                  <span className="label">ADDRESS:</span>
                  <span className="value">{U(displayData.address)}</span>
                </div>
              </div>
            </div>

            {/* Subjects Table */}
            <div className="subjects-section" aria-labelledby="subjects-heading">
              <h3 id="subjects-heading">ENROLLED SUBJECTS</h3>
              {displayData.subjects.length > 0 ? (
                <table className="subjects-table" aria-label="Enrolled subjects table">
                  <thead>
                    <tr>
                      <th scope="col">CODE</th>
                      <th scope="col">TITLE</th>
                      <th scope="col">UNIT</th>
                      <th scope="col">LEC</th>
                      <th scope="col">LAB</th>
                      <th scope="col">COMP</th>
                      <th scope="col">SECT</th>
                      <th scope="col">DAY</th>
                      <th scope="col">TIME</th>
                      <th scope="col">PROFESSOR</th>
                      <th scope="col">ROOM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayData.subjects.map((subject, index) => (
                      <tr key={index}>
                        <td>{U(subject.code)}</td>
                        <td className="subject-title">{U(subject.title)}</td>
                        <td>{U(subject.unit)}</td>
                        <td>{U(subject.lec)}</td>
                        <td>{U(subject.lab)}</td>
                        <td>{U(subject.comp)}</td>
                        <td>{U(subject.section)}</td>
                        <td>{U(subject.day)}</td>
                        <td>{U(subject.time)}</td>
                        <td className="professor-name">{U(subject.professor)}</td>
                        <td>{U(subject.room)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-subjects-message">
                  <p>No subjects enrolled for this semester.</p>
                </div>
              )}
            </div>

            {/* Fees Section */}
            <div className="fees-section">
              <div className="fees-left">
                <h4>FEES ASSESSMENT</h4>
                <div className="fee-item">
                  <span>{U('Tuition:')}</span>
                  <span>{U(`P ${displayData.tuitionFee}`)}</span>
                </div>
                <div className="fee-item">
                  <span>{U('Lab Fee:')}</span>
                  <span>{U(`P ${displayData.labFee}`)}</span>
                </div>
                <div className="fee-item">
                  <span>{U('Computer:')}</span>
                  <span>{U(`P ${displayData.compFee}`)}</span>
                </div>
                <div className="fee-total">
                  <span>{U(`TOTAL: P ${displayData.totalFees}`)}</span>
                </div>
              </div>

              <div className="fees-right">
                <h4>OTHER FEES</h4>
                <div className="other-fees">
                  <div className="other-fee-item"><span>{U('Registration:')}</span><span>{U('P 75')}</span></div>
                  <div className="other-fee-item"><span>{U('Library:')}</span><span>{U('P 40')}</span></div>
                  <div className="other-fee-item"><span>{U('Publication:')}</span><span>{U('P 75')}</span></div>
                  <div className="other-fee-item"><span>{U('Athletic:')}</span><span>{U('P 15')}</span></div>
                  <div className="other-fee-item"><span>{U('Cultural:')}</span><span>{U('P 15')}</span></div>
                  <div className="other-fee-item"><span>{U('SSC:')}</span><span>{U('P 70')}</span></div>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="signatures-section">
              <div className="signature-left">
                <div className="signature-line"></div>
                <p className="signature-name">{U('ROWENA B. DEL ROSARIO')}</p>
                <p>{U('Assessed by')}</p>
              </div>

              <div className="signature-center">
                <div className="signature-line"></div>
                <p className="signature-name">{U(displayData.studentName)}</p>
                <p>{U("Student's Signature")}</p>
              </div>

              <div className="signature-right">
                <div className="signature-line"></div>
                <p className="signature-name">{U('MELISSA L. PATCO, MBA')}</p>
                <p>{U('Registrar')}</p>
              </div>
            </div>

            {/* Footer Notes */}
            <div className="footer-notes">
              <p>{U(`Note: Proof of enrollment for ${displayData.semester} A.Y ${displayData.academicYear}`)}</p>
              <p>{U('Valid without seal and original signature')}</p>
            </div>

            {/* Date */}
            <div className="date-section">
              <div className="date-item">
                <span>{U(`DATE: ${currentDate}`)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons for Generated Certificate of Registration */}
          <div className="document-actions">
            <div className="action-buttons-group">
              <button 
                className="btn-confirm large" 
                onClick={generatePDF}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating PDF...' : '📄 Download Certificate of Registration PDF'}
              </button>
              <button className="btn-schedule large" onClick={handlePrint}>
                🖨️ Print Certificate of Registration
              </button>
              <button className="btn-schedule large" onClick={handleGenerateNew}>
                🔄 Generate New Certificate
              </button>
            </div>
          </div>

          {/* Important Notes */}
          <div className="important-notes">
            <h4>Important Notes:</h4>
            <ul>
              <li>This document is an official record of your course registration</li>
              <li>Keep this document for your records and for any official purposes</li>
              <li>Changes to registration must be processed through the Registrar's Office</li>
              <li>This Certificate of Registration is valid for the current semester only</li>
              <li>Document ID: COR-{displayData.studentId}-{new Date().getFullYear()}</li>
            </ul>
          </div>
        </>
      )}

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="pdf-generation-overlay" role="status" aria-live="polite">
          <div className="pdf-generation-spinner" aria-hidden="true"></div>
          <p>Generating Certificate of Registration...</p>
        </div>
      )}
    </div>
  );
};

export default CertificateOfRegistration;