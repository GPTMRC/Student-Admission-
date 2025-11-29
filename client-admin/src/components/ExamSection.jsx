import React, { useState } from 'react';

const StudentManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([
    {
      id: 1,
      studentNumber: '2022-8402',
      name: 'Mark John Nillasca Cabusas',
      email: 'mncabusas@paterostechnologicalcollege.edu.ph',
      program: 'BSIT',
      yearLevel: '4',
      status: 'ACTIVE',
      examStatus: 'PENDING' // NEW: Track exam status
    },
    {
      id: 2,
      studentNumber: 'jon123',
      name: 'Jon Christopher Calamaan',
      email: 'jcc@paterostechnologicalcollege.edu.ph',
      program: 'BSIT',
      yearLevel: '1',
      status: 'ACTIVE',
      examStatus: 'PASSED'
    },
    {
      id: 3,
      studentNumber: '1234567mark',
      name: 'Mark Christian sdasd temo',
      email: 'ppbaylon@paterostechnologicalcollege.edu.ph',
      program: 'BSEBA',
      yearLevel: '2',
      status: 'ACTIVE',
      examStatus: 'FAILED'
    },
    {
      id: 4,
      studentNumber: '123mm',
      name: 'chris mar',
      email: 'oobaylon@paterostechnologicalcollege.edu.ph',
      program: 'BSIT',
      yearLevel: '2',
      status: 'ACTIVE',
      examStatus: 'PENDING'
    },
    {
      id: 5,
      studentNumber: 'testingmark123',
      name: 'mark mm ribay',
      email: 'mibaylon@paterostechnologicalcollege.edu.ph',
      program: 'BSIT',
      yearLevel: '1',
      status: 'ACTIVE',
      examStatus: 'PASSED'
    },
    {
      id: 6,
      studentNumber: '123BSIT',
      name: 'mark maki admin',
      email: 'mmbaylon@paterostechnologicalcollege.edu.ph',
      program: 'BSIT',
      yearLevel: '1',
      status: 'ACTIVE',
      examStatus: 'FAILED'
    },
    {
      id: 7,
      studentNumber: '2024-00001',
      name: 'Juan Dela Cruz',
      email: 'juan.delacruz@paterostechnologicalcollege.edu.ph',
      program: 'Computer Science',
      yearLevel: '1st Year',
      status: 'ACTIVE',
      examStatus: 'PENDING'
    }
  ]);

  const [editingStudent, setEditingStudent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    studentNumber: '',
    name: '',
    email: '',
    program: '',
    yearLevel: '',
    status: 'ACTIVE',
    examStatus: 'PENDING'
  });

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.studentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle Passed button
  const handlePassed = (studentId) => {
    const updatedStudents = students.map(student =>
      student.id === studentId
        ? { ...student, examStatus: 'PASSED' }
        : student
    );

    setStudents(updatedStudents);
    const student = students.find(s => s.id === studentId);
    alert(`${student.name} has been marked as PASSED! 🎉`);
  };

  // Handle Failed button
  const handleFailed = (studentId) => {
    const updatedStudents = students.map(student =>
      student.id === studentId
        ? { ...student, examStatus: 'FAILED' }
        : student
    );

    setStudents(updatedStudents);
    const student = students.find(s => s.id === studentId);
    alert(`${student.name} has been marked as FAILED. ❌`);
  };

  // Handle Edit button - open edit modal
  const handleEdit = (student) => {
    setEditingStudent(student);
    setEditForm({
      studentNumber: student.studentNumber,
      name: student.name,
      email: student.email,
      program: student.program,
      yearLevel: student.yearLevel,
      status: student.status,
      examStatus: student.examStatus
    });
    setShowEditModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save edited student
  const handleSaveEdit = () => {
    if (!editingStudent) return;

    const updatedStudents = students.map(student =>
      student.id === editingStudent.id
        ? { ...student, ...editForm }
        : student
    );

    setStudents(updatedStudents);
    setShowEditModal(false);
    setEditingStudent(null);
    alert('Student information updated successfully!');
  };

  // Delete student
  const handleDelete = (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      const updatedStudents = students.filter(student => student.id !== studentId);
      setStudents(updatedStudents);
      alert('Student deleted successfully!');
    }
  };

  // Add new student
  const handleAddStudent = () => {
    alert('Add Student functionality would open here!');
  };

  // Get exam status badge style
  const getExamStatusBadge = (examStatus) => {
    switch (examStatus) {
      case 'PASSED':
        return styles.passedStatus;
      case 'FAILED':
        return styles.failedStatus;
      case 'PENDING':
        return styles.pendingStatus;
      default:
        return styles.pendingStatus;
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Student Management</h1>
          <p style={styles.subtitle}>Search by Student ID, First Name, or Last Name</p>
        </div>
        <button 
          onClick={handleAddStudent}
          style={styles.addButton}
        >
          + Add New Student
        </button>
      </div>

      {/* Search Section */}
      <div style={styles.searchSection}>
        <h3 style={styles.sectionTitle}>Search Student</h3>
        <input
          type="text"
          placeholder="Search by Student ID, Name, or Email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Students Table */}
      <div style={styles.tableSection}>
        <h3 style={styles.sectionTitle}>All Students</h3>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Student Number</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Program</th>
                <th style={styles.th}>Year Level</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Exam Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => (
                <tr key={student.id} style={index % 2 === 0 ? styles.evenRow : styles.oddRow}>
                  <td style={styles.td}>
                    <strong>{student.studentNumber}</strong>
                  </td>
                  <td style={styles.td}>{student.name}</td>
                  <td style={styles.td}>{student.email}</td>
                  <td style={styles.td}>{student.program}</td>
                  <td style={styles.td}>{student.yearLevel}</td>
                  <td style={styles.td}>
                    <span style={
                      student.status === 'ACTIVE' ? styles.activeStatus : styles.inactiveStatus
                    }>
                      {student.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={getExamStatusBadge(student.examStatus)}>
                      {student.examStatus}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      <button
                        onClick={() => handlePassed(student.id)}
                        style={styles.passedButton}
                        title="Mark as Passed"
                      >
                        Passed
                      </button>
                      <button
                        onClick={() => handleFailed(student.id)}
                        style={styles.failedButton}
                        title="Mark as Failed"
                      >
                        Failed
                      </button>
                      <button
                        onClick={() => handleEdit(student)}
                        style={styles.editButton}
                        title="Edit Student"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        style={styles.deleteButton}
                        title="Delete Student"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Count */}
      <div style={styles.resultsCount}>
        Showing {filteredStudents.length} of {students.length} students
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Edit Student Information</h3>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Student Number:</label>
              <input
                type="text"
                name="studentNumber"
                value={editForm.studentNumber}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name:</label>
              <input
                type="text"
                name="name"
                value={editForm.name}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email:</label>
              <input
                type="email"
                name="email"
                value={editForm.email}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Program:</label>
              <select
                name="program"
                value={editForm.program}
                onChange={handleInputChange}
                style={styles.input}
              >
                <option value="BSIT">BSIT</option>
                <option value="BSEBA">BSEBA</option>
                <option value="Computer Science">Computer Science</option>
                <option value="BSED">BSED</option>
                <option value="BSCS">BSCS</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Year Level:</label>
              <select
                name="yearLevel"
                value={editForm.yearLevel}
                onChange={handleInputChange}
                style={styles.input}
              >
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
                <option value="1st Year">1st Year (Text)</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Status:</label>
              <select
                name="status"
                value={editForm.status}
                onChange={handleInputChange}
                style={styles.input}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Exam Status:</label>
              <select
                name="examStatus"
                value={editForm.examStatus}
                onChange={handleInputChange}
                style={styles.input}
              >
                <option value="PENDING">PENDING</option>
                <option value="PASSED">PASSED</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>

            <div style={styles.modalActions}>
              <button
                onClick={handleSaveEdit}
                style={styles.saveButton}
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    marginBottom: '30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '16px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 8px 0'
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: '0'
  },
  addButton: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px'
  },
  searchSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 16px 0'
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none'
  },
  tableSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  tableContainer: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  tableHeader: {
    backgroundColor: '#f9fafb',
    borderBottom: '2px solid #e5e7eb'
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '1px solid #e5e7eb'
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid #f3f4f6'
  },
  evenRow: {
    backgroundColor: '#fafafa'
  },
  oddRow: {
    backgroundColor: 'white'
  },
  activeStatus: {
    color: '#10b981',
    fontWeight: '500',
    padding: '4px 8px',
    borderRadius: '4px',
    backgroundColor: '#d1fae5',
    fontSize: '12px'
  },
  inactiveStatus: {
    color: '#ef4444',
    fontWeight: '500',
    padding: '4px 8px',
    borderRadius: '4px',
    backgroundColor: '#fee2e2',
    fontSize: '12px'
  },
  passedStatus: {
    color: '#10b981',
    fontWeight: '500',
    padding: '4px 8px',
    borderRadius: '4px',
    backgroundColor: '#d1fae5',
    fontSize: '12px'
  },
  failedStatus: {
    color: '#ef4444',
    fontWeight: '500',
    padding: '4px 8px',
    borderRadius: '4px',
    backgroundColor: '#fee2e2',
    fontSize: '12px'
  },
  pendingStatus: {
    color: '#f59e0b',
    fontWeight: '500',
    padding: '4px 8px',
    borderRadius: '4px',
    backgroundColor: '#fef3c7',
    fontSize: '12px'
  },
  actionButtons: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap'
  },
  passedButton: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
    cursor: 'pointer',
    minWidth: '50px'
  },
  failedButton: {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
    cursor: 'pointer',
    minWidth: '50px'
  },
  editButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
    cursor: 'pointer',
    minWidth: '40px'
  },
  deleteButton: {
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
    cursor: 'pointer',
    minWidth: '50px'
  },
  resultsCount: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '14px',
    marginTop: '16px',
    padding: '8px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '20px'
  },
  formGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '500',
    color: '#374151'
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '14px'
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px'
  },
  saveButton: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    fontWeight: '500',
    cursor: 'pointer'
  }
};

export default StudentManagement;