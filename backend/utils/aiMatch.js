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

  const studentSkillsRaw = (student.skills || []).map((s) => (typeof s === 'string' ? s : s.name || ''));

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

  const studentCertSkills = (student.certifications || []).map((c) => c.name || c.certificationName || '');

  const allStudentSkillsSet = new Set(
    [...studentSkillsRaw, ...studentProjectSkills, ...studentCertSkills]
      .map((s) => String(s).trim().toLowerCase())
      .filter(Boolean)
  );

  const matchedSkillNames = [];
  const missingSkillNames = [];

  jobSkills.forEach((js) => {
    const jsLower = js.toLowerCase();
    let isMatched = false;

    allStudentSkillsSet.forEach((st) => {
      if (st && (st.includes(jsLower) || jsLower.includes(st))) {
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

  return {
    matchScore,
    matchReasons,
    matchedSkills: matchedSkillNames,
    missingSkills: missingSkillNames,
  };
}

module.exports = { calculateAiJobMatch };
