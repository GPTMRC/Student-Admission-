import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔧 DEBUGGING EMAIL CONFIGURATION');
console.log('=================================');

// Display configuration (hide password for security)
console.log('📧 Email Configuration:');
console.log('   Host:', process.env.EMAIL_HOST);
console.log('   Port:', process.env.EMAIL_PORT);
console.log('   User:', process.env.EMAIL_USER);
console.log('   Pass:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'NOT SET');
console.log('   From:', process.env.FROM_EMAIL);

async function debugSMTP() {
  try {
    console.log('\n🚀 Step 1: Creating SMTP transporter...');
    
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log('✅ Transporter created successfully');

    console.log('\n🔍 Step 2: Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');

    console.log('\n📤 Step 3: Sending test email...');
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: process.env.EMAIL_USER,
      subject: 'DEBUG Test Email - Admission System',
      text: 'This is a debug test email from your admission system.',
      html: '<h2>DEBUG Test Email</h2><p>If you receive this, your SMTP configuration is working!</p>'
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);

    console.log('\n🎉 SUCCESS: All tests passed! Emails should be working.');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.log('Error code:', error.code);
    console.log('Command:', error.command);
    
    // Specific error handling
    if (error.code === 'EAUTH') {
      console.log('\n🔐 AUTHENTICATION FAILED');
      console.log('   Please check:');
      console.log('   1. Email and password are correct');
      console.log('   2. For Gmail: Use App Password (16 characters) not regular password');
      console.log('   3. 2-factor authentication is enabled');
      console.log('   4. App password is generated for "Mail"');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n🌐 CONNECTION REFUSED');
      console.log('   Please check:');
      console.log('   1. SMTP host and port are correct');
      console.log('   2. Firewall is not blocking the connection');
      console.log('   3. Internet connection is working');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n🔍 HOST NOT FOUND');
      console.log('   Please check:');
      console.log('   1. SMTP host name is correct');
      console.log('   2. DNS is working');
    }
  }
}

debugSMTP();