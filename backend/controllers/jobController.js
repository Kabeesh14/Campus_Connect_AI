const crypto = require('crypto');
const { query } = require('../config/db');

/**
 * Get Searchable & Filterable Open Jobs
 */
const getJobs = async (req, res, next) => {
  try {
    const { search = '', location = 'all', minMatch = 0, sortBy = 'match' } = req.query;

    let sql = `
      SELECT 
        j.*, 
        COALESCE(c.name, j.company) as live_company, 
        COALESCE(c.logo, j.logo) as live_logo 
      FROM jobs j
      LEFT JOIN companies c ON j.company_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search.trim()) {
      sql += ' AND (LOWER(j.role) LIKE ? OR LOWER(c.name) LIKE ? OR LOWER(j.company) LIKE ?)';
      const s = `%${search.trim().toLowerCase()}%`;
      params.push(s, s, s);
    }

    if (location !== 'all' && location.trim()) {
      sql += ' AND j.location = ?';
      params.push(location.trim());
    }

    if (minMatch) {
      sql += ' AND j.match_score >= ?';
      params.push(parseInt(minMatch, 10));
    }

    if (sortBy === 'match') {
      sql += ' ORDER BY j.match_score DESC, j.created_at DESC';
    } else {
      sql += ' ORDER BY j.posted_days ASC, j.created_at DESC';
    }

    const jobs = await query(sql, params);

    const formattedJobs = jobs.map((j) => ({
      id: j.id,
      companyId: j.company_id,
      company: j.live_company || j.company,
      logo: j.live_logo || j.logo || 'https://logo.clearbit.com/google.com',
      role: j.role,
      package: j.package,
      location: j.location,
      type: j.type,
      remote: Boolean(j.remote),
      requirements: typeof j.requirements === 'string' ? JSON.parse(j.requirements) : j.requirements || [],
      responsibilities: typeof j.responsibilities === 'string' ? JSON.parse(j.responsibilities) : j.responsibilities || [],
      eligibility: j.eligibility,
      skills: typeof j.skills === 'string' ? JSON.parse(j.skills) : j.skills || [],
      match: j.match_score || 85,
      postedDays: j.posted_days || 1,
      deadline: j.deadline || '14 days left',
      description: j.description || '',
    }));

    return res.status(200).json({ success: true, count: formattedJobs.length, jobs: formattedJobs });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Job By ID
 */
const getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const jobs = await query(
      `SELECT 
        j.*, 
        COALESCE(c.name, j.company) as live_company, 
        COALESCE(c.logo, j.logo) as live_logo 
      FROM jobs j
      LEFT JOIN companies c ON j.company_id = c.id
      WHERE j.id = ?`,
      [id]
    );

    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: 'Job posting not found.' });
    }

    const j = jobs[0];
    const job = {
      id: j.id,
      companyId: j.company_id,
      company: j.live_company || j.company,
      logo: j.live_logo || j.logo || 'https://logo.clearbit.com/google.com',
      role: j.role,
      package: j.package,
      location: j.location,
      type: j.type,
      remote: Boolean(j.remote),
      requirements: typeof j.requirements === 'string' ? JSON.parse(j.requirements) : j.requirements || [],
      responsibilities: typeof j.responsibilities === 'string' ? JSON.parse(j.responsibilities) : j.responsibilities || [],
      eligibility: j.eligibility,
      skills: typeof j.skills === 'string' ? JSON.parse(j.skills) : j.skills || [],
      match: j.match_score || 85,
      postedDays: j.posted_days || 1,
      deadline: j.deadline || '14 days left',
      description: j.description || '',
    };

    return res.status(200).json({ success: true, job });
  } catch (error) {
    next(error);
  }
};

/**
 * Apply to Job
 */
const applyToJob = async (req, res, next) => {
  try {
    const { id: jobId } = req.params;
    const userId = req.user.id;

    // Get student profile
    const students = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found. Please register as a student.' });
    }
    const studentId = students[0].id;

    // Check existing application
    const existing = await query('SELECT id FROM applications WHERE job_id = ? AND student_id = ?', [jobId, studentId]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'You have already applied for this position.' });
    }

    // Get job details
    const jobs = await query('SELECT role, company, logo, package FROM jobs WHERE id = ?', [jobId]);
    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const job = jobs[0];
    const appId = 'a-' + crypto.randomUUID();
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    await query(
      `INSERT INTO applications (id, job_id, student_id, role, company, logo, stage, status, applied_date, updated_date, salary)
       VALUES (?, ?, ?, ?, ?, ?, 'applied', 'pending', ?, 'Just now', ?)`,
      [appId, jobId, studentId, job.role, job.company, job.logo, today, job.package]
    );

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully.',
      applicationId: appId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Withdraw Application
 */
const withdrawApplication = async (req, res, next) => {
  try {
    const { id: appId } = req.params;
    await query('DELETE FROM applications WHERE id = ?', [appId]);
    return res.status(200).json({ success: true, message: 'Application withdrawn.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Student's Applications List (Dynamic JOINs for Company & Logo)
 */
const getUserApplications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const students = await query('SELECT id FROM students WHERE user_id = ?', [userId]);

    if (students.length === 0) {
      return res.status(200).json({ success: true, applications: [] });
    }

    const studentId = students[0].id;
    const apps = await query(
      `SELECT 
        a.id, 
        a.job_id as jobId, 
        COALESCE(j.role, a.role) as role, 
        COALESCE(c.name, a.company) as company, 
        COALESCE(c.logo, a.logo) as logo, 
        a.stage, a.status, 
        a.applied_date as appliedDate, 
        a.updated_date as updatedDate, 
        COALESCE(j.package, a.salary) as salary 
      FROM applications a
      LEFT JOIN jobs j ON a.job_id = j.id
      LEFT JOIN companies c ON j.company_id = c.id
      WHERE a.student_id = ? 
      ORDER BY a.created_at DESC`,
      [studentId]
    );

    return res.status(200).json({ success: true, count: apps.length, applications: apps });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJobs,
  getJobById,
  applyToJob,
  withdrawApplication,
  getUserApplications,
};
