require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🔍 Testing Email Configuration...');
console.log('GMAIL_USER:', process.env.GMAIL_USER ? '✅ Set' : '❌ Missing');
console.log('GMAIL_PASS:', process.env.GMAIL_PASS ? '✅ Set (' + process.env.GMAIL_PASS.substring(0, 4) + '...)' : '❌ Missing');
console.log('SENDER_NAME:', process.env.SENDER_NAME || '❌ Missing');

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

async function testEmail() {
  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful');
    
    const result = await transporter.sendMail({
      from: `"Test" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER, // Send to yourself
      subject: "Test Email from PTC Server",
      text: "If you receive this, your email setup is working!"
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
  } catch (error) {
    console.error('❌ Email test failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔐 AUTHENTICATION TROUBLESHOOTING:');
      console.log('1. Go to: https://myaccount.google.com/security');
      console.log('2. Enable 2-Factor Authentication');
      console.log('3. Generate App Password: https://myaccount.google.com/apppasswords');
      console.log('4. Use the 16-character app password in your .env file');
    }
  }
}

testEmail();