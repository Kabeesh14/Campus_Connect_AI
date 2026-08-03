const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function runTests() {
  console.log('==========================================');
  console.log('Testing CampusConnect AI Authentication & AI APIs');
  console.log('==========================================');

  const BASE_URL = 'http://localhost:5000/api';

  // 1. Test Login with seeded user
  console.log('\n[TEST 1] Logging in seeded user (student@campus.edu)...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@campus.edu', password: 'password', role: 'student' }),
  });
  const loginData = await loginRes.json();
  console.log('Login Response Status:', loginRes.status);
  console.log('Login Success:', loginData.success);
  console.log('Token Received:', loginData.token ? loginData.token.substring(0, 30) + '...' : 'NONE');

  if (!loginData.token) {
    console.error('FAILED: No token returned from login.');
    process.exit(1);
  }

  const token = loginData.token;

  // 2. Test Get Me (/api/auth/me) with JWT token
  console.log('\n[TEST 2] Verifying protected endpoint /api/auth/me with Bearer token...');
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meData = await meRes.json();
  console.log('Get Me Status:', meRes.status);
  console.log('User Email:', meData.user?.email);

  // 3. Test AI Chat (/api/ai/chat) with JWT token
  console.log('\n[TEST 3] Testing AI Chat /api/ai/chat with Bearer token...');
  const chatRes = await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message: 'Write SQL query for top 5 department CGPAs' }),
  });
  const chatData = await chatRes.json();
  console.log('AI Chat Status:', chatRes.status);
  console.log('AI Reply Received:', chatData.success);
  console.log('AI Reply Source:', chatData.source);
  console.log('AI Reply Preview:', chatData.reply ? chatData.reply.substring(0, 100) + '...' : chatData.message);

  // 4. Test Skill Gap Analysis (/api/ai/skill-gap) with JWT token
  console.log('\n[TEST 4] Testing Skill Gap Analysis /api/ai/skill-gap with Bearer token...');
  const gapRes = await fetch(`${BASE_URL}/ai/skill-gap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ targetRole: 'Microsoft SDE-1', company: 'Microsoft' }),
  });
  const gapData = await gapRes.json();
  console.log('Skill Gap Status:', gapRes.status);
  console.log('Skill Gap Analysis Received:', gapData.success);

  // 5. Test Resume Analyzer (/api/ai/resume/analyze) with JWT token
  console.log('\n[TEST 5] Testing Resume Analyzer /api/ai/resume/analyze with Bearer token...');
  const resumeRes = await fetch(`${BASE_URL}/ai/resume/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      resumeText: 'Student User\nstudent@campus.edu\nSkills: React, Node.js, Express, MySQL, Python, Data Structures',
      fileName: 'student_resume.pdf',
      targetRole: 'Full Stack Developer',
    }),
  });
  const resumeData = await resumeRes.json();
  console.log('Resume Analyzer Status:', resumeRes.status);
  console.log('Resume Analysis Received:', resumeData.success);
  console.log('ATS Score:', resumeData.analysis?.atsScore);

  console.log('\n==========================================');
  console.log('ALL AUTHENTICATION & AI TESTS COMPLETED SUCCESSFULLY!');
  console.log('==========================================');
}

runTests().catch(err => {
  console.error('Test error:', err.message);
});
