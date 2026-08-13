/**
 * Dynamic AI Match Engine for Student Profile vs Job Posting
 */
function calculateAiJobMatch(student, job) {
  if (!job) {
    return {
      matchScore: null,
      matchReasons: ['No job data available'],
      matchedSkills: [],
      missingSkills: [],
    };
  }

  if (!student) {
    return {
      matchScore: null,
      matchReasons: ['Not enough profile data to compute AI match score'],
      matchedSkills: [],
      missingSkills: [],
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

  let score = 30; // Baseline starting score (varies dynamically per job)
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
      if (st && (st.includes(js) || js.includes(st))) {
        isMatch = true;
        matchedSkillNames.add(js.toUpperCase());
      }
    });
    if (!isMatch && js.length > 1) {
      missingSkillNames.add(js.toUpperCase());
    }
  });

  if (matchedSkillNames.size > 0) {
    const matchedArr = Array.from(matchedSkillNames);
    score += Math.min(36, matchedArr.length * 12);
    matchReasons.push(`Strong ${matchedArr.slice(0, 3).join(' and ')} match`);
  }

  // 2. Project Relevance Matching
  const relevantProjects = [];
  studentProjects.forEach((proj) => {
    if (!proj.name) return;
    const projText = `${proj.name} ${proj.desc} ${proj.stack.join(' ')}`.toLowerCase();

    const techMatch = proj.stack.some((st) =>
      st && (jobSkills.includes(st.toLowerCase()) || jobTitle.includes(st.toLowerCase()) || jobDesc.includes(st.toLowerCase()))
    );
    const domainMatch = (jobSkills.length > 0 && jobSkills.some((sk) => sk.length > 2 && projText.includes(sk))) ||
      (jobTitle.includes('data') && projText.includes('data')) ||
      (jobTitle.includes('sales') && projText.includes('sales')) ||
      (jobTitle.includes('web') && (projText.includes('react') || projText.includes('web') || projText.includes('html'))) ||
      (jobTitle.includes('full') && (projText.includes('full') || projText.includes('api')));

    if (techMatch || domainMatch) {
      relevantProjects.push(proj.name);
    }
  });

  if (relevantProjects.length > 0) {
    score += Math.min(20, relevantProjects.length * 10);
    matchReasons.push(`Your ${relevantProjects[0]} project is relevant`);
  }

  // 3. Certification Relevance Matching
  const relevantCerts = [];
  studentCerts.forEach((cert) => {
    if (!cert.name) return;
    const certText = `${cert.name} ${cert.issuer}`.toLowerCase();
    const isRelevant = (jobSkills.length > 0 && jobSkills.some((sk) => sk.length > 2 && certText.includes(sk))) ||
      jobTitle.split(/\s+/).some((w) => w.length > 3 && certText.includes(w)) ||
      (jobCategory && jobCategory.split(/\s+/).some((w) => w.length > 3 && certText.includes(w)));

    if (isRelevant) {
      relevantCerts.push(cert);
    }
  });

  if (relevantCerts.length > 0) {
    score += Math.min(16, relevantCerts.length * 8);
    const c = relevantCerts[0];
    matchReasons.push(`Your certification in ${c.name}${c.issuer ? ` from ${c.issuer}` : ''} supports this role`);
  }

  // 4. CGPA & Academic Domain Matching
  if (student.cgpa) {
    const cgpaVal = parseFloat(student.cgpa);
    if (cgpaVal >= 8.5) {
      score += 8;
      matchReasons.push(`Strong academic performance (CGPA ${cgpaVal})`);
    } else if (cgpaVal >= 7.5) {
      score += 5;
    } else if (cgpaVal >= 6.5) {
      score += 3;
    }
  }

  const dept = (student.department || '').toLowerCase();
  if (dept.includes('computer') || dept.includes('cs') || dept.includes('it') || dept.includes('data') || dept.includes('eng')) {
    if (jobCategory.includes('it') || jobCategory.includes('tech') || jobTitle.includes('developer') || jobTitle.includes('engineer') || jobTitle.includes('analyst') || jobTitle.includes('software')) {
      score += 15;
    } else {
      score += 5;
    }
  }

  // Missing Skills Warning Reason
  if (missingSkillNames.size > 0 && matchReasons.length < 4) {
    const missingArr = Array.from(missingSkillNames);
    matchReasons.push(`Missing ${missingArr[0]} experience`);
  }

  const finalMatchScore = Math.min(98, Math.max(30, score));

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
