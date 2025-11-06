require('dotenv').config();

console.log('🔍 DETAILED ENVIRONMENT DEBUGGING');
console.log('=================================');
console.log('GMAIL_USER:', `"${process.env.GMAIL_USER}"`);
console.log('GMAIL_USER length:', process.env.GMAIL_USER ? process.env.GMAIL_USER.length : 'MISSING');
console.log('GMAIL_PASS:', `"${process.env.GMAIL_PASS}"`);
console.log('GMAIL_PASS length:', process.env.GMAIL_PASS ? process.env.GMAIL_PASS.length : 'MISSING');
console.log('SENDER_NAME:', `"${process.env.SENDER_NAME}"`);

// Check for common issues
console.log('\n🔎 CHECKING FOR COMMON ISSUES:');
console.log('GMAIL_USER has spaces?:', process.env.GMAIL_USER ? process.env.GMAIL_USER.includes(' ') : 'N/A');
console.log('GMAIL_PASS has spaces?:', process.env.GMAIL_PASS ? process.env.GMAIL_PASS.includes(' ') : 'N/A');
console.log('GMAIL_USER ends with @gmail.com?:', process.env.GMAIL_USER ? process.env.GMAIL_USER.endsWith('@gmail.com') : 'N/A');

// Check .env file location
const fs = require('fs');
const path = require('path');
console.log('\n📁 .env FILE INFO:');
console.log('Current directory:', __dirname);
console.log('.env exists?:', fs.existsSync(path.join(__dirname, '.env')));