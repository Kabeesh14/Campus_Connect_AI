const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { query, withTransaction } = require('../config/db');

/**
 * Get Recruiter's Company Profile
 */
const getCompanyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const recruiters = await query('SELECT * FROM recruiters WHERE user_id = ?', [userId]);

    if (recruiters.length === 0) {
      return res.status(404).json({ success: false, message: 'Recruiter profile not found.' });
    }

    const recruiter = recruiters[0];
    let company = null;

    if (recruiter.company_id) {
      const companies = await query('SELECT * FROM companies WHERE id = ?', [recruiter.company_id]);
      if (companies.length > 0) company = companies[0];
    }

    // Fallback if no company assigned yet
    if (!company) {
      const defaultCompanies = await query('SELECT * FROM companies LIMIT 1');
      if (defaultCompanies.length > 0) company = defaultCompanies[0];
    }

    if (company) {
      company.culture = typeof company.culture === 'string' ? JSON.parse(company.culture) : company.culture || [];
      company.benefits = typeof company.benefits === 'string' ? JSON.parse(company.benefits) : company.benefits || [];
      company.process = typeof company.process === 'string' ? JSON.parse(company.process) : company.process || [];
      company.stats = typeof company.stats === 'string' ? JSON.parse(company.stats) : company.stats || [];
      company.gallery = typeof company.gallery === 'string' ? JSON.parse(company.gallery) : company.gallery || [];
    }

    return res.status(200).json({
      success: true,
      recruiter,
      company,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Company Profile
 */
const updateCompanyProfile = async (req, res, next) => {
  try {
    const { id, name, industry, location, salary, eligibility, deadlineDays, size } = req.body;
    if (!id) return res.status(400).json({ success: false, message: 'Company ID is required.' });

    await query(
      `UPDATE companies SET
        name = COALESCE(?, name),
        industry = COALESCE(?, industry),
        location = COALESCE(?, location),
        salary = COALESCE(?, salary),
        eligibility = COALESCE(?, eligibility),
        deadline_days = COALESCE(?, deadline_days),
        size = COALESCE(?, size)
      WHERE id = ?`,
      [name, industry, location, salary, eligibility, deadlineDays, size, id]
    );

    return res.status(200).json({ success: true, message: 'Company profile updated.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload Company Logo
 */
const uploadCompanyLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Logo file is required.' });
    }
    const { companyId } = req.body;
    const logoUrl = `/uploads/logos/${req.file.filename}`;

    if (companyId) {
      await query('UPDATE companies SET logo = ? WHERE id = ?', [logoUrl, companyId]);
    }

    return res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully.',
      logo: logoUrl,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Post New Job
 */
const postJob = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const recruiters = await query('SELECT * FROM recruiters WHERE user_id = ?', [userId]);
    const recruiter = recruiters[0];

    const {
      companyId = recruiter?.company_id || 'c1',
      company = 'Google',
      logo = 'https://logo.clearbit.com/google.com',
      role,
      package: pkg,
      location,
      type = 'Full-time',
      remote = false,
      requirements = [],
      responsibilities = [],
      eligibility = 'CGPA 7.5+',
      skills = [],
      deadline = '14 days left',
      description = '',
    } = req.body;

    if (!role || !pkg || !location) {
      return res.status(400).json({ success: false, message: 'Role, package, and location are required.' });
    }

    const jobId = 'j-' + crypto.randomUUID();

    await withTransaction(async (txQuery) => {
      await txQuery(
        `INSERT INTO jobs (
          id, company_id, recruiter_id, company, logo, role, package, location, type, remote,
          requirements, responsibilities, eligibility, skills, deadline, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          jobId,
          companyId,
          recruiter?.id || null,
          company,
          logo,
          role,
          pkg,
          location,
          type,
          remote ? 1 : 0,
          JSON.stringify(requirements),
          JSON.stringify(responsibilities),
          eligibility,
          JSON.stringify(skills),
          deadline,
          description,
        ]
      );

      // Update company open roles count inside transaction
      await txQuery('UPDATE companies SET open_roles = open_roles + 1 WHERE id = ?', [companyId]);
    });

    return res.status(201).json({
      success: true,
      message: 'Job posted successfully.',
      job: {
        id: jobId,
        companyId,
        company,
        logo,
        role,
        package: pkg,
        location,
        type,
        remote,
        requirements,
        responsibilities,
        eligibility,
        skills,
        match: 90,
        postedDays: 0,
        deadline,
        description,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Edit Job Posting
 */
const updateJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, package: pkg, location, type, remote, eligibility, deadline, description } = req.body;

    await query(
      `UPDATE jobs SET
        role = COALESCE(?, role),
        package = COALESCE(?, package),
        location = COALESCE(?, location),
        type = COALESCE(?, type),
        remote = COALESCE(?, remote),
        eligibility = COALESCE(?, eligibility),
        deadline = COALESCE(?, deadline),
        description = COALESCE(?, description)
      WHERE id = ?`,
      [role, pkg, location, type, remote !== undefined ? (remote ? 1 : 0) : null, eligibility, deadline, description, id]
    );

    return res.status(200).json({ success: true, message: 'Job updated.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Job Posting
 */
const deleteJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    await withTransaction(async (txQuery) => {
      const jobs = await txQuery('SELECT company_id FROM jobs WHERE id = ?', [id]);
      await txQuery('DELETE FROM jobs WHERE id = ?', [id]);

      if (jobs.length > 0) {
        await txQuery('UPDATE companies SET open_roles = GREATEST(0, open_roles - 1) WHERE id = ?', [jobs[0].company_id]);
      }
    });

    return res.status(200).json({ success: true, message: 'Job deleted.' });
  } catch (error) {
    next(error);
  }
};

/**
 * View Job Applicants
 */
const getApplicants = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let companyId = null;
    if (userRole === 'recruiter') {
      const recruiters = await query('SELECT company_id FROM recruiters WHERE user_id = ?', [userId]);
      companyId = recruiters[0]?.company_id || 'c1';
    }

    const applicants = await query(
      `
      SELECT 
        a.id, a.job_id as jobId, 
        COALESCE(j.role, a.role) as role, 
        COALESCE(c.name, a.company) as company, 
        COALESCE(c.logo, a.logo) as logo, 
        a.stage, a.status, 
        a.applied_date as appliedDate, a.updated_date as updatedDate,
        COALESCE(j.package, a.salary) as salary,
        s.name as studentName, s.avatar as studentAvatar, s.department as studentDepartment, s.cgpa as studentCgpa
      FROM applications a
      LEFT JOIN jobs j ON a.job_id = j.id
      LEFT JOIN companies c ON j.company_id = c.id
      LEFT JOIN students s ON a.student_id = s.id
      WHERE (? IS NULL OR j.company_id = ? OR c.id = ?)
      ORDER BY a.created_at DESC
    `,
      [companyId, companyId, companyId]
    );

    return res.status(200).json({ success: true, applicants });
  } catch (error) {
    next(error);
  }
};

/**
 * Shortlist / Reject Applicant
 */
const updateApplicantStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stage, status } = req.body;

    await query(
      'UPDATE applications SET stage = COALESCE(?, stage), status = COALESCE(?, status), updated_date = "Just now" WHERE id = ?',
      [stage, status, id]
    );

    return res.status(200).json({ success: true, message: 'Applicant status updated.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Schedule Interview for Candidate
 */
const scheduleInterview = async (req, res, next) => {
  try {
    const { applicationId, studentId, jobId, role, company, logo, date, time, type, round, mode, meetingLink, location } = req.body;

    if (!studentId || !role || !company || !date || !time) {
      return res.status(400).json({ success: false, message: 'Student, role, company, date, and time are required.' });
    }

    const interviewId = 'iv-' + crypto.randomUUID();
    const prepJson = JSON.stringify([
      { label: 'Revise key concepts', done: false },
      { label: 'Review project resume', done: false },
      { label: 'Mock practice', done: false },
    ]);

    // Verify student profile existence
    const students = await query('SELECT user_id FROM students WHERE id = ?', [studentId]);
    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }
    const studentUserId = students[0].user_id;

    // Wrap interview and notification insertion in ACID transaction
    await withTransaction(async (txQuery) => {
      await txQuery(
        `INSERT INTO interviews (
          id, application_id, job_id, student_id, role, company, logo, date, time, type, round, mode, meeting_link, location, prep
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          interviewId,
          applicationId || null,
          jobId || null,
          studentId,
          role,
          company,
          logo || 'https://logo.clearbit.com/google.com',
          date,
          time,
          type || 'Technical',
          round || 'Round 1',
          mode || 'online',
          meetingLink || 'https://meet.google.com/abc-defg-hij',
          location || null,
          prepJson,
        ]
      );

      // Create notification for student
      const notifId = 'n-' + crypto.randomUUID();
      await txQuery(
        `INSERT INTO notifications (id, user_id, type, title, body, time) VALUES (?, ?, 'interview', 'Interview Scheduled', ?, 'Just now')`,
        [notifId, studentUserId, `${company} ${round || 'interview'} scheduled for ${date} at ${time}`]
      );
    });

    return res.status(201).json({ success: true, message: 'Interview scheduled successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCompanyProfile,
  updateCompanyProfile,
  uploadCompanyLogo,
  postJob,
  updateJob,
  deleteJob,
  getApplicants,
  updateApplicantStatus,
  scheduleInterview,
};
