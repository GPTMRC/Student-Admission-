// DocumentsSection.js - For printing academic records
import React, { useState } from 'react';

const DocumentsSection = ({ studentData }) => {
  const [selectedDocument, setSelectedDocument] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const academicDocuments = [
    {
      id: 'certificate_of_registration',
      name: 'Certificate of Registration',
      description: 'Official document showing your current enrolled courses',
      icon: '??',
      available: true
    },
    {
      id: 'grades_report',
      name: 'Grades Report',
      description: 'Official transcript of your academic grades',
      icon: '??',
      available: true
    },
    {
      id: 'enrollment_certificate',
      name: 'Certificate of Enrollment',
      description: 'Proof of current enrollment status',
      icon: '??',
      available: true
    },
    {
      id: 'true_copy_request',
      name: 'Certified True Copy Request',
      description: 'Request stamped certified copies of documents',
      icon: '???',
      available: true
    }
  ];

  const handlePrintDocument = async (documentId) => {
    setIsGenerating(true);
    console.log('??? Generating document:', documentId);
    
    // Simulate document generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create a printable document
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>PTC - ${academicDocuments.find(doc => doc.id === documentId)?.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; border-bottom: 3px solid #2e7d32; padding-bottom: 20px; margin-bottom: 30px; }
            .student-info { margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .footer { margin-top: 50px; text-align: center; color: #666; }
            .watermark { opacity: 0.1; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 120px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="watermark">PTC</div>
          <div class="header">
            <h1>PATEROS TECHNOLOGICAL COLLEGE</h1>
            <h2>${academicDocuments.find(doc => doc.id === documentId)?.name}</h2>
            <p>Official Academic Document</p>
          </div>
          
          <div class="student-info">
            <div class="info-row">
              <strong>Student Number:</strong> <span>${studentData.student_number}</span>
            </div>
            <div class="info-row">
              <strong>Student Name:</strong> <span>${studentData.first_name} ${studentData.middle_name || ''} ${studentData.last_name}</span>
            </div>
            <div class="info-row">
              <strong>Program:</strong> <span>${studentData.program_enrolled}</span>
            </div>
            <div class="info-row">
              <strong>Year Level:</strong> <span>${studentData.year_level}</span>
            </div>
            <div class="info-row">
              <strong>Date Issued:</strong> <span>${new Date().toLocaleDateString()}</span>
            </div>
          </div>

          ${documentId === 'certificate_of_registration' ? `
            <div class="document-content">
              <h3>Enrollment Details</h3>
              <p>This certifies that the above-named student is officially enrolled for the current academic term.</p>
              <p><strong>Status:</strong> Currently Enrolled</p>
              <p><strong>Validity:</strong> Valid until end of current semester</p>
            </div>
          ` : ''}

          ${documentId === 'true_copy_request' ? `
            <div class="document-content">
              <h3>Request for Certified True Copy</h3>
              <p>I hereby request certified true copies of my academic documents.</p>
              <p><strong>Documents Requested:</strong></p>
              <ul>
                <li>Transcript of Records</li>
                <li>Diploma</li>
                <li>Certificate of Graduation</li>
              </ul>
              <p><strong>Purpose:</strong> ${prompt('Please state the purpose for this request:') || 'Personal Record'}</p>
            </div>
          ` : ''}

          <div class="footer">
            <p>Generated electronically by PTC Student Portal</p>
            <p>This document is valid without signature when printed from the official portal</p>
          </div>

          <div class="no-print" style="margin-top: 20px;">
            <button onclick="window.print()">??? Print Document</button>
            <button onclick="window.close()">Close</button>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setIsGenerating(false);
  };

  return (
    <div className="documents-section">
      <div className="section-header">
        <h2>?? Academic Documents</h2>
        <p>Generate and print official academic documents</p>
      </div>

      <div className="documents-grid">
        {academicDocuments.map(doc => (
          <div key={doc.id} className="document-card">
            <div className="document-icon">{doc.icon}</div>
            <div className="document-info">
              <h3>{doc.name}</h3>
              <p>{doc.description}</p>
            </div>
            <div className="document-actions">
              <button 
                onClick={() => handlePrintDocument(doc.id)}
                disabled={isGenerating || !doc.available}
                className="print-btn"
              >
                {isGenerating ? '?? Generating...' : '??? Generate & Print'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="printing-info">
        <h4>?? Printing Guidelines:</h4>
        <ul>
          <li>Documents are generated in real-time with current data</li>
          <li>Use "Print" button in the new window for best results</li>
          <li>For certified true copies, visit the Registrar's Office after online request</li>
          <li>Keep digital copies for your records</li>
        </ul>
      </div>
    </div>
  );
};

export default DocumentsSection;
