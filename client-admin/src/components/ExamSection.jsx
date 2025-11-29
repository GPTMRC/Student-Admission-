import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://avnmpvjocmnearcgrduq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bm1wdmpvY21uZWFyY2dyZHVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MzQ2OTAsImV4cCI6MjA3NTQxMDY5MH0.i7NNK9WB_mzFj84Rjk5f5hq-i6g_-lYPeLjCHJiiw2Q';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ExamSection = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [examDate, setExamDate] = useState('');

  const getApplicationsByStatus = async (status) => {
    const { data, error } = await supabase
      .from('student_admissions')
      .select('*')
      .eq('status', status)
      .order('submitted_at', { ascending: false });
    if (error) throw error;
    return data;
  };

  const updateExamSchedule = async (id, examDate) => {
    const { data, error } = await supabase
      .from('student_admissions')
      .update({ exam_schedule: examDate })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data;
  };

  const updateApplicationStatus = async (id, status) => {
    const { data, error } = await supabase
      .from('student_admissions')
      .update({ status })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data;
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await getApplicationsByStatus('submitted');
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleExam = async (applicationId) => {
    if (!examDate) {
      alert('Please select an exam date');
      return;
    }

    try {
      await updateExamSchedule(applicationId, examDate);
      await updateApplicationStatus(applicationId, 'scheduled');
      alert('Exam scheduled successfully!');
      setSelectedApp(null);
      setExamDate('');
      fetchApplications();
    } catch (error) {
      console.error('Error scheduling exam:', error);
      alert('Error scheduling exam');
    }
  };

  if (loading) return <div>Loading applications...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Schedule Exams</h2>
      <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
        {applications.map(app => (
          <div key={app.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <h3>{app.full_name}</h3>
              <p>Email: {app.email}</p>
              <p>Program: {app.desired_program}</p>
              <p>Contact: {app.contact_number}</p>
              {app.exam_schedule && (
                <p><strong>Scheduled: {new Date(app.exam_schedule).toLocaleString()}</strong></p>
              )}
            </div>
            <div style={{ marginLeft: '15px' }}>
              <button 
                onClick={() => {
                  setSelectedApp(app);
                  setExamDate(app.exam_schedule ? app.exam_schedule.slice(0, 16) : '');
                }}
                style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', background: '#007bff', color: 'white', cursor: 'pointer' }}
              >
                {app.exam_schedule ? 'Reschedule Exam' : 'Schedule Exam'}
              </button>
            </div>
          </div>
        ))}
        {applications.length === 0 && (
          <p>No applications pending exam scheduling.</p>
        )}
      </div>

      {selectedApp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', minWidth: '400px' }}>
            <h3>Schedule Exam for {selectedApp.full_name}</h3>
            <div style={{ margin: '15px 0' }}>
              <label>Exam Date and Time:</label>
              <input
                type="datetime-local"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => handleScheduleExam(selectedApp.id)}
                style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', background: '#28a745', color: 'white', cursor: 'pointer' }}
              >
                Confirm Schedule
              </button>
              <button 
                onClick={() => {
                  setSelectedApp(null);
                  setExamDate('');
                }}
                style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', background: '#6c757d', color: 'white', cursor: 'pointer' }}
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

export default ExamSection;