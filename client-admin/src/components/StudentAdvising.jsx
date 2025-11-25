import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';

// helper: convert "1st Year", "2nd", 1, etc → number
const parseYearLevelNumber = (value) => {
  if (!value) return null;
  if (typeof value === 'number') return value;
  const match = String(value).match(/\d/);
  return match ? parseInt(match[0], 10) : null;
};

const normalizeSemester = (sem) => {
  if (!sem) return 'other';
  const s = String(sem).toLowerCase();
  if (s.includes('1')) return '1st';
  if (s.includes('2')) return '2nd';
  if (s.includes('summer')) return 'summer';
  return 'other';
};

const StudentAdvisingPage = () => {
  // ---------------- CORE STATE ----------------
  const [activeTab, setActiveTab] = useState('all'); // 'irregular' | 'dropped' | 'transferee' | 'all'
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState('');

  const [searchTerm, setSearchTerm] = useState(''); // Student ID search
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [advisingRecords, setAdvisingRecords] = useState([]);
  const [advisingLoading, setAdvisingLoading] = useState(false);
  const [advisingError, setAdvisingError] = useState('');

  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState('');

  // Filters for subject dropdown (for recommended + add form)
  const [selectedYearFilter, setSelectedYearFilter] = useState('all'); // 'all' | '1' | '2' | '3' | '4'
  const [selectedSemester, setSelectedSemester] = useState('all'); // 'all' | '1st' | '2nd' | 'summer'

  // Add-advising form state
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [manualSubject, setManualSubject] = useState('');
  const [manualUnits, setManualUnits] = useState('');
  const [manualLecHours, setManualLecHours] = useState('');
  const [manualLabHours, setManualLabHours] = useState('');
  const [section, setSection] = useState('');
  const [advisingStatus, setAdvisingStatus] = useState('regular');
  const [savingAdvising, setSavingAdvising] = useState(false);

  // Grade + remarks inputs (add form)
  const [grade, setGrade] = useState('');
  const [remarks, setRemarks] = useState('');

  // Edit existing grade/remarks
  const [editRowId, setEditRowId] = useState(null);
  const [editGrade, setEditGrade] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Advising notes (overall)
  const [advisingNotes, setAdvisingNotes] = useState('');

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

  // ---------------- LOAD SUBJECTS (MASTER CURRICULUM) ----------------
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
            'id, student_id, subject_id, subject, year_level, status, section, units, lec_hours, lab_hours, grade, remarks, created_at'
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

  // ---------------- FILTERED STUDENTS (BY ID SEARCH + STATUS + COURSE SORT) ----------------
  const filteredStudents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return students
      .filter((s) => {
        // 1) require search term (para hindi lumabas lahat agad)
        if (!term) return false;

        // 2) main: student ID / number search
        const idMatch = s.student_number
          ?.toLowerCase()
          .includes(term);

        // optional: allow name search pa rin
        const nameMatch =
          s.first_name?.toLowerCase().includes(term) ||
          s.last_name?.toLowerCase().includes(term);

        const matchesSearch = idMatch || nameMatch;
        if (!matchesSearch) return false;

        if (activeTab === 'all') return true;

        const status = (s.enrollment_status || '').toLowerCase();
        return status === activeTab;
      })
      .sort((a, b) => {
        const progA = (a.program_enrolled || '').toLowerCase();
        const progB = (b.program_enrolled || '').toLowerCase();
        if (progA < progB) return -1;
        if (progA > progB) return 1;
        const idA = (a.student_number || '').toLowerCase();
        const idB = (b.student_number || '').toLowerCase();
        return idA.localeCompare(idB);
      });
  }, [students, activeTab, searchTerm]);

  // ---------------- SUBJECTS FILTERED BY COURSE + YEAR/SEM ----------------
  const availableSubjects = useMemo(() => {
    return subjects.filter((subj) => {
      // 🔹 Align course/program with student's program
      if (selectedStudent) {
        const studentProgramText =
          (selectedStudent.program_enrolled ||
            selectedStudent.course ||
            '').toLowerCase();

        const subjectProgramText =
          (subj.course ||
            subj.program ||
            subj.program_enrolled ||
            subj.course_code ||
            '').toLowerCase();

        if (studentProgramText && subjectProgramText) {
          const matchesProgram =
            studentProgramText === subjectProgramText ||
            studentProgramText.includes(subjectProgramText) ||
            subjectProgramText.includes(studentProgramText);

          if (!matchesProgram) return false;
        }
      }

      // Year level filter
      if (selectedYearFilter !== 'all') {
        const subjYear = parseYearLevelNumber(subj.year_level);
        if (subjYear !== Number(selectedYearFilter)) return false;
      }

      // Semester filter
      if (selectedSemester !== 'all' && subj.semester) {
        const sem = normalizeSemester(subj.semester);
        if (selectedSemester !== 'all' && selectedSemester !== sem) return false;
      }

      // allowed_status vs active tab
      const allowed = (subj.allowed_status || 'all').toLowerCase();
      if (allowed === 'all') return true;
      if (activeTab === 'all') return true;
      return allowed === activeTab.toLowerCase();
    });
  }, [subjects, selectedYearFilter, selectedSemester, activeTab, selectedStudent]);

  // ---------------- AUTO ALIGN SUBJECTS FOR SELECTED STUDENT (YEAR + SEM) ----------------
  const alignedSubjectsBySem = useMemo(() => {
    if (!selectedStudent) return { sem1: [], sem2: [], other: [] };

    const yearNum = parseYearLevelNumber(selectedStudent.year_level);
    if (!yearNum) return { sem1: [], sem2: [], other: [] };

    // same logic as course match para sure aligned sa course
    const studentProgramText =
      (selectedStudent.program_enrolled ||
        selectedStudent.course ||
        '').toLowerCase();

    const subsForYear = subjects.filter((subj) => {
      const subjYear = parseYearLevelNumber(subj.year_level);
      if (subjYear !== yearNum) return false;

      const subjectProgramText =
        (subj.course ||
          subj.program ||
          subj.program_enrolled ||
          subj.course_code ||
          '').toLowerCase();

      if (studentProgramText && subjectProgramText) {
        const matchesProgram =
          studentProgramText === subjectProgramText ||
          studentProgramText.includes(subjectProgramText) ||
          subjectProgramText.includes(studentProgramText);
        if (!matchesProgram) return false;
      }

      return true;
    });

    const sem1 = [];
    const sem2 = [];
    const others = [];

    subsForYear.forEach((subj) => {
      const semKey = normalizeSemester(subj.semester);
      if (semKey === '1st') sem1.push(subj);
      else if (semKey === '2nd') sem2.push(subj);
      else others.push(subj);
    });

    return { sem1, sem2, other: others };
  }, [subjects, selectedStudent]);

  // ---------------- ACADEMIC SUMMARY (GWA, units, failed) ----------------
  const academicSummary = useMemo(() => {
    if (!selectedStudent || advisingRecords.length === 0) {
      return {
        totalUnitsTaken: 0,
        totalUnitsEarned: 0,
        totalFailed: 0,
        gwa: null,
        remarks: 'No standing yet',
        canProceed: 'Insufficient data',
      };
    }

    let totalUnitsTaken = 0;
    let totalUnitsEarned = 0;
    let totalFailed = 0;
    let sumWeighted = 0;
    let sumUnitsForGwa = 0;
    let hasSeriousFail = false;

    advisingRecords.forEach((rec) => {
      const subj = subjects.find((s) => s.id === rec.subject_id);
      const units =
        rec.units != null
          ? Number(rec.units)
          : subj?.units != null
          ? Number(subj.units)
          : 0;

      if (units <= 0) return;

      totalUnitsTaken += units;

      const gradeNum =
        rec.grade && !isNaN(parseFloat(rec.grade))
          ? parseFloat(rec.grade)
          : null;

      const remarksText = (rec.remarks || '').toLowerCase();

      const isPassed =
        (gradeNum != null && gradeNum <= 3.0) ||
        remarksText.includes('pass') ||
        remarksText.includes('passed');

      const isFailed =
        (gradeNum != null && gradeNum > 3.0) ||
        remarksText.includes('fail') ||
        remarksText.includes('failed');

      if (isPassed) {
        totalUnitsEarned += units;
      }
      if (isFailed) {
        totalFailed += 1;
        hasSeriousFail = true;
      }

      if (gradeNum != null) {
        sumWeighted += gradeNum * units;
        sumUnitsForGwa += units;
      }
    });

    const gwa =
      sumUnitsForGwa > 0 ? (sumWeighted / sumUnitsForGwa).toFixed(2) : null;

    let standing = 'No standing yet';
    if (gwa != null) {
      const g = parseFloat(gwa);
      if (g <= 2.0) standing = 'Good standing';
      else if (g <= 2.75) standing = 'Satisfactory';
      else if (g <= 3.0) standing = 'On watch';
      else standing = 'On probation';
    }

    let canProceed = 'Can proceed (depends on policy)';
    if (hasSeriousFail) {
      canProceed = 'Has failed subjects – for evaluation';
    }

    return {
      totalUnitsTaken,
      totalUnitsEarned,
      totalFailed,
      gwa,
      remarks: standing,
      canProceed,
    };
  }, [selectedStudent, advisingRecords, subjects]);

  // ---------------- GWA PER SEMESTER ----------------
  const gwaPerSemester = useMemo(() => {
    const buckets = {
      '1st': { units: 0, weighted: 0 },
      '2nd': { units: 0, weighted: 0 },
      summer: { units: 0, weighted: 0 },
      other: { units: 0, weighted: 0 },
    };

    advisingRecords.forEach((rec) => {
      const subj = subjects.find((s) => s.id === rec.subject_id);
      const gradeNum =
        rec.grade && !isNaN(parseFloat(rec.grade))
          ? parseFloat(rec.grade)
          : null;
      if (!subj || gradeNum == null) return;

      const units =
        rec.units != null
          ? Number(rec.units)
          : subj.units != null
          ? Number(subj.units)
          : 0;
      if (units <= 0) return;

      const semKey = normalizeSemester(subj.semester);

      if (!buckets[semKey]) buckets[semKey] = { units: 0, weighted: 0 };
      buckets[semKey].units += units;
      buckets[semKey].weighted += gradeNum * units;
    });

    const compute = (key) => {
      const b = buckets[key];
      if (!b || b.units === 0) return null;
      return (b.weighted / b.units).toFixed(2);
    };

    return {
      '1st': compute('1st'),
      '2nd': compute('2nd'),
      summer: compute('summer'),
      other: compute('other'),
    };
  }, [advisingRecords, subjects]);

  // ---------------- TOTALS SUMMARY (for advised list) ----------------
  const totalUnits = useMemo(
    () =>
      advisingRecords.reduce((sum, rec) => {
        if (rec.units != null) return sum + Number(rec.units);
        const subj = subjects.find((s) => s.id === rec.subject_id);
        if (subj?.units != null) return sum + Number(subj.units);
        return sum;
      }, 0),
    [advisingRecords, subjects]
  );

  const totalLecHours = useMemo(
    () =>
      advisingRecords.reduce((sum, rec) => {
        if (rec.lec_hours != null) return sum + Number(rec.lec_hours);
        const subj = subjects.find((s) => s.id === rec.subject_id);
        if (subj?.lec_hours != null) return sum + Number(subj.lec_hours);
        return sum;
      }, 0),
    [advisingRecords, subjects]
  );

  const totalLabHours = useMemo(
    () =>
      advisingRecords.reduce((sum, rec) => {
        if (rec.lab_hours != null) return sum + Number(rec.lab_hours);
        const subj = subjects.find((s) => s.id === rec.subject_id);
        if (subj?.lab_hours != null) return sum + Number(subj.lab_hours);
        return sum;
      }, 0),
    [advisingRecords, subjects]
  );

  const statusSummary = useMemo(() => {
    const base = { regular: 0, irregular: 0, dropped: 0, transferee: 0 };
    advisingRecords.forEach((rec) => {
      const key = (rec.status || '').toLowerCase();
      if (base[key] !== undefined) base[key] += 1;
    });
    return base;
  }, [advisingRecords]);

  // ---------------- RECOMMENDED SUBJECTS (with prereq check using grades) ----------------
  const recommendedSubjects = useMemo(() => {
    if (!selectedStudent) return [];

    const isPassedRecord = (rec) => {
      const gradeNum =
        rec.grade && !isNaN(parseFloat(rec.grade))
          ? parseFloat(rec.grade)
          : null;
      const remarksText = (rec.remarks || '').toLowerCase();

      const isPassed =
        (gradeNum != null && gradeNum <= 3.0) ||
        remarksText.includes('pass') ||
        remarksText.includes('passed');

      return isPassed;
    };

    return availableSubjects.map((subj) => {
      const alreadyAdvised = advisingRecords.some(
        (r) => r.subject_id === subj.id
      );

      const prereqText =
        subj.prerequisite ||
        subj.prerequisite_code ||
        subj.prerequisite_subject ||
        '';

      let eligible = true;
      let reason = '';

      if (prereqText) {
        const prereqSatisfied = advisingRecords.some((r) => {
          const subjectName = (r.subject || '').toLowerCase();
          const matchesName = subjectName.includes(
            String(prereqText).toLowerCase()
          );
          return matchesName && isPassedRecord(r);
        });

        if (!prereqSatisfied) {
          eligible = false;
          reason = `Prerequisite not satisfied: ${prereqText}`;
        }
      }

      if (alreadyAdvised) {
        eligible = false;
        reason = reason || 'Already in advising list';
      }

      return {
        id: subj.id,
        subjectCode: subj.subject_code,
        subjectTitle: subj.subject_name,
        units: subj.units,
        prerequisite: prereqText || 'None',
        eligible,
        notes: reason,
      };
    });
  }, [availableSubjects, advisingRecords, selectedStudent]);

  // ---------------- CURRICULUM CHECKLIST (FILTERED BY COURSE) ----------------
  const curriculumChecklist = useMemo(() => {
    if (!subjects.length || !selectedStudent) return [];

    const studentProgramText =
      (selectedStudent.program_enrolled ||
        selectedStudent.course ||
        '').toLowerCase();

    return subjects
      .filter((subj) => {
        const subjectProgramText =
          (subj.course ||
            subj.program ||
            subj.program_enrolled ||
            subj.course_code ||
            '').toLowerCase();

        if (studentProgramText && subjectProgramText) {
          const matchesProgram =
            studentProgramText === subjectProgramText ||
            studentProgramText.includes(subjectProgramText) ||
            subjectProgramText.includes(studentProgramText);
          return matchesProgram;
        }
        return true;
      })
      .map((subj) => {
        const rec = advisingRecords.find((r) => r.subject_id === subj.id);

        let status = 'Not yet taken';
        if (rec) {
          const gradeNum =
            rec.grade && !isNaN(parseFloat(rec.grade))
              ? parseFloat(rec.grade)
              : null;
          const remarksText = (rec.remarks || '').toLowerCase();

          const isPassed =
            (gradeNum != null && gradeNum <= 3.0) ||
            remarksText.includes('pass') ||
            remarksText.includes('passed');

          if (!rec.grade && !rec.remarks) status = 'Ongoing';
          else if (isPassed) status = 'Completed';
          else status = 'Completed (Failed)';
        }

        return {
          id: subj.id,
          subjectCode: subj.subject_code,
          subjectTitle: subj.subject_name,
          units: subj.units,
          status,
        };
      });
  }, [subjects, advisingRecords, selectedStudent]);

  // ---------------- HANDLERS ----------------
  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    const y = parseYearLevelNumber(student.year_level);
    if (y) setSelectedYearFilter(String(y));
    setSelectedSemester('all'); // start by showing all sem for that year
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
      manualUnits !== '' && manualUnits !== null ? Number(manualUnits) : null;

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
      subjectObj = subjects.find((s) => String(s.id) === String(subjectId));
      if (subjectObj) {
        subjectText =
          `${subjectObj.subject_code || ''} ${
            subjectObj.subject_name || ''
          }`.trim() || subjectText;

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
        grade: grade !== '' ? grade : null,
        remarks: remarks.trim() || null,
      });

      if (error) throw error;

      // reset form
      setSelectedSubjectId('');
      setManualSubject('');
      setManualUnits('');
      setManualLecHours('');
      setManualLabHours('');
      setSection('');
      setAdvisingStatus('regular');
      setGrade('');
      setRemarks('');

      // reload list
      const { data: newList, error: listErr } = await supabase
        .from('grade_advising')
        .select(
          'id, student_id, subject_id, subject, year_level, status, section, units, lec_hours, lab_hours, grade, remarks, created_at'
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

  const startEditRow = (rec) => {
    setEditRowId(rec.id);
    setEditGrade(rec.grade || '');
    setEditRemarks(rec.remarks || '');
  };

  const cancelEditRow = () => {
    setEditRowId(null);
    setEditGrade('');
    setEditRemarks('');
  };

  const saveEditRow = async (rec) => {
    try {
      setSavingEdit(true);
      const { error } = await supabase
        .from('grade_advising')
        .update({
          grade: editGrade !== '' ? editGrade : null,
          remarks: editRemarks.trim() || null,
        })
        .eq('id', rec.id);

      if (error) throw error;

      setAdvisingRecords((prev) =>
        prev.map((r) =>
          r.id === rec.id ? { ...r, grade: editGrade, remarks: editRemarks } : r
        )
      );

      cancelEditRow();
    } catch (err) {
      console.error('Error updating grade/remarks', err);
      alert(err.message || 'Failed to update grade');
    } finally {
      setSavingEdit(false);
    }
  };

  const handlePrintAdvising = () => {
    window.print();
  };

  const handleSaveAdvisingNotes = () => {
    // TODO: i-connect sa separate table if gusto mo i-save sa DB
    alert('Advising notes saved (frontend only for now).');
  };

  // ---------------- RENDER ----------------
  return (
    <div className="dashboard-card micro" style={{ marginTop: '0.5rem' }}>
      {/* STEP 1: HEADER TABS + SELECTED STUDENT SUMMARY */}
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
        <div
          className="no-data"
          style={{ marginBottom: '0.5rem', color: '#b91c1c' }}
        >
          {studentsError}
        </div>
      )}
      {advisingError && (
        <div
          className="no-data"
          style={{ marginBottom: '0.5rem', color: '#b91c1c' }}
        >
          {advisingError}
        </div>
      )}
      {subjectsError && (
        <div
          className="no-data"
          style={{ marginBottom: '0.5rem', color: '#b91c1c' }}
        >
          {subjectsError}
        </div>
      )}

      {/* STEP 1: SEARCH STUDENT BY ID */}
      <div className="dashboard-controls" style={{ marginBottom: '0.75rem' }}>
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Enter Student ID / Number to search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.25rem' }}>
          Type at least 1 character of the Student ID (or name) to list results.
        </div>
      </div>

      <div
        className="applications-table-container"
        style={{ marginBottom: '1rem' }}
      >
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
            ) : !searchTerm.trim() ? (
              <tr>
                <td colSpan="6" className="no-data">
                  Search a student ID above to see results.
                </td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  No students found for this search.
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

      {/* STEP 2: STUDENT INFO + SUMMARY + GWA (after selecting student) */}
      {selectedStudent && (
        <>
          {/* PRINT BUTTON */}
          <div style={{ textAlign: 'right', marginBottom: '0.5rem' }}>
            <button
              type="button"
              className="btn micro btn-secondary"
              onClick={handlePrintAdvising}
            >
              🖨 Print / Export Advising Slip
            </button>
          </div>

          {/* BASIC INFO + ACADEMIC SUMMARY */}
          <div
            className="dashboard-card micro"
            style={{
              margin: '0.75rem 0',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              background: '#f9fafb',
            }}
          >
            <h3 style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}>
              Student Information & Academic Summary
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.4rem 1rem',
                fontSize: '0.8rem',
              }}
            >
              <div>
                <strong>Student ID:</strong> {selectedStudent.student_number}
              </div>
              <div>
                <strong>Name:</strong> {selectedStudent.last_name},{' '}
                {selectedStudent.first_name}
              </div>
              <div>
                <strong>Program:</strong> {selectedStudent.program_enrolled}
              </div>
              <div>
                <strong>Section:</strong> {selectedStudent.section || 'N/A'}
              </div>
              <div>
                <strong>Year Level:</strong> {selectedStudent.year_level}
              </div>
              <div>
                <strong>Semester:</strong>{' '}
                {selectedStudent.semester || 'N/A'}
              </div>
              <div>
                <strong>Status:</strong>{' '}
                {selectedStudent.enrollment_status || 'N/A'}
              </div>

              <div>
                <strong>Total Units Taken:</strong>{' '}
                {academicSummary.totalUnitsTaken}
              </div>
              <div>
                <strong>Total Units Earned:</strong>{' '}
                {academicSummary.totalUnitsEarned}
              </div>
              <div>
                <strong>Total Failed Subjects:</strong>{' '}
                {academicSummary.totalFailed}
              </div>
              <div>
                <strong>Overall GWA:</strong>{' '}
                {academicSummary.gwa != null ? academicSummary.gwa : 'N/A'}
              </div>
              <div>
                <strong>Standing:</strong> {academicSummary.remarks}
              </div>
              <div>
                <strong>Progression:</strong> {academicSummary.canProceed}
              </div>
            </div>

            {/* GWA per semester */}
            <div
              style={{
                marginTop: '0.6rem',
                fontSize: '0.8rem',
              }}
            >
              <strong>GWA per Semester:</strong>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                <span>
                  1st Sem:{' '}
                  {gwaPerSemester['1st'] != null
                    ? gwaPerSemester['1st']
                    : 'N/A'}
                </span>
                <span>
                  2nd Sem:{' '}
                  {gwaPerSemester['2nd'] != null
                    ? gwaPerSemester['2nd']
                    : 'N/A'}
                </span>
                <span>
                  Summer:{' '}
                  {gwaPerSemester.summer != null
                    ? gwaPerSemester.summer
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* STEP 2: AUTO-ALIGNED SUBJECTS FOR CURRENT YEAR (1st & 2nd SEM) */}
          <div className="dashboard-card micro" style={{ marginBottom: '0.75rem' }}>
            <div className="card-header micro" style={{ alignItems: 'center' }}>
              <h3>
                Curriculum Subjects for {selectedStudent.year_level} –{' '}
                {selectedStudent.program_enrolled}
              </h3>
              <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>
                Automatically aligned based on course and year level.
              </div>
            </div>

            {subjectsLoading ? (
              <div className="no-data">Loading curriculum...</div>
            ) : alignedSubjectsBySem.sem1.length === 0 &&
              alignedSubjectsBySem.sem2.length === 0 &&
              alignedSubjectsBySem.other.length === 0 ? (
              <div className="no-data">
                No subjects found for this student&apos;s course/year.
              </div>
            ) : (
              <>
                {/* 1st Sem */}
                <h4 style={{ fontSize: '0.85rem', margin: '0.5rem 0' }}>
                  1st Semester
                </h4>
                {alignedSubjectsBySem.sem1.length === 0 ? (
                  <div className="no-data">No 1st Sem subjects.</div>
                ) : (
                  <div className="applications-table-container">
                    <table className="applications-table">
                      <thead>
                        <tr>
                          <th>Subject Code</th>
                          <th>Subject Title</th>
                          <th>Units</th>
                          <th>Prerequisite</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alignedSubjectsBySem.sem1.map((subj) => (
                          <tr key={`sem1-${subj.id}`}>
                            <td>{subj.subject_code}</td>
                            <td>{subj.subject_name}</td>
                            <td>{subj.units}</td>
                            <td>
                              {subj.prerequisite ||
                                subj.prerequisite_code ||
                                subj.prerequisite_subject ||
                                'None'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 2nd Sem */}
                <h4 style={{ fontSize: '0.85rem', margin: '0.75rem 0 0.5rem' }}>
                  2nd Semester
                </h4>
                {alignedSubjectsBySem.sem2.length === 0 ? (
                  <div className="no-data">No 2nd Sem subjects.</div>
                ) : (
                  <div className="applications-table-container">
                    <table className="applications-table">
                      <thead>
                        <tr>
                          <th>Subject Code</th>
                          <th>Subject Title</th>
                          <th>Units</th>
                          <th>Prerequisite</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alignedSubjectsBySem.sem2.map((subj) => (
                          <tr key={`sem2-${subj.id}`}>
                            <td>{subj.subject_code}</td>
                            <td>{subj.subject_name}</td>
                            <td>{subj.units}</td>
                            <td>
                              {subj.prerequisite ||
                                subj.prerequisite_code ||
                                subj.prerequisite_subject ||
                                'None'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>

          {/* STEP 3: GRADE HISTORY (PER SUBJECT) */}
          <div className="dashboard-card micro" style={{ marginBottom: '0.75rem' }}>
            <div className="card-header micro" style={{ alignItems: 'center' }}>
              <h3>Grade History (Per Subject)</h3>
            </div>

            {advisingLoading ? (
              <div className="no-data">Loading grade history...</div>
            ) : advisingRecords.length === 0 ? (
              <div className="no-data">
                No grade records yet for this student.
              </div>
            ) : (
              <div className="applications-table-container">
                <table className="applications-table">
                  <thead>
                    <tr>
                      <th>Subject Code</th>
                      <th>Subject Title</th>
                      <th>Units</th>
                      <th>Grade</th>
                      <th>Remarks</th>
                      <th>Semester</th>
                      <th>School Year</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advisingRecords.map((rec) => {
                      const subj = subjects.find((s) => s.id === rec.subject_id);
                      const subjectCode = subj?.subject_code || '—';
                      const subjectTitle =
                        subj?.subject_name || rec.subject || '—';
                      const units =
                        rec.units != null
                          ? rec.units
                          : subj?.units != null
                          ? subj.units
                          : '—';

                      return (
                        <tr key={`grade-history-${rec.id}`}>
                          <td>{subjectCode}</td>
                          <td>{subjectTitle}</td>
                          <td>{units}</td>
                          <td>{rec.grade || '—'}</td>
                          <td>{rec.remarks || '—'}</td>
                          <td>{subj?.semester || '—'}</td>
                          <td>{subj?.school_year || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* CURRENT ADVISING LIST WITH EDITABLE GRADES */}
          <div className="dashboard-card micro" style={{ marginBottom: '0.75rem' }}>
            <div className="card-header micro" style={{ alignItems: 'center' }}>
              <div>
                <h3>
                  Current Advising List
                  {selectedStudent
                    ? ` for ${selectedStudent.last_name}, ${selectedStudent.first_name}`
                    : ''}
                </h3>
                <div
                  style={{
                    fontSize: '0.7rem',
                    marginTop: '0.25rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.4rem',
                  }}
                >
                  <span>
                    Total Units: <strong>{totalUnits}</strong>
                  </span>
                  <span>• LEC: <strong>{totalLecHours}</strong> hrs</span>
                  <span>• LAB: <strong>{totalLabHours}</strong> hrs</span>
                  <span>• Regular: <strong>{statusSummary.regular}</strong></span>
                  <span>• Irregular: <strong>{statusSummary.irregular}</strong></span>
                  <span>• Dropped: <strong>{statusSummary.dropped}</strong></span>
                  <span>• Transferee: <strong>{statusSummary.transferee}</strong></span>
                </div>
              </div>
            </div>

            {advisingLoading ? (
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
                      <th>Grade</th>
                      <th>Remarks</th>
                      <th>Advised At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advisingRecords.map((rec) => {
                      const subj = subjects.find((s) => s.id === rec.subject_id);
                      const displaySubject = subj
                        ? `${subj.subject_code || ''} ${
                            subj.subject_name || ''
                          }`.trim()
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

                      const isEditing = editRowId === rec.id;

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
                            {isEditing ? (
                              <input
                                type="text"
                                className="event-input micro"
                                value={editGrade}
                                onChange={(e) => setEditGrade(e.target.value)}
                                style={{ width: '4rem' }}
                              />
                            ) : (
                              rec.grade || '—'
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                className="event-input micro"
                                value={editRemarks}
                                onChange={(e) => setEditRemarks(e.target.value)}
                              />
                            ) : (
                              rec.remarks || '—'
                            )}
                          </td>
                          <td>
                            {rec.created_at
                              ? new Date(rec.created_at).toLocaleString()
                              : '—'}
                          </td>
                          <td>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button
                                  type="button"
                                  className="btn micro btn-primary"
                                  onClick={() => saveEditRow(rec)}
                                  disabled={savingEdit}
                                >
                                  {savingEdit ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  type="button"
                                  className="btn micro btn-secondary"
                                  onClick={cancelEditRow}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button
                                  type="button"
                                  className="btn micro btn-secondary"
                                  onClick={() => startEditRow(rec)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn micro btn-secondary"
                                  onClick={() => handleRemoveAdvising(rec.id)}
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* RECOMMENDED SUBJECTS (Prereq-aware) */}
          <div className="dashboard-card micro" style={{ marginBottom: '0.75rem' }}>
            <div className="card-header micro" style={{ alignItems: 'center' }}>
              <h3>Current Semester Advising – Recommended Subjects</h3>
              <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>
                Filtered by course and year; eligibility depends on passed
                prerequisites.
              </div>
            </div>

            {recommendedSubjects.length === 0 ? (
              <div className="no-data">
                No recommended subjects found for the current filters.
              </div>
            ) : (
              <div className="applications-table-container">
                <table className="applications-table">
                  <thead>
                    <tr>
                      <th>Subject Code</th>
                      <th>Subject Title</th>
                      <th>Units</th>
                      <th>Prerequisite</th>
                      <th>Status</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recommendedSubjects.map((item) => (
                      <tr key={`reco-${item.id}`}>
                        <td>{item.subjectCode}</td>
                        <td>{item.subjectTitle}</td>
                        <td>{item.units}</td>
                        <td>{item.prerequisite}</td>
                        <td>
                          {item.eligible ? '✅ Eligible' : '❌ Not Allowed'}
                        </td>
                        <td>{item.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* CURRICULUM CHECKLIST */}
          <div className="dashboard-card micro" style={{ marginBottom: '0.75rem' }}>
            <div className="card-header micro" style={{ alignItems: 'center' }}>
              <h3>Curriculum Checklist</h3>
              <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>
                All subjects in the curriculum for this course.
              </div>
            </div>

            {subjects.length === 0 ? (
              <div className="no-data">No subjects found in curriculum.</div>
            ) : (
              <div className="applications-table-container">
                <table className="applications-table">
                  <thead>
                    <tr>
                      <th>Subject Code</th>
                      <th>Subject Title</th>
                      <th>Units</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {curriculumChecklist.map((item) => (
                      <tr key={`checklist-${item.id}`}>
                        <td>{item.subjectCode}</td>
                        <td>{item.subjectTitle}</td>
                        <td>{item.units}</td>
                        <td>
                          {item.status === 'Completed' && '✅ Completed'}
                          {item.status === 'Ongoing' && '⏳ Ongoing'}
                          {item.status === 'Completed (Failed)' &&
                            '⚠ Completed (Failed)'}
                          {item.status === 'Not yet taken' &&
                            '⬜ Not yet taken'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ADVISING NOTES */}
          <div className="dashboard-card micro" style={{ marginBottom: '0.75rem' }}>
            <div className="card-header micro" style={{ alignItems: 'center' }}>
              <h3>Advising Notes / Recommendations</h3>
            </div>

            <div style={{ padding: '0.5rem 0.75rem' }}>
              <textarea
                className="event-input micro"
                rows={3}
                placeholder='e.g. "Retake IT 102 next semester." / "Can enroll a maximum of 18 units only."'
                value={advisingNotes}
                onChange={(e) => setAdvisingNotes(e.target.value)}
                style={{ width: '100%', resize: 'vertical' }}
              />
              <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
                <button
                  type="button"
                  className="btn micro btn-primary"
                  onClick={handleSaveAdvisingNotes}
                >
                  Save Advising Notes
                </button>
              </div>
            </div>
          </div>

          {/* ADD SUBJECT + GRADE INPUT FORM (ADVISER USE) */}
          <div className="dashboard-card micro">
            <div className="card-header micro">
              <h3>Add Subject to Advising (with Grade & Remarks)</h3>
              <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>
                Filtered by course, year, and semester. Grades affect GWA and
                prerequisite eligibility.
              </div>
            </div>

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
              <div
                className="no-data"
                style={{ marginBottom: '0.75rem' }}
              >
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
                  placeholder="e.g. BSIT-1A"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                />
              </div>

              {/* Grade + Remarks inputs */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 3fr',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
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
                    Grade (optional)
                  </label>
                  <input
                    type="text"
                    className="event-input micro"
                    placeholder="e.g. 1.75 / 3.00 / INC"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
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
                    Remarks / Advising Notes
                  </label>
                  <input
                    type="text"
                    className="event-input micro"
                    placeholder="e.g. Passed, Retake if failed, Incomplete..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  alignItems: 'center',
                  marginTop: '0.5rem',
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
          </div>
        </>
      )}
    </div>
  );
};

export default StudentAdvisingPage;
