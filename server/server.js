/**
 * server/server.js
 * PTC Admission Email Server (full updated)
 *
 * - Single, reusable Nodemailer transporter (Gmail App Password)
 * - /send-confirmation endpoint for frontend to request exam email
 * - submit-application retains DB save simulation + confirmation email send
 * - Winston logging (console + logs/app.log)
 * - Rate limiting, helmet, CORS
 *
 * IMPORTANT:
 * - Put credentials in .env, DO NOT commit .env
 * - If App Password was exposed, revoke it and create a new one
 */

const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");
const winston = require("winston");
require("dotenv").config();

// --- Ensure logs directory exists
const logsDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// --- Logger setup (winston)
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
      const base = `${timestamp} ${level.toUpperCase()}: ${message}`;
      const extra = Object.keys(meta).length ? ` | meta: ${JSON.stringify(meta)}` : "";
      return stack ? `${base}\n${stack}${extra}` : `${base}${extra}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: path.join(logsDir, "app.log"), maxsize: 5 * 1024 * 1024 })
  ]
});

// --- Express app
const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// --- Helpers
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// --- Nodemailer transporter (singleton, pooled)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  logger: process.env.NODE_ENV === "development",
  debug: process.env.NODE_ENV === "development"
});

// Verify transporter at startup (log but do not crash)
transporter.verify()
  .then(() => logger.info("✅ SMTP transporter verified and ready"))
  .catch(err => {
    logger.error("⚠️ SMTP transporter verification failed at startup", { message: err.message, code: err.code, stack: err.stack });
  });

// --- Rate limiter for submissions
const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests, please try again later." }
});

// --- Routes

app.get("/", (req, res) => {
  res.json({
    message: "PTC Admission System Email API",
    endpoints: {
      "GET /": "API information",
      "GET /health": "Health check",
      "GET /test-email-config": "Check email configuration",
      "GET /send-test-email?to=email@example.com": "Send test email",
      "POST /send-confirmation": "Send exam confirmation email (for frontend)",
      "POST /test-frontend-connection": "Test frontend connection",
      "POST /submit-application": "Submit admission application"
    },
    status: "Running 🚀"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "PTC Admission Email Service",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0"
  });
});

app.post("/test-frontend-connection", (req, res) => {
  logger.info("Frontend connection test", { body: req.body });
  res.json({
    success: true,
    message: "Frontend-backend connection working!",
    timestamp: new Date().toISOString(),
    receivedData: req.body
  });
});

app.get("/test-email-config", (req, res) => {
  const config = {
    gmailUser: process.env.GMAIL_USER ? "✅ Set" : "❌ Missing",
    gmailPass: process.env.GMAIL_PASS ? "✅ Set" : "❌ Missing",
    senderName: process.env.SENDER_NAME ? "✅ Set" : "❌ Missing",
    port: process.env.PORT || 4000
  };
  logger.info("Email configuration check", { config });
  res.json({ success: true, message: "Email configuration check", config });
});

// send-test-email - quick test endpoint
app.get("/send-test-email", async (req, res) => {
  try {
    const { to } = req.query;
    const testEmail = to || "receiver@example.com";

    if (!isValidEmail(testEmail)) {
      return res.status(400).json({ success: false, error: "Invalid email address" });
    }

    const info = await transporter.sendMail({
      from: `"${process.env.SENDER_NAME || "PTC ADMISSION"}" <${process.env.GMAIL_USER}>`,
      to: testEmail,
      subject: "Test Email from PTC Admission System 🚀",
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.6;">
          <h1 style="color: #2c5530;">PTC ADMISSION SYSTEM</h1>
          <p>This is a test email from your PTC Admission System.</p>
          <p><strong>Server Time:</strong> ${new Date().toLocaleString()}</p>
          <p>If you received this, your email setup is working correctly! ✅</p>
        </div>
      `
    });

    logger.info("Test email sent", { to: testEmail, messageId: info.messageId });
    res.json({ success: true, message: "Test email sent successfully", to: testEmail, messageId: info.messageId });
  } catch (err) {
    logger.error("Failed to send test email", { message: err.message, code: err.code, response: err.response });
    res.status(500).json({ success: false, error: "Failed to send test email", details: err.message });
  }
});

/**
 * NEW endpoint: /send-confirmation
 * Called by your React frontend after DB insert to send exam schedule email.
 * Body: { student_name, student_email, exam_schedule, year_level }
 */
app.post("/send-confirmation", async (req, res) => {
  try {
    const { student_name, student_email, exam_schedule, year_level } = req.body;
    if (!student_name || !student_email) {
      return res.status(400).json({ success: false, error: "Missing student_name or student_email" });
    }
    if (!isValidEmail(student_email)) {
      return res.status(400).json({ success: false, error: "Invalid student_email format" });
    }

    const mailOptions = {
      from: `"${process.env.SENDER_NAME || "PTC ADMISSION"}" <${process.env.GMAIL_USER}>`,
      to: student_email,
      subject: "Exam Schedule — PTC Admission",
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.6; max-width:600px; margin:0 auto;">
          <div style="background: linear-gradient(135deg, #2c5530 0%, #4a7c59 100%); padding:20px; color:white; text-align:center;">
            <h2 style="margin:0">${process.env.SENDER_NAME || 'PTC ADMISSION'}</h2>
            <p style="margin:0; opacity:0.9;">Exam Schedule Notification</p>
          </div>
          <div style="padding:20px; background:#f9f9f9;">
            <p>Hi <strong>${student_name}</strong>,</p>
            <p>Your exam is scheduled for <strong>${exam_schedule ? new Date(exam_schedule).toLocaleString() : 'TBA'}</strong> for <strong>${year_level || 'N/A'}</strong>.</p>
            <p>Please arrive on time and bring required documents.</p>
            <p>Good luck!</p>
            <p style="margin-top:20px; color:#666; font-size:12px;">PTC Admission System</p>
          </div>
        </div>
      `
    };

    // Attempt with retry
    let info = null;
    let lastError = null;
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        logger.info("Attempting send-confirmation email", { attempt, to: student_email });
        info = await transporter.sendMail(mailOptions);
        logger.info("send-confirmation email sent", { to: student_email, messageId: info.messageId, attempt });
        break;
      } catch (err) {
        lastError = err;
        logger.error("send-confirmation attempt failed", { attempt, message: err.message, code: err.code, response: err.response });
        if (attempt < maxAttempts) {
          const backoff = 500 * Math.pow(2, attempt - 1);
          await new Promise(r => setTimeout(r, backoff));
        }
      }
    }

    if (!info) {
      const internalLogId = `SENDCONF_FAIL_${Date.now()}`;
      logger.error("Failed to send confirmation email after retries", { internalLogId, lastErrorMessage: lastError && lastError.message });
      return res.status(500).json({ success: false, error: "Failed to send confirmation email", internalLogId });
    }

    return res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    logger.error("Unexpected error in /send-confirmation", { message: err.message, stack: err.stack });
    return res.status(500).json({ success: false, error: "Unexpected server error" });
  }
});

// MAIN: submit-application
app.post("/submit-application", submitLimiter, async (req, res) => {
  try {
    const { studentData, email } = req.body;
    if (!studentData || !email) {
      return res.status(400).json({ success: false, error: "Missing student data or email" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: "Invalid email address format" });
    }

    // Simulated DB save (replace with real DB)
    const applicationId = `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logger.info("Saving application", { applicant: studentData.name || "Unknown", applicationId });

    const applicationRecord = {
      id: applicationId,
      ...studentData,
      submittedAt: new Date().toISOString(),
      status: "submitted"
    };
    // TODO: persist applicationRecord to DB

    // Prepare confirmation email (same template as /send-confirmation)
    const mailOptions = {
      from: `"${process.env.SENDER_NAME || "PTC ADMISSION"}" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "PTC Admission Application Received",
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.6; max-width:600px; margin:0 auto;">
          <div style="background: linear-gradient(135deg, #2c5530 0%, #4a7c59 100%); padding:20px; color:white; text-align:center;">
            <h2 style="margin:0">${process.env.SENDER_NAME || 'PTC ADMISSION'}</h2>
            <p style="margin:0; opacity:0.9;">Application Confirmation</p>
          </div>
          <div style="padding:20px; background:#f9f9f9;">
            <p>Hi <strong>${studentData.name || 'Applicant'}</strong>,</p>
            <p>We have received your application. Your Application ID is <strong>${applicationId}</strong>.</p>
            <p>We will notify you of the exam schedule shortly.</p>
            <p style="margin-top:20px; color:#666; font-size:12px;">PTC Admission System</p>
          </div>
        </div>
      `
    };

    // Send email with retry logic
    let emailSent = false;
    let emailMessageId = null;
    let lastError = null;
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        logger.info("Attempting to send confirmation email (submit-application)", { attempt, to: email });
        const info = await transporter.sendMail(mailOptions);
        emailSent = true;
        emailMessageId = info.messageId;
        logger.info("Confirmation email sent", { to: email, messageId: emailMessageId, attempt });
        break;
      } catch (err) {
        lastError = err;
        logger.error("sendMail attempt failed (submit-application)", { attempt, message: err.message, code: err.code, response: err.response });
        if (attempt < maxAttempts) {
          const backoff = 500 * Math.pow(2, attempt - 1);
          await new Promise(r => setTimeout(r, backoff));
        }
      }
    }

    if (!emailSent) {
      const internalLogId = `EMAIL_FAIL_${Date.now()}`;
      logger.error("Failed to send confirmation email after retries", { internalLogId, email, lastErrorMessage: lastError && lastError.message });
      return res.status(200).json({
        success: true,
        message: "Application submitted but email failed. Please check your inbox.",
        applicationId,
        emailSent: false,
        emailMessageId: null,
        emailError: "Email delivery failed (temporary). Administrators have been notified.",
        internalLogId
      });
    }

    return res.json({
      success: true,
      message: "Application submitted successfully",
      applicationId,
      emailSent: true,
      emailMessageId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error("Unexpected error in submit-application", { message: error.message, stack: error.stack });
    return res.status(500).json({ success: false, error: "Application submission failed", details: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  logger.info(`🚀 PTC Admission Email Server running on http://localhost:${PORT}`);
  logger.info(`📧 Using Gmail: ${process.env.GMAIL_USER || "NOT SET"}`);
  logger.info(`🏫 Sender Name: ${process.env.SENDER_NAME || "NOT SET"}`);
});
