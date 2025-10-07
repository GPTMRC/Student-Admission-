import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

async function testSMTP() {
  console.log('🔧 Testing SMTP Configuration...');
  console.log('Host:', process.env.EMAIL_HOST);
  console.log('Port:', process.env.EMAIL_PORT);
  console.log('User:', process.env.EMAIL_USER);

  try {
    const transporter = nodemailer.createTransport({  // ← FIXED: createTransport (no 'e')
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP Connection Successful!');

    // Send test email
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: 'SMTP Test - Admission System',
      text: 'If you receive this, SMTP is working!',
      html: '<h2>SMTP Test Successful! 🎉</h2><p>Your email configuration is working correctly.</p>'
    });

    console.log('✅ Test email sent:', info.messageId);
    
  } catch (error) {
    console.error('❌ SMTP Error:', error.message);
    
    // Specific error handling
    if (error.code === 'EAUTH') {
      console.log('🔐 Authentication failed. Check:');
      console.log('   - Email and password are correct');
      console.log('   - For Gmail: Use App Password, not regular password');
      console.log('   - 2-factor authentication is enabled');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('🌐 Connection refused. Check:');
      console.log('   - SMTP host and port are correct');
      console.log('   - Firewall is not blocking the connection');
    } else {
      console.log('🔧 General SMTP error');
    }
  }
}

testSMTP();