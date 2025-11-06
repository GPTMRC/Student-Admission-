// send-test.js
require('dotenv').config();
const nodemailer = require('nodemailer');

async function main() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;
  const senderName = process.env.SENDER_NAME || 'No Name';

  if (!user || !pass) {
    console.error('Missing GMAIL_USER or GMAIL_PASS in .env');
    process.exit(1);
  }

  // Create transporter for Gmail using App Password (recommended)
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for 465, false for 587
    auth: {
      user,
      pass
    },
    logger: true,
    debug: true
  });

  // Verify transporter first (gives clear connection/auth errors)
  try {
    console.log('Verifying transporter...');
    await transporter.verify();
    console.log('SMTP server is ready to take messages');
  } catch (err) {
    console.error('Transporter verify failed. Full error below:\n', err);
    // print full JSON structure if available
    try { console.error('Error (stringified):', JSON.stringify(err, Object.getOwnPropertyNames(err), 2)); } catch {}
    process.exit(1);
  }

  // Prepare mail
  const mailOptions = {
    from: `"${senderName}" <${user}>`, // <--- use the same address as auth to avoid rejection
    to: 'recipient@example.com',      // change to your test recipient
    subject: 'Nodemailer test from PTC ADMISSION',
    text: 'Hello — this is a test email from nodemailer.',
    html: '<p><b>Hello</b> — this is a test email from nodemailer.</p>'
  };

  // Send mail
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent:', info.messageId);
    console.log('Response:', info.response);
    process.exit(0);
  } catch (err) {
    console.error('sendMail failed. Full error below:\n', err);
    try { console.error('Error (stringified):', JSON.stringify(err, Object.getOwnPropertyNames(err), 2)); } catch {}
    process.exit(1);
  }
}

main();

