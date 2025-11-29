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

// Simple test
app.post('/test-frontend-connection', (req, res) => {
  return res.json({ success: true });
});

// Send confirmation email
app.post('/send-confirmation', async (req, res) => {
  const { student_name, student_email, exam_schedule, year_level } = req.body;

  if (!student_name || !student_email || !exam_schedule) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: student_email,
      subject: "Exam Schedule Confirmation",
      html: `
        <h2>Hello ${student_name},</h2>
        <p>Your exam is scheduled on:</p>
        <strong>${new Date(exam_schedule).toLocaleString()}</strong>
        <p>Year Level: ${year_level}</p>
        <br>
        <p>Thank you.</p>
      `
    });

    return res.json({ success: true, message: "Email sent" });
  } catch (error) {
    console.error("Email Error:", error);
    return res.status(500).json({ success: false, message: "Email failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
