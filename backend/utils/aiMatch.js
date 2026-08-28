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
 * Authoritative AI Match Engine for Student Profile / Resume vs Adzuna Job
 * ALWAYS returns a numeric matchScore between 0 and 100 (NEVER NULL)
 */
function calculateAiJobMatch(student = {}, job = {}) {
  if (!job || typeof job !== 'object') {
    return {
      matchScore: 0,
      matchReasons: ['Job listing details unavailable'],
      matchedSkills: [],
      missingSkills: [],
      fallbackUsed: false,
    };
  }

  // 1. Collect all student skills from: Resume, Manual Skills, Projects, Certifications
  const studentResumeSkills = Array.isArray(student.resumeSkills) ? student.resumeSkills : [];
  const studentSkillsRaw = Array.isArray(student.skills) ? student.skills.map((s) => (typeof s === 'string' ? s : s.name || '')) : [];
  const studentProjectSkills = Array.isArray(student.projects)
    ? student.projects.flatMap((p) => {
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
      })
    : [];
  const studentCertSkills = Array.isArray(student.certifications) ? student.certifications.map((c) => c.name || c.certificationName || '') : [];

  // Deduplicate and normalize all student skills
  const allStudentSkillsSet = new Set(
    [...studentResumeSkills, ...studentSkillsRaw, ...studentProjectSkills, ...studentCertSkills]
      .map((s) => normalizeSkillName(s))
      .filter(Boolean)
  );

  const jobSkills = Array.isArray(job.skills) ? job.skills.map((s) => String(s).trim()) : [];
  const jobId = job.id || job.adzunaJobId || 'adzuna-job';
  const jobTitle = job.title || 'Job Position';

  let finalMatchScore = 0;
  let fallbackUsed = false;
  const matchedSkillNames = [];
  const missingSkillNames = [];
  const matchReasons = [];

  if (jobSkills.length > 0) {
    // ----------------------------------------------------
    // CASE A: Explicit Job Skills Available
    // ----------------------------------------------------
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

    finalMatchScore = Math.min(100, Math.max(0, Math.round((matchedSkillNames.length / jobSkills.length) * 100)));

    if (matchedSkillNames.length > 0) {
      matchReasons.push(`Matches your ${matchedSkillNames.slice(0, 3).join(', ')} skills`);
    }
    if (missingSkillNames.length > 0) {
      matchReasons.push(`Missing experience in ${missingSkillNames.slice(0, 2).join(', ')}`);
    }
  } else {
    // ----------------------------------------------------
    // CASE B: Fallback Relevance Scoring (No explicit skill tags)
    // ----------------------------------------------------
    fallbackUsed = true;
    const titleLower = (job.title || '').toLowerCase();
    const descLower = (job.description || '').toLowerCase();
    const categoryLower = (job.category || '').toLowerCase();
    const resumeTextLower = (student.resumeText || '').toLowerCase();

    if (allStudentSkillsSet.size === 0 && !resumeTextLower) {
      finalMatchScore = 0;
      matchReasons.push('Upload a resume or add skills to view personalized match score');
    } else {
      let titleOverlapCount = 0;
      let descOverlapCount = 0;

      // Check overlap between student skills and job title/description/category
      allStudentSkillsSet.forEach((stSkill) => {
        if (!stSkill || stSkill.length < 2) return;
        if (titleLower.includes(stSkill)) titleOverlapCount++;
        if (descLower.includes(stSkill) || categoryLower.includes(stSkill)) descOverlapCount++;
      });

      // Check direct keyword overlap between parsed resume text and job description
      let resumeTextOverlap = 0;
      if (resumeTextLower && descLower) {
        const descWords = descLower.split(/[^a-z0-9+#.]+/).filter((w) => w.length > 3);
        const uniqueDescWords = new Set(descWords);
        uniqueDescWords.forEach((word) => {
          if (resumeTextLower.includes(word)) {
            resumeTextOverlap++;
          }
        });
      }

      // Calculate deterministic score components
      const titleWeight = titleOverlapCount * 30;
      const descWeight = descOverlapCount * 15;
      const resumeWeight = Math.min(30, Math.round(resumeTextOverlap * 2));

      let computedScore = titleWeight + descWeight + resumeWeight;

      if (computedScore === 0 && (allStudentSkillsSet.size > 0 || resumeTextLower.length > 50)) {
        computedScore = 0;
      }

      finalMatchScore = Math.min(100, Math.max(0, Math.round(computedScore)));

      if (titleOverlapCount > 0) {
        matchReasons.push('Your background aligns with the job title requirements');
      } else if (descOverlapCount > 0) {
        matchReasons.push('Your skills match key responsibilities in the job description');
      } else if (finalMatchScore > 0) {
        matchReasons.push('General alignment with your uploaded resume profile');
      } else {
        matchReasons.push('Low alignment with your current profile skills');
      }
    }
  }

  // Debug Logging per Requirement 9
  console.log('[JOB MATCH DEBUG]');
  console.log(`Job ID: ${jobId}`);
  console.log(`Job Title: ${jobTitle}`);
  console.log(`Extracted Job Skills: ${JSON.stringify(jobSkills)}`);
  console.log(`Student Skills: ${JSON.stringify(Array.from(allStudentSkillsSet))}`);
  console.log(`Matched Skills: ${JSON.stringify(matchedSkillNames)}`);
  console.log(`Skill Score: ${jobSkills.length > 0 ? Math.round((matchedSkillNames.length / jobSkills.length) * 100) + '%' : 'N/A'}`);
  console.log(`Fallback Used: ${fallbackUsed}`);
  console.log(`Final Match Score: ${finalMatchScore}%`);

  return {
    matchScore: finalMatchScore,
    matchReasons,
    matchedSkills: matchedSkillNames,
    missingSkills: missingSkillNames,
    fallbackUsed,
  };
}

module.exports = { calculateAiJobMatch, normalizeSkillName };
