// src/components/StudentAdvisingPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import "./StudentAdvisingPage.css";

// Build full name
const getFullName = (s) =>
  [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(" ");

// Parse year level like "1", "1st", "1st Year"
const parseYearLevelNumber = (value) => {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  const direct = parseInt(str, 10);
  if (!Number.isNaN(direct)) return direct;
  const match = str.match(/\d/);
  if (match) return parseInt(match[0], 10);
  return null;
};

// Map program_enrolled -> subjects.course style code
const mapProgramToCourseCode = (program_enrolled) => {
  if (!program_enrolled) return null;
  const lower = program_enrolled.toLowerCase();

  if (
    lower.includes("bsit") ||
    lower.includes("computer science") ||
    lower.includes("information technology")
  ) {
    return "bsit";
  }

  if (
    lower.includes("bsoa") ||
    lower.includes("office administration") ||
    lower.includes("office admin")
  ) {
    return "bsoa";
  }

  if (lower.includes("bscs") || lower.includes("computer science")) {
    return "bscs";
  }

  if (lower.includes("bsis") || lower.includes("information systems")) {
    return "bsis";
  }

  return lower.trim();
};

// Helper: get student status label (regular/irregular)
const getStudentStatusLabel = (student) => {
  if (!student) return "regular";
  if (!student.student_status) return "regular";
  const status = student.student_status.toString().toLowerCase();
  return status === 'irregular' ? 'irregular' : 'regular';
};

// Compute GWA from grade_advising rows (grade + units)
const computeGwa = (rows) => {
  if (!rows || rows.length === 0) return null;
  let totalUnits = 0;
  let weightedSum = 0;

  rows.forEach((g) => {
    const gradeNum = parseFloat(g.grade);
    const units = g.units || 0;
    if (!isNaN(gradeNum) && units > 0) {
      weightedSum += gradeNum * units;
      totalUnits += units;
    }
  });

  if (totalUnits === 0) return null;
  return weightedSum / totalUnits;
};

// Normalize subject code string (remove spaces, uppercase)
const normalizeCode = (code) => {
  if (!code) return "";
  return String(code).replace(/\s+/g, "").toUpperCase();
};

// Parse prerequisites text into array of subject codes
const parsePrereqList = (text) => {
  if (!text) return [];
  const lower = text.toLowerCase().trim();
  if (lower === "none" || lower === "n/a" || lower === "na") return [];
  return text
    .split(/[,/]/)
    .map((p) => normalizeCode(p))
    .filter(Boolean);
};

// Enhanced time overlap detection
const hasTimeOverlap = (time1, time2, days1, days2) => {
  if (!time1 || !time2 || !days1 || !days2) return false;
  
  // Check if days overlap
  const daysArray1 = days1.split('/');
  const daysArray2 = days2.split('/');
  const commonDays = daysArray1.filter(day => daysArray2.includes(day));
  
  if (commonDays.length === 0) return false;

  // Parse times (assuming 24-hour format)
  const parseTime = (timeStr) => {
    const cleanTime = timeStr.trim();
    const [start, end] = cleanTime.split('-');
    
    const parseSingleTime = (t) => {
      const [hours, minutes] = t.split(':').map(Number);
      return hours * 60 + (minutes || 0);
    };

    return [parseSingleTime(start), parseSingleTime(end)];
  };

  const [start1, end1] = parseTime(time1);
  const [start2, end2] = parseTime(time2);

  return start1 < end2 && start2 < end1;
};

export default function StudentAdvisingPage() {
  const [activeTab, setActiveTab] = useState("plan");

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Students list state
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [savingStudent, setSavingStudent] = useState(false);

  // Advising state
  const [advisingSchoolYear, setAdvisingSchoolYear] = useState("2025-2026");
  const [advisingSemester, setAdvisingSemester] = useState("1st");
  const [subjectsForAdvising, setSubjectsForAdvising] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState("");
  const [plannedSubjectIds, setPlannedSubjectIds] = useState([]);

  // Sections state
  const [availableSections, setAvailableSections] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [sectionEnrollments, setSectionEnrollments] = useState({});

  // Grades state
  const [grades, setGrades] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [gradesError, setGradesError] = useState("");
  const [savingGrades, setSavingGrades] = useState(false);

  // Section selection state
  const [selectedSectionsBySubjectId, setSelectedSectionsBySubjectId] = useState({});
  const [conflictWarnings, setConflictWarnings] = useState({});
  const [enrolling, setEnrolling] = useState(false);

  // ---------------------------
  // LOAD ALL STUDENTS
  // ---------------------------
  useEffect(() => {
    const loadStudents = async () => {
      setStudentsLoading(true);
      try {
        const { data, error } = await supabase
          .from("institutional_students")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error loading students:", error);
        } else {
          setStudents(data || []);
        }
      } catch (error) {
        console.error("Error loading students:", error);
      } finally {
        setStudentsLoading(false);
      }
    };

    loadStudents();
  }, []);

  // ---------------------------
  // SEARCH STUDENT
  // ---------------------------
  const handleSearchStudent = async () => {
    if (!searchTerm.trim()) return;

    setSearchLoading(true);
    setSearchError("");
    setSearchResults([]);
    setSelectedStudent(null);
    setSubjectsForAdvising([]);
    setPlannedSubjectIds([]);
    setGrades([]);
    setGradesError("");
    setSelectedSectionsBySubjectId({});
    setConflictWarnings({});
    setAvailableSections([]);
    setSectionEnrollments({});

    try {
      const { data, error } = await supabase
        .from("institutional_students")
        .select("*")
        .or(`student_number.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`);

      if (error) {
        setSearchError(error.message);
      } else if (data && data.length === 1) {
        setSelectedStudent(data[0]);
      } else if (data && data.length > 1) {
        setSearchResults(data);
      } else {
        setSearchError("No students found matching your search.");
      }
    } catch (err) {
      console.error(err);
      setSearchError("Unexpected error while searching.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectStudent = (s) => {
    setSelectedStudent(s);
    setSearchResults([]);
    setSubjectsForAdvising([]);
    setPlannedSubjectIds([]);
    setGrades([]);
    setGradesError("");
    setSelectedSectionsBySubjectId({});
    setConflictWarnings({});
  };

  // ---------------------------
  // EDIT STUDENT FUNCTIONS
  // ---------------------------
  const handleEditStudent = (student) => {
    setEditingStudent({ ...student });
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
  };

  const handleStudentChange = (field, value) => {
    setEditingStudent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveStudent = async () => {
    if (!editingStudent) return;

    setSavingStudent(true);
    try {
      const { error } = await supabase
        .from("institutional_students")
        .update({
          first_name: editingStudent.first_name,
          middle_name: editingStudent.middle_name,
          last_name: editingStudent.last_name,
          institutional_email: editingStudent.institutional_email,
          program_enrolled: editingStudent.program_enrolled,
          year_level: editingStudent.year_level,
          student_status: editingStudent.student_status,
          enrollment_status: editingStudent.enrollment_status,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingStudent.id);

      if (error) {
        console.error("Error updating student:", error);
        alert("Error updating student: " + error.message);
        return;
      }

      // Update local state
      setStudents(prev => prev.map(s => 
        s.id === editingStudent.id ? { ...s, ...editingStudent } : s
      ));

      // Update selected student if it's the one being edited
      if (selectedStudent && selectedStudent.id === editingStudent.id) {
        setSelectedStudent(editingStudent);
      }

      setEditingStudent(null);
      alert("Student updated successfully!");

    } catch (error) {
      console.error("Error saving student:", error);
      alert("Error saving student: " + error.message);
    } finally {
      setSavingStudent(false);
    }
  };

  // ---------------------------
  // LOAD SUBJECTS
  // ---------------------------
  useEffect(() => {
    const loadSubjects = async () => {
      if (!selectedStudent) return;

      setSubjectsLoading(true);
      setSubjectsError("");

      try {
        const yearLevelNumber = parseYearLevelNumber(selectedStudent.year_level);
        const courseCode = mapProgramToCourseCode(selectedStudent.program_enrolled);

        let query = supabase
          .from("subjects")
          .select("*")
          .eq("semester", advisingSemester);

        if (yearLevelNumber !== null) {
          query = query.eq("year_level", yearLevelNumber);
        }

        if (courseCode) {
          query = query.eq("course", courseCode);
        }

        const { data, error } = await query;

        if (error) {
          setSubjectsError(error.message);
        } else {
          setSubjectsForAdvising(data || []);
        }
      } catch (err) {
        console.error("Unexpected error loading subjects:", err);
        setSubjectsError("Unexpected error while loading subjects.");
      } finally {
        setSubjectsLoading(false);
      }
    };

    loadSubjects();
  }, [selectedStudent, advisingSemester]);

  // ---------------------------
  // LOAD SECTIONS AND ENROLLMENT COUNTS
  // ---------------------------
  useEffect(() => {
    const loadSectionsData = async () => {
      if (!selectedStudent) return;

      setSectionsLoading(true);

      try {
        const yearLevelNumber = parseYearLevelNumber(selectedStudent.year_level);
        const courseCode = mapProgramToCourseCode(selectedStudent.program_enrolled);

        // Load sections with their schedules
        const { data: sectionsData, error: sectionsError } = await supabase
          .from("sections")
          .select(`
            *,
            section_schedules (*)
          `)
          .eq("school_year", advisingSchoolYear)
          .eq("semester", advisingSemester);

        // Filter by year level and course if available
        let filteredSections = sectionsData || [];
        if (yearLevelNumber !== null) {
          filteredSections = filteredSections.filter(section => section.year_level === yearLevelNumber);
        }
        if (courseCode) {
          filteredSections = filteredSections.filter(section => section.course === courseCode);
        }

        if (sectionsError) {
          console.error("Error loading sections:", sectionsError);
          setAvailableSections([]);
          return;
        }

        if (filteredSections.length > 0) {
          setAvailableSections(filteredSections);

          // Load enrollment counts for each section
          const enrollmentCounts = {};
          for (const section of filteredSections) {
            const { data: enrollments, error: enrollError } = await supabase
              .from("student_sections")
              .select("student_type")
              .eq("section_id", section.id)
              .eq("school_year", advisingSchoolYear)
              .eq("semester", advisingSemester);

            if (!enrollError && enrollments) {
              const regularCount = enrollments.filter(e => e.student_type === 'regular').length;
              const irregularCount = enrollments.filter(e => e.student_type === 'irregular').length;
              enrollmentCounts[section.id] = { regular: regularCount, irregular: irregularCount };
            } else {
              enrollmentCounts[section.id] = { regular: 0, irregular: 0 };
            }
          }
          setSectionEnrollments(enrollmentCounts);
        } else {
          setAvailableSections([]);
        }
      } catch (error) {
        console.error("Error loading sections:", error);
        setAvailableSections([]);
      } finally {
        setSectionsLoading(false);
      }
    };

    loadSectionsData();
  }, [selectedStudent, advisingSchoolYear, advisingSemester]);

  // ---------------------------
  // LOAD GRADES
  // ---------------------------
  useEffect(() => {
    const loadGrades = async () => {
      if (!selectedStudent) return;

      setGradesLoading(true);
      setGradesError("");
      try {
        const { data, error } = await supabase
          .from("grade_advising")
          .select("*")
          .eq("student_id", selectedStudent.id);

        if (error) {
          setGradesError(error.message);
        } else {
          setGrades(data || []);
        }
      } catch (err) {
        console.error("Unexpected error (grades):", err);
        setGradesError("Unexpected error while loading grades.");
      } finally {
        setGradesLoading(false);
      }
    };

    loadGrades();
  }, [selectedStudent]);

  // ---------------------------
  // PRE-REQ ELIGIBILITY
  // ---------------------------
  const passedSubjects = useMemo(() => {
    const set = new Set();
    grades.forEach((g) => {
      const code = normalizeCode(g.subject);
      if (!code) return;
      const num = parseFloat(g.grade);
      if (!isNaN(num) && num <= 3) {
        set.add(code);
      }
    });
    return set;
  }, [grades]);

  const subjectEligibilityMap = useMemo(() => {
    const map = {};
    subjectsForAdvising.forEach((subj) => {
      const prereqList = parsePrereqList(subj.prerequisites);
      if (prereqList.length === 0) {
        map[subj.id] = { status: "Eligible", missing: [] };
        return;
      }

      const missing = prereqList.filter((code) => !passedSubjects.has(code));

      if (missing.length === 0) {
        map[subj.id] = { status: "Eligible", missing: [] };
      } else {
        map[subj.id] = { status: "Not allowed", missing };
      }
    });
    return map;
  }, [subjectsForAdvising, passedSubjects]);

  // ---------------------------
  // SECTION CAPACITY AND CONFLICT CHECKS
  // ---------------------------
  const getSectionCapacityStatus = (sectionId) => {
    const enrollment = sectionEnrollments[sectionId] || { regular: 0, irregular: 0 };
    const section = availableSections.find(s => s.id === sectionId);
    
    if (!section) return { regular: 0, irregular: 0, total: 0, fullForRegular: true, fullForIrregular: true };
    
    const fullForRegular = enrollment.regular >= (section.max_regular || 35);
    const fullForIrregular = enrollment.irregular >= (section.max_irregular || 5);
    const totalFull = (enrollment.regular + enrollment.irregular) >= ((section.max_regular || 35) + (section.max_irregular || 5));
    
    return { 
      ...enrollment, 
      total: enrollment.regular + enrollment.irregular,
      fullForRegular, 
      fullForIrregular,
      totalFull
    };
  };

  const checkSectionConflicts = (candidateSectionId, currentSubjectId) => {
    const candidateSection = availableSections.find(s => s.id === candidateSectionId);
    if (!candidateSection || !candidateSection.section_schedules) return { hasConflict: false, conflicts: [] };

    const conflicts = [];
    const candidateSchedules = candidateSection.section_schedules;

    Object.entries(selectedSectionsBySubjectId).forEach(([subjectId, sectionId]) => {
      if (subjectId === String(currentSubjectId) || !sectionId) return;
      
      const otherSection = availableSections.find(s => s.id === sectionId);
      if (!otherSection || !otherSection.section_schedules) return;

      const otherSchedules = otherSection.section_schedules;

      candidateSchedules.forEach(candidateSchedule => {
        otherSchedules.forEach(otherSchedule => {
          if (hasTimeOverlap(
            candidateSchedule.schedule_time,
            otherSchedule.schedule_time,
            candidateSchedule.schedule_days,
            otherSchedule.schedule_days
          )) {
            conflicts.push({
              type: 'time',
              withSubject: otherSchedule.subject_name,
              withSection: otherSection.section_code,
              days: otherSchedule.schedule_days,
              time: otherSchedule.schedule_time,
              room: candidateSchedule.room === otherSchedule.room ? candidateSchedule.room : null
            });
          }
        });
      });
    });

    return { hasConflict: conflicts.length > 0, conflicts };
  };

  // ---------------------------
  // SECTION SELECTION
  // ---------------------------
  const handleSelectSectionForSubject = (subjectId, sectionId) => {
    const subject = subjectsForAdvising.find(s => s.id === subjectId);
    const section = availableSections.find(s => s.id === sectionId);
    if (!subject || !section) return;

    const capacity = getSectionCapacityStatus(sectionId);
    const studentType = getStudentStatusLabel(selectedStudent);
    
    if (studentType === 'regular' && capacity.fullForRegular) {
      alert(`Section is full for regular students. (${capacity.regular}/${section.max_regular || 35})`);
      return;
    }
    
    if (studentType === 'irregular' && capacity.fullForIrregular) {
      alert(`Section is full for irregular students. (${capacity.irregular}/${section.max_irregular || 5})`);
      return;
    }

    if (capacity.totalFull) {
      alert(`Section is completely full. (${capacity.total}/${(section.max_regular || 35) + (section.max_irregular || 5)})`);
      return;
    }

    const conflictCheck = checkSectionConflicts(sectionId, subjectId);
    
    if (conflictCheck.hasConflict) {
      setConflictWarnings(prev => ({
        ...prev,
        [subjectId]: {
          sectionId,
          conflicts: conflictCheck.conflicts
        }
      }));
      
      const conflictMessages = conflictCheck.conflicts.map(conflict => 
        `Time conflict with ${conflict.withSubject} (${conflict.withSection}) on ${conflict.days} at ${conflict.time}`
      );
      
      alert(`Schedule conflict detected:\n${conflictMessages.join('\n')}`);
      return;
    }

    setConflictWarnings(prev => {
      const newState = { ...prev };
      delete newState[subjectId];
      return newState;
    });

    setSelectedSectionsBySubjectId(prev => ({
      ...prev,
      [subjectId]: sectionId,
    }));
  };

  // ---------------------------
  // ENROLL STUDENT IN SECTIONS
  // ---------------------------
  const handleEnrollSections = async () => {
    if (!selectedStudent) {
      alert("Please select a student first.");
      return;
    }

    if (Object.keys(selectedSectionsBySubjectId).length === 0) {
      alert("Please select sections for planned subjects.");
      return;
    }

    setEnrolling(true);

    try {
      const enrollments = [];
      const studentType = getStudentStatusLabel(selectedStudent);

      for (const [subjectId, sectionId] of Object.entries(selectedSectionsBySubjectId)) {
        const subject = subjectsForAdvising.find(s => s.id === Number(subjectId));
        const section = availableSections.find(s => s.id === sectionId);

        if (subject && section) {
          enrollments.push({
            student_id: selectedStudent.id,
            section_id: sectionId,
            subject_code: subject.subject_code,
            student_type: studentType,
            school_year: advisingSchoolYear,
            semester: advisingSemester,
            created_at: new Date().toISOString()
          });
        }
      }

      // Save to database
      const { error } = await supabase
        .from("student_sections")
        .insert(enrollments);

      if (error) {
        console.error("Database enrollment error:", error);
        alert("Error enrolling student: " + error.message);
      } else {
        alert(`✅ Successfully enrolled ${getFullName(selectedStudent)} in ${enrollments.length} section(s)!`);
        
        // Update enrollment counts in state
        const updatedEnrollments = { ...sectionEnrollments };
        enrollments.forEach(enrollment => {
          if (!updatedEnrollments[enrollment.section_id]) {
            updatedEnrollments[enrollment.section_id] = { regular: 0, irregular: 0 };
          }
          if (enrollment.student_type === 'regular') {
            updatedEnrollments[enrollment.section_id].regular++;
          } else {
            updatedEnrollments[enrollment.section_id].irregular++;
          }
        });
        setSectionEnrollments(updatedEnrollments);
      }

    } catch (error) {
      console.error("Enrollment error:", error);
      alert(`Enrollment error: ${error.message}`);
    } finally {
      setEnrolling(false);
    }
  };

  // ---------------------------
  // RENDER SECTION OPTIONS
  // ---------------------------
  const renderSectionOptions = (subject) => {
    if (availableSections.length === 0) {
      return <p>No sections available for this course and year level.</p>;
    }

    const studentType = getStudentStatusLabel(selectedStudent);
    const selectedSectionId = selectedSectionsBySubjectId[subject.id];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {availableSections.map((section, index) => {
          const capacity = getSectionCapacityStatus(section.id);
          const conflictCheck = checkSectionConflicts(section.id, subject.id);
          const hasConflict = conflictCheck.hasConflict && selectedSectionId !== section.id;

          let disabled = false;
          let disabledReason = "";

          if (studentType === 'regular' && capacity.fullForRegular) {
            disabled = true;
            disabledReason = `FULL (Regular: ${capacity.regular}/${section.max_regular || 35})`;
          } else if (studentType === 'irregular' && capacity.fullForIrregular) {
            disabled = true;
            disabledReason = `FULL (Irregular: ${capacity.irregular}/${section.max_irregular || 5})`;
          } else if (capacity.totalFull) {
            disabled = true;
            disabledReason = `COMPLETELY FULL (${capacity.total}/${(section.max_regular || 35) + (section.max_irregular || 5)})`;
          } else if (hasConflict) {
            disabled = true;
            disabledReason = "TIME CONFLICT";
          }

          const isSelected = selectedSectionId === section.id;

          return (
            <div key={`section-${section.id}-subject-${subject.id}-index-${index}`} style={{ 
              border: isSelected ? "2px solid #4CAF50" : hasConflict ? "2px solid #f44336" : "1px solid #ddd",
              backgroundColor: isSelected ? "#e8f5e8" : hasConflict ? "#ffe6e6" : disabled ? "#f5f5f5" : "white",
              padding: "12px",
              borderRadius: "6px",
              cursor: disabled ? "not-allowed" : "pointer"
            }} onClick={() => !disabled && handleSelectSectionForSubject(subject.id, section.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '16px', color: isSelected ? '#2e7d32' : '#333' }}>
                    {section.section_code}
                  </strong>
                  {section.section_schedules && section.section_schedules.map((schedule, idx) => (
                    <div key={`schedule-${schedule.id}-idx-${idx}`} style={{ marginTop: '8px', fontSize: '14px' }}>
                      <div>
                        <strong>{schedule.subject_code}:</strong> {schedule.subject_name}
                      </div>
                      <div>
                        📅 {schedule.schedule_days} | 🕒 {schedule.schedule_time} | 🏫 {schedule.room}
                      </div>
                      {idx < section.section_schedules.length - 1 && <hr style={{ margin: '8px 0', opacity: 0.3 }} />}
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: 'right', minWidth: '120px' }}>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    Regular: {capacity.regular}/{section.max_regular || 35}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    Irregular: {capacity.irregular}/{section.max_irregular || 5}
                  </div>
                  {disabledReason && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#d32f2f', 
                      fontWeight: 'bold',
                      marginTop: '4px'
                    }}>
                      {disabledReason}
                    </div>
                  )}
                  {isSelected && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#2e7d32', 
                      fontWeight: 'bold',
                      marginTop: '4px'
                    }}>
                      SELECTED ✓
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ---------------------------
  // GRADES MANAGEMENT
  // ---------------------------
  const handleGradeChange = (gradeId, field, newValue) => {
    setGrades((prev) =>
      prev.map((g) => (g.id === gradeId ? { ...g, [field]: newValue } : g))
    );
  };

  const overallGwa = useMemo(() => computeGwa(grades), [grades]);

  const handleSaveGrades = async () => {
    if (!selectedStudent) return alert("Select a student first.");

    setSavingGrades(true);
    try {
      const updates = grades.map((g) => ({
        id: g.id,
        student_id: g.student_id,
        subject: g.subject,
        year_level: g.year_level,
        section: g.section,
        units: g.units,
        status: g.status,
        semester: g.semester,
        school_year: g.school_year,
        grade: g.grade,
        remarks: g.remarks,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from("grade_advising")
        .upsert(updates);

      if (error) {
        console.error(error);
        alert("Failed to save grades: " + error.message);
      } else {
        alert("Grades saved successfully!");
      }
    } catch (err) {
      console.error(err);
      alert("Unexpected error while saving grades.");
    } finally {
      setSavingGrades(false);
    }
  };

  // ---------------------------
  // SUBJECT PLANNING
  // ---------------------------
  const togglePlannedSubject = (subjectId) => {
    const eligibility = subjectEligibilityMap[subjectId];
    if (eligibility && eligibility.status === "Not allowed") {
      alert("This subject is not allowed. Check prerequisites first.");
      return;
    }

    setPlannedSubjectIds((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );

    if (plannedSubjectIds.includes(subjectId)) {
      setSelectedSectionsBySubjectId(prev => {
        const newState = { ...prev };
        delete newState[subjectId];
        return newState;
      });
      setConflictWarnings(prev => {
        const newState = { ...prev };
        delete newState[subjectId];
        return newState;
      });
    }
  };

  const totalPlannedUnits = useMemo(
    () =>
      subjectsForAdvising.reduce((sum, s) => {
        if (plannedSubjectIds.includes(s.id)) {
          return sum + (s.units || 0);
        }
        return sum;
      }, 0),
    [subjectsForAdvising, plannedSubjectIds]
  );

  const getEligibilityLabel = (subj) => {
    const info = subjectEligibilityMap[subj.id];
    if (!info) {
      if (!subj.prerequisites || subj.prerequisites.trim() === "") {
        return "Eligible (no prerequisites)";
      }
      return `Has prerequisites: ${subj.prerequisites}`;
    }

    if (info.status === "Eligible") {
      if (!subj.prerequisites || subj.prerequisites.trim() === "") {
        return "Eligible (no prerequisites)";
      }
      return `Eligible (completed: ${subj.prerequisites})`;
    }

    return `Not allowed (missing: ${info.missing.join(", ")})`;
  };

  return (
    <div className="advising-page" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ color: '#2c3e50', marginBottom: '30px' }}>Student Advising Hub - Admin Panel</h1>

      {/* STUDENT MANAGEMENT */}
      <section style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2 style={{ color: '#34495e', marginBottom: '15px' }}>Student Management</h2>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Student ID, First Name, or Last Name"
            style={{ 
              flex: '1 1 300px', 
              padding: '10px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              fontSize: '16px'
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleSearchStudent()}
          />
          <button 
            onClick={handleSearchStudent} 
            disabled={searchLoading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: searchLoading ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {searchLoading ? "Searching..." : "Search Student"}
          </button>
        </div>

        {searchError && (
          <div style={{ 
            color: "#e74c3c", 
            backgroundColor: '#fdf2f2',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #e74c3c'
          }}>
            {searchError}
          </div>
        )}

        {/* STUDENTS TABLE */}
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ color: '#34495e', marginBottom: '15px' }}>All Students</h3>
          
          {studentsLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Loading students...</p>
            </div>
          ) : students.length > 0 ? (
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid #e1e8ed'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e9ecef' }}>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Student Number</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Program</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Year Level</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} style={{ 
                      backgroundColor: selectedStudent?.id === student.id ? '#e3f2fd' : 'white',
                      cursor: 'pointer'
                    }}>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        <strong>{student.student_number}</strong>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        {getFullName(student)}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        {student.institutional_email}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        {student.program_enrolled}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        {student.year_level}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        <span style={{ 
                          color: student.enrollment_status === 'active' ? '#27ae60' : '#e74c3c',
                          fontWeight: 'bold'
                        }}>
                          {student.enrollment_status?.toUpperCase() || 'ACTIVE'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => setSelectedStudent(student)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#3498db',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Select
                          </button>
                          <button 
                            onClick={() => handleEditStudent(student)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#f39c12',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e1e8ed'
            }}>
              <p style={{ color: '#7f8c8d' }}>No students found in the database.</p>
            </div>
          )}
        </div>

        {/* EDIT STUDENT MODAL */}
        {editingStudent && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h3 style={{ color: '#34495e', marginBottom: '20px' }}>Edit Student</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Student Number
                  </label>
                  <input
                    type="text"
                    value={editingStudent.student_number}
                    disabled
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      border: '1px solid #ddd', 
                      borderRadius: '4px',
                      backgroundColor: '#f5f5f5'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Institutional Email *
                  </label>
                  <input
                    type="email"
                    value={editingStudent.institutional_email}
                    onChange={(e) => handleStudentChange('institutional_email', e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      border: '1px solid #ddd', 
                      borderRadius: '4px' 
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={editingStudent.first_name}
                    onChange={(e) => handleStudentChange('first_name', e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      border: '1px solid #ddd', 
                      borderRadius: '4px' 
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={editingStudent.middle_name || ''}
                    onChange={(e) => handleStudentChange('middle_name', e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      border: '1px solid #ddd', 
                      borderRadius: '4px' 
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={editingStudent.last_name}
                    onChange={(e) => handleStudentChange('last_name', e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      border: '1px solid #ddd', 
                      borderRadius: '4px' 
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Program Enrolled *
                  </label>
                  <select
                    value={editingStudent.program_enrolled}
                    onChange={(e) => handleStudentChange('program_enrolled', e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      border: '1px solid #ddd', 
                      borderRadius: '4px' 
                    }}
                  >
                    <option value="BSIT">BSIT - Bachelor of Science in Information Technology</option>
                    <option value="BSOA">BSOA - Bachelor of Science in Office Administration</option>
                    <option value="BSCS">BSCS - Bachelor of Science in Computer Science</option>
                    <option value="BSIS">BSIS - Bachelor of Science in Information Systems</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Year Level *
                  </label>
                  <select
                    value={editingStudent.year_level}
                    onChange={(e) => handleStudentChange('year_level', e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      border: '1px solid #ddd', 
                      borderRadius: '4px' 
                    }}
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Student Status *
                  </label>
                  <select
                    value={editingStudent.student_status}
                    onChange={(e) => handleStudentChange('student_status', e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      border: '1px solid #ddd', 
                      borderRadius: '4px' 
                    }}
                  >
                    <option value="regular">Regular</option>
                    <option value="irregular">Irregular</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Enrollment Status *
                  </label>
                  <select
                    value={editingStudent.enrollment_status}
                    onChange={(e) => handleStudentChange('enrollment_status', e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      border: '1px solid #ddd', 
                      borderRadius: '4px' 
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={handleCancelEdit}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#95a5a6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveStudent}
                  disabled={savingStudent}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: savingStudent ? '#95a5a6' : '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: savingStudent ? 'not-allowed' : 'pointer'
                  }}
                >
                  {savingStudent ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {searchResults.length > 1 && (
          <div style={{ marginTop: '15px' }}>
            <h3 style={{ color: '#34495e', marginBottom: '10px' }}>Search Results:</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {searchResults.map((s) => (
                <button 
                  key={s.id} 
                  onClick={() => handleSelectStudent(s)}
                  style={{
                    padding: '10px',
                    border: '1px solid #ddd',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <strong>{s.student_number}</strong> - {getFullName(s)} ({s.program_enrolled}) - Year {s.year_level}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedStudent && (
          <div style={{ 
            marginTop: '15px', 
            padding: '15px',
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #e1e8ed'
          }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '10px' }}>
              👤 Selected Student Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <p><strong>Name:</strong> {getFullName(selectedStudent)}</p>
              <p><strong>Student Number:</strong> {selectedStudent.student_number}</p>
              <p><strong>Email:</strong> {selectedStudent.institutional_email}</p>
              <p><strong>Program:</strong> {selectedStudent.program_enrolled}</p>
              <p><strong>Year Level:</strong> {selectedStudent.year_level}</p>
              <p><strong>Student Type:</strong> 
                <span style={{ 
                  color: getStudentStatusLabel(selectedStudent) === 'regular' ? '#27ae60' : '#e67e22',
                  fontWeight: 'bold',
                  marginLeft: '5px'
                }}>
                  {getStudentStatusLabel(selectedStudent).toUpperCase()}
                </span>
              </p>
              <p><strong>Enrollment Status:</strong> 
                <span style={{ 
                  color: selectedStudent.enrollment_status === 'active' ? '#27ae60' : '#e74c3c',
                  fontWeight: 'bold',
                  marginLeft: '5px'
                }}>
                  {selectedStudent.enrollment_status?.toUpperCase() || 'ACTIVE'}
                </span>
              </p>
            </div>
          </div>
        )}
      </section>

      {/* TABS */}
      {selectedStudent && (
        <section style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #ddd' }}>
            <button 
              onClick={() => setActiveTab("plan")}
              style={{
                padding: '12px 24px',
                backgroundColor: activeTab === "plan" ? '#3498db' : 'transparent',
                color: activeTab === "plan" ? 'white' : '#34495e',
                border: 'none',
                borderBottom: activeTab === "plan" ? '2px solid #3498db' : 'none',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Plan Subjects & Sections
            </button>
            <button 
              onClick={() => setActiveTab("grades")}
              style={{
                padding: '12px 24px',
                backgroundColor: activeTab === "grades" ? '#3498db' : 'transparent',
                color: activeTab === "grades" ? 'white' : '#34495e',
                border: 'none',
                borderBottom: activeTab === "grades" ? '2px solid #3498db' : 'none',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Grades & History
            </button>
            <button 
              onClick={() => setActiveTab("summary")}
              style={{
                padding: '12px 24px',
                backgroundColor: activeTab === "summary" ? '#3498db' : 'transparent',
                color: activeTab === "summary" ? 'white' : '#34495e',
                border: 'none',
                borderBottom: activeTab === "summary" ? '2px solid #3498db' : 'none',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Summary
            </button>
          </div>
        </section>
      )}

      {/* PLAN SUBJECTS TAB */}
      {activeTab === "plan" && selectedStudent && (
        <section>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            border: '1px solid #e1e8ed'
          }}>
            <h2 style={{ color: '#34495e', marginBottom: '20px' }}>Section Enrollment</h2>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong>School Year:</strong>
                <input
                  type="text"
                  value={advisingSchoolYear}
                  onChange={(e) => setAdvisingSchoolYear(e.target.value)}
                  style={{ 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    width: '120px'
                  }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong>Semester:</strong>
                <select
                  value={advisingSemester}
                  onChange={(e) => setAdvisingSemester(e.target.value)}
                  style={{ 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    width: '100px'
                  }}
                >
                  <option value="1st">1st</option>
                  <option value="2nd">2nd</option>
                  <option value="Summer">Summer</option>
                </select>
              </label>
            </div>

            {sectionsLoading && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p>Loading sections and schedules...</p>
              </div>
            )}

            {availableSections.length > 0 ? (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ color: '#34495e', marginBottom: '15px' }}>Available Subjects</h3>
                  
                  {subjectsForAdvising.length > 0 ? (
                    <div style={{ 
                      backgroundColor: '#f8f9fa', 
                      padding: '15px', 
                      borderRadius: '6px',
                      marginBottom: '20px'
                    }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e9ecef' }}>
                            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Include</th>
                            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Code</th>
                            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Name</th>
                            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Units</th>
                            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Prerequisites</th>
                            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Eligibility</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subjectsForAdvising.map(subject => {
                            const eligibility = subjectEligibilityMap[subject.id];
                            const notAllowed = eligibility && eligibility.status === "Not allowed";
                            
                            return (
                              <tr key={subject.id}>
                                <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                                  <input
                                    type="checkbox"
                                    checked={plannedSubjectIds.includes(subject.id)}
                                    disabled={notAllowed}
                                    onChange={() => togglePlannedSubject(subject.id)}
                                    style={{ transform: 'scale(1.2)' }}
                                  />
                                </td>
                                <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{subject.subject_code}</td>
                                <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{subject.subject_name}</td>
                                <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{subject.units}</td>
                                <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{subject.prerequisites || "None"}</td>
                                <td style={{ 
                                  padding: '12px', 
                                  border: '1px solid #dee2e6',
                                  color: notAllowed ? '#e74c3c' : '#27ae60',
                                  fontWeight: notAllowed ? 'bold' : 'normal'
                                }}>
                                  {getEligibilityLabel(subject)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div style={{ marginTop: '15px', fontWeight: 'bold' }}>
                        Total Planned Units: {totalPlannedUnits}
                      </div>
                    </div>
                  ) : (
                    <p>No subjects available for this semester.</p>
                  )}
                </div>

                <h3 style={{ color: '#34495e', marginBottom: '15px' }}>Section Selection</h3>
                <p style={{ marginBottom: '15px', color: '#666' }}>
                  Select one section for each planned subject. The system will automatically prevent scheduling conflicts and enforce capacity limits.
                </p>

                {plannedSubjectIds.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                    {subjectsForAdvising
                      .filter(subject => plannedSubjectIds.includes(subject.id))
                      .map(subject => (
                        <div key={subject.id} style={{ 
                          padding: '20px', 
                          border: '1px solid #e1e8ed', 
                          borderRadius: '8px',
                          backgroundColor: 'white'
                        }}>
                          <h4 style={{ 
                            color: '#2c3e50', 
                            marginBottom: '15px',
                            paddingBottom: '10px',
                            borderBottom: '2px solid #3498db'
                          }}>
                            {subject.subject_code} - {subject.subject_name} ({subject.units} units)
                          </h4>
                          {renderSectionOptions(subject)}
                        </div>
                      ))}
                    
                    <div style={{ 
                      marginTop: '20px', 
                      padding: '20px',
                      backgroundColor: '#e8f5e8',
                      border: '1px solid #27ae60',
                      borderRadius: '8px'
                    }}>
                      <button 
                        onClick={handleEnrollSections} 
                        disabled={enrolling || Object.keys(selectedSectionsBySubjectId).length === 0}
                        style={{
                          padding: '12px 30px',
                          backgroundColor: enrolling ? '#95a5a6' : 
                                        Object.keys(selectedSectionsBySubjectId).length === 0 ? '#bdc3c7' : '#27ae60',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: (enrolling || Object.keys(selectedSectionsBySubjectId).length === 0) ? 'not-allowed' : 'pointer',
                          fontSize: '16px',
                          fontWeight: 'bold'
                        }}
                      >
                        {enrolling ? 'Enrolling...' : `Enroll in ${Object.keys(selectedSectionsBySubjectId).length} Section(s)`}
                      </button>
                      <p style={{ marginTop: '10px', color: '#2e7d32' }}>
                        {Object.keys(selectedSectionsBySubjectId).length} out of {plannedSubjectIds.length} subjects have sections selected
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '40px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '2px dashed #bdc3c7'
                  }}>
                    <p style={{ color: '#7f8c8d', fontSize: '18px' }}>
                      Please select subjects from the table above to see available sections.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              !sectionsLoading && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '8px'
                }}>
                  <p style={{ color: '#856404', fontSize: '16px' }}>
                    No sections available for {selectedStudent?.program_enrolled} - Year {selectedStudent?.year_level} in {advisingSchoolYear} {advisingSemester} Semester.
                  </p>
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* GRADES & HISTORY TAB */}
      {activeTab === "grades" && selectedStudent && (
        <section>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            border: '1px solid #e1e8ed'
          }}>
            <h2 style={{ color: '#34495e', marginBottom: '20px' }}>Grades & History</h2>

            {gradesLoading && <p>Loading grades...</p>}
            {gradesError && (
              <div style={{ 
                color: "#e74c3c", 
                backgroundColor: '#fdf2f2',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #e74c3c',
                marginBottom: '15px'
              }}>
                {gradesError}
              </div>
            )}

            {grades && grades.length > 0 ? (
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#e9ecef' }}>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Subject</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Year Level</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Section</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Units</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Grade</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((g) => (
                      <tr key={g.id}>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{g.subject}</td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{g.year_level}</td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{g.status}</td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{g.section}</td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{g.units}</td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          <input
                            type="text"
                            value={g.grade || ""}
                            onChange={(e) =>
                              handleGradeChange(g.id, "grade", e.target.value)
                            }
                            style={{ 
                              width: '60px', 
                              padding: '4px', 
                              border: '1px solid #ddd', 
                              borderRadius: '2px' 
                            }}
                          />
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          <input
                            type="text"
                            value={g.remarks || ""}
                            onChange={(e) =>
                              handleGradeChange(g.id, "remarks", e.target.value)
                            }
                            style={{ 
                              width: '120px', 
                              padding: '4px', 
                              border: '1px solid #ddd', 
                              borderRadius: '2px' 
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '15px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px'
                }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    Overall GWA:{" "}
                    {overallGwa !== null ? overallGwa.toFixed(2) : "--"}
                  </div>

                  <button 
                    onClick={handleSaveGrades} 
                    disabled={savingGrades}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: savingGrades ? '#95a5a6' : '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: savingGrades ? 'not-allowed' : 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    {savingGrades ? 'Saving...' : 'Save Grades'}
                  </button>
                </div>
              </div>
            ) : (
              !gradesLoading && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  <p style={{ color: '#7f8c8d' }}>No grades found for this student.</p>
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* SUMMARY TAB */}
      {activeTab === "summary" && selectedStudent && (
        <section>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            border: '1px solid #e1e8ed'
          }}>
            <h2 style={{ color: '#34495e', marginBottom: '20px' }}>Enrollment Summary</h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{ 
                padding: '20px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '6px',
                border: '1px solid #e1e8ed'
              }}>
                <h3 style={{ color: '#34495e', marginBottom: '15px' }}>Student Information</h3>
                <p><strong>Name:</strong> {getFullName(selectedStudent)}</p>
                <p><strong>Student Number:</strong> {selectedStudent.student_number}</p>
                <p><strong>Email:</strong> {selectedStudent.institutional_email}</p>
                <p><strong>Program:</strong> {selectedStudent.program_enrolled}</p>
                <p><strong>Year Level:</strong> {selectedStudent.year_level}</p>
                <p><strong>Student Type:</strong> 
                  <span style={{ 
                    color: getStudentStatusLabel(selectedStudent) === 'regular' ? '#27ae60' : '#e67e22',
                    fontWeight: 'bold',
                    marginLeft: '5px'
                  }}>
                    {getStudentStatusLabel(selectedStudent).toUpperCase()}
                  </span>
                </p>
                <p><strong>Enrollment Status:</strong> 
                  <span style={{ 
                    color: selectedStudent.enrollment_status === 'active' ? '#27ae60' : '#e74c3c',
                    fontWeight: 'bold',
                    marginLeft: '5px'
                  }}>
                    {selectedStudent.enrollment_status?.toUpperCase() || 'ACTIVE'}
                  </span>
                </p>
              </div>

              <div style={{ 
                padding: '20px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '6px',
                border: '1px solid #e1e8ed'
              }}>
                <h3 style={{ color: '#34495e', marginBottom: '15px' }}>Academic Information</h3>
                <p><strong>School Year:</strong> {advisingSchoolYear}</p>
                <p><strong>Semester:</strong> {advisingSemester}</p>
                <p><strong>Total Planned Units:</strong> {totalPlannedUnits}</p>
                <p><strong>Overall GWA:</strong> {overallGwa !== null ? overallGwa.toFixed(2) : "--"}</p>
                <p><strong>Subjects Planned:</strong> {plannedSubjectIds.length}</p>
                <p><strong>Sections Assigned:</strong> {Object.keys(selectedSectionsBySubjectId).length}</p>
              </div>
            </div>

            <h3 style={{ color: '#34495e', marginBottom: '15px' }}>Planned Subjects & Sections</h3>
            {plannedSubjectIds.length > 0 ? (
              <div>
                {subjectsForAdvising
                  .filter((s) => plannedSubjectIds.includes(s.id))
                  .map((s) => {
                    const secId = selectedSectionsBySubjectId[s.id];
                    const sec = availableSections.find((x) => x.id === secId);
                    const hasConflict = conflictWarnings[s.id];
                    
                    return (
                      <div key={s.id} style={{ 
                        marginBottom: '15px',
                        padding: '15px',
                        border: hasConflict ? '2px solid #e74c3c' : secId ? '2px solid #27ae60' : '1px solid #e1e8ed',
                        backgroundColor: hasConflict ? '#fdf2f2' : secId ? '#e8f5e8' : '#f8f9fa',
                        borderRadius: '6px'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'flex-start'
                        }}>
                          <div>
                            <strong style={{ 
                              color: hasConflict ? '#e74c3c' : secId ? '#2e7d32' : '#2c3e50',
                              fontSize: '16px'
                            }}>
                              {s.subject_code} - {s.subject_name} ({s.units} units)
                            </strong>
                            {sec && (
                              <div style={{ marginTop: '8px' }}>
                                <div>
                                  <strong>Section:</strong> {sec.section_code}
                                </div>
                                {sec.section_schedules && sec.section_schedules.map(schedule => (
                                  <div key={`summary-schedule-${schedule.id}`} style={{ fontSize: '14px', color: '#666' }}>
                                    📅 {schedule.schedule_days} | 🕒 {schedule.schedule_time} | 🏫 {schedule.room}
                                  </div>
                                ))}
                              </div>
                            )}
                            {!secId && (
                              <div style={{ marginTop: '8px', color: '#e67e22' }}>
                                ⚠️ No section selected
                              </div>
                            )}
                          </div>
                          <div>
                            {hasConflict ? (
                              <span style={{ 
                                color: '#e74c3c', 
                                fontWeight: 'bold',
                                fontSize: '14px'
                              }}>
                                ⚠️ CONFLICT
                              </span>
                            ) : secId ? (
                              <span style={{ 
                                color: '#27ae60', 
                                fontWeight: 'bold',
                                fontSize: '14px'
                              }}>
                                ✓ ENROLLED
                              </span>
                            ) : (
                              <span style={{ 
                                color: '#f39c12', 
                                fontWeight: 'bold',
                                fontSize: '14px'
                              }}>
                                ⚠️ PENDING
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {Object.keys(conflictWarnings).length > 0 && (
                  <div style={{
                    border: '2px solid #e74c3c',
                    backgroundColor: '#fdf2f2',
                    padding: '15px',
                    marginTop: '20px',
                    borderRadius: '6px'
                  }}>
                    <h4 style={{ color: '#e74c3c', margin: '0 0 10px 0' }}>
                      ⚠️ Schedule Conflicts Detected
                    </h4>
                    <p style={{ margin: '0', color: '#c0392b' }}>
                      Some subjects have scheduling conflicts. Please resolve them in the Plan Subjects tab before finalizing enrollment.
                    </p>
                  </div>
                )}

                {Object.keys(selectedSectionsBySubjectId).length === plannedSubjectIds.length && 
                 Object.keys(conflictWarnings).length === 0 && (
                  <div style={{
                    border: '2px solid #27ae60',
                    backgroundColor: '#e8f5e8',
                    padding: '15px',
                    marginTop: '20px',
                    borderRadius: '6px'
                  }}>
                    <h4 style={{ color: '#27ae60', margin: '0 0 10px 0' }}>
                      ✓ Ready for Enrollment
                    </h4>
                    <p style={{ margin: '0', color: '#2e7d32' }}>
                      All subjects have conflict-free section assignments. You can proceed with enrollment in the Plan Subjects tab.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <p style={{ color: '#7f8c8d' }}>No subjects planned for this semester.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {!selectedStudent && activeTab !== "plan" && (
        <section>
          <div style={{ 
            textAlign: 'center', 
            padding: '60px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e1e8ed'
          }}>
            <h3 style={{ color: '#7f8c8d', marginBottom: '15px' }}>No Student Selected</h3>
            <p style={{ color: '#95a5a6' }}>
              Please select a student from the list above to begin the advising process.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}