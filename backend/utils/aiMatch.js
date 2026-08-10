/**
 * Dynamic AI Match Engine for Student Profile vs Job Posting
 */
function calculateAiJobMatch(student, job) {
  if (!job) {
    return {
      matchScore: 80,
      matchReasons: [],
    };
  }

  const defaultMatchScore = job.match || 80;
  if (!student) {
    return {
      matchScore: defaultMatchScore,
      matchReasons: [],
    };
  }

  const jobTitle = (job.title || job.role || '').toLowerCase();
  const jobDesc = (job.description || '').toLowerCase();
  const jobCategory = (job.category || '').toLowerCase();
  const jobSkills = (job.skills || []).map((s) => s.toLowerCase());

  const studentSkills = (student.skills || []).map((s) => (typeof s === 'string' ? s : s.name).toLowerCase());
  
  const studentProjects = (student.projects || []).map((p) => {
    let stackArr = [];
    if (Array.isArray(p.stack)) {
      stackArr = p.stack;
    } else if (typeof p.stack === 'string') {
      try {
        const parsed = JSON.parse(p.stack);
        stackArr = Array.isArray(parsed) ? parsed : p.stack.split(',').map((s) => s.trim());
      } catch {
        stackArr = p.stack.split(',').map((s) => s.trim());
      }
    }
    return {
      name: p.name || p.projectName || '',
      desc: p.desc || p.description || '',
      stack: stackArr.map((s) => String(s).trim()),
    };
  });

  const studentCerts = (student.certifications || []).map((c) => ({
    name: c.name || c.certificationName || '',
    issuer: c.issuer || c.issuingOrganization || '',
  }));

  let score = 50;
  const matchReasons = [];
  const matchedSkillNames = new Set();
  const missingSkillNames = new Set();

  // 1. Skill Matching
  const allStudentTech = new Set([
    ...studentSkills,
    ...studentProjects.flatMap((p) => p.stack.map((s) => s.toLowerCase())),
    ...studentCerts.map((c) => c.name.toLowerCase()),
  ]);

  jobSkills.forEach((js) => {
    let isMatch = false;
    allStudentTech.forEach((st) => {
      if (st.includes(js) || js.includes(st)) {
        isMatch = true;
        matchedSkillNames.add(js.toUpperCase());
      }
    });
    if (!isMatch && js.length > 2) {
      missingSkillNames.add(js.toUpperCase());
    }
  });

  if (matchedSkillNames.size > 0) {
    const matchedArr = Array.from(matchedSkillNames);
    score += Math.min(25, matchedArr.length * 6);
    matchReasons.push(`Strong ${matchedArr.slice(0, 3).join(' and ')} match`);
  }

  // 2. Project Relevance Matching
  const relevantProjects = [];
  studentProjects.forEach((proj) => {
    if (!proj.name) return;
    const projText = `${proj.name} ${proj.desc} ${proj.stack.join(' ')}`.toLowerCase();
    
    // Check if project technology or domain matches job skills or title
    const techMatch = proj.stack.some((st) => 
      st && (jobSkills.includes(st.toLowerCase()) || jobTitle.includes(st.toLowerCase()) || jobDesc.includes(st.toLowerCase()))
    );
    const domainMatch = jobSkills.some((sk) => sk.length > 2 && projText.includes(sk)) ||
      (jobTitle.includes('data') && projText.includes('data')) ||
      (jobTitle.includes('sales') && projText.includes('sales')) ||
      (jobTitle.includes('web') && (projText.includes('react') || projText.includes('web') || projText.includes('html'))) ||
      (jobTitle.includes('full') && (projText.includes('full') || projText.includes('api')));

    if (techMatch || domainMatch) {
      relevantProjects.push(proj.name);
    }
  });

  if (relevantProjects.length > 0) {
    score += Math.min(15, relevantProjects.length * 8);
    matchReasons.push(`Your ${relevantProjects[0]} project is relevant`);
  }

  // 3. Certification Relevance Matching
  const relevantCerts = [];
  studentCerts.forEach((cert) => {
    if (!cert.name) return;
    const certText = `${cert.name} ${cert.issuer}`.toLowerCase();
    const isRelevant = jobSkills.some((sk) => sk.length > 2 && certText.includes(sk)) ||
      jobTitle.split(/\s+/).some((w) => w.length > 3 && certText.includes(w)) ||
      (jobCategory && jobCategory.split(/\s+/).some((w) => w.length > 3 && certText.includes(w)));

    if (isRelevant) {
      relevantCerts.push(cert);
    }
  });

  if (relevantCerts.length > 0) {
    score += Math.min(10, relevantCerts.length * 5);
    const c = relevantCerts[0];
    matchReasons.push(`Your certification in ${c.name}${c.issuer ? ` from ${c.issuer}` : ''} supports this role`);
  }

  // 4. CGPA & Academic Domain Matching
  if (student.cgpa) {
    const cgpaVal = parseFloat(student.cgpa);
    if (cgpaVal >= 8.5) score += 5;
    else if (cgpaVal >= 7.5) score += 3;
  }

  const dept = (student.department || '').toLowerCase();
  if (dept.includes('computer') || dept.includes('cs') || dept.includes('it') || dept.includes('data')) {
    if (jobCategory.includes('it') || jobTitle.includes('developer') || jobTitle.includes('engineer') || jobTitle.includes('analyst')) {
      score += 5;
    }
  }

  // Missing Skills Warning Reason
  if (missingSkillNames.size > 0 && matchReasons.length < 4) {
    const missingArr = Array.from(missingSkillNames);
    matchReasons.push(`Missing ${missingArr[0]} experience`);
  }

  const finalMatchScore = Math.min(98, Math.max(55, score));

  return {
    matchScore: finalMatchScore,
    matchReasons,
    matchedSkills: Array.from(matchedSkillNames),
    missingSkills: Array.from(missingSkillNames),
    relevantProjects,
    relevantCerts: relevantCerts.map((c) => c.name),
  };
}

module.exports = { calculateAiJobMatch };
