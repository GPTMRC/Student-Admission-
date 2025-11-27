// src/components/StudentAdvisingPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
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

  try {
    const [start1, end1] = parseTime(time1);
    const [start2, end2] = parseTime(time2);

    return start1 < end2 && start2 < end1;
  } catch (error) {
    console.error('Error parsing time:', error);
    return false;
  }
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
  const [advisingSchoolYear, setAdvisingSchoolYear] = useState("2024-2025");
  const [advisingSemester, setAdvisingSemester] = useState("1st");
  const [subjectsForAdvising, setSubjectsForAdvising] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState("");
  const [plannedSubjectIds, setPlannedSubjectIds] = useState([]);

  // Sections state
  const [availableSections, setAvailableSections] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [sectionEnrollments, setSectionEnrollments] = useState({});

  // Subjects view state
  const [subjectsView, setSubjectsView] = useState([]);
  const [subjectsViewLoading, setSubjectsViewLoading] = useState(false);
  const [subjectsViewError, setSubjectsViewError] = useState("");

  // Current enrollments from student_sections
  const [currentEnrollments, setCurrentEnrollments] = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);

  // Grades state
  const [grades, setGrades] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [gradesError, setGradesError] = useState("");
  const [savingGrades, setSavingGrades] = useState(false);
  const [editingGrades, setEditingGrades] = useState({});

  // Add grade state
  const [addingGrade, setAddingGrade] = useState(false);
  const [newGradeData, setNewGradeData] = useState({
    subject_code: "",
    subject_name: "",
    units: 0,
    section: "",
    year_level: "",
    semester: "",
    school_year: "",
    grade: "",
    remarks: ""
  });

  // Section selection state
  const [selectedSectionsBySubjectId, setSelectedSectionsBySubjectId] = useState({});
  const [conflictWarnings, setConflictWarnings] = useState({});
  const [savingToStudentSections, setSavingToStudentSections] = useState(false);

  // Single section selection state
  const [selectedSectionForAll, setSelectedSectionForAll] = useState("");

  // NEW: State for newly enrolled subject highlighting
  const [newlyEnrolledSubject, setNewlyEnrolledSubject] = useState(null);

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
    if (!searchTerm.trim()) {
      setSearchError("Please enter a search term");
      return;
    }

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
    setSelectedSectionForAll("");
    setCurrentEnrollments([]);
    setNewlyEnrolledSubject(null);

    try {
      const { data, error } = await supabase
        .from("institutional_students")
        .select("*")
        .or(`student_number.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`);

      if (error) {
        setSearchError(`Search error: ${error.message}`);
      } else if (data && data.length === 1) {
        setSelectedStudent(data[0]);
      } else if (data && data.length > 1) {
        setSearchResults(data);
      } else {
        setSearchError("No students found matching your search.");
      }
    } catch (err) {
      console.error("Search error:", err);
      setSearchError("Unexpected error while searching.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectStudent = useCallback((s) => {
    setSelectedStudent(s);
    setSearchResults([]);
    setSubjectsForAdvising([]);
    setPlannedSubjectIds([]);
    setGrades([]);
    setGradesError("");
    setSelectedSectionsBySubjectId({});
    setConflictWarnings({});
    setSelectedSectionForAll("");
    setCurrentEnrollments([]);
    setNewlyEnrolledSubject(null);
  }, []);

  // ---------------------------
  // LOAD CURRENT ENROLLMENTS FROM STUDENT_SECTIONS
  // ---------------------------
  useEffect(() => {
    const loadCurrentEnrollments = async () => {
      if (!selectedStudent) return;

      setEnrollmentsLoading(true);
      try {
        const { data, error } = await supabase
          .from("student_sections")
          .select(`
            *,
            sections (
              section_code,
              section_schedules (
                schedule_days,
                schedule_time,
                room
              )
            ),
            subjects:subject_code (
              subject_name,
              units,
              year_level,
              semester
            )
          `)
          .eq("student_number", selectedStudent.student_number)
          .eq("school_year", advisingSchoolYear)
          .eq("semester", advisingSemester);

        if (error) {
          console.error("Error loading current enrollments:", error);
        } else {
          setCurrentEnrollments(data || []);
        }
      } catch (error) {
        console.error("Error loading enrollments:", error);
      } finally {
        setEnrollmentsLoading(false);
      }
    };

    loadCurrentEnrollments();
  }, [selectedStudent, advisingSchoolYear, advisingSemester]);

  // ---------------------------
  // LOAD GRADES FROM GRADE_ADVISING
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
          .eq("student_number", selectedStudent.student_number)
          .order("school_year", { ascending: false })
          .order("semester", { ascending: false });

        if (error) {
          setGradesError(`Error loading grades: ${error.message}`);
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

    // Validation
    if (!editingStudent.first_name?.trim() || !editingStudent.last_name?.trim() || !editingStudent.institutional_email?.trim()) {
      alert("Please fill in all required fields (First Name, Last Name, and Email)");
      return;
    }

    setSavingStudent(true);
    try {
      const { error } = await supabase
        .from("institutional_students")
        .update({
          first_name: editingStudent.first_name.trim(),
          middle_name: editingStudent.middle_name?.trim(),
          last_name: editingStudent.last_name.trim(),
          institutional_email: editingStudent.institutional_email.trim(),
          program_enrolled: editingStudent.program_enrolled,
          year_level: editingStudent.year_level,
          student_status: editingStudent.student_status,
          enrollment_status: editingStudent.enrollment_status,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingStudent.id);

      if (error) {
        console.error("Error updating student:", error);
        alert(`Error updating student: ${error.message}`);
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
      alert(`Error saving student: ${error.message}`);
    } finally {
      setSavingStudent(false);
    }
  };

  // ---------------------------
  // LOAD SUBJECTS FOR PLANNING
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
          setSubjectsError(`Error loading subjects: ${error.message}`);
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
  // LOAD SUBJECTS VIEW
  // ---------------------------
  useEffect(() => {
    const loadSubjectsView = async () => {
      setSubjectsViewLoading(true);
      setSubjectsViewError("");
      try {
        const { data, error } = await supabase
          .from("subjects")
          .select("*")
          .order("course", { ascending: true })
          .order("year_level", { ascending: true })
          .order("semester", { ascending: true });

        if (error) {
          setSubjectsViewError(`Error loading subjects: ${error.message}`);
        } else {
          setSubjectsView(data || []);
        }
      } catch (err) {
        console.error("Error loading subjects view:", err);
        setSubjectsViewError("Unexpected error while loading subjects.");
      } finally {
        setSubjectsViewLoading(false);
      }
    };

    loadSubjectsView();
  }, []);

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

        // Load all sections for the current school year and semester
        const { data: sectionsData, error: sectionsError } = await supabase
          .from("sections")
          .select(`
            *,
            section_schedules (*)
          `)
          .eq("school_year", advisingSchoolYear)
          .eq("semester", advisingSemester);

        if (sectionsError) {
          console.error("Error loading sections:", sectionsError);
          setAvailableSections([]);
          return;
        }

        // Filter sections
        let filteredSections = sectionsData || [];
        
        if (courseCode && yearLevelNumber !== null) {
          filteredSections = filteredSections.filter(section => {
            const sectionCourse = section.course ? section.course.toLowerCase() : null;
            const sectionYearLevel = section.year_level;
            
            const courseMatch = !sectionCourse || sectionCourse === courseCode.toLowerCase();
            const yearLevelMatch = !sectionYearLevel || sectionYearLevel === yearLevelNumber;
            
            return courseMatch && yearLevelMatch;
          });
        }

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
  // PRE-REQ ELIGIBILITY
  // ---------------------------
  const passedSubjects = useMemo(() => {
    const set = new Set();
    grades.forEach((g) => {
      const code = normalizeCode(g.subject_code);
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
  const getSectionCapacityStatus = useCallback((sectionId) => {
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
  }, [availableSections, sectionEnrollments]);

  const checkSectionConflicts = useCallback((candidateSectionId, currentSubjectId) => {
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
  }, [availableSections, selectedSectionsBySubjectId]);

  // ---------------------------
  // SECTION SELECTION
  // ---------------------------
  const handleSelectSectionForSubject = useCallback((subjectId, sectionId) => {
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
  }, [subjectsForAdvising, availableSections, getSectionCapacityStatus, selectedStudent, checkSectionConflicts]);

  // ---------------------------
  // SINGLE SECTION SELECTION FOR ALL SUBJECTS
  // ---------------------------
  const handleSelectSectionForAll = useCallback((sectionId) => {
    if (!sectionId) {
      setSelectedSectionForAll("");
      setSelectedSectionsBySubjectId({});
      setConflictWarnings({});
      return;
    }

    const section = availableSections.find(s => s.id === sectionId);
    if (!section) return;

    const capacity = getSectionCapacityStatus(sectionId);
    const studentType = getStudentStatusLabel(selectedStudent);
    
    if (studentType === 'regular' && capacity.fullForRegular) {
      alert(`Section is full for regular students. (${capacity.regular}/${section.max_regular || 35})`);
      setSelectedSectionForAll("");
      return;
    }
    
    if (studentType === 'irregular' && capacity.fullForIrregular) {
      alert(`Section is full for irregular students. (${capacity.irregular}/${section.max_irregular || 5})`);
      setSelectedSectionForAll("");
      return;
    }

    if (capacity.totalFull) {
      alert(`Section is completely full. (${capacity.total}/${(section.max_regular || 35) + (section.max_irregular || 5)})`);
      setSelectedSectionForAll("");
      return;
    }

    // Check for conflicts with the selected section
    const conflicts = [];
    plannedSubjectIds.forEach(subjectId => {
      const conflictCheck = checkSectionConflicts(sectionId, subjectId);
      if (conflictCheck.hasConflict) {
        conflicts.push(...conflictCheck.conflicts);
      }
    });

    if (conflicts.length > 0) {
      const conflictMessages = conflicts.map(conflict => 
        `Time conflict with ${conflict.withSubject} (${conflict.withSection}) on ${conflict.days} at ${conflict.time}`
      );
      
      alert(`Schedule conflicts detected:\n${conflictMessages.join('\n')}`);
      setSelectedSectionForAll("");
      return;
    }

    setSelectedSectionForAll(sectionId);

    // Assign this section to all planned subjects
    const newSectionAssignments = {};
    plannedSubjectIds.forEach(subjectId => {
      newSectionAssignments[subjectId] = sectionId;
    });

    setSelectedSectionsBySubjectId(newSectionAssignments);
    setConflictWarnings({});
  }, [availableSections, getSectionCapacityStatus, selectedStudent, checkSectionConflicts, plannedSubjectIds]);

  // ---------------------------
  // SAVE TO STUDENT_SECTIONS TABLE - ENHANCED WITH AUTO-GRADE INSERTION
  // ---------------------------
  const handleSaveToStudentSections = async () => {
    if (!selectedStudent) {
      alert("Please select a student first.");
      return;
    }

    if (Object.keys(selectedSectionsBySubjectId).length === 0) {
      alert("Please select sections for planned subjects first.");
      return;
    }

    setSavingToStudentSections(true);

    try {
      const studentSectionsData = [];
      const gradeAdvisingData = [];
      const studentType = getStudentStatusLabel(selectedStudent);

      for (const [subjectId, sectionId] of Object.entries(selectedSectionsBySubjectId)) {
        const subject = subjectsForAdvising.find(s => 
          s.id.toString() === subjectId.toString() || 
          s.id === Number(subjectId) || 
          s.id === subjectId
        );
        const section = availableSections.find(s => s.id === sectionId);

        if (subject && section) {
          // Prepare enrollment data for student_sections
          const enrollmentData = {
            section_id: sectionId,
            subject_code: subject.subject_code,
            student_type: studentType,
            school_year: advisingSchoolYear,
            semester: advisingSemester,
            student_number: selectedStudent.student_number,
            enrolled_at: new Date().toISOString()
          };

          studentSectionsData.push(enrollmentData);

          // NEW: Prepare grade data for grade_advising
          const gradeData = {
            student_number: selectedStudent.student_number,
            subject_code: subject.subject_code,
            subject_name: subject.subject_name,
            units: subject.units || 0,
            section: section.section_code,
            year_level: subject.year_level,
            semester: advisingSemester,
            school_year: advisingSchoolYear,
            grade: "", // Empty grade for new enrollment
            remarks: "", // Empty remarks
            status: 'enrolled',
            created_at: new Date().toISOString()
          };

          gradeAdvisingData.push(gradeData);
        }
      }

      if (studentSectionsData.length === 0) {
        alert("No valid enrollment data to save.");
        return;
      }

      // Save to student_sections table
      const { data, error } = await supabase
        .from("student_sections")
        .insert(studentSectionsData)
        .select();

      if (error) {
        console.error("Error saving to student_sections:", error);
        
        if (error.code === '23505') {
          alert("Error: Duplicate enrollment detected.");
        } else if (error.code === '23503') {
          alert("Error: Foreign key violation. Please check section and student data.");
        } else {
          alert(`Database Error: ${error.message}`);
        }
      } else {
        // NEW: Automatically insert into grade_advising table
        const { error: gradeError } = await supabase
          .from("grade_advising")
          .insert(gradeAdvisingData);

        if (gradeError) {
          console.error("Error saving to grade_advising:", gradeError);
          alert(`Enrollment saved but grade record creation failed: ${gradeError.message}`);
        } else {
          alert(`✅ Successfully enrolled student in ${studentSectionsData.length} subject(s)!`);
          
          // Set the newly enrolled subject for highlighting
          if (gradeAdvisingData.length > 0) {
            setNewlyEnrolledSubject(gradeAdvisingData[0].subject_code);
          }

          // NEW: Automatically switch to Grades & History tab
          setActiveTab("grades");
        }

        // Update enrollment counts and reload current enrollments
        const updatedEnrollments = { ...sectionEnrollments };
        studentSectionsData.forEach(record => {
          if (updatedEnrollments[record.section_id]) {
            if (record.student_type === 'regular') {
              updatedEnrollments[record.section_id].regular++;
            } else {
              updatedEnrollments[record.section_id].irregular++;
            }
          }
        });
        setSectionEnrollments(updatedEnrollments);

        // Reload current enrollments and grades
        const { data: newEnrollments } = await supabase
          .from("student_sections")
          .select(`
            *,
            sections (
              section_code,
              section_schedules (
                schedule_days,
                schedule_time,
                room
              )
            ),
            subjects:subject_code (
              subject_name,
              units,
              year_level,
              semester
            )
          `)
          .eq("student_number", selectedStudent.student_number)
          .eq("school_year", advisingSchoolYear)
          .eq("semester", advisingSemester);

        setCurrentEnrollments(newEnrollments || []);

        // Reload grades to show the newly inserted records
        const { data: newGrades } = await supabase
          .from("grade_advising")
          .select("*")
          .eq("student_number", selectedStudent.student_number)
          .order("school_year", { ascending: false })
          .order("semester", { ascending: false });

        setGrades(newGrades || []);

        // Clear selections
        setPlannedSubjectIds([]);
        setSelectedSectionsBySubjectId({});
        setSelectedSectionForAll("");
      }

    } catch (error) {
      console.error("Unexpected error:", error);
      alert(`Unexpected error: ${error.message}`);
    } finally {
      setSavingToStudentSections(false);
    }
  };

  // ---------------------------
  // GRADE MANAGEMENT FUNCTIONS - ENHANCED
  // ---------------------------
  const handleInputGrade = (enrollmentId) => {
    const enrollment = currentEnrollments.find(e => e.id === enrollmentId);
    if (enrollment) {
      setEditingGrades(prev => ({
        ...prev,
        [enrollmentId]: { 
          subject_code: enrollment.subject_code,
          subject_name: enrollment.subjects?.subject_name || enrollment.subject_code,
          units: enrollment.subjects?.units || 0,
          section: enrollment.sections?.section_code,
          year_level: enrollment.subjects?.year_level,
          semester: advisingSemester,
          school_year: advisingSchoolYear,
          grade: "",
          remarks: ""
        }
      }));
    }
  };

  const handleCancelEditGrade = (enrollmentId) => {
    setEditingGrades(prev => {
      const newState = { ...prev };
      delete newState[enrollmentId];
      return newState;
    });
  };

  const handleGradeChange = (enrollmentId, field, newValue) => {
    setEditingGrades(prev => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        [field]: newValue
      }
    }));
  };

  // Save grade to grade_advising table
  const handleSaveGrade = async (enrollmentId) => {
    const gradeData = editingGrades[enrollmentId];
    if (!gradeData || !gradeData.grade) {
      alert("Please enter a grade");
      return;
    }

    setSavingGrades(true);
    try {
      const { error } = await supabase
        .from("grade_advising")
        .insert({
          student_number: selectedStudent.student_number,
          subject_code: gradeData.subject_code,
          subject_name: gradeData.subject_name,
          units: gradeData.units,
          section: gradeData.section,
          year_level: gradeData.year_level,
          semester: gradeData.semester,
          school_year: gradeData.school_year,
          grade: gradeData.grade,
          remarks: gradeData.remarks,
          status: 'completed',
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error("Error saving grade:", error);
        alert(`Error saving grade: ${error.message}`);
        return;
      }

      // Reload grades
      const { data: newGrades } = await supabase
        .from("grade_advising")
        .select("*")
        .eq("student_number", selectedStudent.student_number)
        .order("school_year", { ascending: false })
        .order("semester", { ascending: false });

      setGrades(newGrades || []);

      // Clear editing state
      setEditingGrades(prev => {
        const newState = { ...prev };
        delete newState[enrollmentId];
        return newState;
      });

      alert("Grade saved successfully!");

    } catch (error) {
      console.error("Error saving grade:", error);
      alert(`Error saving grade: ${error.message}`);
    } finally {
      setSavingGrades(false);
    }
  };

  // Edit existing grade
  const handleEditExistingGrade = (gradeId) => {
    const grade = grades.find(g => g.id === gradeId);
    if (grade) {
      setEditingGrades(prev => ({
        ...prev,
        [gradeId]: { ...grade }
      }));
    }
  };

  const handleUpdateGrade = async (gradeId) => {
    const editedGrade = editingGrades[gradeId];
    if (!editedGrade) return;

    setSavingGrades(true);
    try {
      const { error } = await supabase
        .from("grade_advising")
        .update({
          grade: editedGrade.grade,
          remarks: editedGrade.remarks,
          status: editedGrade.grade ? 'completed' : 'enrolled',
          updated_at: new Date().toISOString()
        })
        .eq('id', gradeId);

      if (error) {
        console.error("Error updating grade:", error);
        alert(`Error updating grade: ${error.message}`);
        return;
      }

      // Update local state
      setGrades(prev => prev.map(g => 
        g.id === gradeId ? { ...g, ...editedGrade } : g
      ));

      // Clear editing state
      setEditingGrades(prev => {
        const newState = { ...prev };
        delete newState[gradeId];
        return newState;
      });

      alert("Grade updated successfully!");

    } catch (error) {
      console.error("Error updating grade:", error);
      alert(`Error updating grade: ${error.message}`);
    } finally {
      setSavingGrades(false);
    }
  };

  // Add Grade Functions
  const handleAddGrade = () => {
    setAddingGrade(true);
    setNewGradeData({
      subject_code: "",
      subject_name: "",
      units: 0,
      section: "",
      year_level: selectedStudent.year_level,
      semester: advisingSemester,
      school_year: advisingSchoolYear,
      grade: "",
      remarks: ""
    });
  };

  const handleCancelAddGrade = () => {
    setAddingGrade(false);
    setNewGradeData({
      subject_code: "",
      subject_name: "",
      units: 0,
      section: "",
      year_level: "",
      semester: "",
      school_year: "",
      grade: "",
      remarks: ""
    });
  };

  const handleNewGradeChange = (field, value) => {
    setNewGradeData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveNewGrade = async () => {
    if (!newGradeData.subject_code || !newGradeData.grade) {
      alert("Please fill in subject code and grade");
      return;
    }

    setSavingGrades(true);
    try {
      const { error } = await supabase
        .from("grade_advising")
        .insert({
          student_number: selectedStudent.student_number,
          subject_code: newGradeData.subject_code,
          subject_name: newGradeData.subject_name,
          units: newGradeData.units,
          section: newGradeData.section,
          year_level: newGradeData.year_level,
          semester: newGradeData.semester,
          school_year: newGradeData.school_year,
          grade: newGradeData.grade,
          remarks: newGradeData.remarks,
          status: 'completed',
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error("Error adding grade:", error);
        alert(`Error adding grade: ${error.message}`);
        return;
      }

      // Reload grades
      const { data: newGrades } = await supabase
        .from("grade_advising")
        .select("*")
        .eq("student_number", selectedStudent.student_number)
        .order("school_year", { ascending: false })
        .order("semester", { ascending: false });

      setGrades(newGrades || []);
      setAddingGrade(false);
      alert("Grade added successfully!");

    } catch (error) {
      console.error("Error adding grade:", error);
      alert(`Error adding grade: ${error.message}`);
    } finally {
      setSavingGrades(false);
    }
  };

  const overallGwa = useMemo(() => computeGwa(grades), [grades]);

  // ---------------------------
  // RENDER SINGLE SECTION SELECTOR
  // ---------------------------
  const renderSingleSectionSelector = useCallback(() => {
    if (availableSections.length === 0) {
      return <p>No sections available for this course and year level.</p>;
    }

    const studentType = getStudentStatusLabel(selectedStudent);

    return (
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ color: '#2c3e50', marginBottom: '15px' }}>
          Select One Section for All Planned Subjects
        </h4>
        
        <select
          value={selectedSectionForAll}
          onChange={(e) => handleSelectSectionForAll(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '16px',
            backgroundColor: 'white'
          }}
        >
          <option value="">-- Select a Section --</option>
          {availableSections.map((section) => {
            const capacity = getSectionCapacityStatus(section.id);
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
            }

            return (
              <option 
                key={section.id} 
                value={section.id}
                disabled={disabled}
                style={{
                  backgroundColor: disabled ? '#f5f5f5' : 'white',
                  color: disabled ? '#999' : '#333'
                }}
              >
                {section.section_code} - {disabled ? disabledReason : `Regular: ${capacity.regular}/${section.max_regular || 35}, Irregular: ${capacity.irregular}/${section.max_irregular || 5}`}
              </option>
            );
          })}
        </select>

        {selectedSectionForAll && (
          <div style={{ 
            marginTop: '15px',
            padding: '15px',
            backgroundColor: '#e8f5e8',
            border: '1px solid #27ae60',
            borderRadius: '6px'
          }}>
            <h5 style={{ color: '#2e7d32', margin: '0 0 10px 0' }}>
              Selected Section: {availableSections.find(s => s.id === selectedSectionForAll)?.section_code}
            </h5>
            <p style={{ margin: '0', color: '#2e7d32' }}>
              This section will be assigned to all {plannedSubjectIds.length} planned subjects.
            </p>
          </div>
        )}
      </div>
    );
  }, [availableSections, selectedStudent, selectedSectionForAll, getSectionCapacityStatus, handleSelectSectionForAll, plannedSubjectIds]);

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

  // ---------------------------
  // RENDER CURRENT ENROLLMENTS FOR GRADING
  // ---------------------------
  const renderCurrentEnrollmentsForGrading = () => {
    if (enrollmentsLoading) {
      return <div style={{ textAlign: 'center', padding: '20px' }}>Loading current enrollments...</div>;
    }

    if (currentEnrollments.length === 0) {
      return (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <p style={{ color: '#7f8c8d' }}>No current enrollments found for {advisingSchoolYear} {advisingSemester} Semester.</p>
        </div>
      );
    }

    return (
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ color: '#34495e', marginBottom: '15px' }}>Current Enrollments - Input Grades</h3>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '6px'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#e9ecef' }}>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Subject</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Section</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Units</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Schedule</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentEnrollments.map((enrollment) => {
                const isEditing = editingGrades[enrollment.id];
                const hasGrade = grades.some(g => 
                  g.subject_code === enrollment.subject_code && 
                  g.school_year === advisingSchoolYear && 
                  g.semester === advisingSemester
                );

                return (
                  <tr key={enrollment.id}>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      <strong>{enrollment.subject_code}</strong>
                      <br />
                      <small>{enrollment.subjects?.subject_name}</small>
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      {enrollment.sections?.section_code}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      {enrollment.subjects?.units || 0}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      {enrollment.sections?.section_schedules?.map(schedule => (
                        <div key={schedule.id}>
                          {schedule.schedule_days} {schedule.schedule_time} {schedule.room}
                        </div>
                      ))}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <input
                            type="text"
                            placeholder="Grade"
                            value={isEditing.grade || ""}
                            onChange={(e) => handleGradeChange(enrollment.id, "grade", e.target.value)}
                            style={{ 
                              padding: '4px', 
                              border: '1px solid #ddd', 
                              borderRadius: '2px',
                              width: '80px'
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Remarks"
                            value={isEditing.remarks || ""}
                            onChange={(e) => handleGradeChange(enrollment.id, "remarks", e.target.value)}
                            style={{ 
                              padding: '4px', 
                              border: '1px solid #ddd', 
                              borderRadius: '2px',
                              width: '120px'
                            }}
                          />
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button 
                              onClick={() => handleSaveGrade(enrollment.id)}
                              disabled={savingGrades}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: savingGrades ? '#95a5a6' : '#27ae60',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: savingGrades ? 'not-allowed' : 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Save
                            </button>
                            <button 
                              onClick={() => handleCancelEditGrade(enrollment.id)}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#7f8c8d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleInputGrade(enrollment.id)}
                          disabled={hasGrade}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: hasGrade ? '#95a5a6' : '#3498db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: hasGrade ? 'not-allowed' : 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          {hasGrade ? 'Graded' : 'Input Grade'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ---------------------------
  // RENDER ADD GRADE FORM
  // ---------------------------
  const renderAddGradeForm = () => {
    if (!addingGrade) return null;

    return (
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
          maxWidth: '500px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          <h3 style={{ color: '#34495e', marginBottom: '20px' }}>Add New Grade</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Subject Code *
              </label>
              <input
                type="text"
                value={newGradeData.subject_code}
                onChange={(e) => handleNewGradeChange('subject_code', e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px' 
                }}
                placeholder="e.g., CS101"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Subject Name
              </label>
              <input
                type="text"
                value={newGradeData.subject_name}
                onChange={(e) => handleNewGradeChange('subject_name', e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px' 
                }}
                placeholder="e.g., Introduction to Computer Science"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Units
                </label>
                <input
                  type="number"
                  value={newGradeData.units}
                  onChange={(e) => handleNewGradeChange('units', parseInt(e.target.value) || 0)}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                  min="0"
                  max="10"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Grade *
                </label>
                <input
                  type="text"
                  value={newGradeData.grade}
                  onChange={(e) => handleNewGradeChange('grade', e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                  placeholder="e.g., 1.25"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Year Level
                </label>
                <select
                  value={newGradeData.year_level}
                  onChange={(e) => handleNewGradeChange('year_level', e.target.value)}
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
                  Semester
                </label>
                <select
                  value={newGradeData.semester}
                  onChange={(e) => handleNewGradeChange('semester', e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                >
                  <option value="1st">1st</option>
                  <option value="2nd">2nd</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  School Year
                </label>
                <input
                  type="text"
                  value={newGradeData.school_year}
                  onChange={(e) => handleNewGradeChange('school_year', e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                  placeholder="e.g., 2024-2025"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Section
                </label>
                <input
                  type="text"
                  value={newGradeData.section}
                  onChange={(e) => handleNewGradeChange('section', e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px' 
                  }}
                  placeholder="e.g., A"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Remarks
              </label>
              <input
                type="text"
                value={newGradeData.remarks}
                onChange={(e) => handleNewGradeChange('remarks', e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px' 
                }}
                placeholder="Optional remarks"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button 
              onClick={handleCancelAddGrade}
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
              onClick={handleSaveNewGrade}
              disabled={savingGrades}
              style={{
                padding: '10px 20px',
                backgroundColor: savingGrades ? '#95a5a6' : '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: savingGrades ? 'not-allowed' : 'pointer'
              }}
            >
              {savingGrades ? 'Saving...' : 'Save Grade'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------
  // RENDER GRADES HISTORY - ENHANCED WITH HIGHLIGHTING
  // ---------------------------
  const renderGradesHistory = () => {
    if (gradesLoading) {
      return <div style={{ textAlign: 'center', padding: '20px' }}>Loading grades history...</div>;
    }

    if (gradesError) {
      return (
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
      );
    }

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: '#34495e', margin: 0 }}>Grades History</h3>
          <button 
            onClick={handleAddGrade}
            style={{
              padding: '10px 20px',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            + Add Grade
          </button>
        </div>

        {grades.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <p style={{ color: '#7f8c8d' }}>No grade history available.</p>
            <button 
              onClick={handleAddGrade}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Add First Grade
            </button>
          </div>
        ) : (
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '6px'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#e9ecef' }}>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Subject</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Year Level</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Semester</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>School Year</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Section</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Units</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Grade</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Remarks</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((g) => {
                  const isEditing = editingGrades[g.id];
                  const isNewlyEnrolled = newlyEnrolledSubject === g.subject_code && !g.grade;
                  
                  return (
                    <tr key={g.id} style={{ 
                      backgroundColor: isNewlyEnrolled ? '#fff3cd' : 'transparent',
                      border: isNewlyEnrolled ? '2px solid #ffc107' : '1px solid #dee2e6',
                      animation: isNewlyEnrolled ? 'pulse 2s infinite' : 'none'
                    }}>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        <strong>{g.subject_code}</strong>
                        <br />
                        <small>{g.subject_name}</small>
                        {isNewlyEnrolled && (
                          <div style={{ 
                            fontSize: '10px', 
                            color: '#856404', 
                            backgroundColor: '#fff3cd',
                            padding: '2px 4px',
                            borderRadius: '3px',
                            marginTop: '2px'
                          }}>
                            NEW
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{g.year_level}</td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{g.semester}</td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{g.school_year}</td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{g.section}</td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{g.units}</td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={isEditing.grade || ""}
                            onChange={(e) => handleGradeChange(g.id, "grade", e.target.value)}
                            style={{ 
                              width: '60px', 
                              padding: '4px', 
                              border: '1px solid #ddd', 
                              borderRadius: '2px' 
                            }}
                          />
                        ) : (
                          <span style={{ 
                            fontWeight: g.grade ? 'bold' : 'normal',
                            color: g.grade ? '#2c3e50' : '#e74c3c'
                          }}>
                            {g.grade || "Not Set"}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={isEditing.remarks || ""}
                            onChange={(e) => handleGradeChange(g.id, "remarks", e.target.value)}
                            style={{ 
                              width: '120px', 
                              padding: '4px', 
                              border: '1px solid #ddd', 
                              borderRadius: '2px' 
                            }}
                          />
                        ) : (
                          <span style={{ 
                            fontStyle: g.remarks ? 'normal' : 'italic',
                            color: g.remarks ? '#2c3e50' : '#95a5a6'
                          }}>
                            {g.remarks || "No remarks"}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        <span style={{ 
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: g.status === 'completed' ? '#d4edda' : '#fff3cd',
                          color: g.status === 'completed' ? '#155724' : '#856404',
                          border: g.status === 'completed' ? '1px solid #c3e6cb' : '1px solid #ffeaa7'
                        }}>
                          {g.status || 'enrolled'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button 
                              onClick={() => handleUpdateGrade(g.id)}
                              disabled={savingGrades}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: savingGrades ? '#95a5a6' : '#27ae60',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: savingGrades ? 'not-allowed' : 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Update
                            </button>
                            <button 
                              onClick={() => handleCancelEditGrade(g.id)}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#7f8c8d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleEditExistingGrade(g.id)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#3498db',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          marginTop: '20px'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            Overall GWA:{" "}
            {overallGwa !== null ? overallGwa.toFixed(2) : "--"}
          </div>

          <div style={{ fontSize: '14px', color: '#666' }}>
            Total Records: {grades.length}
          </div>
        </div>

        {/* CSS for highlighting animation */}
        <style>
          {`
            @keyframes pulse {
              0% { background-color: #fff3cd; }
              50% { background-color: #ffeaa7; }
              100% { background-color: #fff3cd; }
            }
          `}
        </style>
      </div>
    );
  };

  // ---------------------------
  // RENDER SUBJECTS VIEW
  // ---------------------------
  const renderSubjectsView = () => {
    if (subjectsViewLoading) {
      return <div style={{ textAlign: 'center', padding: '20px' }}>Loading subjects...</div>;
    }

    if (subjectsViewError) {
      return (
        <div style={{ 
          color: "#e74c3c", 
          backgroundColor: '#fdf2f2',
          padding: '10px',
          borderRadius: '4px',
          border: '1px solid #e74c3c',
          marginBottom: '15px'
        }}>
          {subjectsViewError}
        </div>
      );
    }

    // Group subjects by course and semester
    const groupedSubjects = subjectsView.reduce((acc, subject) => {
      const key = `${subject.course}-${subject.year_level}`;
      if (!acc[key]) {
        acc[key] = {
          course: subject.course,
          year_level: subject.year_level,
          semesters: {}
        };
      }
      
      if (!acc[key].semesters[subject.semester]) {
        acc[key].semesters[subject.semester] = [];
      }
      
      acc[key].semesters[subject.semester].push(subject);
      return acc;
    }, {});

    return (
      <div>
        <h3 style={{ color: '#34495e', marginBottom: '20px' }}>All Subjects by Course and Semester</h3>
        
        {Object.values(groupedSubjects).map((group, index) => (
          <div key={`group-${group.course}-${group.year_level}-${index}`} style={{ 
            marginBottom: '30px',
            border: '1px solid #e1e8ed',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              backgroundColor: '#3498db',
              color: 'white',
              padding: '15px 20px',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              {group.course.toUpperCase()} - Year {group.year_level}
            </div>
            
            <div style={{ padding: '20px' }}>
              {Object.entries(group.semesters).map(([semester, subjects]) => (
                <div key={`semester-${semester}-${group.course}-${group.year_level}`} style={{ marginBottom: '25px' }}>
                  <h4 style={{ 
                    color: '#2c3e50', 
                    marginBottom: '15px',
                    paddingBottom: '10px',
                    borderBottom: '2px solid #3498db'
                  }}>
                    {semester} Semester
                  </h4>
                  
                  <div style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '15px', 
                    borderRadius: '6px'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#e9ecef' }}>
                          <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Code</th>
                          <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Name</th>
                          <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Units</th>
                          <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Prerequisites</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.map(subject => (
                          <tr key={`subject-${subject.id}`}>
                            <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                              <strong>{subject.subject_code}</strong>
                            </td>
                            <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                              {subject.subject_name}
                            </td>
                            <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                              {subject.units}
                            </td>
                            <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                              {subject.prerequisites || "None"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ---------------------------
  // RENDER SUMMARY TAB
  // ---------------------------
  const renderSummaryTab = () => {
    return (
      <div>
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
            <p><strong>Current Enrollments:</strong> {currentEnrollments.length}</p>
            <p><strong>Total Planned Units:</strong> {totalPlannedUnits}</p>
            <p><strong>Overall GWA:</strong> {overallGwa !== null ? overallGwa.toFixed(2) : "--"}</p>
            <p><strong>Subjects Planned:</strong> {plannedSubjectIds.length}</p>
            <p><strong>Grades Recorded:</strong> {grades.length}</p>
          </div>
        </div>

        <h3 style={{ color: '#34495e', marginBottom: '15px' }}>Current Enrollments</h3>
        {currentEnrollments.length > 0 ? (
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '6px',
            marginBottom: '30px'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#e9ecef' }}>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Subject</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Section</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Units</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Schedule</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Grade Status</th>
                </tr>
              </thead>
              <tbody>
                {currentEnrollments.map((enrollment) => {
                  const hasGrade = grades.some(g => 
                    g.subject_code === enrollment.subject_code && 
                    g.school_year === advisingSchoolYear && 
                    g.semester === advisingSemester
                  );

                  return (
                    <tr key={enrollment.id}>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        <strong>{enrollment.subject_code}</strong>
                        <br />
                        <small>{enrollment.subjects?.subject_name}</small>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        {enrollment.sections?.section_code}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        {enrollment.subjects?.units || 0}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        {enrollment.sections?.section_schedules?.map(schedule => (
                          <div key={schedule.id}>
                            {schedule.schedule_days} {schedule.schedule_time} {schedule.room}
                          </div>
                        ))}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        <span style={{ 
                          color: hasGrade ? '#27ae60' : '#e67e22',
                          fontWeight: 'bold'
                        }}>
                          {hasGrade ? 'GRADED' : 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '30px'
          }}>
            <p style={{ color: '#7f8c8d' }}>No current enrollments for {advisingSchoolYear} {advisingSemester} Semester.</p>
          </div>
        )}

        <h3 style={{ color: '#34495e', marginBottom: '15px' }}>Planned Subjects</h3>
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
                            ✓ READY
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

        <h3 style={{ color: '#34495e', marginBottom: '15px', marginTop: '30px' }}>Recent Grades</h3>
        {grades.length > 0 ? (
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '6px'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#e9ecef' }}>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Subject</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Semester</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>School Year</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Grade</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {grades.slice(0, 5).map(g => (
                  <tr key={g.id}>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      <strong>{g.subject_code}</strong>
                      <br />
                      <small>{g.subject_name}</small>
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{g.semester}</td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{g.school_year}</td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{g.grade || "-"}</td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{g.remarks || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {grades.length > 5 && (
              <p style={{ marginTop: '10px', color: '#666', textAlign: 'center' }}>
                Showing 5 most recent records out of {grades.length} total grades
              </p>
            )}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px'
          }}>
            <p style={{ color: '#7f8c8d' }}>No grade history available.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="advising-page" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ color: '#2c3e50', marginBottom: '30px' }}>Student Advising Hub - Admin Panel</h1>

      {/* STUDENT MANAGEMENT SECTION */}
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
                            onClick={() => handleSelectStudent(student)}
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
              onClick={() => setActiveTab("subjects")}
              style={{
                padding: '12px 24px',
                backgroundColor: activeTab === "subjects" ? '#3498db' : 'transparent',
                color: activeTab === "subjects" ? 'white' : '#34495e',
                border: 'none',
                borderBottom: activeTab === "subjects" ? '2px solid #3498db' : 'none',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              View Subjects
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

            {subjectsLoading && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p>Loading subjects...</p>
              </div>
            )}

            {subjectsError && (
              <div style={{ 
                color: "#e74c3c", 
                backgroundColor: '#fdf2f2',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #e74c3c',
                marginBottom: '15px'
              }}>
                {subjectsError}
              </div>
            )}

            {subjectsForAdvising.length > 0 ? (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ color: '#34495e', marginBottom: '15px' }}>Available Subjects</h3>
                  
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
                </div>

                {sectionsLoading && (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <p>Loading sections and schedules...</p>
                  </div>
                )}

                {availableSections.length > 0 ? (
                  <div>
                    <h3 style={{ color: '#34495e', marginBottom: '15px' }}>Section Selection</h3>
                    <p style={{ marginBottom: '15px', color: '#666' }}>
                      Select ONE section that will be applied to ALL planned subjects.
                    </p>

                    {plannedSubjectIds.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        {/* SINGLE SECTION SELECTOR FOR ALL SUBJECTS */}
                        {renderSingleSectionSelector()}
                        
                        {/* SINGLE SAVE BUTTON FOR STUDENT_SECTIONS TABLE */}
                        <div style={{ 
                          marginTop: '20px', 
                          padding: '20px',
                          backgroundColor: '#e8f5e8',
                          border: '1px solid #27ae60',
                          borderRadius: '8px'
                        }}>
                          <h4 style={{ color: '#2c3e50', marginBottom: '15px' }}>Save Enrollment</h4>
                          
                          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '15px' }}>
                            <button 
                              onClick={handleSaveToStudentSections} 
                              disabled={savingToStudentSections || Object.keys(selectedSectionsBySubjectId).length === 0}
                              style={{
                                padding: '12px 20px',
                                backgroundColor: savingToStudentSections ? '#95a5a6' : 
                                              Object.keys(selectedSectionsBySubjectId).length === 0 ? '#bdc3c7' : '#27ae60',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: (savingToStudentSections || Object.keys(selectedSectionsBySubjectId).length === 0) ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                minWidth: '200px'
                              }}
                            >
                              {savingToStudentSections ? 'Saving...' : 
                               Object.keys(selectedSectionsBySubjectId).length === 0 ? 'No Sections Selected' : 
                               `Save Enroll (${Object.keys(selectedSectionsBySubjectId).length} subjects)`}
                            </button>
                          </div>
                          
                          {/* STATUS SUMMARY */}
                          <div style={{ 
                            backgroundColor: 'white', 
                            padding: '15px', 
                            borderRadius: '6px',
                            border: '1px solid #ddd'
                          }}>
                            <h5 style={{ color: '#2c3e50', marginBottom: '10px' }}>Current Status:</h5>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60' }}>
                                  {plannedSubjectIds.length}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666' }}>Subjects Planned</div>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>
                                  {Object.keys(selectedSectionsBySubjectId).length}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666' }}>Sections Assigned</div>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9b59b6' }}>
                                  {totalPlannedUnits}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666' }}>Total Units</div>
                              </div>
                            </div>
                          </div>
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
                      <p style={{ color: '#856404', fontSize: '14px', marginTop: '10px' }}>
                        Please check if sections are properly configured in the database.
                      </p>
                    </div>
                  )
                )}
              </div>
            ) : (
              !subjectsLoading && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '8px'
                }}>
                  <p style={{ color: '#856404', fontSize: '16px' }}>
                    No subjects found for {selectedStudent?.program_enrolled} - Year {selectedStudent?.year_level} in {advisingSemester} Semester.
                  </p>
                  <p style={{ color: '#856404', fontSize: '14px', marginTop: '10px' }}>
                    Please check if subjects are properly configured in the database for this program and year level.
                  </p>
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* GRADES & HISTORY TAB - ENHANCED */}
      {activeTab === "grades" && selectedStudent && (
        <section>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            border: '1px solid #e1e8ed'
          }}>
            <h2 style={{ color: '#34495e', marginBottom: '20px' }}>Grades & History</h2>

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

            {/* ADD GRADE MODAL */}
            {renderAddGradeForm()}

            {/* CURRENT ENROLLMENTS FOR GRADING */}
            {renderCurrentEnrollmentsForGrading()}

            {/* GRADES HISTORY */}
            {renderGradesHistory()}
          </div>
        </section>
      )}

      {/* SUBJECTS VIEW TAB */}
      {activeTab === "subjects" && (
        <section>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            border: '1px solid #e1e8ed'
          }}>
            <h2 style={{ color: '#34495e', marginBottom: '20px' }}>Subjects Catalog</h2>
            {renderSubjectsView()}
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
            {renderSummaryTab()}
          </div>
        </section>
      )}

      {!selectedStudent && activeTab !== "plan" && activeTab !== "subjects" && (
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