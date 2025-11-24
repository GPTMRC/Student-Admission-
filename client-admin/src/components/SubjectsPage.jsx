import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';

const SubjectsPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [saving, setSaving] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  // form state
  const [form, setForm] = useState({
    subject_code: '',
    subject_name: '',
    description: '',
    units: '',
    year_level: '',
    semester: '1st',
    allowed_status: 'both',
    section: '',
    available_slot: '',
    lec_hours: '',
    lab_hours: '',
  });

  // --- LOAD SUBJECTS ---
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        setError('');

        const { data, error } = await supabase
          .from('subjects')
          .select('*')
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

    fetchSubjects();
  }, []);

  const resetForm = () => {
    setEditingSubject(null);
    setForm({
      subject_code: '',
      subject_name: '',
      description: '',
      units: '',
      year_level: '',
      semester: '1st',
      allowed_status: 'both',
      section: '',
      available_slot: '',
      lec_hours: '',
      lab_hours: '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --- SUBMIT ADD / UPDATE ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    const {
      subject_code,
      subject_name,
      description,
      units,
      year_level,
      semester,
      allowed_status,
      section,
      available_slot,
      lec_hours,
      lab_hours,
    } = form;

    if (!subject_code.trim() || !subject_name.trim() || !year_level || !semester) {
      alert('Please fill Subject Code, Subject Name, Year Level, and Semester.');
      return;
    }

    const payload = {
      subject_code: subject_code.trim(),
      subject_name: subject_name.trim(),
      description: description.trim() || null,
      units: units !== '' ? Number(units) : null,
      year_level: Number(year_level),
      semester: semester || '1st',
      allowed_status: allowed_status || 'both',
      section: section.trim() || null,
      available_slot: available_slot !== '' ? Number(available_slot) : 0,
      lec_hours: lec_hours !== '' ? Number(lec_hours) : null,
      lab_hours: lab_hours !== '' ? Number(lab_hours) : null,
    };

    try {
      setSaving(true);

      if (editingSubject) {
        // UPDATE
        const { data, error } = await supabase
          .from('subjects')
          .update(payload)
          .eq('id', editingSubject.id)
          .select()
          .single();

        if (error) throw error;

        setSubjects((prev) =>
          prev.map((s) => (s.id === editingSubject.id ? data : s))
        );
        resetForm();
        alert('Subject updated successfully.');
      } else {
        // INSERT
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
      year_level: subject.year_level?.toString() || '',
      semester: subject.semester || '1st',
      allowed_status: subject.allowed_status || 'both',
      section: subject.section || '',
      available_slot:
        subject.available_slot !== null && subject.available_slot !== undefined
          ? subject.available_slot.toString()
          : '',
      lec_hours:
        subject.lec_hours !== null && subject.lec_hours !== undefined
          ? subject.lec_hours.toString()
          : '',
      lab_hours:
        subject.lab_hours !== null && subject.lab_hours !== undefined
          ? subject.lab_hours.toString()
          : '',
    });
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

  // --- FILTERED SUBJECTS LIST ---
  const filteredSubjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return subjects.filter((s) => {
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

      if (yearFilter !== 'all') {
        if (Number(yearFilter) !== Number(s.year_level)) return false;
      }

      if (semesterFilter !== 'all') {
        if (!s.semester) return false;
        const sem = s.semester.toLowerCase();
        if (semesterFilter === '1st' && !sem.includes('1')) return false;
        if (semesterFilter === '2nd' && !sem.includes('2')) return false;
        if (semesterFilter === 'summer' && !sem.includes('summer')) return false;
      }

      if (statusFilter !== 'all') {
        const st = (s.allowed_status || 'both').toLowerCase();
        if (statusFilter === 'regular' && st !== 'regular' && st !== 'both') {
          return false;
        }
        if (statusFilter === 'irregular' && st !== 'irregular' && st !== 'both') {
          return false;
        }
      }

      return true;
    });
  }, [subjects, searchTerm, yearFilter, semesterFilter, statusFilter]);

  return (
    <div className="dashboard-card micro" style={{ marginTop: '0.5rem' }}>
      <div className="card-header micro">
        <h3>Subjects Masterlist</h3>
        <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>
          Manage subjects stored in <strong>subjects</strong> table.
        </span>
      </div>

      {/* ERROR */}
      {error && (
        <div className="no-data" style={{ marginBottom: '0.5rem', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {/* FILTERS */}
      <div
        className="dashboard-controls"
        style={{ marginBottom: '0.5rem', gap: '1rem' }}
      >
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search subject code / name / description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls" style={{ flexWrap: 'wrap' }}>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Year Levels</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>

          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Semesters</option>
            <option value="1st">1st Sem</option>
            <option value="2nd">2nd Sem</option>
            <option value="summer">Summer</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Status (Allowed For)</option>
            <option value="regular">Regular</option>
            <option value="irregular">Irregular / Transferee</option>
          </select>
        </div>
      </div>

      {/* SUBJECTS TABLE */}
      <div className="applications-table-container" style={{ marginBottom: '1rem' }}>
        <table className="applications-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Subject Name</th>
              <th>Year</th>
              <th>Sem</th>
              <th>Units</th>
              <th>LEC</th>
              <th>LAB</th>
              <th>Allowed</th>
              <th>Slots</th>
              <th>Section</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="11" className="no-data">
                  Loading subjects...
                </td>
              </tr>
            ) : filteredSubjects.length === 0 ? (
              <tr>
                <td colSpan="11" className="no-data">
                  No subjects match the filters.
                </td>
              </tr>
            ) : (
              filteredSubjects.map((s) => (
                <tr key={s.id}>
                  <td>{s.subject_code}</td>
                  <td>{s.subject_name}</td>
                  <td>{s.year_level}</td>
                  <td>{s.semester}</td>
                  <td>{s.units}</td>
                  <td>{s.lec_hours ?? '—'}</td>
                  <td>{s.lab_hours ?? '—'}</td>
                  <td>{s.allowed_status || 'both'}</td>
                  <td>{s.available_slot ?? 0}</td>
                  <td>{s.section || '—'}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        type="button"
                        className="btn-icon"
                        title="Edit subject"
                        onClick={() => handleEdit(s)}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="btn-icon btn-delete"
                        title="Delete subject"
                        onClick={() => handleDelete(s)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FORM: ADD / EDIT SUBJECT */}
      <div className="dashboard-card micro">
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

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}
        >
          {/* Code + Name */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 2fr',
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
                Subject Code
              </label>
              <input
                name="subject_code"
                type="text"
                className="event-input micro"
                placeholder="e.g. IT101"
                value={form.subject_code}
                onChange={handleChange}
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
                Subject Name
              </label>
              <input
                name="subject_name"
                type="text"
                className="event-input micro"
                placeholder="e.g. Introduction to Computing"
                value={form.subject_name}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'block',
                marginBottom: '0.25rem',
              }}
            >
              Description (optional)
            </label>
            <textarea
              name="description"
              className="event-input micro"
              style={{ minHeight: '60px', resize: 'vertical' }}
              placeholder="Short description of the subject..."
              value={form.description}
              onChange={handleChange}
            />
          </div>

          {/* Year / Sem / Units / Allowed */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
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
                Year Level
              </label>
              <select
                name="year_level"
                className="status-select"
                value={form.year_level}
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
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
                Semester
              </label>
              <select
                name="semester"
                className="status-select"
                value={form.semester}
                onChange={handleChange}
              >
                <option value="1st">1st Sem</option>
                <option value="2nd">2nd Sem</option>
                <option value="summer">Summer</option>
              </select>
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
                name="units"
                type="number"
                min="0"
                step="1"
                className="event-input micro"
                placeholder="e.g. 3"
                value={form.units}
                onChange={handleChange}
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
                Allowed For
              </label>
              <select
                name="allowed_status"
                className="status-select"
                value={form.allowed_status}
                onChange={handleChange}
              >
                <option value="both">Both</option>
                <option value="regular">Regular Only</option>
                <option value="irregular">Irregular / Transferee</option>
              </select>
            </div>
          </div>

          {/* Lec/Lab / Slots / Section */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
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
                LEC Hours
              </label>
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
              <label
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: '0.25rem',
                }}
              >
                LAB Hours
              </label>
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
              <label
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: '0.25rem',
                }}
              >
                Available Slots
              </label>
              <input
                name="available_slot"
                type="number"
                min="0"
                step="1"
                className="event-input micro"
                placeholder="e.g. 40"
                value={form.available_slot}
                onChange={handleChange}
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
                Section (optional)
              </label>
              <input
                name="section"
                type="text"
                className="event-input micro"
                placeholder="e.g. BSIT-1A"
                value={form.section}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ marginTop: '0.5rem' }}>
            <button
              type="submit"
              className="btn micro btn-primary"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : editingSubject
                ? 'Update Subject'
                : 'Add Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubjectsPage;
