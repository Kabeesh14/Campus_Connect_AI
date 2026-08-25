/**
 * Normalize skill string for accurate alias comparison
 */
function normalizeSkillName(rawSkill = '') {
  let clean = String(rawSkill).trim().toLowerCase();
  if (!clean) return '';

  const aliasMap = {
    js: 'javascript',
    ts: 'typescript',
    node: 'node.js',
    nodejs: 'node.js',
    expressjs: 'express',
    powerbi: 'power bi',
    postgres: 'postgresql',
    ml: 'machine learning',
    dl: 'deep learning',
    ai: 'artificial intelligence',
    reactjs: 'react',
    vuejs: 'vue',
    angularjs: 'angular',
    py: 'python',
  };

  return aliasMap[clean] || clean;
}

/**
 * Dynamic AI Match Engine for Student Profile vs Job Posting
 * Strictly calculates score based on intersection of student skills vs job skills
 */
function calculateAiJobMatch(student, job) {
  if (!job || !student) {
    return {
      matchScore: null,
      matchReasons: ['Insufficient profile or job data for match calculation'],
      matchedSkills: [],
      missingSkills: [],
    };
  }

  const jobSkills = Array.isArray(job.skills) ? job.skills.map((s) => String(s).trim()) : [];

  if (jobSkills.length === 0) {
    return {
      matchScore: null,
      matchReasons: ['Skills not specified in the job listing'],
      matchedSkills: [],
      missingSkills: [],
    };
  }

  // 1. Resume Extracted Skills
  const studentResumeSkills = Array.isArray(student.resumeSkills) ? student.resumeSkills : [];

  // 2. Profile Manual Skills
  const studentSkillsRaw = (student.skills || []).map((s) => (typeof s === 'string' ? s : s.name || ''));

  // 3. Project Stack Skills
  const studentProjectSkills = (student.projects || []).flatMap((p) => {
    if (Array.isArray(p.stack)) return p.stack;
    if (typeof p.stack === 'string') {
      try {
        const parsed = JSON.parse(p.stack);
        return Array.isArray(parsed) ? parsed : p.stack.split(',');
      } catch {
        return p.stack.split(',');
      }
    }
    return [];
  });

  // 4. Certification Skills
  const studentCertSkills = (student.certifications || []).map((c) => c.name || c.certificationName || '');

  // Combine and normalize all student skills into a deduplicated Set
  const allStudentSkillsSet = new Set(
    [...studentResumeSkills, ...studentSkillsRaw, ...studentProjectSkills, ...studentCertSkills]
      .map((s) => normalizeSkillName(s))
      .filter(Boolean)
  );

  const matchedSkillNames = [];
  const missingSkillNames = [];

  jobSkills.forEach((js) => {
    const jsNormalized = normalizeSkillName(js);
    let isMatched = false;

    allStudentSkillsSet.forEach((st) => {
      if (st && (st === jsNormalized || st.includes(jsNormalized) || jsNormalized.includes(st))) {
        isMatched = true;
      }
    });

    if (isMatched) {
      matchedSkillNames.push(js);
    } else {
      missingSkillNames.push(js);
    }
  });

  const matchScore = Math.round((matchedSkillNames.length / jobSkills.length) * 100);
  const matchReasons = [];

  if (matchedSkillNames.length > 0) {
    matchReasons.push(`Matches your ${matchedSkillNames.slice(0, 3).join(', ')} skills`);
  }

  if (missingSkillNames.length > 0) {
    matchReasons.push(`Missing experience in ${missingSkillNames.slice(0, 2).join(', ')}`);
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[MATCH CALCULATION]', {
      jobId: job.id || job.adzunaJobId,
      jobTitle: job.title,
      studentSkillsCount: allStudentSkillsSet.size,
      jobSkillsCount: jobSkills.length,
      matchedSkillsCount: matchedSkillNames.length,
      matchScore,
    });
  }

  return {
    matchScore,
    matchReasons,
    matchedSkills: matchedSkillNames,
    missingSkills: missingSkillNames,
  };
}

module.exports = { calculateAiJobMatch, normalizeSkillName };
