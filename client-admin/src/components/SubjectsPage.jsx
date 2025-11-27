import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import './SubjectPage.css'; // Import the CSS file

const SubjectsPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');

  const [saving, setSaving] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  // Courses list
  const courses = [
    { id: 'bsit', name: 'BS Information Technology' },
    { id: 'ccs', name: 'Certificate of Computer Science' },
    { id: 'bsoa', name: 'BS Office Administration' },
    { id: 'coa', name: 'Certificate of Administration' }
  ];

  const semesters = ['1st', '2nd', 'Summer'];
  const yearLevels = [
    { value: '1', label: '1st Year' },
    { value: '2', label: '2nd Year' },
    { value: '3', label: '3rd Year' },
    { value: '4', label: '4th Year' }
  ];

  // Form state
  const [form, setForm] = useState({
    subject_code: '',
    subject_name: '',
    description: '',
    units: '',
    course: '',
    year_level: '',
    semester: '1st',
    lec_hours: '',
    lab_hours: '',
    prerequisites: '',
    corequisites: ''
  });

  // Load subjects
  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('course', { ascending: true })
        .order('year_level', { ascending: true })
        .order('semester', { ascending: true })
        .order('subject_code', { ascending: true });

      if (error) throw error;
      setSubjects(data || []);
    } catch (err) {
      console.error('Error loading subjects', err);
      setError(err.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingSubject(null);
    setForm({
      subject_code: '',
      subject_name: '',
      description: '',
      units: '',
      course: '',
      year_level: '',
      semester: '1st',
      lec_hours: '',
      lab_hours: '',
      prerequisites: '',
      corequisites: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const {
      subject_code,
      subject_name,
      description,
      units,
      course,
      year_level,
      semester,
      lec_hours,
      lab_hours,
      prerequisites,
      corequisites
    } = form;

    if (!subject_code.trim() || !subject_name.trim() || !course || !year_level || !semester) {
      alert('Please fill all required fields including Course.');
      return;
    }

    const payload = {
      subject_code: subject_code.trim(),
      subject_name: subject_name.trim(),
      description: description.trim() || null,
      units: units !== '' ? Number(units) : null,
      course: course,
      year_level: Number(year_level),
      semester: semester,
      lec_hours: lec_hours !== '' ? Number(lec_hours) : null,
      lab_hours: lab_hours !== '' ? Number(lab_hours) : null,
      prerequisites: prerequisites.trim() || null,
      corequisites: corequisites.trim() || null,
    };

    try {
      setSaving(true);

      if (editingSubject) {
        const { data, error } = await supabase
          .from('subjects')
          .update(payload)
          .eq('id', editingSubject.id)
          .select()
          .single();

        if (error) throw error;
        setSubjects((prev) => prev.map((s) => (s.id === editingSubject.id ? data : s)));
        resetForm();
        alert('Subject updated successfully.');
      } else {
        const { data, error } = await supabase
          .from('subjects')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        setSubjects((prev) => [...prev, data]);
        resetForm();
        alert('Subject added successfully.');
      }
    } catch (err) {
      console.error('Error saving subject', err);
      alert(err.message || 'Failed to save subject');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setForm({
      subject_code: subject.subject_code || '',
      subject_name: subject.subject_name || '',
      description: subject.description || '',
      units: subject.units?.toString() || '',
      course: subject.course || '',
      year_level: subject.year_level?.toString() || '',
      semester: subject.semester || '1st',
      lec_hours: subject.lec_hours?.toString() || '',
      lab_hours: subject.lab_hours?.toString() || '',
      prerequisites: subject.prerequisites || '',
      corequisites: subject.corequisites || ''
    });

    document.getElementById('subject-form').scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = async (subject) => {
    const confirm = window.confirm(
      `Delete subject ${subject.subject_code} - ${subject.subject_name}?`
    );
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subject.id);

      if (error) throw error;
      setSubjects((prev) => prev.filter((s) => s.id !== subject.id));
    } catch (err) {
      console.error('Error deleting subject', err);
      alert(err.message || 'Failed to delete subject');
    }
  };

  // Filtered subjects
  const filteredSubjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return subjects.filter((s) => {
      if (!courseFilter) return false;
      if (s.course !== courseFilter) return false;

      if (
        term &&
        !(
          s.subject_code?.toLowerCase().includes(term) ||
          s.subject_name?.toLowerCase().includes(term) ||
          s.description?.toLowerCase().includes(term)
        )
      ) {
        return false;
      }

      if (yearFilter !== 'all' && s.year_level.toString() !== yearFilter) {
        return false;
      }

      if (semesterFilter !== 'all' && s.semester !== semesterFilter) {
        return false;
      }

      return true;
    });
  }, [subjects, searchTerm, courseFilter, yearFilter, semesterFilter]);

  // Group subjects
  const groupedSubjects = useMemo(() => {
    const grouped = {};
    
    filteredSubjects.forEach(subject => {
      const key = `${subject.year_level}-${subject.semester}`;
      if (!grouped[key]) {
        grouped[key] = {
          year_level: subject.year_level,
          semester: subject.semester,
          subjects: []
        };
      }
      grouped[key].subjects.push(subject);
    });

    return Object.values(grouped).sort((a, b) => {
      const yearOrder = yearLevels.map(y => y.value);
      const semOrder = semesters;
      
      const yearCompare = yearOrder.indexOf(a.year_level.toString()) - yearOrder.indexOf(b.year_level.toString());
      if (yearCompare !== 0) return yearCompare;
      
      return semOrder.indexOf(a.semester) - semOrder.indexOf(b.semester);
    });
  }, [filteredSubjects]);

  const calculateGroupTotals = (subjects) => {
    return subjects.reduce((totals, subject) => {
      totals.units += Number(subject.units) || 0;
      totals.lec_hours += Number(subject.lec_hours) || 0;
      totals.lab_hours += Number(subject.lab_hours) || 0;
      totals.total_hours = totals.lec_hours + totals.lab_hours;
      totals.subject_count = subjects.length;
      return totals;
    }, { units: 0, lec_hours: 0, lab_hours: 0, total_hours: 0, subject_count: 0 });
  };

  const selectedCourseName = courses.find(c => c.id === courseFilter)?.name || '';

  return (
    <div className="dashboard-card" style={{ marginTop: '0.5rem' }}>
      <div className="card-header">
        <h3>Subjects Masterlist</h3>
        <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
          Select a course to view and manage subjects
        </span>
      </div>

      {error && (
        <div className="error-message" style={{ margin: '1rem' }}>
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      <div id="subject-form" className="dashboard-card micro" style={{ margin: '1.5rem' }}>
        <div className="card-header micro">
          <h3>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</h3>
          {editingSubject && (
            <button
              type="button"
              className="btn micro btn-secondary"
              onClick={resetForm}
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Subject Code *</label>
              <input
                name="subject_code"
                type="text"
                className="event-input micro"
                placeholder="e.g. CC 101"
                value={form.subject_code}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="form-label">Subject Name *</label>
              <input
                name="subject_name"
                type="text"
                className="event-input micro"
                placeholder="e.g. IT Fundamentals"
                value={form.subject_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Description (optional)</label>
            <textarea
              name="description"
              className="event-input micro"
              style={{ minHeight: '100px', resize: 'vertical' }}
              placeholder="Short description of the subject..."
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Course *</label>
              <select
                name="course"
                className="status-select"
                value={form.course}
                onChange={handleChange}
                required
              >
                <option value="">Select Course</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Year Level *</label>
              <select
                name="year_level"
                className="status-select"
                value={form.year_level}
                onChange={handleChange}
                required
              >
                <option value="">Select Year</option>
                {yearLevels.map(year => (
                  <option key={year.value} value={year.value}>{year.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Semester *</label>
              <select
                name="semester"
                className="status-select"
                value={form.semester}
                onChange={handleChange}
                required
              >
                {semesters.map(sem => (
                  <option key={sem} value={sem}>{sem} Sem</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Units *</label>
              <input
                name="units"
                type="number"
                min="0"
                step="1"
                className="event-input micro"
                placeholder="e.g. 3"
                value={form.units}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">LEC Hours</label>
              <input
                name="lec_hours"
                type="number"
                min="0"
                step="1"
                className="event-input micro"
                placeholder="e.g. 2"
                value={form.lec_hours}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="form-label">LAB Hours</label>
              <input
                name="lab_hours"
                type="number"
                min="0"
                step="1"
                className="event-input micro"
                placeholder="e.g. 1"
                value={form.lab_hours}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="form-label">Prerequisites</label>
              <input
                name="prerequisites"
                type="text"
                className="event-input micro"
                placeholder="e.g. CC 102"
                value={form.prerequisites}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="form-label">Corequisites</label>
              <input
                name="corequisites"
                type="text"
                className="event-input micro"
                placeholder="e.g. CC 103"
                value={form.corequisites}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <button type="submit" className="btn micro btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingSubject ? 'Update Subject' : 'Add Subject'}
            </button>
          </div>
        </form>
      </div>

      {/* Course Selection */}
      <div className="dashboard-card micro" style={{ margin: '1.5rem' }}>
        <div className="card-header micro">
          <h4>Select Course</h4>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="status-filter"
            style={{ width: '100%', maxWidth: '500px' }}
          >
            <option value="">Choose a course to view subjects...</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Welcome Message */}
      {!courseFilter && !loading && (
        <div className="dashboard-card micro welcome-message" style={{ margin: '1.5rem' }}>
          <div className="emoji-large">📚</div>
          <h3>Welcome to Subjects Management</h3>
          <p>Select a course from the dropdown above to view and manage subjects.</p>
        </div>
      )}

      {/* Filters */}
      {courseFilter && (
        <div className="dashboard-controls" style={{ margin: '0 1.5rem 1rem 1.5rem' }}>
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder={`Search subjects in ${selectedCourseName}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-controls">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="status-filter"
            >
              <option value="all">All Year Levels</option>
              {yearLevels.map(year => (
                <option key={year.value} value={year.value}>{year.label}</option>
              ))}
            </select>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="status-filter"
            >
              <option value="all">All Semesters</option>
              {semesters.map(sem => (
                <option key={sem} value={sem}>{sem} Sem</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Subjects Display */}
      {courseFilter && (
        <div style={{ margin: '0 1.5rem 1.5rem 1.5rem' }}>
          {loading ? (
            <div className="no-data">Loading subjects...</div>
          ) : groupedSubjects.length === 0 ? (
            <div className="dashboard-card micro" style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="emoji-medium">📝</div>
              <h4>No Subjects Found</h4>
              <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
                {searchTerm || yearFilter !== 'all' || semesterFilter !== 'all' 
                  ? 'No subjects match your current filters.'
                  : `No subjects found for ${selectedCourseName}.`
                }
              </p>
              {(searchTerm || yearFilter !== 'all' || semesterFilter !== 'all') && (
                <button
                  type="button"
                  className="btn micro btn-secondary"
                  onClick={() => {
                    setSearchTerm('');
                    setYearFilter('all');
                    setSemesterFilter('all');
                  }}
                  style={{ marginTop: '1.5rem' }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div>
              <div className="dashboard-card micro course-header-accent" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header micro">
                  <h3 style={{ margin: 0, color: '#1a5632' }}>{selectedCourseName}</h3>
                  <span style={{ fontSize: '1rem', color: '#4b5563' }}>
                    {filteredSubjects.length} subjects total
                  </span>
                </div>
              </div>

              {groupedSubjects.map((group, index) => {
                const totals = calculateGroupTotals(group.subjects);
                const yearLabel = yearLevels.find(y => y.value === group.year_level.toString())?.label || `${group.year_level} Year`;
                
                return (
                  <div key={index} className="dashboard-card micro" style={{ marginBottom: '2rem' }}>
                    <div className="card-header micro group-header">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                        <div>
                          <h4 style={{ margin: 0 }}>{yearLabel} - {group.semester} Semester</h4>
                          <span style={{ fontSize: '0.9rem', color: '#4b5563' }}>
                            {totals.subject_count} subjects • {totals.units} units
                          </span>
                        </div>
                        <div className="units-display">{totals.units} Units</div>
                      </div>
                    </div>

                    <div className="applications-table-container">
                      <table className="applications-table">
                        <thead>
                          <tr>
                            <th>Code</th>
                            <th>Subject Name</th>
                            <th>Units</th>
                            <th>LEC</th>
                            <th>LAB</th>
                            <th>Prerequisites</th>
                            <th style={{ width: '140px' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.subjects.map((subject) => (
                            <tr key={subject.id}>
                              <td><strong>{subject.subject_code}</strong></td>
                              <td>
                                <div>
                                  <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{subject.subject_name}</div>
                                  {subject.description && (
                                    <div style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                      {subject.description}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td style={{ fontWeight: '600' }}>{subject.units || '—'}</td>
                              <td>{subject.lec_hours ?? '—'}</td>
                              <td>{subject.lab_hours ?? '—'}</td>
                              <td>
                                <span style={{ fontSize: '0.9rem', color: subject.prerequisites ? '#dc2626' : '#6b7280' }}>
                                  {subject.prerequisites || 'None'}
                                </span>
                              </td>
                              <td>
                                <div className="action-buttons">
                                  <button type="button" className="btn-icon" onClick={() => handleEdit(subject)}>
                                    ✏️
                                  </button>
                                  <button type="button" className="btn-icon btn-delete" onClick={() => handleDelete(subject)}>
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubjectsPage;