const { fetchAdzunaJobs, getCompanyDomain, getJobByIdFromStore, extractJobSkills } = require('../services/adzunaService');
const { query } = require('../config/db');
const { calculateAiJobMatch } = require('../utils/aiMatch');

async function getStudentProfileForMatch(userId) {
  if (!userId) return null;
  try {
    const students = await query('SELECT * FROM students WHERE user_id = ?', [userId]);
    if (!students || students.length === 0) return null;
    const student = students[0];

    const skills = await query('SELECT name, level FROM skills WHERE student_id = ?', [student.id]);
    const projects = await query('SELECT name, `desc`, stack FROM projects WHERE student_id = ?', [student.id]);
    const certs = await query('SELECT name, issuer FROM certifications WHERE student_id = ?', [student.id]);
    const resumes = await query('SELECT parsed_content FROM resumes WHERE student_id = ? ORDER BY uploaded_at DESC LIMIT 1', [student.id]);

    const resumeText = resumes.length > 0 ? (resumes[0].parsed_content || '') : '';
    const resumeSkills = resumeText ? extractJobSkills('', resumeText) : [];

    return {
      studentId: student.id,
      cgpa: student.cgpa,
      department: student.department,
      skills,
      projects,
      certifications: certs,
      resumeText,
      resumeSkills,
      hasParsedResume: Boolean(resumeText),
    };
  } catch (err) {
    console.error('[getStudentProfileForMatch Error]', err.message);
    return null;
  }
}

/**
 * Get All Live Jobs (via Adzuna API, with AI profile matching & filters)
 */
const getJobs = async (req, res, next) => {
  try {
    const {
      search = '',
      q = '',
      location = 'all',
      where = '',
      minMatch = 0,
      sortBy = 'match',
      category = 'all',
      contractType = 'all',
      remote = 'all',
      page = 1,
    } = req.query;

    const queryTerm = (search || q || '').trim();
    const locTerm = (location !== 'all' ? location : where).trim();

    const adzunaRes = await fetchAdzunaJobs({
      what: queryTerm,
      where: locTerm === 'all' ? '' : locTerm,
      country: 'in',
      page: parseInt(page, 10) || 1,
      resultsPerPage: 50,
    });

    if (!adzunaRes.success) {
      return res.status(502).json({
        success: false,
        source: 'adzuna',
        message: adzunaRes.message || 'Failed to fetch live jobs from Adzuna API.',
        jobs: [],
      });
    }

    const rawJobs = adzunaRes.jobs || [];
    if (rawJobs.length === 0) {
      return res.status(200).json({
        success: true,
        source: 'adzuna',
        count: 0,
        jobs: [],
      });
    }

    const studentProfile = await getStudentProfileForMatch(req.user?.id);

    let filtered = rawJobs.map((j) => {
      if (studentProfile) {
        const aiResult = calculateAiJobMatch(studentProfile, j);
        return {
          ...j,
          match: aiResult.matchScore,
          matchReasons: aiResult.matchReasons,
          matchedSkills: aiResult.matchedSkills,
          missingSkills: aiResult.missingSkills,
        };
      }
      return {
        ...j,
        match: null,
        matchReasons: ['Not enough profile data to compute AI match score'],
      };
    }).filter((j) => {
      let matchesSearch = true;
      if (queryTerm) {
        const qt = queryTerm.toLowerCase();
        matchesSearch = j.title.toLowerCase().includes(qt) ||
          j.company.toLowerCase().includes(qt) ||
          j.description.toLowerCase().includes(qt) ||
          j.skills.some((s) => s.toLowerCase().includes(qt));
      }

      let matchesLoc = true;
      if (locTerm && locTerm.toLowerCase() !== 'all') {
        matchesLoc = j.location.toLowerCase().includes(locTerm.toLowerCase());
      }

      let matchesMinMatch = true;
      if (minMatch) {
        matchesMinMatch = (j.match || 0) >= parseInt(minMatch, 10);
      }

      let matchesCategory = true;
      if (category && category.toLowerCase() !== 'all') {
        matchesCategory = j.category.toLowerCase().includes(category.toLowerCase());
      }

      let matchesType = true;
      if (contractType && contractType.toLowerCase() !== 'all') {
        matchesType = j.contractType.toLowerCase().includes(contractType.toLowerCase());
      }

      let matchesRemote = true;
      if (remote === 'true' || remote === true) {
        matchesRemote = j.remote === true;
      }

      return matchesSearch && matchesLoc && matchesMinMatch && matchesCategory && matchesType && matchesRemote;
    });

    if (sortBy === 'match') {
      filtered.sort((a, b) => (b.match || 0) - (a.match || 0));
    } else {
      filtered.sort((a, b) => (a.postedDays || 0) - (b.postedDays || 0));
    }

    return res.status(200).json({
      success: true,
      source: 'adzuna',
      count: filtered.length,
      jobs: filtered,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search Live Jobs Specific Route
 */
const searchJobs = async (req, res, next) => {
  return getJobs(req, res, next);
};

/**
 * Get Specific Job By ID
 */
const getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DETAILS REQUEST] Adzuna ID:', id);
    }
    let job = await getJobByIdFromStore(id);

    if (!job) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[DETAILS NOT FOUND] Adzuna ID:', id);
      }
      return res.status(404).json({
        success: false,
        source: 'adzuna',
        message: 'Job position not found or has expired on Adzuna.',
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[DETAILS RESPONSE] Adzuna ID:', job.id || job.adzunaJobId, 'Title:', job.title, 'Company:', job.company);
    }

    const studentProfile = await getStudentProfileForMatch(req.user?.id);
    if (studentProfile) {
      const aiResult = calculateAiJobMatch(studentProfile, job);
      job = {
        ...job,
        match: aiResult.matchScore,
        matchReasons: aiResult.matchReasons,
        matchedSkills: aiResult.matchedSkills,
        missingSkills: aiResult.missingSkills,
      };
    }

    return res.status(200).json({
      success: true,
      source: 'adzuna',
      job,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Jobs for a Specific Company
 */
const getCompanyJobs = async (req, res, next) => {
  try {
    const companyParam = req.params.company || req.query.company || '';
    const cleanCompany = companyParam.trim().toLowerCase();

    const adzunaRes = await fetchAdzunaJobs({ what: cleanCompany, where: '' });
    if (!adzunaRes.success) {
      return res.status(502).json({
        success: false,
        source: 'adzuna',
        message: adzunaRes.message || 'Error fetching company jobs.',
        jobs: [],
      });
    }

    const allJobs = adzunaRes.jobs || [];
    const companyJobs = allJobs.filter((j) => !cleanCompany || j.company.toLowerCase().includes(cleanCompany));

    return res.status(200).json({
      success: true,
      source: 'adzuna',
      count: companyJobs.length,
      jobs: companyJobs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Dynamic Companies Aggregated from Real Adzuna Jobs
 */
const getCompanies = async (req, res, next) => {
  try {
    const adzunaRes = await fetchAdzunaJobs({ what: 'software', where: '' });
    if (!adzunaRes.success) {
      return res.status(502).json({
        success: false,
        source: 'adzuna',
        message: adzunaRes.message || 'Error fetching companies from Adzuna.',
        companies: [],
      });
    }

    const allJobs = adzunaRes.jobs || [];
    const companyMap = new Map();

    allJobs.forEach((j) => {
      const name = j.company;
      if (!companyMap.has(name)) {
        const domain = getCompanyDomain(name);
        const logo = j.companyLogo || `https://logo.clearbit.com/${domain}`;
        companyMap.set(name, {
          id: `c-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          name,
          domain,
          logo,
          defaultLogo: j.defaultLogo,
          industry: j.category || 'Information Technology',
          location: j.location,
          salary: j.package,
          hiring: true,
          openRoles: 1,
          rating: (4.2 + (name.length % 7) * 0.1).toFixed(1),
          deadlineDays: j.postedDays + 14,
          latestHiring: j.role,
          jobs: [j],
          stats: [
            { label: 'Open Positions', value: '1+' },
            { label: 'Avg Package', value: j.package },
            { label: 'Location', value: j.location },
            { label: 'Work Mode', value: j.remote ? 'Remote' : 'On-site' },
          ],
          culture: ['Innovation Focused', 'Work-Life Balance', 'Professional Growth'],
          benefits: ['Health Insurance', 'Performance Bonus', 'Remote Work Options'],
          process: [
            { step: 'Application Review', detail: 'Screening by recruitment team' },
            { step: 'Technical Assessment', detail: 'Skills verification & coding round' },
            { step: 'Final Interview', detail: 'Managerial & team culture interview' },
          ],
          gallery: [
            'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=600',
            'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=600',
          ],
        });
      } else {
        const existing = companyMap.get(name);
        existing.openRoles += 1;
        existing.jobs.push(j);
        existing.stats[0].value = `${existing.openRoles}+`;
      }
    });

    const companiesList = Array.from(companyMap.values());

    return res.status(200).json({
      success: true,
      source: 'adzuna',
      count: companiesList.length,
      companies: companiesList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Saved Jobs for User
 */
const getSavedJobs = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const rows = await query('SELECT * FROM saved_jobs WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    const savedJobs = rows.map((r) => {
      try {
        return typeof r.job_data === 'string' ? JSON.parse(r.job_data) : r.job_data;
      } catch {
        return { id: r.job_id };
      }
    });
    return res.status(200).json({ success: true, source: 'adzuna', savedJobs });
  } catch (error) {
    next(error);
  }
};

/**
 * Save Job for User
 */
const saveJob = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { jobId, job } = req.body;
    if (!jobId) {
      return res.status(400).json({ success: false, message: 'jobId is required' });
    }
    const id = `sj-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const jobDataStr = JSON.stringify(job || { id: jobId });
    await query('INSERT INTO saved_jobs (id, user_id, job_id, job_data) VALUES (?, ?, ?, ?)', [id, userId, String(jobId), jobDataStr]);
    return res.status(200).json({ success: true, message: 'Job saved successfully', jobId });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove Saved Job for User
 */
const removeSavedJob = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await query('DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?', [userId, String(id)]);
    return res.status(200).json({ success: true, message: 'Saved job removed', jobId: id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJobs,
  searchJobs,
  getJobById,
  getCompanyJobs,
  getCompanies,
  getSavedJobs,
  saveJob,
  removeSavedJob,
};
