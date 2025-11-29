// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import bodyParser from 'body-parser';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(bodyParser.json());

// Simple request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (Object.keys(req.body || {}).length) console.log('  body:', req.body);
  next();
});

app.get('/', (req, res) => res.json({ success: true, message: 'Backend alive' }));

app.post('/test-frontend-connection', (req, res) => res.json({ success: true }));

/**
 * Try to create a transporter using real SMTP config if provided.
 * Returns transporter or null.
 */
function createConfiguredTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: (process.env.SMTP_SECURE === 'true'),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return null;
}

/**
 * Create an Ethereal transporter (for dev/testing)
 */
async function createEtherealTransporter() {
  const testAccount = await nodemailer.createTestAccount();
  console.warn('Using Ethereal test account for email preview.');
  console.log('Ethereal user:', testAccount.user);
  console.log('Ethereal pass:', testAccount.pass);

  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass }
  });

  return { transporter, testAccount };
}

app.post('/send-confirmation', async (req, res) => {
  const { student_name, student_email, exam_schedule, year_level } = req.body;

  if (!student_name || !student_email || !exam_schedule) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  const subject = 'Exam Schedule Confirmation';
  const htmlBody = `
    <h2>Hello ${student_name},</h2>
    <p>Your exam is scheduled on:</p>
    <strong>${new Date(exam_schedule).toLocaleString()}</strong>
    <p>Year Level: ${year_level}</p>
    <br>
    <p>Thank you.</p>
  `;
  const from = process.env.SMTP_FROM || '"Pateros Tech" <no-reply@paterostech.local>';

  // Try configured SMTP first (if present)
  const configuredTransporter = createConfiguredTransporter();

  if (configuredTransporter) {
    try {
      const info = await configuredTransporter.sendMail({
        from,
        to: student_email,
        subject,
        html: htmlBody
      });

      // Log and return full info for debugging (includes accepted/rejected/response/messageId)
      console.log('Email sent via configured SMTP. sendMail info:', info);
      return res.json({
        success: true,
        source: 'configured-smtp',
        message: 'Email sent via configured SMTP',
        info
      });
    } catch (err) {
      // Log error and inspect message to decide fallback
      console.error('Configured SMTP failed:', err && err.message ? err.message : err);

      const errMsg = (err && err.message) ? err.message.toLowerCase() : '';
      const isAuthError = errMsg.includes('535') ||
                          errMsg.includes('invalid login') ||
                          errMsg.includes('username and password not accepted') ||
                          errMsg.includes('authentication failed');

      // If not an auth error, return the error details (no fallback)
      if (!isAuthError) {
        return res.status(500).json({
          success: false,
          source: 'configured-smtp',
          message: 'Email failed (configured SMTP)',
          error: err.message || String(err)
        });
      }

      // If auth error, fall through to Ethereal fallback
      console.warn('Auth error detected — falling back to Ethereal for local preview.');
    }
  }

  // Ethereal fallback (or used when no SMTP configured)
  try {
    const { transporter, testAccount } = await createEtherealTransporter();

    const info = await transporter.sendMail({
      from,
      to: student_email,
      subject,
      html: htmlBody
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || null;

    console.log('Ethereal message sent. sendMail info:', info);
    if (previewUrl) console.log('Preview URL:', previewUrl);

    return res.json({
      success: true,
      source: 'ethereal',
      message: 'Email sent (preview available)',
      previewUrl,
      info
    });
  } catch (error) {
    console.error('Ethereal send failed:', error);
    return res.status(500).json({
      success: false,
      source: 'ethereal',
      message: 'Email failed (ethereal)',
      error: error.message || String(error)
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT} — http://localhost:${PORT}`);
});
