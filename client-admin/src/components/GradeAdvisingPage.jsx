import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';

// helper: convert '1st Year', '2nd', 1, etc → number
const parseYearLevelNumber = (value) => {
  if (!value) return null;
  if (typeof value === 'number') return value;
  const match = String(value).match(/\d/);
  return match ? parseInt(match[0], 10) : null;
};

const GradeAdvisingPage = () => {
  const [activeTab, setActiveTab] = useState('all'); // 'irregular' | 'dropped' | 'transferee' | 'all'
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [advisingRecords, setAdvisingRecords] = useState([]);
  const [advisingLoading, setAdvisingLoading] = useState(false);
  const [advisingError, setAdvisingError] = useState('');

  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState('');

  // Filters for subject dropdown
  const [selectedYearFilter, setSelectedYearFilter] = useState('all'); // 'all' | '1' | '2' | '3' | '4'
  const [selectedSemester, setSelectedSemester] = useState('all'); // 'all' | '1st' | '2nd' | 'summer'

  // Add-advising form state
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [manualSubject, setManualSubject] = useState('');
  const [manualUnits, setManualUnits] = useState('');
  const [manualLecHours, setManualLecHours] = useState('');
  const [manualLabHours, setManualLabHours] = useState('');
  const [section, setSection] = useState('');
  const [advisingStatus, setAdvisingStatus] = useState('regular'); // per-subject status
  const [savingAdvising, setSavingAdvising] = useState(false);

  // ---------------- LOAD STUDENTS ----------------
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setStudentsLoading(true);
        setStudentsError('');

        const { data, error } = await supabase
          .from('institutional_students')
          .select('*')
          .order('student_number', { ascending: true });

        if (error) throw error;
        setStudents(data || []);
      } catch (err) {
        console.error('Error loading students', err);
        setStudentsError(err.message || 'Failed to load students');
      } finally {
        setStudentsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // ---------------- LOAD SUBJECTS (MASTER) ----------------
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setSubjectsLoading(true);
        setSubjectsError('');

        const { data, error } = await supabase
          .from('subjects')
          .select('*')
          .order('year_level', { ascending: true })
          .order('subject_code', { ascending: true });

        if (error) throw error;
        setSubjects(data || []);
      } catch (err) {
        console.error('Error loading subjects', err);
        setSubjectsError(err.message || 'Failed to load subjects');
      } finally {
        setSubjectsLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  // ---------------- LOAD ADVISING PER STUDENT ----------------
  useEffect(() => {
    const fetchAdvising = async () => {
      if (!selectedStudent) {
        setAdvisingRecords([]);
        return;
      }

      try {
        setAdvisingLoading(true);
        setAdvisingError('');

        const { data, error } = await supabase
          .from('grade_advising')
          .select(
            'id, student_id, subject_id, subject, year_level, status, section, units, lec_hours, lab_hours, created_at'
          )
          .eq('student_id', selectedStudent.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setAdvisingRecords(data || []);
      } catch (err) {
        console.error('Error loading advising records', err);
        setAdvisingError(err.message || 'Failed to load advising records');
      } finally {
        setAdvisingLoading(false);
      }
    };

    fetchAdvising();
  }, [selectedStudent]);

  // ---------------- FILTERED STUDENTS (TAB + SEARCH) ----------------
  const filteredStudents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return students.filter((s) => {
      const matchesSearch =
        !term ||
        s.student_number?.toLowerCase().includes(term) ||
        s.first_name?.toLowerCase().includes(term) ||
        s.last_name?.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      if (activeTab === 'all') return true;

      const status = (s.enrollment_status || '').toLowerCase();
      return status === activeTab;
    });
  }, [students, activeTab, searchTerm]);

  // ---------------- FILTERED SUBJECTS FOR DROPDOWN ----------------
  const availableSubjects = useMemo(() => {
    return subjects.filter((subj) => {
      // year level filter
      if (selectedYearFilter !== 'all') {
        const subjYear = parseYearLevelNumber(subj.year_level);
        if (subjYear !== Number(selectedYearFilter)) return false;
      }

      // semester filter (assuming `semester` column text: '1st', '2nd', 'summer', etc)
      if (selectedSemester !== 'all' && subj.semester) {
        const sem = String(subj.semester).toLowerCase();
        if (selectedSemester === '1st' && !sem.includes('1')) return false;
        if (selectedSemester === '2nd' && !sem.includes('2')) return false;
        if (selectedSemester === 'summer' && !sem.includes('summer')) return false;
      }

      // allowed_status vs active tab (irregular, transferee, etc)
      const allowed = (subj.allowed_status || 'all').toLowerCase();
      if (allowed === 'all') return true;
      if (activeTab === 'all') return true;
      return allowed === activeTab.toLowerCase();
    });
  }, [subjects, selectedYearFilter, selectedSemester, activeTab]);

  // ---------------- TOTAL UNITS ----------------
  const totalUnits = useMemo(() => {
    return advisingRecords.reduce((sum, rec) => {
      if (rec.units != null) return sum + Number(rec.units);
      const subj = subjects.find((s) => s.id === rec.subject_id);
      if (subj?.units != null) return sum + Number(subj.units);
      return sum;
    }, 0);
  }, [advisingRecords, subjects]);

  // ---------------- HANDLERS ----------------
  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    const y = parseYearLevelNumber(student.year_level);
    if (y) setSelectedYearFilter(String(y));
  };

  const handleAddAdvising = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      alert('Please select a student first.');
      return;
    }

    let subjectId = selectedSubjectId || null;
    let subjectText = manualSubject.trim();
    let unitsValue =
      manualUnits !== '' && manualUnits !== null
        ? Number(manualUnits)
        : null;

    let lecValue =
      manualLecHours !== '' && manualLecHours !== null
        ? Number(manualLecHours)
        : null;

    let labValue =
      manualLabHours !== '' && manualLabHours !== null
        ? Number(manualLabHours)
        : null;

    let subjectObj = null;

    if (subjectId) {
      subjectObj = subjects.find((s) => s.id === subjectId);
      if (subjectObj) {
        subjectText =
          `${subjectObj.subject_code || ''} ${subjectObj.subject_name || ''}`.trim() ||
          subjectText;

        if (unitsValue == null && subjectObj.units != null) {
          unitsValue = Number(subjectObj.units);
        }
        if (lecValue == null && subjectObj.lec_hours != null) {
          lecValue = Number(subjectObj.lec_hours);
        }
        if (labValue == null && subjectObj.lab_hours != null) {
          labValue = Number(subjectObj.lab_hours);
        }
      }
    }

    if (!subjectText) {
      alert('Please select a subject from the list or enter it manually.');
      return;
    }

    // rule: if activeTab = irregular and subject allowed_status = 'regular' only → block
    if (
      activeTab === 'irregular' &&
      subjectObj &&
      subjectObj.allowed_status &&
      subjectObj.allowed_status.toLowerCase() === 'regular'
    ) {
      alert('This subject is allowed for regular students only.');
      return;
    }

    const yearNumber =
      parseYearLevelNumber(subjectObj?.year_level) ||
      parseYearLevelNumber(selectedStudent.year_level);

    try {
      setSavingAdvising(true);

      const { error } = await supabase.from('grade_advising').insert({
        student_id: selectedStudent.id,
        subject_id: subjectId,
        subject: subjectText,
        year_level: yearNumber,
        status: advisingStatus,
        section: section || subjectObj?.section || '',
        units: unitsValue,
        lec_hours: lecValue,
        lab_hours: labValue,
      });

      if (error) throw error;

      // reset
      setSelectedSubjectId('');
      setManualSubject('');
      setManualUnits('');
      setManualLecHours('');
      setManualLabHours('');
      setSection('');
      setAdvisingStatus('regular');

      // reload list
      const { data: newList, error: listErr } = await supabase
        .from('grade_advising')
        .select(
          'id, student_id, subject_id, subject, year_level, status, section, units, lec_hours, lab_hours, created_at'
        )
        .eq('student_id', selectedStudent.id)
        .order('created_at', { ascending: true });

      if (listErr) throw listErr;
      setAdvisingRecords(newList || []);
    } catch (err) {
      console.error('Error adding advising record', err);
      alert(err.message || 'Failed to add advising record');
    } finally {
      setSavingAdvising(false);
    }
  };

  const handleRemoveAdvising = async (recordId) => {
    if (!window.confirm('Remove this subject from this student’s advising list?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('grade_advising')
        .delete()
        .eq('id', recordId);

      if (error) throw error;
      setAdvisingRecords((prev) => prev.filter((r) => r.id !== recordId));
    } catch (err) {
      console.error('Error removing advising record', err);
      alert(err.message || 'Failed to remove advising record');
    }
  };

  // ---------------- RENDER ----------------
  return (
    <div className="dashboard-card micro" style={{ marginTop: '0.5rem' }}>
      {/* TABS + SELECTED STUDENT SUMMARY */}
      <div
        className="card-header micro"
        style={{ alignItems: 'center', gap: '0.75rem' }}
      >
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {['irregular', 'dropped', 'transferee', 'all'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`btn micro ${
                activeTab === tab ? 'btn-primary' : 'btn-secondary'
              }`}
              style={{
                padding: '0.25rem 0.7rem',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'all' ? 'All Students' : tab}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '0.8rem', color: '#065f46' }}>
          {selectedStudent ? (
            <>
              <strong>Selected student:</strong>{' '}
              {selectedStudent.student_number} •{' '}
              {selectedStudent.last_name}, {selectedStudent.first_name} (
              {selectedStudent.program_enrolled}) •{' '}
              <span style={{ textTransform: 'lowercase' }}>
                Status: {selectedStudent.enrollment_status || 'n/a'}
              </span>
            </>
          ) : (
            <span>No student selected</span>
          )}
        </div>
      </div>

      {/* ERROR BANNERS */}
      {studentsError && (
        <div className="no-data" style={{ marginBottom: '0.5rem', color: '#b91c1c' }}>
          {studentsError}
        </div>
      )}
      {advisingError && (
        <div className="no-data" style={{ marginBottom: '0.5rem', color: '#b91c1c' }}>
          {advisingError}
        </div>
      )}
      {subjectsError && (
        <div className="no-data" style={{ marginBottom: '0.5rem', color: '#b91c1c' }}>
          {subjectsError}
        </div>
      )}

      {/* SEARCH + STUDENTS TABLE */}
      <div className="dashboard-controls" style={{ marginBottom: '0.75rem' }}>
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search student (ID / name)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="applications-table-container" style={{ marginBottom: '1rem' }}>
        <table className="applications-table">
          <thead>
            <tr>
              <th>Student No</th>
              <th>Name</th>
              <th>Program</th>
              <th>Year Level</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {studentsLoading ? (
              <tr>
                <td colSpan="6" className="no-data">
                  Loading students...
                </td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  No students found for this filter.
                </td>
              </tr>
            ) : (
              filteredStudents.map((s) => (
                <tr
                  key={s.id}
                  style={
                    selectedStudent && selectedStudent.id === s.id
                      ? { backgroundColor: '#ecfdf5' }
                      : {}
                  }
                >
                  <td>{s.student_number}</td>
                  <td>
                    {s.last_name}, {s.first_name}
                  </td>
                  <td>{s.program_enrolled}</td>
                  <td>{s.year_level}</td>
                  <td>{s.enrollment_status || '—'}</td>
                  <td>
                    <button
                      type="button"
                      className="btn micro btn-primary"
                      onClick={() => handleSelectStudent(s)}
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ADVISED SUBJECTS TABLE */}
      <div className="dashboard-card micro" style={{ marginBottom: '0.75rem' }}>
        <div className="card-header micro">
          <h3>
            Advised Subjects
            {selectedStudent
              ? ` for ${selectedStudent.last_name}, ${selectedStudent.first_name}`
              : ''}
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#059669' }}>
            Total Units: <strong>{totalUnits}</strong>
          </span>
        </div>

        {selectedStudent == null ? (
          <div className="no-data">Select a student above to view advising.</div>
        ) : advisingLoading ? (
          <div className="no-data">Loading advising records...</div>
        ) : advisingRecords.length === 0 ? (
          <div className="no-data">
            No subjects advised yet for this student.
          </div>
        ) : (
          <div className="applications-table-container">
            <table className="applications-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Section</th>
                  <th>Units</th>
                  <th>LEC Hrs</th>
                  <th>LAB Hrs</th>
                  <th>Status</th>
                  <th>Year Level</th>
                  <th>Advised At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {advisingRecords.map((rec) => {
                  const subj = subjects.find((s) => s.id === rec.subject_id);
                  const displaySubject =
                    subj
                      ? `${subj.subject_code || ''} ${subj.subject_name || ''}`.trim()
                      : rec.subject;

                  const unitsValue =
                    rec.units != null
                      ? rec.units
                      : subj?.units != null
                      ? subj.units
                      : '—';

                  const lecValue =
                    rec.lec_hours != null
                      ? rec.lec_hours
                      : subj?.lec_hours != null
                      ? subj.lec_hours
                      : '—';

                  const labValue =
                    rec.lab_hours != null
                      ? rec.lab_hours
                      : subj?.lab_hours != null
                      ? subj.lab_hours
                      : '—';

                  return (
                    <tr key={rec.id}>
                      <td>{displaySubject}</td>
                      <td>{rec.section || subj?.section || '—'}</td>
                      <td>{unitsValue}</td>
                      <td>{lecValue}</td>
                      <td>{labValue}</td>
                      <td style={{ textTransform: 'capitalize' }}>
                        {rec.status || '—'}
                      </td>
                      <td>{rec.year_level || '—'}</td>
                      <td>
                        {rec.created_at
                          ? new Date(rec.created_at).toLocaleString()
                          : '—'}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn micro btn-secondary"
                          onClick={() => handleRemoveAdvising(rec.id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD SUBJECT TO ADVISING */}
      <div className="dashboard-card micro">
        <div className="card-header micro">
          <h3>Add Subject to Advising</h3>
          <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>
            You can use the subject list <strong>or</strong> encode manually.
          </div>
        </div>

        {selectedStudent == null ? (
          <div className="no-data">Select a student above first.</div>
        ) : (
          <>
            {/* Year level / sem filter controls */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginBottom: '0.75rem',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                Filter by Year:
              </div>
              {['all', '1', '2', '3', '4'].map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setSelectedYearFilter(y)}
                  className="btn micro"
                  style={{
                    background:
                      selectedYearFilter === y ? '#10b981' : '#f8fafc',
                    color: selectedYearFilter === y ? '#fff' : '#065f46',
                    border:
                      selectedYearFilter === y
                        ? '1px solid #10b981'
                        : '1px solid #d1e7dd',
                    padding: '0.25rem 0.6rem',
                  }}
                >
                  {y === 'all' ? 'All' : `${y} Year`}
                </button>
              ))}

              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  marginLeft: '0.75rem',
                }}
              >
                Semester:
              </div>
              {[
                { id: 'all', label: 'All' },
                { id: '1st', label: '1st Sem' },
                { id: '2nd', label: '2nd Sem' },
                { id: 'summer', label: 'Summer' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedSemester(opt.id)}
                  className="btn micro"
                  style={{
                    background:
                      selectedSemester === opt.id ? '#10b981' : '#f8fafc',
                    color: selectedSemester === opt.id ? '#fff' : '#065f46',
                    border:
                      selectedSemester === opt.id
                        ? '1px solid #10b981'
                        : '1px solid #d1e7dd',
                    padding: '0.25rem 0.6rem',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {subjectsLoading && (
              <div className="no-data">Loading subjects list...</div>
            )}

            {!subjectsLoading && availableSubjects.length === 0 && (
              <div className="no-data" style={{ marginBottom: '0.75rem' }}>
                No subjects available for this filter. You can still encode
                subject, units and hours manually below.
              </div>
            )}

            <form
              onSubmit={handleAddAdvising}
              className="advising-form"
              style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}
            >
              {/* Subject selection from list */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 2fr)',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'block',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Subject from list (optional)
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="status-select"
                    style={{ width: '100%' }}
                  >
                    <option value="">-- Select subject --</option>
                    {availableSubjects.map((subj) => (
                      <option key={subj.id} value={subj.id}>
                        {subj.subject_code} - {subj.subject_name} (
                        {subj.units}u){' '}
                        {subj.semester ? `• ${subj.semester}` : ''}
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                    If nothing fits, leave this blank and use manual fields.
                  </div>
                </div>
              </div>

              {/* Manual encodings: Subject / Units / LEC / LAB */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'block',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Manual Subject Name
                  </label>
                  <input
                    type="text"
                    className="event-input micro"
                    placeholder="e.g. Introduction to Computing"
                    value={manualSubject}
                    onChange={(e) => setManualSubject(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'block',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Units
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="event-input micro"
                    placeholder="e.g. 3"
                    value={manualUnits}
                    onChange={(e) => setManualUnits(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'block',
                      marginBottom: '0.25rem',
                    }}
                  >
                    LEC Hrs
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="event-input micro"
                    placeholder="e.g. 2"
                    value={manualLecHours}
                    onChange={(e) => setManualLecHours(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'block',
                      marginBottom: '0.25rem',
                    }}
                  >
                    LAB Hrs
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="event-input micro"
                    placeholder="e.g. 1"
                    value={manualLabHours}
                    onChange={(e) => setManualLabHours(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'block',
                    marginBottom: '0.25rem',
                  }}
                >
                  Section
                </label>
                <input
                  type="text"
                  className="event-input micro"
                  placeholder="e.g. A, BSIT-1A"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  alignItems: 'center',
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'block',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Advising Status
                  </label>
                  <select
                    className="status-select"
                    value={advisingStatus}
                    onChange={(e) => setAdvisingStatus(e.target.value)}
                  >
                    <option value="regular">Regular</option>
                    <option value="irregular">Irregular</option>
                    <option value="dropped">Dropped</option>
                    <option value="transferee">Transferee</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn micro btn-primary"
                  disabled={savingAdvising}
                  style={{ marginTop: '1.2rem' }}
                >
                  {savingAdvising ? 'Saving...' : 'Add to Advising'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default GradeAdvisingPage;
