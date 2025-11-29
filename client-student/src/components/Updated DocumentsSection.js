import React, { useState } from 'react';
import CertificateOfRegistration from './CertificateOfRegistration';
import CertificateOfGrade from './CertificateOfGrade';
import TranscriptOfRecords from './TranscriptOfRecords';

const DocumentsSection = ({ studentData }) => {
  const [selectedDocument, setSelectedDocument] = useState(null);

  const academicDocuments = [
    { 
      id: 'cor', 
      name: 'Certificate of Registration', 
      description: 'Current semester registration details and course schedule',
      available: true,
      icon: '📋'
    },
    { 
      id: 'grades', 
      name: 'Certificate of Grade', 
      description: 'Official grade report and academic performance',
      available: true,
      icon: '📊'
    },
    { 
      id: 'transcript', 
      name: 'Transcript of Records', 
      description: 'Complete academic history and official transcript',
      available: true,
      icon: '🎓'
    }
  ];

  const handleDocumentSelect = (documentId) => {
    setSelectedDocument(documentId);
  };

  const handleCloseDocument = () => {
    setSelectedDocument(null);
  };

  const renderSelectedDocument = () => {
    switch (selectedDocument) {
      case 'cor':
        return <CertificateOfRegistration studentData={studentData} onClose={handleCloseDocument} />;
      case 'grades':
        return <CertificateOfGrade studentData={studentData} onClose={handleCloseDocument} />;
      case 'transcript':
        return <TranscriptOfRecords studentData={studentData} onClose={handleCloseDocument} />;
      default:
        return null;
    }
  };

  if (selectedDocument) {
    return renderSelectedDocument();
  }

  return (
    <div className="section-content">
      <div className="applications-table-container">
        <div className="table-header">
          <h3>Online Documents</h3>
          <p>Access and generate your academic documents</p>
        </div>
        
        <div className="documents-grid">
          {academicDocuments.map(doc => (
            <div key={doc.id} className="document-card">
              <div className="document-icon">
                {doc.icon}
              </div>
              <div className="document-info">
                <h4>{doc.name}</h4>
                <p>{doc.description}</p>
                <div className="document-status">
                  <span className={`status-badge ${doc.available ? 'status-completed' : 'status-rejected'}`}>
                    {doc.available ? 'Available' : 'Not Available'}
                  </span>
                </div>
              </div>
              <div className="document-actions">
                <button
                  className={`btn-confirm ${!doc.available ? 'disabled' : ''}`}
                  onClick={() => handleDocumentSelect(doc.id)}
                  disabled={!doc.available}
                >
                  Generate Document
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Information */}
        <div className="documents-info">
          <h4>Document Information:</h4>
          <div className="info-cards">
            <div className="info-card">
              <h5>Certificate of Registration (COR)</h5>
              <p>Shows your currently enrolled courses, schedule, and units for the current semester.</p>
            </div>
            <div className="info-card">
              <h5>Certificate of Grade</h5>
              <p>Displays your grades and GPA for selected semesters or cumulative academic performance.</p>
            </div>
            <div className="info-card">
              <h5>Transcript of Records (TOR)</h5>
              <p>Complete record of all courses taken, grades received, and academic standing.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentsSection;