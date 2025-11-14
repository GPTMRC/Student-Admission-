import React, { useState, useEffect } from 'react';

const CertificateOfRegistration = ({ studentData, onClose }) => {
  const [currentSemester, setCurrentSemester] = useState('1st Semester 2024');
  const [courses, setCourses] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  // Sample course data
  useEffect(() => {
    const sampleCourses = [
      {
        code: 'GE 2',
        title: 'Understanding the self',
        units: 3,
        lec: 3,
        lab: 0,
        section: 'CCS 1G',
        day: 'W',
        time: '6:00-9:00PM',
        instructor: 'VILLACARLOS'
      },
      {
        code: 'GE 1',
        title: 'Mathematics in Modern World',
        units: 3,
        lec: 3,
        lab: 0,
        section: 'CCS 1G',
        day: 'M',
        time: '6:00-9:00PM',
        instructor: 'KANMO'
      },
      {
        code: 'CC 101',
        title: 'IT Fundamentals',
        units: 3,
        lec: 3,
        lab: 0,
        section: 'CCS 1G',
        day: 'TH',
        time: '6:00-9:00PM',
        instructor: 'TAVU ER'
      },
      {
        code: 'CC 102',
        title: 'Programming 1 (Java)',
        units: 3,
        lec: 2,
        lab: 3,
        section: 'CCS 1G',
        day: 'F',
        time: '4:00-9:00PM',
        instructor: 'R-YAMSON'
      },
      {
        code: 'OP 1',
        title: 'Office Productivity 1',
        units: 3,
        lec: 2,
        lab: 3,
        section: 'CCS 1G',
        day: 'T',
        time: '4:00-9:00PM',
        instructor: 'G RAQUEL'
      }
    ];
    setCourses(sampleCourses);
  }, []);

  const calculateTotals = () => {
    const totalUnits = courses.reduce((sum, course) => sum + course.units, 0);
    const totalLec = courses.reduce((sum, course) => sum + course.lec, 0);
    const totalLab = courses.reduce((sum, course) => sum + course.lab, 0);
    return { totalUnits, totalLec, totalLab };
  };

  const handleEditCourse = (index, field, value) => {
    const updatedCourses = [...courses];
    updatedCourses[index][field] = value;
    setCourses(updatedCourses);
  };

  const handlePrint = () => {
    window.print();
  };

  const { totalUnits, totalLec, totalLab } = calculateTotals();

  // Compact fees breakdown
  const fees = {
    tuition: 6000,
    laboratory: 900,
    computer: 2700,
    misc: 670 // Sum of all miscellaneous fees
  };

  const totalFees = fees.tuition + fees.laboratory + fees.computer + fees.misc;

  return React.createElement(
    'div',
    { className: 'cor-container' },
    // Control Panel
    React.createElement(
      'div',
      { className: 'cor-controls' },
      React.createElement(
        'button',
        {
          className: 'print-btn',
          onClick: handlePrint
        },
        '🖨️ Print COR'
      ),
      React.createElement(
        'button',
        {
          className: 'edit-btn',
          onClick: () => setIsEditing(!isEditing)
        },
        isEditing ? '🔒 Lock' : '✏️ Edit'
      ),
      React.createElement(
        'button',
        {
          className: 'close-btn',
          onClick: onClose
        },
        '❌ Close'
      )
    ),

    // Certificate of Registration Document - COMPACT VERSION
    React.createElement(
      'div',
      { className: 'cor-document compact' },
      // Header
      React.createElement(
        'div',
        { className: 'cor-header' },
        React.createElement(
          'div',
          { className: 'school-header' },
          React.createElement('h1', null, 'PATEROS TECHNOLOGICAL COLLEGE'),
          React.createElement('p', { className: 'school-address' }, 
            'College St., Sto. Rosario - Kanluran Pateros, Metro Manila'
          ),
          React.createElement('h2', { className: 'document-title' }, 
            'CERTIFICATE OF REGISTRATION'
          )
        )
      ),

      // Student Information - COMPACT
      React.createElement(
        'div',
        { className: 'student-info compact' },
        React.createElement(
          'div',
          { className: 'info-grid compact' },
          React.createElement(
            'div',
            { className: 'info-item' },
            React.createElement('strong', null, 'NAME: '),
            studentData ? 
              `${studentData.last_name}, ${studentData.first_name} ${studentData.middle_name || ''}`.toUpperCase() :
              'BAYLON, MARK CHRISTIAN MACASABUANG'
          ),
          React.createElement(
            'div',
            { className: 'info-item' },
            React.createElement('strong', null, 'ID NO: '),
            studentData?.student_number || '2022-8397'
          ),
          React.createElement(
            'div',
            { className: 'info-item' },
            React.createElement('strong', null, 'PROGRAM: '),
            studentData?.program_enrolled || 'CERTIFICATE IN COMPUTER SCIENCE'
          ),
          React.createElement(
            'div',
            { className: 'info-item' },
            React.createElement('strong', null, 'YEAR LEVEL: '),
            studentData?.year_level || '1ST YEAR'
          ),
          React.createElement(
            'div',
            { className: 'info-item' },
            React.createElement('strong', null, 'SEMESTER: '),
            isEditing ? 
              React.createElement('input', {
                type: 'text',
                value: currentSemester,
                onChange: (e) => setCurrentSemester(e.target.value),
                className: 'edit-input small'
              }) :
              currentSemester
          )
        )
      ),

      // Courses Table - COMPACT
      React.createElement(
        'div',
        { className: 'courses-section compact' },
        React.createElement(
          'table',
          { className: 'courses-table compact' },
          React.createElement(
            'thead',
            null,
            React.createElement(
              'tr',
              null,
              React.createElement('th', null, 'CODE'),
              React.createElement('th', null, 'COURSE TITLE'),
              React.createElement('th', null, 'UNT'),
              React.createElement('th', null, 'LEC'),
              React.createElement('th', null, 'LAB'),
              React.createElement('th', null, 'SEC'),
              React.createElement('th', null, 'DAY'),
              React.createElement('th', null, 'TIME'),
              React.createElement('th', null, 'INSTRUCTOR')
            )
          ),
          React.createElement(
            'tbody',
            null,
            courses.map((course, index) => 
              React.createElement(
                'tr',
                { key: index },
                React.createElement(
                  'td',
                  null,
                  isEditing ?
                    React.createElement('input', {
                      type: 'text',
                      value: course.code,
                      onChange: (e) => handleEditCourse(index, 'code', e.target.value),
                      className: 'edit-input x-small'
                    }) :
                    course.code
                ),
                React.createElement(
                  'td',
                  { className: 'course-title' },
                  isEditing ?
                    React.createElement('input', {
                      type: 'text',
                      value: course.title,
                      onChange: (e) => handleEditCourse(index, 'title', e.target.value),
                      className: 'edit-input'
                    }) :
                    course.title
                ),
                React.createElement(
                  'td',
                  null,
                  isEditing ?
                    React.createElement('input', {
                      type: 'number',
                      value: course.units,
                      onChange: (e) => handleEditCourse(index, 'units', parseInt(e.target.value) || 0),
                      className: 'edit-input x-small'
                    }) :
                    course.units
                ),
                React.createElement(
                  'td',
                  null,
                  isEditing ?
                    React.createElement('input', {
                      type: 'number',
                      value: course.lec,
                      onChange: (e) => handleEditCourse(index, 'lec', parseInt(e.target.value) || 0),
                      className: 'edit-input x-small'
                    }) :
                    course.lec
                ),
                React.createElement(
                  'td',
                  null,
                  isEditing ?
                    React.createElement('input', {
                      type: 'number',
                      value: course.lab,
                      onChange: (e) => handleEditCourse(index, 'lab', parseInt(e.target.value) || 0),
                      className: 'edit-input x-small'
                    }) :
                    course.lab
                ),
                React.createElement(
                  'td',
                  null,
                  isEditing ?
                    React.createElement('input', {
                      type: 'text',
                      value: course.section,
                      onChange: (e) => handleEditCourse(index, 'section', e.target.value),
                      className: 'edit-input x-small'
                    }) :
                    course.section
                ),
                React.createElement(
                  'td',
                  null,
                  isEditing ?
                    React.createElement('input', {
                      type: 'text',
                      value: course.day,
                      onChange: (e) => handleEditCourse(index, 'day', e.target.value),
                      className: 'edit-input x-small'
                    }) :
                    course.day
                ),
                React.createElement(
                  'td',
                  null,
                  isEditing ?
                    React.createElement('input', {
                      type: 'text',
                      value: course.time,
                      onChange: (e) => handleEditCourse(index, 'time', e.target.value),
                      className: 'edit-input small'
                    }) :
                    course.time
                ),
                React.createElement(
                  'td',
                  null,
                  isEditing ?
                    React.createElement('input', {
                      type: 'text',
                      value: course.instructor,
                      onChange: (e) => handleEditCourse(index, 'instructor', e.target.value),
                      className: 'edit-input small'
                    }) :
                    course.instructor
                )
              )
            )
          ),
          React.createElement(
            'tfoot',
            null,
            React.createElement(
              'tr',
              { className: 'totals-row' },
              React.createElement('td', { colSpan: 2 }, React.createElement('strong', null, 'TOTAL:')),
              React.createElement('td', null, React.createElement('strong', null, totalUnits)),
              React.createElement('td', null, React.createElement('strong', null, totalLec)),
              React.createElement('td', null, React.createElement('strong', null, totalLab)),
              React.createElement('td', { colSpan: 4 }, '')
            )
          )
        )
      ),

      // Fees Section - COMPACT
      React.createElement(
        'div',
        { className: 'fees-section compact' },
        React.createElement(
          'div',
          { className: 'fees-grid compact' },
          React.createElement(
            'div',
            { className: 'fee-column' },
            React.createElement(
              'div',
              { className: 'fee-item' },
              React.createElement('strong', null, 'Tuition Fee:'),
              React.createElement('span', null, `₱${fees.tuition.toLocaleString()}`)
            ),
            React.createElement(
              'div',
              { className: 'fee-item' },
              React.createElement('strong', null, 'Laboratory Fee:'),
              React.createElement('span', null, `₱${fees.laboratory.toLocaleString()}`)
            ),
            React.createElement(
              'div',
              { className: 'fee-item' },
              React.createElement('strong', null, 'Computer Fee:'),
              React.createElement('span', null, `₱${fees.computer.toLocaleString()}`)
            )
          ),
          React.createElement(
            'div',
            { className: 'fee-column' },
            React.createElement(
              'div',
              { className: 'fee-item' },
              React.createElement('strong', null, 'Miscellaneous:'),
              React.createElement('span', null, `₱${fees.misc.toLocaleString()}`)
            ),
            React.createElement(
              'div',
              { className: 'fee-item total' },
              React.createElement('strong', null, 'TOTAL FEE:'),
              React.createElement('span', null, `₱${totalFees.toLocaleString()}`)
            )
          )
        )
      ),

      // Payment Section - COMPACT
      React.createElement(
        'div',
        { className: 'payment-section' },
        React.createElement(
          'div',
          { className: 'payment-grid' },
          React.createElement(
            'div',
            { className: 'payment-item' },
            React.createElement('strong', null, '1ST PAYMENT'),
            React.createElement('div', { className: 'payment-details' },
              'Amount Paid: ______ Date: ______'
            )
          ),
          React.createElement(
            'div',
            { className: 'payment-item' },
            React.createElement('strong', null, '2ND PAYMENT'),
            React.createElement('div', { className: 'payment-details' },
              'Amount Paid: ______ Date: ______'
            )
          )
        ),
        React.createElement(
          'div',
          { className: 'balance-section' },
          React.createElement('strong', null, 'TOTAL BALANCE: ₱0.00')
        )
      ),

      // Footer and Notes - COMPACT
      React.createElement(
        'div',
        { className: 'cor-footer compact' },
        React.createElement(
          'div',
          { className: 'official-note compact' },
          React.createElement('p', null, 
            '📝 This is an official document generated by PTC Student Portal. ' +
            'Valid without signature.'
          )
        ),
        React.createElement(
          'div',
          { className: 'signature-section' },
          React.createElement(
            'div',
            { className: 'student-signature' },
            React.createElement('div', { className: 'signature-line' }),
            React.createElement('p', null, 
              studentData ? 
                `${studentData.first_name} ${studentData.last_name}`.toUpperCase() :
                'MARK CHRISTIAN MACASABUANG BAYLON'
            ),
            React.createElement('p', { className: 'label' }, "Student's Signature")
          )
        ),
        React.createElement(
          'div',
          { className: 'generated-info compact' },
          React.createElement('p', null, 
            `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`
          )
        )
      )
    )
  );
};

export default CertificateOfRegistration;