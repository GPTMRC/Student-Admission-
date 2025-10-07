import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3002',
  credentials: true
}));
app.use(express.json());

// Create SMTP transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Email template function
const createEmailTemplate = (studentData) => {
  const examDate = new Date(studentData.exam_schedule);
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { 
            font-family: 'Arial', sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
        }
        .header { 
            background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 10px 10px 0 0;
        }
        .content { 
            background: #f8fdf8; 
            padding: 30px; 
            border: 1px solid #e8f5e9;
        }
        .exam-info { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #4caf50; 
            margin: 20px 0;
        }
        .footer { 
            background: #e8f5e9; 
            padding: 20px; 
            text-align: center; 
            border-radius: 0 0 10px 10px; 
            font-size: 14px; 
            color: #666;
        }
        .highlight { 
            color: #2e7d32; 
            font-weight: bold;
        }
        .requirements { 
            background: #f1f8e9; 
            padding: 15px; 
            border-radius: 5px; 
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎓 ${process.env.UNIVERSITY_NAME}</h1>
        <p>Admission Office</p>
    </div>
    
    <div class="content">
        <h2>Dear ${studentData.full_name},</h2>
        
        <p>Thank you for submitting your application to <span class="highlight">${process.env.UNIVERSITY_NAME}</span>. We're excited to review your application!</p>
        
        <div class="exam-info">
            <h3 style="color: #2e7d32; margin-top: 0;">📅 Your Entrance Exam Schedule</h3>
            <p><strong>Date:</strong> ${examDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Time:</strong> ${examDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
            <p><strong>Location:</strong> ${process.env.CAMPUS_LOCATION}</p>
            <p><strong>Exam Duration:</strong> 3 hours</p>
        </div>

        <div class="requirements">
            <h4 style="color: #2e7d32; margin-top: 0;">📋 What to Bring:</h4>
            <ul>
                <li>Valid government-issued ID</li>
                <li>This confirmation email (printed or digital)</li>
                <li>Two (2) pencils and eraser</li>
                <li>Scientific calculator (if applicable)</li>
                <li>Water and light snacks</li>
            </ul>
        </div>

        <p><strong>Important Notes:</strong></p>
        <ul>
            <li>Arrive at least 30 minutes before your scheduled exam time</li>
            <li>Latecomers may not be permitted to take the exam</li>
            <li>Dress comfortably and appropriately</li>
            <li>Electronic devices (phones, smartwatches) must be turned off during the exam</li>
        </ul>

        <p>If you need to reschedule or have any questions, please contact our Admissions Office:</p>
        <p>
            📧 Email: <a href="mailto:${process.env.ADMISSIONS_EMAIL}">${process.env.ADMISSIONS_EMAIL}</a><br>
            📞 Phone: ${process.env.ADMISSIONS_PHONE}
        </p>

        <p>We wish you the best of luck on your exam!</p>
    </div>
    
    <div class="footer">
        <p><strong>${process.env.UNIVERSITY_NAME} - Admissions Office</strong></p>
        <p>This is an automated message. Please do not reply to this email.</p>
    </div>
</body>
</html>
  `;
};

// Email sending endpoint
app.post('/api/send-exam-email', async (req, res) => {
  try {
    const { student_name, student_email, exam_schedule, year_level } = req.body;

    // Validate required fields
    if (!student_name || !student_email || !exam_schedule) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: student_name, student_email, exam_schedule'
      });
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: process.env.FROM_NAME,
        address: process.env.FROM_EMAIL
      },
      to: student_email,
      subject: `Entrance Exam Schedule - ${process.env.UNIVERSITY_NAME}`,
      html: createEmailTemplate({
        full_name: student_name,
        exam_schedule: exam_schedule,
        year_level: year_level
      }),
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', info.messageId);
    
    res.json({
      success: true,
      message: 'Exam schedule email sent successfully',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send email: ' + error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Admission Email Service',
    timestamp: new Date().toISOString()
  });
});

// Test email endpoint
app.post('/api/test-email', async (req, res) => {
  try {
    const { test_email } = req.body;
    
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: process.env.FROM_NAME,
        address: process.env.FROM_EMAIL
      },
      to: test_email || process.env.EMAIL_USER,
      subject: 'Test Email - Admission System',
      html: `
        <h2>Test Email Successful! 🎉</h2>
        <p>Your SMTP configuration is working correctly.</p>
        <p><strong>Server:</strong> ${process.env.EMAIL_HOST}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test email: ' + error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Email server running on port ${PORT}`);
  console.log(`📧 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎯 CORS enabled for: ${process.env.CORS_ORIGIN}`);
});